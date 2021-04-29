
//## Main

var peano;
var origin;
var s;
var lvl;
var editing;
var lineColour;
var grid;

function setup() {
  lvl = 3;
  s = Math.floor(Math.min(HEIGHT,WIDTH)/Math.pow(3,lvl));
  var row;
  grid = [];
  for (var i = 0; i < Math.pow(3,lvl); i++) {
    row = [];
    for (var j = 0; j < Math.pow(3,lvl); j++) {
      row.push(0);
    }
    grid.push(row);
  }
  origin = new Vec2(WIDTH,HEIGHT);
  origin.decrement( new Vec2(s*Math.pow(3,lvl), s*Math.pow(3,lvl)));
  origin.multiplyBy(.5);
  peano = generatePeano(grid,lvl,s);
  lineColour = new Parameter({type: "colour", title: "Line Colour", value: new Colour('white')});
  editing = new Parameter({type: "boolean", title: "Editing", value: true, callback: function(b) {
    if (!b) peano = generatePeano(grid,lvl,s);
  }});
  print("In editing mode, click on squares to indicate that they are to be filled in, then switch out of editing mode to see the generated Peano curve.")
}

function draw() {
  background(40,40,50);
  translate(origin);
  if (editing.value) {
	  var top = Math.pow(3,lvl);
    fill("lightgrey");
    noStroke();
    for (var i = 0; i < grid.length; i++) {
      for (var j = 0; j < grid[i].length; j++) {
        if (grid[i][j] == 1) {
          rect(i*s,j*s,s,s);
        }
      }
    }
	  stroke("grey");
    noFill();
  	for (var x = 0; x <= top; x++) {
    	line(x*s,0,x*s,s*top);
    	line(0,x*s,s*top,x*s);
  	}	
  } else {
  	peano.use({draw: lineColour.value, transformShape: true});
  }
}

function touched(t) {
  if (editing.value) {
    if (t.state == ENDED) {
      var x,y;
      x = Math.floor((t.x - origin.x)/s);
      y = Math.floor((t.y - origin.y)/s);
      if (x > -1 && x < grid.length && y > -1 && y < grid.length) {
        grid[x][y] = 1 - grid[x][y];
      }
    }  
  }
}

function generatePeano(grid, level, scaleFactor) {
  pushTransformation();
  resetTransformation();
  scale(scaleFactor*Math.sqrt(2));
  rotate(45);
	var p = new Path();
  var d = 1;
  var x = 0, y = 0, dx = 1, dy = 1;
  p.moveTo(0,0);
  var l = 1/3;
  for (var n = 1; n <= Math.pow(9,level); n++) {
    p.lineTo(.1,0);
    if (grid[x][y] == 1) {
      p.lineTo(.9*l,0);
      p.lineTo(l,.1*l);
      p.lineTo(l,.9*l);
      p.lineTo(1.1*l,l);
      p.lineTo(1.9*l,l);
      p.lineTo(2*l,.9*l);
      p.lineTo(2*l,.1*l);
      p.lineTo(1.9*l,0);
      p.lineTo(1.1*l,0);
      p.lineTo(l,-.1*l);
      p.lineTo(l,-.9*l);
      p.lineTo(1.1*l,-l);
      p.lineTo(1.9*l,-l);
      p.lineTo(2*l,-.9*l);
      p.lineTo(2*l,-.1*l);
      p.lineTo(2.1*l,0);
    }
    p.lineTo(.9,0);
    cn = n;
    while (cn%9 == 0) {cn = cn/9;};
    translate(1,0);
    if (cn%3 == 0) {
      rotate(-90*d);
      x += dx;
      dy *= -1;
    } else {
			rotate(90*d);
      y += dy;
      dx *= -1;
    }
    d *= -1;
  }
  popTransformation();
  return p;
}


