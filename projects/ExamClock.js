
//## Main

var r;
var examTime;
var extraTime;
var endTime;
var endExtraTime;
var msOffset = 0;
var action;
var fsClock;
var fsText;

function setup() {
  r = Math.min(WIDTH/2,HEIGHT/2)-100;
  fsClock = Math.floor(r/5);
  fontSize(10);
  var fm = textSize("End of Extra Time");
  fsText = Math.floor((WIDTH/2 - 1.2*r - 40)/fm.width*10);
  textValign(CENTRE);
  textMode(CENTRE);
  arcMode(RELATIVE);
  examTime = new Parameter({type: "number", title: "Exam Length (minutes)", min: 0, max: 200, step: 1, value: 60});
  extraTime = new Parameter({type: "number", title: "Extra Time (percentage)", min: 0, max: 100, step: 1, value: 25});
  action = new Parameter({type: "action", name: "Start Exam", callback: startExam}); // 'name' should be 'title' for consistency
  
  print("Set the exam length with the first slider.  If there are students with extra time use the second slider to set their percentage (set to 0 if there are none).  Click 'Start Exam' to start the timer.")
}

function draw() {
  background(200,200,210);
  var d = new Date();
  d = new Date(d.getTime() - msOffset);
  
  var s = new Vec2(r,0);
  var m = new Vec2(r,0);
  var h = new Vec2(r/2,0);
  s.rotateBy(90 - 6*(d.getSeconds() + click(d.getMilliseconds()/1000)));
	m.rotateBy(90 - 6*(d.getMinutes() + click(edge(d.getSeconds() + d.getMilliseconds()/1000 - 59,0,1))));
  h.rotateBy(90 - 30*(d.getHours() + d.getMinutes()/60 + d.getSeconds()/3600));
  
  translate(WIDTH/2,HEIGHT/2);
	fill(255);
  noStroke();
  ellipseMode(RADIUS);
  ellipse(0,0,r*1.2);
  fill(0);
  var x,f,tm;
  stroke(0);
  strokeWidth(5);
  fontSize(fsClock);
  for (var k = 1; k <= 60; k++) {
    x = new Vec2(r,0);
    x.rotateBy(90 - k*6);
    if (k%5 == 0) {
      f = .8
      text(k/5, x.multiply(1.1));
    } else {
      f = .9
    };
    line(x.multiply(f),x);
  }
  if (endTime) {
    var em = new Vec2(r*.9,0);
		em.rotateBy(90 - 6*(endTime.getMinutes()));
    var ec = new Colour(0,255,0);
    if (endTime.getHours()*60 + endTime.getMinutes() > d.getHours()*60 + d.getMinutes() + 59) {
      ec = ec.mix(new Colour(0),.25);
    }
    stroke(ec);
    line(0,0,em);
    var sector = new Path();
    sector.moveTo(0,0);
    sector.lineTo(ec.x/2,ec.y/2);
    sector.arc(0,0,r*.45,90 - 6*(endTime.getMinutes()),30);
    sector.lineTo(0,0);
    sector.fill({colour: ec});
    
    pushStyle();
    if (endTime.getHours()*60 + endTime.getMinutes() <= d.getHours()*60 + d.getMinutes()) {
      fill(255,0,0);
    } else if (endTime.getHours()*60 + endTime.getMinutes() < d.getHours()*60 + d.getMinutes()+5) {
      fill(0,255,255);
    } else {
      fill(ec);
    }

    fontSize(fsText);
    textMode(LEFT);
    noStroke();
    var y = r;
    var x = -WIDTH/2 + 20;
    text("End of Exam",x,y);
    y -= fsText + 20;
    text(endTime.toLocaleTimeString(),x+10,y);
    y -= fsText + 20;
    text("Time Remaining",x,y);
    y -= fsText + 20;
    text((endTime.getHours()*60 + endTime.getMinutes() - ( d.getHours()*60 + d.getMinutes())) + " mins",x+10,y);
    popStyle();
  }

  if (endExtraTime) {
    var em = new Vec2(r*.9,0);
		em.rotateBy(90 - 6*(endExtraTime.getMinutes()));
    var ec = new Colour(0,127,255);
    if (endExtraTime.getHours()*60 + endExtraTime.getMinutes() > d.getHours()*60 + d.getMinutes() + 59) {
      ec = ec.mix(new Colour(0),.25);
    }
    stroke(ec);
    line(0,0,em);
    var sector = new Path();
    sector.moveTo(0,0);
    sector.lineTo(em.x/2,em.y/2);
    sector.arc(0,0,r*.45,90 - 6*(endExtraTime.getMinutes()),30);
    sector.lineTo(0,0);
    sector.fill({colour: ec});

    pushStyle();
    if (endExtraTime.getHours()*60 + endExtraTime.getMinutes() <= d.getHours()*60 + d.getMinutes()) {
      fill(255,0,0);
    } else if (endExtraTime.getHours()*60 + endExtraTime.getMinutes() < d.getHours()*60 + d.getMinutes()+5) {
      fill(0,255,255);
    } else {
      fill(ec);
    }

    fontSize(fsText);
    textMode(LEFT);
    var y = r;
    var x = WIDTH/2 - 20;
    var tw = textSize("End of Extra Time"); // textSize not working atm
    x -= tw.width;
    text("End of Extra Time",x,y);
    y -= fsText + 20;
    text(endExtraTime.toLocaleTimeString(),x+10,y);
    y -= fsText + 20;
    text("Time Remaining",x,y);
    y -= fsText + 20;
    text((endExtraTime.getHours()*60 + endExtraTime.getMinutes() - ( d.getHours()*60 + d.getMinutes())) + " mins",x+10,y);
    popStyle();
  }
  
  pushStyle();
  fill(255);
  textMode(CENTRE);
  textValign(BOTTOM);
  fontSize(40);
  text(d.toLocaleTimeString(),0,r*1.2);
  popStyle();
  
  
  stroke(0);
  line(0,0,h);
  line(0,0,m);
  
  stroke(255,0,0);
  strokeWidth(3);
  line(0,0,s);
  
  noStroke();
  fill(255,0,0);
  ellipse(0,0,10,10);
}

function startExam() {
  var d,e,m,h,et;
  d = new Date();
  endTime = new Date(d.getTime());
  e = examTime.value;
  m = d.getMinutes();
  h = d.getHours();
  m += e;
  h += Math.floor(m/60);
  m %= 60;
  endTime.setHours(h);
  endTime.setMinutes(m);
  endTime.setSeconds(0);

  et = extraTime.value;
  if (et != 0) {
	  endExtraTime = new Date(d.getTime());
    h = d.getHours();
    m = d.getMinutes();
    m += Math.ceil(e*(1 + et/100));
    h += Math.floor(m/60);
    m %= 60;
    endExtraTime.setHours(h);
    endExtraTime.setMinutes(m);
  	endExtraTime.setSeconds(0);
  }  else {
    endExtraTime = false;
  }
  msOffset = d.getSeconds()*1000 + d.getMilliseconds();
  
  output.clear();
  
  print("Green is for the regular exam, blue for extra time.  The wedge represents 5 minutes before the end of the exam.  The displayed time will brighten when there is less than an hour remaining, will turn cyan when there is 5 minutes remaining, and red at the end of the exam.");
  // Change action title to "Restart Exam"
  return true;
}

function click(t) {
  var a = Math.floor(t);
  if (t < a + .6) {
    return a;
  } else {
    return (t - a - .6)/.4 + a;
  }
}

function edge(t,a,b) {
  return Math.min(b, Math.max(a,t));
}


