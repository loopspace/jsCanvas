
//## Main

var length, cycle, time, atime;
var colours = [
  new Colour("magenta"),
  new Colour("cyan"),
  new Colour("yellow"),
]

function setup() {
  length = WIDTH - 250;
  cycle = 0;
  time = 0;
  dt = 1;
  atime = 1440;
/*  parameter.number("time","time",0,1440,1,0)
  parameter.boolean("Layer","layer");//,0,360,1,0)
  parameter.number("offset","s",0,360,1,0);
  */
}

function draw() {
  if (time <= 0) {
		dt *= -1;
  }
  if (time >= atime) {
    dt *= -1;
    cycle = 1 - cycle;
  }
  time += dt*DeltaTime/5;
  time = Math.max(0,Math.min(atime,time));
  var itime = cycle*Math.max(0,Math.min(360,360 - (atime - time)/3));
//  time = parameters.time;
  background(40,40,50);
  stroke(200,30,150);
  strokeWidth(2);
  translate(length+120,HEIGHT/2);
  pushTransformation();
//  rotate(parameters.s);
  if (cycle) {
//  if (parameters.layer) {
    spiral(10,colours[0],time,itime);
  } else {
    spiral(34,colours[0],time,0);
  }
  popTransformation();
  spiral(30,colours[1],time,0);
  strokeWidth(15);
  spiral(20,colours[2],time,0);
  /*
  strokeWidth(1);
  stroke("black");
  line(-50,0,50,0);
  line(0,-50,0,50);
  */
}

function spiralCentre(r,t) {
  var neg = false;
  var dr = 6;
  var c = new Vec2(-dr,0);
  var o = new Vec2(0,r);
  var l = 0;
  if (t < 0) {
    r -= dr*4;
    t += 360;
    neg = true;
    l = -(r + 11*dr)*Math.PI/2;
  }
  c = c.rotate(t-90);
  l += r*Math.PI/2;
  while (t > 90) {
    r += dr;
    l += r*Math.PI/2;
    c = c.rotate(-90);
    o = o.add(c);
    t -= 90;
  }
  o = o.add(new Vec2(0,-r));
	return o.multiply(-1);  
}

function spiral(r,cl,t,it) {
  var st = t - it;
  var neg = false;
  var dr = 6;
  var c = new Vec2(-dr,0);
  var l = 0;
  var o = spiralCentre(r,t);
  pushTransformation();
  translate(o);
  pushStyle();
  if (t < 0) {
    noStroke();
    r -= dr*4;
    t += 360;
    neg = true;
    l = -(r + 11*dr)*Math.PI/2;
  } else {
    stroke(cl);
  }
  c = c.rotate(t-90);
  l += r*Math.PI/2;
  while (t > 90 && l < length) {
    r += dr;
    if (t > st) {
      if (t - 90 < st) {
        arc(0,0,r - dr,st - 90,t - 180,false);
		    l += r*Math.PI/2*(st - t + 90)/90;
      }
    } else {
      arc(0,0,r - dr,t-90,t - 180,false);
	    l += r*Math.PI/2;
    }
    c = c.rotate(-90);
    translate(c);
    t -= 90;
  }
  var a = 0;
  if (l > length) {
    a = Math.max(t - 90 + (l - length)*180/Math.PI/r,0);
  }
  arc(0,0,r,t-90,a-90,false);
  l -= r*Math.PI*(a - t + 90)/180;
  translate(0,-r);
  if (l < length) {
    line(0,0,l-length,0);
  }
  if (neg) {
    stroke(cl);
    line(l,0,l-length,0);
  }
  popStyle();
  popTransformation();
}


