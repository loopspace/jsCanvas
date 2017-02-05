
//## Main

var shapes = [];
var constant = {parameter: {value: 1}, colour: new Colour("grey"), changed: function() {return false}, name: ""};
var variables = [constant];
var scaleFactor = 20;
var tolerance = 10;
var border = 3;
var grid = 1;
var generators = [];

function setup() {
  var w,h,wr,hr;
  w = WIDTH - 10;
  h = HEIGHT - 20;

  wr = constant.parameter.value*scaleFactor;
  h -= wr + scaleFactor;
  generators.push(
    new Rectangle(
      w - wr, h, constant.parameter, constant.parameter, constant.colour,"1"
    )
  )
  new Parameter({type: "action", callback: addVariable, name: "Add new variable"});
}

function draw() {
  for (var i = 0; i < variables.length; i++) {
    if (variables[i].changed()) {
      resetRectangles();
      break;
    }
  }
  background(40,40,50);
  stroke(90,90,90);
  strokeWidth(1);
  for (var i = 0; i < WIDTH/(grid*scaleFactor); i++) {
    line(i*grid*scaleFactor,0,i*grid*scaleFactor,HEIGHT);
  }
  for (var i = 0; i < HEIGHT/(grid*scaleFactor); i++) {
    line(0,i*grid*scaleFactor,WIDTH,i*grid*scaleFactor);
  }
  for (var i = 0; i < shapes.length; i++) {
    fill(shapes[i].colour);
    if (shapes[i] == tshape) {
      stroke("yellow")
      strokeWidth(3);
    } else {
      noStroke();
    }
    shapes[i].rectangle.draw();
  }
  noStroke();
  for (var i = 0; i < generators.length; i++) {
    generators[i].draw();
  }
}

var moved;

function touched(t) {
  var tpt = new Vec2(t);
	if (t.state == BEGAN) {
    moved = false;
    for (var i = 0; i < generators.length; i++) {
      if (generators[i].isTouchedBy(tpt)) {
        tshape = addShape(generators[i]);
        tshape.rectangle.isTouchedBy(tpt);
        return;
      }
    }
    for (var i = 0; i < shapes.length; i++) {
      if (shapes[i].rectangle.isTouchedBy(tpt)) {
        tshape = shapes[i];
        return;
      }
    }
  } else if (t.state == MOVING) {
    moved = true;
    if (tshape) {
      tshape.rectangle.drag(tpt);
      tshape.anchor = null;
    }
  } else if (t.state == ENDED) {
    if (!tshape) 
    	return;
    if (!moved) {
      tshape.rectangle.rotate();
      if (tshape.anchor) {
        tshape.rectangle.locate(tshape.anchor[2].rectangle.anchor(tshape.anchor[1]),tshape.anchor[0]);
      }
      tshape = null;
      return;
    }
    if (tshape.generator.isTouchedBy(tpt)) {
      shapes.splice(tshape.index,1);
      tshape = null;
      return;
    }
    var anchor;
    for (var i = 0; i < shapes.length; i++) {
      if (i == tshape.index)
        continue;
      anchor = tshape.rectangle.alongside(shapes[i].rectangle);
      if (anchor) {
        anchor.push(shapes[i]);
        tshape.anchor = anchor;
        tshape.rectangle.locate(anchor[2].rectangle.anchor(anchor[1]),anchor[0]);
        tshape = null;
        return;
      }
    }
    tshape.rectangle.position.x = Math.floor(tshape.rectangle.position.x/(grid*scaleFactor)+.5)*grid*scaleFactor;
    tshape.rectangle.position.y = Math.floor(tshape.rectangle.position.y/(grid*scaleFactor)+.5)*grid*scaleFactor;
    tshape = null;
  }
}

function addShape(g) {
  var nshape = 
    {
      rectangle: g.clone(),
      generator: g,
      index: shapes.length
    }
	shapes.push(nshape);
  return nshape;
}

function resetRectangles() {
  for (var i = 0; i < generators.length; i++) {
    generators[i].resize();
  }
  for (var i = 0; i < shapes.length; i++) {
    shapes[i].rectangle.resize();
  }
  var w,h,wr,hr;
  w = WIDTH - 10;
  h = HEIGHT - 20;

  for (var i = 0; i < generators.length; i++) {
    wr = generators[i].size.x;
    hr = generators[i].size.y;
    h -= hr + scaleFactor;
    generators[i].position = new Vec2(w - wr,h);
  }
  var adjusted = [];
  for (var i = 0; i < shapes.length; i++) {
    adjusted.push(shapes[i]);
  }
  adjusted.sort(function(a,b){ if (b.anchor && b.anchor[2] == a) {return -1} else if (a.anchor && a.anchor[2] == b) { return 1} else {return 0}});
  var s;
  for (var i = 0; i < adjusted.length; i++) {
    s = adjusted[i];
    if (s.anchor) {
      s.rectangle.locate(s.anchor[2].rectangle.anchor(s.anchor[1]),s.anchor[0]);
    }
  }
}

