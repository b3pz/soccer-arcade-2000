#!/usr/bin/env python3
"""Static game + private-room WebRTC signaling, Python standard library only."""
import argparse
import hmac
import json
import os
from pathlib import Path
import secrets
import threading
import time
from collections import defaultdict, deque
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, unquote, parse_qs

ROOT = Path(__file__).resolve().parents[1]
ROOM_TTL = 180
MAX_ROOMS = 500

class Rooms:
    def __init__(self, now=time.monotonic):
        self.now = now
        self.lock = threading.RLock()
        self.rooms = {}
        self.rates = defaultdict(deque)

    def prune(self):
        now = self.now()
        for code, room in list(self.rooms.items()):
            if now - room['hostSeen'] > ROOM_TTL:
                del self.rooms[code]
            elif room['guest'] and now - room['guestSeen'] > ROOM_TTL:
                room['guest'] = None
                room['guestEvents'].clear()
                self.emit(room, 'host', {'type': 'left'})
        for ip, hits in list(self.rates.items()):
            while hits and now - hits[0] > 60:
                hits.popleft()
            if not hits:
                del self.rates[ip]

    def emit(self, room, side, message):
        room['sequence'] += 1
        room[side + 'Events'].append({'id': room['sequence'], 'message': message})

    def create(self, ip):
        with self.lock:
            self.prune()
            hits = self.rates[ip]
            if len(hits) >= 10 or len(self.rooms) >= MAX_ROOMS:
                raise ValueError('Troppe stanze. Riprova fra un minuto.')
            hits.append(self.now())
            alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
            code = ''.join(secrets.choice(alphabet) for _ in range(6))
            while code in self.rooms:
                code = ''.join(secrets.choice(alphabet) for _ in range(6))
            token = secrets.token_urlsafe(32)
            self.rooms[code] = {'host': token, 'guest': None, 'hostSeen': self.now(),
                                'guestSeen': self.now(), 'sequence': 0,
                                'hostEvents': deque(maxlen=256), 'guestEvents': deque(maxlen=256)}
            return {'code': code, 'token': token, 'role': 'host'}

    def join(self, code):
        with self.lock:
            self.prune()
            room = self.rooms.get(code)
            if not room:
                raise KeyError('Stanza non trovata o scaduta.')
            if room['guest']:
                raise ValueError('Questa stanza ha già due giocatori.')
            room['guest'] = secrets.token_urlsafe(32)
            room['guestSeen'] = self.now()
            room['guestEvents'].clear()
            self.emit(room, 'host', {'type': 'joined'})
            return {'code': code, 'token': room['guest'], 'role': 'guest'}

    def authenticate(self, code, token):
        room = self.rooms.get(code)
        if not room:
            raise KeyError('Stanza non trovata o scaduta.')
        for side in ('host', 'guest'):
            if token and room[side] and hmac.compare_digest(token, room[side]):
                room[side + 'Seen'] = self.now()
                return room, side
        raise PermissionError('Accesso alla stanza non valido.')

    def events(self, code, token, since):
        with self.lock:
            self.prune()
            room, side = self.authenticate(code, token)
            return {'events': [event for event in room[side + 'Events'] if event['id'] > since]}

    def signal(self, code, token, message):
        with self.lock:
            room, side = self.authenticate(code, token)
            if not isinstance(message, dict) or message.get('type') not in ('offer', 'answer', 'candidate'):
                raise ValueError('Messaggio non valido.')
            target = 'guest' if side == 'host' else 'host'
            if not room[target]:
                raise ValueError('Il secondo giocatore non è collegato.')
            self.emit(room, target, message)
            return {'ok': True}

    def leave(self, code, token):
        with self.lock:
            room, side = self.authenticate(code, token)
            if side == 'host':
                del self.rooms[code]
            else:
                room['guest'] = None
                room['guestEvents'].clear()
                self.emit(room, 'host', {'type': 'left'})
            return {'ok': True}

ROOMS = Rooms()

def allowed_origins():
    return {origin.strip().rstrip('/') for origin in os.environ.get('SA2000_ALLOWED_ORIGINS', '').split(',') if origin.strip()}

