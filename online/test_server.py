"""Private-room authentication, signaling and lifecycle checks."""
import unittest
from server import Rooms

class RoomTests(unittest.TestCase):
    def setUp(self):
        self.clock = [0]
        self.rooms = Rooms(lambda: self.clock[0])
        self.host = self.rooms.create('test')
    def test_pair_and_signal(self):
        h = self.host
        guest = self.rooms.join(h['code'])
        self.assertNotEqual(h['token'], guest['token'])
        with self.assertRaises(ValueError): self.rooms.join(h['code'])
        self.assertEqual(self.rooms.events(h['code'], h['token'], 0)['events'][0]['message']['type'], 'joined')
        self.rooms.signal(h['code'], h['token'], {'type':'offer','description':{'sdp':'test'}})
        events = self.rooms.events(h['code'], guest['token'], 0)['events']
        self.assertEqual(events[0]['message']['type'], 'offer')
        self.assertEqual(self.rooms.events(h['code'], guest['token'], events[0]['id'])['events'], [])
        self.rooms.signal(h['code'], guest['token'], {'type':'answer'})
        self.assertEqual(self.rooms.events(h['code'], h['token'], 1)['events'][0]['message']['type'], 'answer')
    def test_authentication(self):
        with self.assertRaises(PermissionError): self.rooms.events(self.host['code'], 'wrong', 0)
        with self.assertRaises(ValueError): self.rooms.signal(self.host['code'], self.host['token'], {'type':'command'})
    def test_leave_and_rejoin(self):
        h = self.host; guest = self.rooms.join(h['code'])
        self.rooms.leave(h['code'], guest['token'])
        with self.assertRaises(PermissionError): self.rooms.events(h['code'], guest['token'], 0)
        self.assertEqual(self.rooms.events(h['code'], h['token'], 1)['events'][0]['message']['type'], 'left')
        self.rooms.join(h['code'])
        self.rooms.leave(h['code'], h['token'])
        with self.assertRaises(KeyError): self.rooms.join(h['code'])
    def test_timeout_and_limits(self):
        for _ in range(9): self.rooms.create('test')
        with self.assertRaises(ValueError): self.rooms.create('test')
        self.clock[0] = 181
        with self.assertRaises(KeyError): self.rooms.join(self.host['code'])
        self.rooms.create('test')
    def test_guest_timeout(self):
        h = self.host; guest = self.rooms.join(h['code'])
        self.clock[0] = 170; self.rooms.events(h['code'], h['token'], 0)
        self.clock[0] = 181; self.rooms.events(h['code'], h['token'], 0)
        with self.assertRaises(PermissionError): self.rooms.events(h['code'], guest['token'], 0)
        self.rooms.join(h['code'])

if __name__ == '__main__': unittest.main()
