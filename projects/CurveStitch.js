
//## Main

var radius;

function setup() {
  parameter.number("Clock","clock",3,200,1,12);
  parameter.number("Multiplier","multiplier",2,10,1,2);
  parameter.number("Offset","offset",-10,10,1,0);
  radius = Math.min(WIDTH/2-10,HEIGHT/2-10);
}

function draw() {
  background(40,40,50);
  stroke(200,30,150);
  strokeWidth(2);
  translate(WIDTH/2,HEIGHT/2);
  ellipse(0,0,radius);
  var p,q,a,r;
  a = 360/parameters.clock;
  r = new Vec2(radius,0);
  for (var k=0; k < parameters.clock; k++) {
    p = r.rotate(90 - k*a);
    q = r.rotate(90 - (k*parameters.multiplier + parameters.offset)*a);
    line(p,q);
  }
}


