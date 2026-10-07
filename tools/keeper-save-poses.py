"""Original articulated pixel poses for the existing code-generated animation atlas."""
import math
from PIL import Image, ImageDraw

def pose(kind, index, left=False):
    # Anticipation, push-off, extension, glove contact, fall, landing and recovery.
    angles = [0, -.3, -.7, -1.05, -1.1, -.9, -.55, -.15]
    if kind == 'tip': angles = [0, -.1, -.3, -.55, -.6, -.5, -.3, 0]
    if kind == 'punch': angles = [0, .05, .1, .12, .08, -.08, -.15, 0]
    angle = -angles[index]
    stretch = [0, .2, .65, 1, 1, .75, .4, .1][index]
    cell = Image.new('RGBA', (128,128)); d = ImageDraw.Draw(cell)
    def point(x,y):
        x,y=x*math.cos(angle)-y*math.sin(angle),x*math.sin(angle)+y*math.cos(angle)
        return (round(64+(-x if left else x)),round(76+y))
    def poly(points, fill): d.polygon([point(*p) for p in points], fill=fill)
    def limb(points, outer, inner, width=9):
        pts=[point(*p) for p in points];d.line(pts,fill=outer,width=width,joint='curve');d.line(pts,fill=inner,width=width-3,joint='curve')
    # Distinct trailing legs and boot studs preserve a readable complete silhouette.
    leg1=[(-7,9),(-13-9*stretch,24),(-15-17*stretch,38-8*stretch)]
    leg2=[(7,9),(15+8*stretch,23),(18+13*stretch,36-12*stretch)]
    for leg in [leg1,leg2]:
        limb(leg,'#07171c','#30484b',10);limb(leg[1:],'#172933','#426161',7)
        x,y=leg[-1];limb([(x-4,y),(x+7,y+1)],'#07101c','#d7e3cf',8)
        for off in [-2,3,7]: poly([(x+off,y+3),(x+off+2,y+3),(x+off+2,y+5),(x+off,y+5)],'#e4e9cc')
    poly([(-12,-24),(11,-24),(14,4),(9,13),(-11,12),(-15,1)],'#103425')
    poly([(-10,-22),(9,-22),(11,0),(7,7),(-9,6),(-12,-2)],'#278c48')
    poly([(-8,-21),(-3,-21),(-4,6),(-9,4)],'#4eaf60')
    poly([(-11,7),(12,7),(17,17),(1,20),(-16,17)],'#10282d')
    limb([(-2,-24),(-2,-30)],'#74432b','#efb476',8)
    head=point(-2,-37);d.ellipse((head[0]-8,head[1]-10,head[0]+8,head[1]+10),fill='#8b5133');d.ellipse((head[0]-7,head[1]-9,head[0]+5,head[1]+7),fill='#eeb176')
    poly([(-10,-39),(-9,-47),(0,-49),(7,-43),(5,-38),(-1,-42)],'#20242a');poly([(-8,-46),(-3,-47),(2,-44),(-4,-44)],'#4c4d49')
    if kind=='stretch':
        hands=[(-21,-14-24*stretch),(18+10*stretch,-16-27*stretch)]
    elif kind=='tip':
        hands=[(-23,-11-13*stretch),(14+10*stretch,-25-25*stretch)]
    else:
        hands=[(-6-4*stretch,-22-25*stretch),(7+4*stretch,-22-25*stretch)]
    for shoulder,hand in zip([(-12,-21),(11,-21)],hands):
        elbow=((shoulder[0]+hand[0])*.5-3,(shoulder[1]+hand[1])*.5+3)
        limb([shoulder,elbow,hand],'#0c3023','#3c9c51',10)
        hx,hy=hand
        poly([(hx-5,hy-5),(hx+4,hy-5),(hx+5,hy+4),(hx-5,hy+5)],'#536973')
        poly([(hx-4,hy-4),(hx+3,hy-4),(hx+4,hy+2),(hx-3,hy+3)],'#e8eee2')
        limb([(hx-3,hy-4),(hx+3,hy-4)],'#fff7cf','#fff7cf',3)
        if kind=='tip' and stretch>.5:
            for finger in range(3): limb([(hx-3+finger*3,hy-3),(hx-3+finger*3,hy-9-finger%2)],'#ddeee6','#ddeee6',2)
        if kind=='punch': poly([(hx-3,hy-3),(hx+3,hy-3),(hx+3,hy),(hx-3,hy)],'#fbf9df')
    bounds=cell.getbbox();body=cell.crop(bounds);out=Image.new('RGBA',(128,128));out.alpha_composite(body,((128-body.width)//2,118-body.height));return out
