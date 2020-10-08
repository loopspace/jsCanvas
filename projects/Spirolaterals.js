
//## Main

function setup() {
  multiplier = new Parameter({type: "number", title: "Multiplier",min: 1, max: 12, value: 3});
  clock = new Parameter({type: "number", title: "Clock Number",min: 2,max: 15,value: 9});
  angleStep = new Parameter({type: "number", title: "Angle Step",min: 2,max: 10,value: 4});
  fadeFactor = new Parameter({type: "number", title: "Fade Factor",min: 0,max: 1,step: .1,value: 0});
  interior = new Parameter({type: "boolean", title: "Angle is interior", value: true})
  new Parameter({type: "action", name: "Generate",callback: generate});
  generate();
  background(40,40,50);
}

function draw() {
  background(40,40,50,fadeFactor.value*255);
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
  var m = multiplier.value, n = clock.value, da = 360/angleStep.value;
  if (interior.value) {
    da = 180 - da;
  }
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
  for (var k = 0; k < angleStep.value; k++) {
    for (var l = 0; l < nl; l++) {
      pts.push(pts[l]);
    }
  }
  nl *= angleStep.value;
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


