
//## Main

var angle = 0, radius = 200;
var radianStrings = ["0", "\u03C0/2", "\u03C0", "3\u03C0/2", "2\u03C0"];
var multipliers = {x: [-1,1], y: [1,-1]};

function setup() {
  trace = new Parameter({type: "boolean", title: "Trace", value: false});
  radians = new Parameter({type: "boolean", title: "Radians",value: false});
  mirror = new Parameter({type: "boolean", title: "Mirror points", value: false});
  rotateCircle = new Parameter({type: "boolean", title: "Rotate circle",value: false});
  track = new Parameter({type: "select", title: "Track", options: ["x","y","y/x"], value: "y"});
	speed = new Parameter({type: "number", title: "Speed", min: 0, max: 30, step: 1, value: 5});
    new Parameter({
	type: "watch",
	title: "Angle",
	watch: function() {
	    if (radians.value) {
		return Math.round(angle/180*Math.PI*100)/100
	    } else {
		return Math.round(angle)
	    }
	}
    }
		 );
  radius = WIDTH/10;
  ellipseMode(RADIUS);
}

function draw() {
  background(40,40,50);
  // centre of circle
  translate(radius+40,HEIGHT/2);
  noFill();
  stroke(127);
  strokeWidth(2);
  pushTransformation();
  // draw and label the y-axis
  translate(radius + 50,0);
  textValign(BASELINE);
  textMode(RIGHT);
  if (track.value == "y/x") {
    line(0,-2*radius - 20,0,2*radius + 20);
    line(0,2*radius,-5,2*radius);
    line(0,-2*radius,-5,-2*radius);    
	  text(2,-10,2*radius);
  	text(-2,-10,-2*radius);
  } else {
    line(0,-radius - 20,0,radius + 20);
  }
  line(0,radius,-5,radius);
  line(0,-radius,-5,-radius);    
  text(1,-10,radius);
  text(-1,-10,-radius);
  if (trace.value) {
    // if we're doing the trace, draw and label the x-axis
    line(0,0,WIDTH - radius - 20,0);
    textValign(TOP);
    var s;
    for (var k = 0; k < 5; k++) {
      line(k*radius*Math.PI/2,0,k*radius*Math.PI/2,-5);
      if (radians.value) {
        s = radianStrings[k];
      } else {
        s = k*90;
      }
      text(s,k*radius*Math.PI/2,-5);
    }
    if (track.value == "y/x") {
      bezier(0,0,radius,radius,1.13*radius,1.5*radius,1.32*radius,3.92*radius);
      translate(radius*Math.PI,0);
      bezier(0,0,-radius,-radius,-1.13*radius,-1.5*radius,-1.32*radius,-3.92*radius);
      bezier(0,0,radius,radius,1.13*radius,1.5*radius,1.32*radius,3.92*radius);
      translate(radius*Math.PI,0);
      bezier(0,0,-radius,-radius,-1.13*radius,-1.5*radius,-1.32*radius,-3.92*radius);
    } else {
      // draw the sine/cosine curve as appropriate
      if (track.value == "x") {
        translate(-radius*Math.PI/2,0);
      } else {
        sineCurve(0,0,radius*Math.PI/2,radius);
      }
      translate(radius*Math.PI,0);
      sineCurve(0,0,-radius*Math.PI/2,radius);
      sineCurve(0,0,radius*Math.PI/2,-radius);
      translate(radius*Math.PI,0);
      sineCurve(0,0,-radius*Math.PI/2,-radius);
      if (track.value == "x") {
        sineCurve(0,0,radius*Math.PI/2,radius);
      }
    }
  }
  popTransformation();
  // back to centred on the circle
  pushTransformation();
  if (rotateCircle.value) {
    rotate(90);
  }
  line(-radius-20,0,radius+20,0);
  textValign(TOP);
  text("x",radius+20,-5);
  line(0,-radius-20,0,radius+20);
  textValign(BASELINE);
  text("y",-5,radius+20);
  // main circle
  strokeWidth(5);
  circle(0,0,radius);
  strokeWidth(2);
  stroke(200);
  var p = new Vec2(radius,0).rotate(angle);
  // draw the triangle
  line(0,0,p);
  line(p,p.x,0);
  line(p.x,0,0,0);
  // draw the lines for the mirror points
  if (mirror.value) {
    line(0,0,-p.x,p.y);
    line(0,0,-p.x,-p.y);
    line(0,0,p.x,-p.y);
  }
  arc(0,0,radius/3,0,angle);
  fill(255);
  noStroke();
  // draw the main point
  circle(p,10);
  // draw the mirror points
  if (mirror.value) {
    circle(-p.x,p.y,5);
    circle(-p.x,-p.y,5);
    circle(p.x,-p.y,5);
  }
  popTransformation();
  // back to the axes frame of reference
  translate(radius + 50,0);
  var x;
  if (trace.value) {
    x = angle;
    if (mirror.value) {
      // draw the mirror blobs
      if (track.value == "y/x") {
        circle((540-angle)%360*radius*Math.PI/180,-p.y/p.x*radius,5);
        circle((angle+180)%360*radius*Math.PI/180,p.y/p.x*radius,5);
        circle((360-angle)%360*radius*Math.PI/180,-p.y/p.x*radius,5);
      } else {
        circle((540-angle)%360*radius*Math.PI/180,multipliers[track.value][0]*p[track.value],5);
        circle((angle+180)%360*radius*Math.PI/180,-p[track.value],5);
        circle((360-angle)%360*radius*Math.PI/180,multipliers[track.value][1]*p[track.value],5);
      }
    }
  } else {
    x = 0;
  }
  // draw the main blob
  if (track.value == "y/x") {
    circle(x*radius*Math.PI/180,p.y/p.x*radius,10);
  } else {
    circle(x*radius*Math.PI/180,p[track.value],10);
  }
  // update the angle
  if (!inTouch) {
    angle += DeltaTime*speed.value/100;
    angle %= 360;
  }
}

function touched(t) {
  if (t.state == BEGAN) {
    inTouch = true;
  } else if (t.state == ENDED) {
    inTouch = false;
  }
    var p = new Vec2(t);
    angle = (360+ p.subtract(new Vec2(radius+40,HEIGHT/2)).angle())%360;
}

function sineCurve(a,b,c,d) {
  var x = (c - a)*2/Math.PI;
  var y = d - b;
  bezier(a,b,.9*x,.9*y,1.25*x,y,c,d);
}


