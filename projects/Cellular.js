
//## Main

var persist,clear,sqwidth,h,drawSq;

function setup() {
  parameter.action("Restart",restart);
  parameter.action("Continuous", function() {persist = !persist; nextLine();});
  parameter.action("Shift Up", function() {clear = true;});
  parameter.action("Random Start", function() { clear = true; for (var k = 0; k < size; k++) {if (Math.random() > .5) {grid[k] = 1}}});
  parameter.action("Draw", nextLine);
  parameter.number("Rule","rule",0,255,1,101,newRule);
  parameter.number("Size","size",10,WIDTH,1,10,restart);
  parameter.colour("Edge Colour", "edgeColour",new Colour(255));
  parameter.colour("Shade Colour", "shadeColour", new Colour(200));
  newRule(101);
  restart();
}

function draw() {
  if (clear) {
    background(40,40,50);
    h = 1;
    clear = false;
    drawSq = true;
  }
  stroke(parameters.edgeColour);
  if (drawSq) {
    for (var k = 0; k < parameters.size; k++) {
      if (grid[k] == 1) {
        fill(parameters.shadeColour);
      } else {
        noFill();
      }
      rect(k*sqwidth,HEIGHT - h*sqwidth,sqwidth,sqwidth);
    }
    drawSq = false;
    if (persist) {
      nextLine();
    }
    h++;
    if (h*sqwidth > 1*HEIGHT) {
      clear = true;
    }
  }
}

function touched(t) {
  if (h == 2 && t.state == ENDED && t.y > HEIGHT - sqwidth) {
    var sq = Math.floor(t.x/sqwidth);
    grid[sq] = 1 - grid[sq];
    clear = true;
  }
}

function restart() {
  sqwidth = WIDTH/parameters.size;
  h = 1;
  grid = [];
  for (var k = 0; k < parameters.size; k++) {
    grid[k] = 0;
  }
  clear = true;
  persist = false;
}

function nextLine() {
  var a,b,c,g;
  g = [];
  for (var k = 0; k < parameters.size; k++) {
    a = grid[k-1] || 0;
    b = grid[k];
    c = grid[k+1] || 0;
    g[k] = rule[a*4 + b*2 + c];
  }
  grid = g;
  drawSq = true;
}

function newRule(n) {
  rule = [];
  for (var k = 0; k < 8; k++) {
    rule[k] = n%2;
    n = Math.floor(n/2);
  }
  var v;
  output.clear();
  for (var k = 0; k < 8; k++) {
    print(("000" + k.toString(2)).substr(-3) + ' -> ' + rule[k]);
  }
}


