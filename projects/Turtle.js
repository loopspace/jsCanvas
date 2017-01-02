
//## Main

function setup() {
	turtle = new Turtle();
  turtle.forward(40);
  turtle.left(90);
  protractor = new Protractor();
  ruler = new Ruler();
}

function draw() {
  background(40,40,50);
  turtle.draw();
  protractor.draw();
  ruler.draw();
}

function touched(t) {
  if (protractor.touched(t)) {
    return;
  } else if (ruler.touched(t)) {
    return;
  }
}



//## Turtle

function Turtle() {
  this.pos = vec2(0,0);
  this.dir = vec2(0,1);
  this.width = 2;
  this.colour = new Colour("orange");
  this.canvas = image(WIDTH,HEIGHT);
  this.actions = [];
  this.drawing = true;
  this.speed = 0.1;
  this.aspeed = 0.1;
  this.tSize = 10;
  
  var self = this;
  
  this.draw = function() {
    var ts = self.tSize;
    pushStyle();
    pushTransformation();
    resetTransformation();
    sprite(self.canvas,0,0);
    translate(WIDTH/2,HEIGHT/2);
    if (self.action) {
      if (self.action['draw']()) {
        setContext(self.canvas);
        self.action['finish']();
        setContext();
        self.action = self.actions.shift();
        if (self.action) {
          self.action['init']();
        }
      }
    } else {
      self.action = self.actions.shift();
      if (self.action) {
        self.action['init']();
      }
    }
    var p = self.pos, d = self.dir.multiply(ts), b = self.dir.rotate90().multiply(ts);
    translate(p.add(d));
    strokeWidth(self.width);
    stroke(self.colour);
    line(0,0,d.multiply(-1));
    strokeWidth(2);
    line(d,b.divide(2));
    line(b.divide(2),b.divide(-2));
    line(b.divide(-2),d);
    popTransformation();
    popStyle();
  }
  
  this.penUp = function() {
    self.actions.push({
      'init': function() {self.drawing = false},
      'draw': function() {return true},
      'finish': function() {}
    })
  }
  
  this.penDown = function() {
    self.actions.push({
      'init': function() {self.drawing = true},
      'draw': function() {return true},
      'finish': function() {}
    })
  }

  this.setPenWidth = function(w) {
    self.actions.push({
      'init': function() {self.width = w},
      'draw': function() {return true},
      'finish': function() {}
    })
  }

  this.setPenColour = function(c) {
    var col = new Colour(c);
    self.actions.push({
      'init': function() {self.colour = col},
      'draw': function() {return true},
      'finish': function() {}
    })
  }

  this.penErase = function() {}
  this.penNormal = function() {}
  this.setFillColour = function() {}
  this.fill = function() {}
  
  this.forward = function(d) {
    var sp, st;
    self.actions.push({
      'init': function() {sp = self.pos; st = ElapsedTime; },
      'draw': function() {
        var t = step((ElapsedTime - st)*self.speed/Math.abs(d));
        var ep = sp.add(self.dir.multiply(t*d));
        if (self.drawing) {
          stroke(self.colour);
          strokeWidth(self.width);
          line(sp,ep);
        }
        self.pos = ep;
        if (t >= 1) {return true;};
      },
      'finish': function() {
        self.pos = sp.add(self.dir.multiply(d));
        if (self.drawing) {
          stroke(self.colour);
          strokeWidth(self.width);
          line(sp,self.pos);
        }
      }
    })
  }
  
  this.backward = function(d) {self.forward(-d)}
  
  this.left = function(a) {
    var sd, st;
    self.actions.push({
      'init': function() { sd = self.dir; st = ElapsedTime;},
      'draw': function() {
        var t = step((ElapsedTime - st)*self.speed/Math.abs(a));
        self.dir = sd.rotate(t*a);
        if (t >= 1) { return true };
      },
      'finish': function() {self.dir = sd.rotate(a);}
    })
  }
  
  this.right = function(a) {
    self.left(-a);
  }
  
  this.toAngle = function(a) {
    var sd,st,sa;
    self.actions.push({
      'init': function() {
        sd = self.dir;
        st = ElapsedTime;
        a = a.subtract(vec2(1,0).angleBetween(self.dir));
        a = (a + 180)%360 - 180;
      },
      'draw': function() {
        var t = step((ElapsedTime - st)*self.speed/Math.abs(a));
        self.dir = sd.rotate(t*a);
        if (t >= 1) { return true };
      },
      'finish': function() { self.dir = sd.rotate(a) }
    })
  }
  
  this.toRelativeAngle = function(a) {
    var sd,st,sa;
    self.actions.push({
      'init': function() {
        sd = self.dir;
        st = ElapsedTime;
        a = a.subtract(self.pos.angleBetween(self.dir));
        a = (a + 180)%360 - 180;
      },
      'draw': function() {
        var t = step((ElapsedTime - st)*self.speed/Math.abs(a));
        self.dir = sd.rotate(t*a);
        if (t >= 1) { return true };
      },
      'finish': function() { self.dir = sd.rotate(a) }
    })
  }
  
  this.toPosition = function() {
    var args = [].slice.call(arguments);
    var p = vec2(args);
    var st,sp,d;
    self.actions.push({
      'init': function() { sp = self.pos; st = ElapsedTime; d = p.len(); },
      'draw': function() {
        var t = step((ElapsedTime - st)*self.speed/Math.abs(d));
        var ep = sp.add(p.multiply(t));
        if (self.drawing) {
          stroke(self.colour);
          strokeWidth(self.width);
          line(sp,ep);
        }
        self.pos = ep;
        if (t >= 1) {return true};
      },
      'finish': function() {
        self.pos = sp.add(p.multiply(t));
        if (self.drawing) {
          stroke(self.colour);
          strokeWidth(self.width);
          line(sp,self.pos);
        }
      }
    })
  }
  
}

