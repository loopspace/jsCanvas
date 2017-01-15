
//## Main

var g;

function setup() {
  g = new Grid(20,5);
}

function draw() {
  background(40,40,50);
  g.draw();
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
    return new Vec2(x,y);
  }
  
  return this;
}


