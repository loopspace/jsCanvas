
//## Main

function setup() {
  parameter.number("Multiplier","multiplier",1,12,1,3);
  parameter.number("Clock Number","clock",2,15,1,9);
  parameter.number("Angle Step","angleStep",2,10,1,4);
  parameter.number("Fade Factor","fadeFactor",0,1,.1,0);
  parameter.action("Generate",generate);
  generate();
  background(40,40,50);
}

function draw() {
  background(40,40,50,parameters.fadeFactor*255);
  stroke(200,30,150);
  strokeWidth(2);
  translate(WIDTH/2,HEIGHT/2);
  scale(scaleFactor);
  translate(centre.multiply(-1));
  line(lines[step],lines[(step+1)%nlines]);
  step++;
  step %= nlines;
}

function generate() {
  background(40,40,50);
  var m = parameters.multiplier, n = parameters.clock, da = 360/parameters.angleStep;
  var l,nl = 1;
  var pts = [(m+n-1)%n+1];
  for (var k = 2; k <= n; k++) {
    l = (k*m + n - 1)%n + 1;
    if (l == m) {
      break;
    }
    pts.push(l);
    nl++;
  }
  for (var k = 0; k < parameters.angleStep; k++) {
    for (var l = 0; l < nl; l++) {
      pts.push(pts[l]);
    }
  }
  nl *= parameters.angleStep;
  var ll = new Vec2(0,0), ur = new Vec2(0,0), p = new Vec2(0,0), a = 0;
  lines = [new Vec2(0,0)];
  for (var k = 0; k < nl; k++) {
    p = p.add(new Vec2(pts[k],0).rotate(a));
    lines.push(p);
    a += da;
  }
  for (var k = 0; k < lines.length; k++) {
    ll.x = Math.min(ll.x,lines[k].x);
    ll.y = Math.min(ll.y,lines[k].y);
    ur.x = Math.max(ur.x,lines[k].x);
    ur.y = Math.max(ur.y,lines[k].y);
  }
  centre = ll.add(ur).divide(2);
  var w = ur.subtract(ll);
  scaleFactor = Math.min((WIDTH-10)/w.x,(HEIGHT - 10)/w.y);
  step = 0;
  nlines = lines.length;
}