var varname = 22;

function addVariable() {
  varname += 1;
  varname %= 26;
  var chr = String.fromCharCode(97 + varname);
  
  var w,h,wr,hr,lbl;
  w = WIDTH - 10;
  h = HEIGHT - 20;
  
  for (var i = 0; i < variables.length; i++) {
    for (var j = i; j < variables.length; j++) {
      hr = variables[i].parameter.value*scaleFactor;
      h -= hr + scaleFactor;
    }
  }

  variables.push(new Variable({name: chr, colour: new Colour("hsl(" + varname*360/26*137.5 + ",50,50)")}));
  var j = variables.length - 1;
  for (var i = 0; i < variables.length; i++) {
    wr = variables[j].parameter.value*scaleFactor;
    hr = variables[i].parameter.value*scaleFactor;
    h -= hr + scaleFactor;
    lbl = variables[j].name + variables[i].name;
    if (lbl == "")
      lbl = "1";
    lbl = lbl.split('').sort().join('');
    
    lbl = lbl.replace(/(.)\1{1,}/g,function(m,p) {var n = p.length + 1; if (n < 4) { return p + String.fromCharCode('0x00B' + n)} else {return p + String.fromCharCode('0x207' + n)}});
    generators.push(
      new Rectangle(
        w - wr, h, variables[j].parameter, variables[i].parameter, variables[i].colour.mix(variables[j].colour,.5), lbl
      )
    )
  }
}



//## Variable

function Variable(t) {
  this.colour = t.colour;
  this.name = t.name;
  this.parameter = new Parameter({title: this.name,type: "number",min: 0,max: 10,step: .1,value: 5, callback: t.callback});
  this.value = this.parameter.value;
}

Variable.prototype.changed = function() {
  if (this.value == this.parameter.value) {
    return false;
  } else {
    this.value = this.parameter.value;
    return true;
  }
}


//## Rectangle

function Rectangle(x,y,w,h,c,l) {
  if (x instanceof Vec2) {
    this.position = x;
    l = c;
    c = h;
    h = w;
    w = y;
  } else {
    this.position = new Vec2(x,y);
  }
  this.width = w;
  this.height = h;
  this.size = new Vec2(w.value*scaleFactor,h.value*scaleFactor);
  this.colour = c;
  this.label = l;
}

Rectangle.prototype.clone = function() {
  var p = new Vec2(this.position);
  return new Rectangle(p,this.width,this.height,this.colour,this.label);
}

Rectangle.prototype.draw = function() {
  pushStyle();
  fill(this.colour);
  rect(this.position.x + border,this.position.y + border,this.size.x - 2*border,this.size.y - 2 * border);
  fill("white");
  textMode(CENTRE);
  textValign(CENTRE);
  text(this.label,this.position.x + this.size.x/2,this.position.y + this.size.y/2);
  popStyle();
}

Rectangle.prototype.isTouchedBy = function(t) {
  if (t.x > this.position.x
     && t.x < this.position.x + this.size.x
     && t.y > this.position.y
     && t.y < this.position.y + this.size.y
     )
    {
      this.offset = t.subtract(this.position);
      return true;
    }
  return false;
}

Rectangle.prototype.drag = function(t) {
  if (this.offset) {
    this.position = t.subtract(this.offset);
  } else {
    this.position = t;
  }
}

Rectangle.prototype.anchor = function(a) {
  if (a == "south east") {
    return this.position.add(new Vec2(this.size.x,0));
  } else if (a == "north west") {
    return this.position.add(new Vec2(0,this.size.y));
  } else if (a == "north east") {
    return this.position.add(this.size);
  } else {
    return this.position;
  }
}

var anchors = ["south east", "south west", "north east", "north west"];

Rectangle.prototype.alongside = function(r) {
  for (var i = 0; i < anchors.length; i++) {
    for (var j = 0; j < anchors.length; j++) {
      if (i == j) continue;
      if (this.anchor(anchors[i]).dist(r.anchor(anchors[j])) < tolerance) {
        return [anchors[i],anchors[j]];
      }
    }
  }
  return false;
}

Rectangle.prototype.locate = function(x,y,a) {
  if (x instanceof Vec2) {
    a = y;
  } else {
    x = new Vec2(x,y);
  }
  if (a == "south east") {
    this.position = x.subtract(new Vec2(this.size.x,0));
  } else if (a == "north west") {
    this.position = x.subtract(new Vec2(0,this.size.y));
  } else if (a == "north east") {
    this.position = x.subtract(this.size);
  } else {
    this.position = x;
  }
}

Rectangle.prototype.rotate = function() {
  var c = this.position.add(this.size.multiply(.5));
  this.size = new Vec2(this.size.y,this.size.x);
  var w = this.width;
  var h = this.height;
  this.width = h;
  this.height = w;
  this.position = c.subtract(this.size.multiply(.5));
}

Rectangle.prototype.resize = function() {
  this.size = new Vec2(this.width.value*scaleFactor,this.height.value*scaleFactor);
}


