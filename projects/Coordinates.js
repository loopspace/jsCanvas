
//## Main

var g,shapes;

function setup() {
  g = new Grid(20,5);
  var c = point;
  shapes = [
    {
      'colour': new Colour(255,255,0),
      'points': [c(1,2), c(10,2), c(10,7), c(1,7), c(1,2)]
    },
    {
      'colour': new Colour(255,0,255),
      'points': [c(-1,2), c(-10,2), c(-10,7), c(-1,7), c(-1,2)]
    }
  ]
}

function draw() {
  background(40,40,50);
  g.draw();
  stroke(150,50,200);
  strokeWidth(5);
  for (var j = 0; j < shapes.length; j++) {
    stroke(shapes[j]['colour']);
    for (var k = 1; k < shapes[j]['points'].length; k++) {
      line(shapes[j]['points'][k-1],shapes[j]['points'][k]);
    }
  }
}



//## Grid

var stuff = false;

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
  
  return this;
}


