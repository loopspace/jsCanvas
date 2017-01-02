
//## Main

var g,lines;

function setup() {
  g = new Grid(20,5);
  var c = point;
  lines = [
    {
      'colour': new Colour(255,255,255),
      'points': []
    }
  ]
  parameter.watch("Number of Coordinates", function() {return lines[lines.length-1]['points'].length });
  parameter.action("Undo", function() {lines[0]['points'].pop();});
  parameter.colour("Line Colour","lineColour",new Colour(255,255,255), function(c) {lines[lines.length-1]['colour'] = c;});
  parameter.action("New Set of Lines", function() {lines.push({'colour': parameters.lineColour, 'points': []})});
  parameter.action("Show", function() {for (var k = 0; k < lines.length; k++) {print("--"); for (var l = 0; l < lines[k]['points'].length; l++ ) {print(lines[k]['points'][l])}}});
  parameter.action("Clear", function() {lines = [{'colour': lineColour, 'points': []}]});
}

function draw() {
  background(40,40,50);
  g.draw();
  for (var j = 0; j < lines.length; j++) {
    stroke(lines[j]['colour']);
    for (var k = 1; k < lines[j]['points'].length; k++) {
      line(lines[j]['points'][k-1],lines[j]['points'][k]);
    }
  }
  noStroke();
  fill(50,200,50);
  if (lines[lines.length-1]['points'].length > 0) {
    ellipse(lines[lines.length-1]['points'][lines[lines.length-1]['points'].length-1],.5);
  }
}

function touched(t) {
  if (t.state == BEGAN) {
    lines[lines.length-1]['points'].push(g.invtransform(t,0));
  }
}



//## Grid

function Grid(n,s) {
  this.scale = s;
  this.size = n;
  
  this.draw = function() {
    var n = this.size, s = this.scale;
    var sf = Math.min((WIDTH-20)/(2*n),(HEIGHT-20)/(2*n));
    var xm = Math.floor((WIDTH-20)/(2*sf));
    var ym = Math.floor((HEIGHT-20)/(2*sf));
    pushStyle();
    translate(WIDTH/2,HEIGHT/2);
    scale(sf);
    stroke(100);
    strokeWidth(1);
    for (var k = 1; k <= xm; k++) {
      line(k,-ym,k,ym);
      line(-k,-ym,-k,ym);
    }
    for (var k = 1; k <= ym; k++) {
      line(-xm,k,xm,k);
      line(-xm,-k,xm,-k);
    }
    stroke(255);
    line(0,-ym,0,ym);
    line(-xm,0,xm,0);
    fill(255);
    textMode(CENTRE);
    textValign(TOP);
    for (var k = s; k <= xm; k += s) {
      line(k,0,k,-.5);
      text(k,k,-.5);
      line(-k,0,-k,-.5);
      text(-k,-k,-.5);
    }
    textMode(RIGHT);
    textValign(CENTRE);
    for (var k = s; k <= ym; k += s) {
      line(0,k,-.5,k);
      text(k,-1,k);
      line(0,-k,-.5,-k);
      text(-k,-1,-k);
    }
    popStyle();
  }
  
  this.invtransform = function(v,p) {
    p = p || 0;
    p = Math.pow(10,p);
    var n = this.size, s = this.scale;
    var sf = Math.min((WIDTH-20)/(2*n),(HEIGHT-20)/(2*n));
    var xm = Math.floor((WIDTH-20)/(2*sf));
    var ym = Math.floor((HEIGHT-20)/(2*sf));
		var x = v.x - WIDTH/2, y = v.y - HEIGHT/2;
    x = Math.floor(x/sf*p+.5)/p;
    y = Math.floor(y/sf*p+.5)/p;
    return vec2(x,y);
  }
  
  return this;
}