def ice_servers():
    # Add TURN credentials through deployment configuration for cross-network reliability.
    raw = os.environ.get('SA2000_ICE_SERVERS', '[{"urls":"stun:stun.cloudflare.com:3478"}]')
    servers = json.loads(raw)
    if not isinstance(servers, list):
        raise ValueError('SA2000_ICE_SERVERS must contain a JSON array.')
    return servers

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def cors(self):
        origin = self.headers.get('Origin')
        if origin and (origin.rstrip('/') in allowed_origins() or urlparse(origin).netloc == self.headers.get('Host')):
            self.send_header('Access-Control-Allow-Origin', origin)
            self.send_header('Vary', 'Origin')

    def do_OPTIONS(self):
        origin = self.headers.get('Origin', '')
        if origin.rstrip('/') not in allowed_origins() and urlparse(origin).netloc != self.headers.get('Host'):
            return self.json_reply({'error': 'Origine non autorizzata.'}, 403)
        self.send_response(204)
        self.cors()
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Max-Age', '600')
        self.end_headers()

    def json_reply(self, value, status=200):
        body = json.dumps(value).encode()
        self.send_response(status)
        self.cors()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.end_headers()
        self.wfile.write(body)

    def token(self):
        auth = self.headers.get('Authorization', '')
        return auth[7:] if auth.startswith('Bearer ') else ''

    def api(self):
        parsed = urlparse(self.path)
        parts = parsed.path.strip('/').split('/')
        origin = self.headers.get('Origin')
        if origin and urlparse(origin).netloc != self.headers.get('Host') and origin.rstrip('/') not in allowed_origins():
            return self.json_reply({'error': 'Origine non autorizzata.'}, 403)
        try:
            data = {}
            if self.command == 'POST':
                length = int(self.headers.get('Content-Length', '0'))
                if not 0 < length <= 65536:
                    raise ValueError('Dimensione messaggio non valida.')
                data = json.loads(self.rfile.read(length))
                if not isinstance(data, dict):
                    raise ValueError('Messaggio non valido.')
            if parsed.path == '/api/rooms' and self.command == 'POST':
                return self.json_reply({**ROOMS.create(self.client_address[0]), 'iceServers': ice_servers()})
            if len(parts) == 4 and parts[:2] == ['api', 'rooms']:
                code, action = parts[2].upper(), parts[3]
                if action == 'join' and self.command == 'POST':
                    return self.json_reply({**ROOMS.join(code), 'iceServers': ice_servers()})
                if action == 'events' and self.command == 'GET':
                    since = max(0, int(parse_qs(parsed.query).get('since', ['0'])[0]))
                    return self.json_reply(ROOMS.events(code, self.token(), since))
                if action == 'signal' and self.command == 'POST':
                    return self.json_reply(ROOMS.signal(code, self.token(), data))
                if action == 'leave' and self.command == 'POST':
                    return self.json_reply(ROOMS.leave(code, self.token()))
            self.json_reply({'error': 'Endpoint non trovato.'}, 404)
        except PermissionError as exc:
            self.json_reply({'error': str(exc)}, 403)
        except KeyError as exc:
            self.json_reply({'error': exc.args[0]}, 404)
        except (ValueError, TypeError) as exc:
            self.json_reply({'error': str(exc)}, 400)

    def do_POST(self):
        if self.path.startswith('/api/'):
            return self.api()
        self.json_reply({'error': 'Endpoint non trovato.'}, 404)

    def do_GET(self):
        if self.path.startswith('/api/'):
            return self.api()
        path = unquote(urlparse(self.path).path).lstrip('/') or 'index.html'
        allowed = path == 'index.html' or any(path.startswith(prefix) for prefix in
                    ('game/', 'arcade/engine/', 'arcade/ui/', 'arcade/assets/', 'assets/'))
        file = (ROOT / path).resolve()
        safe_parts = all(part != '..' and not part.startswith('.') for part in Path(path).parts)
        canonical = str(file.relative_to(ROOT)) if file.is_relative_to(ROOT) else ''
        canonical_allowed = canonical == 'index.html' or any(canonical.startswith(prefix) for prefix in ('game/', 'arcade/engine/', 'arcade/ui/', 'arcade/assets/', 'assets/'))
        if not allowed or not safe_parts or not canonical_allowed or not file.is_file():
            return self.json_reply({'error': 'File non trovato.'}, 404)
        import mimetypes
        body = file.read_bytes()
        self.send_response(200)
        self.send_header('Content-Type', mimetypes.guess_type(str(file))[0] or 'application/octet-stream')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.end_headers()
        self.wfile.write(body)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--port', type=int, default=8080)
    args = parser.parse_args()
    ice_servers()  # Validate configuration before accepting rooms.
    server = ThreadingHTTPServer((args.host, args.port), Handler)
    print(f'Soccer Arcade 2000: http://{args.host}:{server.server_port}', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
