
//## Main

var sqwidth, gridwidth, gridheight;

function setup() {
  parameter.number("Size","size",10,100,1,10,restart);
  parameter.action("Restart",restart);
  parameter.action("Step",step);
  parameter.boolean("Run","run",false);
  restart();
}

function draw() {
  background(40,40,50);
  scale(sqwidth);
  fill(200);
  noStroke();
  for (var k = 0; k < gridwidth; k++) {
    for (var l = 0; l < gridheight; l++) {
      if (grid[k][l] == 1) {
        rect(k,l,1,1);
      }
    }
  }
  stroke(100);
  for (var k = 0; k < gridheight; k++) {
    line(0,k,gridwidth,k);
  }
  for (var k = 0; k < gridwidth; k++) {
    line(k,0,k,gridheight);
  }
  if (parameters.run) {
    step();
  }
}

function restart() {
  sqwidth = WIDTH/parameters.size;
  gridwidth = parameters.size;
  gridheight = Math.floor(HEIGHT/sqwidth);
  grid = [];
  for (var k = 0; k < gridwidth; k++) {
    grid[k] = [];
    for (var l = 0; l < gridheight; l++) {
      grid[k][l] = 0;
    }
  }
}

function step() {
  var g = [];
  var nb;
  for (var k = 0; k < gridwidth; k++) {
    g[k] = [];
    for (var l = 0; l < gridheight; l++) {
      nb = 0;
      for (var m = Math.max(0,k-1); m <= Math.min(gridwidth-1,k+1); m++) {
        for (var n = Math.max(0,l-1); n <= Math.min(gridheight-1,l+1); n++) {
        	nb += grid[m][n];
      	}
      }
     	nb -= grid[k][l];
      if (grid[k][l] == 1 && (nb < 2 || nb > 3)) {
        g[k][l] = 0;
      } else if (grid[k][l] == 0 && nb == 3) {
        g[k][l] = 1;
      } else {
        g[k][l] = grid[k][l];
      }
    }
  }
  grid = g;
}

function touched(t) {
  if (t.state == ENDED) {
    var sqx = Math.floor(t.x/sqwidth);
    var sqy = Math.floor(t.y/sqwidth);
    grid[sqx][sqy] = 1 - grid[sqx][sqy];
  }
}