function step(t,a,b) {
  a = a || 0;
  b = b || 1;
  return Math.min(b,Math.max(a,t));
}



//## Protractor

function Protractor(r) {
  var self = this;

  var b,w,h,v,p;
  r = r || 100;
  b = 5;
  w = 2*r + 2*b;
  h = r + 2*b;
  this.img = image(w,h);
  setContext(self.img);
  stroke("white");
  line(b,b,2*r+b,b);
  arc(r+b,b,r,0,180);
  v = vec2(1,0);
  p = vec2(b+r,b);
  for (var k = 1; k < 36; k++) {
    line(p.add(v.rotate(5*k).multiply(r-15+k%2*5)),p.add(v.rotate(5*k).multiply(r)));
  }
  line(p,p.add(vec2(0,5)));
  setContext();
  self.pos = vec2(r,0);
  self.ang = 0;
  self.radius = r;
  self.border = b;

  this.draw = function() {
    pushTransformation();
    resetTransformation();
    translate(self.pos);
    rotate(self.ang);
    sprite(self.img,- self.radius - self.border, -self.border);
    popTransformation();    
  }

  this.touched = function(t) {
    var p = vec2(t);
    if (t.state == BEGAN) {
      var q = p.subtract(self.pos).rotate(-self.ang);
      if (q.y > 0) {
        if (q.len() < 50) {
          self.tp = p.subtract(self.pos);
          self.state = 1;
        } else if (q.len() < 100) {
          self.tp = vec2(1,0).angleBetween(p.subtract(self.pos)) - self.ang;
          self.state = 2;
        } else {
          return false;
        }
      } else {
        return false;
      }
    } else if (t.state == MOVING) {
      if (self.state == 1) {
        self.pos = p.subtract(self.tp);
      } else if (self.state == 2) {
        self.ang = vec2(1,0).angleBetween(p.subtract(self.pos)) - self.tp;
      } else {
        return false;
      }
    } else if (t.state == ENDED) {
      if (self.state) {
        self.state = null;
      } else {
        return false;
      }
    }
    return true;
  }
  
  return this;
}



//## Ruler

function Ruler(l,w) {
  var self = this;
  
  l = l || 200;
  w = w || 20;
  var b = 5;
  
  self.img = image(l + 2*b, w + 2*b);
  
  setContext(self.img);
  stroke('white');
  line(b,b+w,l+b,b+w);
  line(b,b+w,b,b);
  line(l+b,b+w,l+b,b);
  for (var k = 5; k <=l-5; k+= 5) {
    line(b+k,b+w-15+k%2*5,b+k,b+w);
  }
  setContext();
  
  self.pos = vec2(WIDTH-l-b,b+w);
  self.ang = 0;
  self.width = w;
  self.length = l;
  self.border = b;
  
  this.draw = function() {
    pushTransformation();
    resetTransformation();
    translate(self.pos);
    rotate(self.ang);
    sprite(self.img,-self.border,-self.width -self.border);
    popTransformation();
  }
  
  this.touched = function(t) {
    var p = vec2(t);
    if (t.state == BEGAN) {
      var w = self.width, l = self.length;
      var q = p.subtract(self.pos).rotate(-self.ang);
      if (q.y < 0 && q.y > -w) {
        if (Math.abs(q.x - l/2) < l/4) {
          self.state = 1;
          self.tp = p.subtract(self.pos);
        } else if (Math.abs(q.x - l/2) < l/2) {
          if (q.x > l/2) {
            self.state = 2;
            self.tp = vec2(1,0).angleBetween(p.subtract(self.pos)) - self.ang;
          } else {
            self.state = 3;
            self.op = self.pos.add(vec2(l,0).rotate(self.ang));
            self.tp = vec2(1,0).angleBetween(p.subtract(self.op)) - self.ang + 180;
          }
        } else {
          return false;
        }
      } else {
        return false;
      }
    } else if (t.state == MOVING) {
      var l = self.length;
      if (self.state == 1) {
        self.pos = p.subtract(self.tp);
      } else if (self.state == 2) {
        self.ang = vec2(1,0).angleBetween(p.subtract(self.pos)) - self.tp;
      } else if (self.state == 3) {
        self.ang = vec2(1,0).angleBetween(p.subtract(self.op)) - self.tp + 180;
        self.pos = self.op.subtract(vec2(l,0).rotate(self.ang));
      } else {
        return false;
      }
    } else if (t.state == ENDED) {
      if (self.state) {
        self.state = null;
      } else {
        return false;
      }
    }
    return true;
  }
}


