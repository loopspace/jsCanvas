//TODO: Remove jquery (possibly only if no parameters available)

/*
This is our wrapper around the js execution
*/
function jsCanvas(c,o,p,pl) {
    /*
      Instance variables:
      self.jsState; // transformation and style and similar
      this.ctx; // refers to the current context on the canvas
     */
    var self = this; // keep hold of this
    this.ctx = c; // canvas context
    var gctx = c; // so that we never lose the base canvas 
    var output = o; // output pane
    var params = p; // parameters pane
    var panel = pl; // parameter panel
    if (p)
	p.addEventListener('submit',function(e) {e.preventDefault(); return false;}); // disable submission

    var jsDraw; // the draw cycle animation
    var jsGrExt; // our graphical extensions
    var jsG; // a global table
    var sTime; // time at which the script started
    var inTouch; // used for handling touches
    var code; // saves the current code in case we restart
    var codetxt; // saves the text version of the current code
    var imgNum = 0; // generated images
    var blendmodes = { // all the various blend modes
	sourceOver: 'source-over',
	sourceIn: 'source-in',
	sourceOut: 'source-out',
	sourceAtop: 'source-atop',
	destinationOver: 'destination-over',
	destinationIn: 'destination-in',
	destinationOut: 'destination-out',
	destinationAtop: 'destination-atop',
	lighter: 'lighter',
	copy: 'copy',
	xor: 'xor',
	multiply: 'multiply',
	screen: 'screen',
	overlay: 'overlay',
	darken: 'darken',
	lighten: 'lighten',
	colourDodge: 'color-dodge',
	colourBurn: 'color-burn',
	hardLight: 'hard-light',
	softLight: 'soft-light',
	difference: 'difference',
	exclusion: 'exclusion',
	hue: 'hue',
	saturation: 'saturation',
	colour: 'color',
	luminosity: 'luminosity'
    };

    /*
      This does the actual execution
     */
    this.executeJS = function(c,cl) {
	var offset;
	jsG = new Table;
	if (panel)
	    panel.style.display = 'block';
	var evt = new Event ('resize');
	window.dispatchEvent(evt);
	
	self.initialiseJS();
	if (typeof c == 'string') {
	    codetxt = self.prejs(true);
	    offset = codetxt.split('\n').length - 1 + 4; // not currently used
	    codetxt += '\n' + c + '\n' + self.postjs(true);
	    code = function() { eval(codetxt) };
	} else if (typeof c == 'function') {
	    code = c;
	    codetxt = c.toString();
	    offset = 0;
	}
	if (cl && output) {
	    output.innerHTML = '';
	    output.style.color = 'black';
	    self.clear();
	}
	sTime = performance.now();
	self.ctx.canvas.focus();
	try {
	    code(jsG);
	} catch (e) {
	    self.doError(e,codetxt,offset);
	};
    }

    this.doError = function(e,c,o) {
	self.stopJS();
	if (!c) {
	    c = codetxt;
	}
        var emsg;
	var elines = e.stack.split('\n');
	var efn;
	var eln;
	if (elines[0].search(/@/) != -1) {
	    // Firefox
	    efn = elines[0].substring(0,elines[0].search(/@/));
	    eln = elines[0].match(/:(\d+):\d+$/)[1];
	} else if (elines[1].search(/^\s*at /) != -1) {
	    // Chrome
	    var matches = elines[1].match(/^\s*at (\w+) .*:(\d+):\d+\)$/);
	    if (matches) {
		eln = matches[2];
		if (matches[1] != "eval") {
		    efn = matches[1];
		}
	    }
	}
        if (eln) {
            var lines = c.split('\n');
            var tab,m,n = 0;
            for (var i = 0; i < lines.length && i< eln; i++) {
                if (lines[i].search(/^\/\/##/) != -1) {
                    m = lines[i].match(/^\/\/## (.*)/);
                    tab = m[1];
		    n = i;
                }
            }
	    emsg = e.message;
	    if (efn) {
		emsg += "\nFunction: " + efn;
	    }
	    emsg += "\nLine: " + (eln - 2 - n) + "\nTab: " + tab;
        } else {
            emsg = e.message.toString();
        }

	if (output) {
	    var elt;
	    if (!output.hasChildNodes()) {
		elt = document.createElement('br');
		output.appendChild(elt);
	    }
	    var errdiv = document.createElement('div');
	    errdiv.classList.add('error');
	    var errtype = document.createElement('span');
	    var errtxt = document.createTextNode(e.name + ':');
	    errtype.appendChild(errtxt);
	    errdiv.appendChild(errtype);
	    var errmsg = document.createElement('span');
	    var errmsgtxt = document.createTextNode(emsg);
	    errmsg.appendChild(errmsgtxt);
	    errdiv.appendChild(errmsg);
	    output.appendChild(errdiv);
	    output.scrollTop = output.scrollHeight;
	} else {
	    console.log(e.name + ' : ' + emsg);
	}
    }

    /*
      Wraps the supplied code for exporting 
    */
    this.exportCode = function(c) {
	jsG = new Table;
	self.initialiseJS();
	var jcode = self.prejs() + '\n' + c + '\n' + self.postjs();
	return jcode;
    }
    
    /*
      Restart the code from fresh
    */
    this.restartCode = function() {
	self.stopJS();
	self.executeJS(null,true);
    }
    
    /*
      Stops the draw cycle
     */
    this.stopJS = function() {
	if (jsDraw) {
	    jsDraw.stop();
	}
    }
    
    /*
      Pauses the draw cycle
      TODO: adjust sTime accordingly
    */
    this.pauseCode = function(e) {
	if (jsDraw) {
	    if (jsDraw.isPaused) {
		jsDraw.resume();
		e.target.innerHTML = 'Pause';
	    } else {
		jsDraw.pause();
		e.target.innerHTML = 'Resume';
	    }
	}
	return false;
    }
    
    /*
      Returns a vanilla state (transformation,styles,etc)
     */
    this.getState = function() {
	return {
	    transformation: [
		new Transformation(),
	    ],
	    style: [
		{
		    fill: true,
		    stroke: true,
		    fillColour: new Colour(0,0,0,255),
		    strokeColour: new Colour(255,255,255,255),
		    strokeWidth: 1,
		    rectMode: 0,
		    ellipseMode: 2,
		    arcMode: 0,
		    bezierMode: 0,
		    textMode: 0,
		    lineCapMode: 0,
		    font: 'sans-serif',
		    fontSize: 12,
		    textValign: 1,
		    blendMode: 'source-over'
		}
	    ],
	    defaultStyle: {
		fill: true,
		stroke: true,
		fillColour: new Colour(0,0,0,255),
		strokeColour: new Colour(255,255,255,255),
		strokeWidth: 1,
		rectMode: 0,
		ellipseMode: 2,
		arcMode: 0,
		bezierMode: 0,
		textMode: 0,
		lineCapMode: 0,
		font: 'sans-serif',
		fontSize: 12,
		textValign: 1,
		blendMode: 'source-over'
	    },
	    touches: [],
	    keys: [],
	    watches: []
	}
    }
    
    self.jsState = this.getState();

    /*
      Apply a style
    */
    this.applyStyle = function(s) {
	self.ctx.lineWidth = s.strokeWidth;
	self.ctx.fillStyle = s.fillColour.toCSS();
	self.ctx.strokeStyle = s.strokeColour.toCSS();
	self.ctx.font = s.fontSize + 'px ' + s.font;
	if (s.lineCapMode == 0) {
	    self.ctx.lineCap = "round";
	} else if (s.lineCapMode == 1) {
	    self.ctx.lineCap = "butt";
	} else if (s.lineCapMode == 2) {
	    self.ctx.lineCap = "square";
	}
	self.ctx.globalCompositeOperation = s.blendMode;
    }

    this.applyTransformation = function(x,y) {
	var p = self.jsState.transformation[0].applyTransformation(x,y);
	var ch = self.ctx.canvas.height;
	p.y *= -1;
	p.y += ch;
	return p;
    }

    this.applyTransformationNoShift = function(x,y) {
	var p = self.jsState.transformation[0].applyTransformationNoShift(x,y);
	p.y *= -1;
	return p;
    }

    this.clear = function() {
	self.ctx.save();
	self.ctx.setTransform(1,0,0,1,0,0);
	self.ctx.clearRect(0,0,self.ctx.canvas.width,self.ctx.canvas.height);
	self.ctx.restore();
    }

/*
Currently only records a single touch.  Needs a bit of work to track multiple touches correctly.
*/
    
    this.startTouch = function(e) {
	e.preventDefault();
	window.blockMenuHeaderScroll = true;
	self.recordTouch(e);
	inTouch = true;
	self.ctx.canvas.addEventListener('mousemove',self.recordTouch);
	self.ctx.canvas.addEventListener('touchmove',self.recordTouch);
    }

    this.stopTouch = function(e) {
	e.preventDefault();
	window.blockMenuHeaderScroll = false;
	if (inTouch)
	    self.recordTouch(e);
	self.ctx.canvas.removeEventListener('mousemove',self.recordTouch);
	self.ctx.canvas.removeEventListener('touchmove',self.recordTouch);
	inTouch = false;
    }

    
    self.ctx.canvas.addEventListener('mousedown',self.startTouch);
    self.ctx.canvas.addEventListener('touchstart',self.startTouch);
    self.ctx.canvas.addEventListener('mouseleave',self.stopTouch);
    self.ctx.canvas.addEventListener('mouseup',self.stopTouch);
    self.ctx.canvas.addEventListener('touchend',self.stopTouch);
    self.ctx.canvas.addEventListener('touchcancel',self.stopTouch);

    this.recordTouch = (function() {
	var prevTouch;
	return function(e) {
	    e.preventDefault();
	    var s;
	    var px,py,dx,dy,x,y,pgx,pgy,id,radx;
	    if (e.type == 'touchstart' || e.type == 'touchmove' || e.type == 'touchend' || e.type == 'touchcancel' ) {
		var touch = e.touches[0] || e.changedTouches[0];
		pgx = touch.pageX;
		pgy = touch.pageY;
		id = touch.identifier;
	    } else {
		pgx = e.pageX;
		pgy = e.pageY;
	    }
	    x = Math.floor(pgx - self.ctx.canvas.offsetLeft);
	    y = parseInt(self.ctx.canvas.offsetTop,10) + parseInt(self.ctx.canvas.offsetHeight,10) - pgy;
	    if (e.type == 'mousedown' || e.type == 'touchstart') {
		s = 0;
	    } else if (e.type == 'mousemove' || e.type == 'touchmove') {
		s = 1;
		px = prevTouch.x;
		py = prevTouch.y;
		dx = x - px;
		dy = x - py;
	    } else if (e.type == 'mouseup' || e.type == 'mouseleave' || e.type == 'touchend' || e.type == 'touchcancel') {
		s = 2;
		px = prevTouch.x;
		py = prevTouch.y;
		dx = x - px;
		dy = x - py;
	    }
	    var t = {
		state: s,
		id: id,
		time: getHighResTimeStamp(e) - sTime,
		x: x,
		y: y,
		prevX: px,
		prevY: py,
		deltaX: dx,
		deltaY: dy
	    };
	    prevTouch = t;
	    self.jsState.touches.push(t);
	}
    })();

    /*
      For tracking keys
    */

    this.recordKey = function(e) {
	e.preventDefault();
	var s;
	if (e.type == 'keydown') {
	    s = 0;
	} else if (e.type == 'keypress') {
	    s = 1;
	} else if (e.type == 'keyup') {
	    s = 2;
	}
	var k = {
	    state: s,
	    time: getHighResTimeStamp(e) - sTime,
	    key: e.key,
	    code: e.which,
//	    repeat: e.originalEvent.repeat,
	    shift: e.shiftKey,
	    meta: e.metaKey,
	    ctrl: e.ctrlKey,
	    alt: e.altKey,
	};
	self.jsState.keys.push(k);
    }

    self.ctx.canvas.addEventListener('keydown',self.recordKey);
    self.ctx.canvas.addEventListener('keypress',self.recordKey);
    self.ctx.canvas.addEventListener('keyup',self.recordKey);

    this.prejs = function(b) {
	var str;
	if (b) {
	    str = '(function() { '
	} else {
	    str = 'Project = function (jsG) { '
	}
	str += 'var self; '
	    + jsG.getProperties()
	    + ' setter = eval(jsG.makeSetter()); jsG.setAll(setter); print(); clearOutput(); '
	    + '(function() { '
	    + 'stroke(255,255,255); '
	    + 'fill(0,0,0); ';
	return str;
    }

    this.postjs = function(b) {
	var str =
	    'setup(); ' +
	    'initCycle(draw,touched,key); ' +
	    '})();}';
	if (b) {
	    str += ')();';
	}
	return str;
    }

    this.initCycle = function (draw,touched,key) {
	jsDraw = new Animation(
	    function(et,dt) {
		jsG.set('ElapsedTime',et);
		jsG.set('DeltaTime',dt);
		jsG.set('WIDTH',parseInt(self.ctx.canvas.offsetWidth,10));
		jsG.set('HEIGHT',parseInt(self.ctx.canvas.offsetHeight,10));
		self.jsState.transformation = [new Transformation()];
		self.ctx = gctx;
		try {
		    draw();
		} catch(e) {
		    self.doError(e);
		}
		self.jsState.touches.forEach(
		    function(t) {
			try {
			    touched(t);
			} catch(e) {
			    self.doError(e);
			}
		    }
		);
		self.jsState.keys.forEach(
		    function(k) {
			try {
			    key(k);
			} catch(e) {
			    self.doError(e);
			}
		    }
		);
		self.jsState.touches = [];
		self.jsState.keys = [];
		self.jsState.watches.forEach(function(v) {v()});
	    }
	);
    }
	

    this.initialiseJS = function() {
	var g = jsG;
	if (params)
	    params.innerHTML = '';
	// Canvas dimensions
	g.set('WIDTH',parseInt(self.ctx.canvas.offsetWidth,10));
	g.set('HEIGHT',parseInt(self.ctx.canvas.offsetHeight,10));
	// Rectangle and Ellipse modes
	g.set('CORNER',0);
	g.set('CORNERS',1);
	g.set('CENTER',2);
	g.set('CENTRE',2);
	g.set('RADIUS',3);
	// Text horizontal alignment
	g.set('LEFT',0);
	g.set('RIGHT',1);
	// Text vertical alignment
	g.set('BOTTOM',0);
	g.set('BASELINE',1);
	g.set('TOP',3);
	// Bezier control point and Arc angle
	g.set('ABSOLUTE',0);
	g.set('RELATIVE',1);
	// line cap
	g.set('ROUND',0);
	g.set('SQUARE',1);
	g.set('PROJECT',2);
	// display mode
	g.set('NORMAL',0);
	g.set('FULLSIZE',1);
	g.set('FULLSIZE_NO_BUTTONS',2);
	// touches
	g.set('BEGAN',0);
	g.set('MOVING',1);
	g.set('PRESSED',1);
	g.set('ENDED',2);
	Object.keys(jsGrExt).forEach(function(v,i,a) {
	    g.set(v, jsGrExt[v]);
	})
	g.set('ElapsedTime',0);
	g.set('DeltaTime',0);
	g.set('blendmodes',blendmodes);
	g.set('setup', function() {});
	g.set('draw', function() {});
	g.set('touched', function() {});
	g.set('key', function() {});
	self.jsState = this.getState();
	self.applyStyle(self.jsState.defaultStyle);
    }

    jsGrExt = {
	initCycle: function(d,t,k) {
	    self.initCycle(d,t,k);
	},
	clearOutput: function() {
	    if (output)
		output.innerHTML = '';
	},
	print: function(x) {
	    if (output) {
		if (!output.hasChildNodes()) {
		    var br = document.createElement('br');
		    output.appendChild(br);
		}
		output.appendChild(document.createTextNode(x));
		output.scrollTop = outdiv.scrollHeight;
	    }
	},
	rect: function(x,y,w,h) {
	    if (x instanceof Vec2) {
		h = w;
		w = y;
		y = x.y;
		x = x.x;
	    }
	    if (w instanceof Vec2) {
		h = w.y;
		w = w.x;
	    }
	    if (typeof(h) === "undefined") {
		h = w;
	    }
	    if (self.jsState.style[0].rectMode == 1) {
		w -=x;
		h -=y;
	    } else if (self.jsState.style[0].rectMode == 2) {
		x -= w/2;
		y -= h/2;
	    } else if (self.jsState.style[0].rectMode == 3) {
		x -= w/2;
		y -= h/2;
		w *= 2;
		h *= 2;
	    }
	    var p = self.applyTransformation(x,y);
	    var r = self.applyTransformationNoShift(w,0);
	    var s = self.applyTransformationNoShift(0,h);
	    self.ctx.beginPath();
	    self.ctx.save();
	    self.ctx.setTransform(r.x,r.y,s.x,s.y,p.x,p.y);
	    self.ctx.rect(0,0,1,1);
	    self.ctx.restore();
	    if (self.jsState.style[0].fill) {
		self.ctx.fill();
	    }
	    if (self.jsState.style[0].stroke) {
		self.ctx.stroke();
	    }
	},
	rectMode: function(m) {
	    if (typeof m !== 'undefined') {
		self.jsState.style[0].rectMode = m;
	    } else {
		return self.jsState.style[0].rectMode;
	    }
	},
	polygon: function() {
	    var i = 0;
	    var x,y,p,ln;
	    var args = Array.from(arguments);
	    ln = 'moveTo';
	    self.ctx.beginPath();
	    x = args[i];
	    if (x instanceof Vec2) {
		y = x.y;
		x = x.x;
	    } else {
		i++;
		y = args[i];
	    }
	    p = self.applyTransformation(x,y);
	    self.ctx.moveTo(p.x,p.y);
	    args.push(x,y);
	    i++;
	    while (i < args.length) {
		x = args[i];
		if (x instanceof Vec2) {
		    y = x.y;
		    x = x.x;
		} else {
		    i++;
		    y = args[i];
		}
		p = self.applyTransformation(x,y);
		self.ctx.lineTo(p.x,p.y);
		i++;
	    }
	    if (self.jsState.style[0].fill) {
		self.ctx.fill();
	    }
	    if (self.jsState.style[0].stroke) {
		self.ctx.stroke();
	    }
	},
	polyline: function() {
	    var i = 0;
	    var x,y,p,ln;
	    var args = Array.from(arguments);
	    ln = 'moveTo';
	    self.ctx.beginPath();
	    x = args[i];
	    if (x instanceof Vec2) {
		y = x.y;
		x = x.x;
	    } else {
		i++;
		y = args[i];
	    }
	    p = self.applyTransformation(x,y);
	    self.ctx.moveTo(p.x,p.y);
	    i++;
	    while (i < args.length) {
		x = args[i];
		if (x instanceof Vec2) {
		    y = x.y;
		    x = x.x;
		} else {
		    i++;
		    y = args[i];
		}
		p = self.applyTransformation(x,y);
		self.ctx.lineTo(p.x,p.y);
		i++;
	    }
	    if (self.jsState.style[0].fill) {
		self.ctx.fill();
	    }
	    if (self.jsState.style[0].stroke) {
		self.ctx.stroke();
	    }
	},
	arcMode: function(m) {
	    if (m !== 'undefined') {
		self.jsState.style[0].arcMode = m;
	    } else {
		return self.jsState.style[0].arcMode;
	    }
	},
	bezierMode: function(m) {
	    if (m !== 'undefined') {
		self.jsState.style[0].bezierMode = m;
	    } else {
		return self.jsState.style[0].bezierMode;
	    }
	},
	blendMode: function(m) {
	    if (m !== 'undefined') {
		self.jsState.style[0].blendMode = m;
		self.ctx.globalCompositeOperation = m;
	    } else {
		return self.jsState.style[0].blendMode;
	    }
	},
	background: function(c,g,b,a) {
	    if (!(c instanceof Colour)) {
		c = new Colour(c,g,b,a);
	    }
	    self.ctx.save();
	    self.ctx.globalCompositeOperation = 'source-over';
	    self.ctx.fillStyle = c.toCSS();
	    self.ctx.setTransform(1,0,0,1,0,0);
	    self.ctx.beginPath();
	    self.ctx.fillRect(0,0,self.ctx.canvas.width,self.ctx.canvas.height);
	    self.ctx.restore();
	},
	fill: function (c,g,b,a) {
	    if (typeof c != 'undefined') {
		if (!(c instanceof Colour)) {
		    c = new Colour(c,g,b,a);
		}
		self.ctx.fillStyle = c.toCSS();
		self.jsState.style[0].fillColour = c;
		self.jsState.style[0].fill = true;
	    } else {
		return self.ctx.fillStyle;
	    }
	},
	stroke: function (c,g,b,a) {
	    if (typeof c != 'undefined') {
		var c;
		if (!(c instanceof Colour)) {
		    c = new Colour(c,g,b,a);
		}
		self.ctx.strokeStyle = c.toCSS();
		self.jsState.style[0].strokeColour = c;
		self.jsState.style[0].stroke = true;
	    } else {
		return self.ctx.strokeStyle;
	    }
	},
	strokeWidth: function (w) {
	    if (typeof w != 'undefined') {
		self.ctx.lineWidth = w;
		self.jsState.style[0].strokeWidth = w;
		self.jsState.style[0].stroke = true;
	    } else {
		return self.ctx.lineWidth;
	    }
	},
	noFill: function() {
	    self.jsState.style[0].fill = false;
	},
	noStroke: function() {
	    self.jsState.style[0].stroke = false;
	},
	line: function (x,y,xx,yy) {
	    if (x instanceof Vec2) {
		yy = xx;
		xx = y;
		y = x.y;
		x = x.x;
	    }
	    if (xx instanceof Vec2) {
		yy = xx.y;
		xx = xx.x;
	    }
	    if (self.jsState.style[0].stroke) {
		var p = self.applyTransformation(x,y);
		var pp = self.applyTransformation(xx,yy);
		self.ctx.beginPath();
		self.ctx.moveTo(p.x,p.y);
		self.ctx.lineTo(pp.x,pp.y);
		self.ctx.stroke();
	    }
	},
/*
How should the angles interact with the transformation?
*/
	arc: function(x,y,r,sa,ea,cl) {
	    if (x instanceof Vec2) {
		cl = ea;
		ea = sa;
		sa = r;
		r = y;
		y = x.y;
		x = x.x;
	    }
	    if (self.jsState.style[0].arcMode == 1)
		ea += sa;
	    sa *= Math.PI/180;
	    ea *= Math.PI/180;
	    if (typeof cl === 'undefined') {
		cl = true;
	    }
	    cl = !cl;
	    var p = self.applyTransformation(x,y);
	    var q = self.applyTransformationNoShift(r,0);
	    var s = self.applyTransformationNoShift(0,r);
	    self.ctx.beginPath();
	    self.ctx.save();
	    self.ctx.setTransform(q.x,q.y,s.x,s.y,p.x,p.y);
	    self.ctx.arc(0,0,1,sa,ea,cl);
	    self.ctx.restore();
	    if (self.jsState.style[0].stroke) {
		self.ctx.stroke();
	    }
	},
	bezier: function(ax,ay,bx,by,cx,cy,dx,dy) {
	    if (ax instanceof Vec2) {
		dy = dx;
		dx = cy;
		cy = cx;
		cx = by;
		by = bx;
		bx = ay;
		ay = ax.y;
		ax = ax.x;
	    }
	    if (bx instanceof Vec2) {
		dy = dx;
		dx = cy;
		cy = cx;
		cx = by;
		by = bx.y;
		bx = bx,x;
	    }
	    if (cx instanceof Vec2) {
		dy = dx;
		dx = cy;
		cy = cx.y;
		cx = cx.x;
	    }
	    if (dx instanceof Vec2) {
		dy = dx.y;
		dx = dx.x;
	    }

	    if (self.jsState.style[0].bezierMode == 1) {
		cy += dy;
		cx += dx;
		by += ay;
		bx += ax;
	    }
	    dy -= ay;
	    dx -= ax;
	    cy -= ay;
	    cx -= ax;
	    by -= ay;
	    bx -= ax;
	    var p = self.applyTransformation(ax,ay);
	    var q = self.applyTransformationNoShift(1,0);
	    var s = self.applyTransformationNoShift(0,1);
	    self.ctx.beginPath();
	    self.ctx.save();
	    self.ctx.setTransform(q.x,q.y,s.x,s.y,p.x,p.y);
	    self.ctx.moveTo(0,0);
	    self.ctx.bezierCurveTo(bx,by,cx,cy,dx,dy);
	    self.ctx.restore();
	    if (self.jsState.style[0].stroke) {
		self.ctx.stroke();
	    }
	},
	lineCapMode: function(m) {
	    if (typeof m !== 'undefined') {
		if (m == 0) {
		    self.ctx.lineCap = "round";
		} else if (m == 1) {
		    self.ctx.lineCap = "butt";
		} else if (m == 2) {
		    self.ctx.lineCap = "square";
		}
		self.jsState.style[0].lineCapMode = m;
	    } else {
		return self.jsState.style[0].lineCapMode;
	    }
	},
	text: function (s,x,y) {
	    if (x instanceof Vec2) {
		y = x.y;
		x = x.x;
	    }
	    var p = self.applyTransformation(x,y);
	    var q = self.applyTransformationNoShift(1,0).normalise();
	    var r = self.applyTransformationNoShift(0,-1).normalise();
	    if (self.jsState.style[0].textMode == 1) {
		var tm = self.ctx.measureText(s);
		p = p.subtract(q.multiply(tm.width));
	    } else if (self.jsState.style[0].textMode == 2) {
		var tm = self.ctx.measureText(s);
		p = p.subtract(q.multiply(tm.width/2));
	    }
	    if (self.jsState.style[0].textValign == 0) {
		var f = self.jsState.style[0].fontSize + 'px ' + self.jsState.style[0].font;
		var fm = getTextHeight(f,s);
		p = p.subtract(r.multiply(fm.descent));
	    } else if (self.jsState.style[0].textValign == 2) {
		var f = self.jsState.style[0].fontSize + 'px ' + self.jsState.style[0].font;
		var fm = getTextHeight(f,s);
		p = p.add(r.multiply(fm.height/2-fm.descent));
	    } else if (self.jsState.style[0].textValign == 3) {
		var f = self.jsState.style[0].fontSize + 'px ' + self.jsState.style[0].font;
		var fm = getTextHeight(f,s);
		p = p.add(r.multiply(fm.ascent));
	    }
	    self.ctx.save();
	    self.ctx.beginPath();
	    self.ctx.setTransform(q.x,q.y,r.x,r.y,p.x,p.y);
	    self.ctx.fillText(s,0,0);
	    self.ctx.restore();
	},
	textMode: function(m) {
	    if (typeof m !== 'undefined') {
		if (m == 0) {
		    self.jsState.style[0].textMode = 0;
		} else if (m == 1) {
		    self.jsState.style[0].textMode = 1;
		} else if (m == 2) {
		    self.jsState.style[0].textMode = 2;
		}
	    } else {
		return self.jsState.style[0].textMode;
	    }
	},
	textValign: function(m) {
	    if (typeof m !== 'undefined') {
		if (m == 0) {
		    self.jsState.style[0].textValign = 0;
		} else if (m == 1) {
		    self.jsState.style[0].textValign = 1;
		} else if (m == 2) {
		    self.jsState.style[0].textValign = 2;
		} else if (m == 3) {
		    self.jsState.style[0].textValign = 3;
		}
	    } else {
		return self.jsState.style[0].textValign;
	    }
	},
	textSize: function(s) {
	    var tm = self.ctx.measureText(s);
	    var f = self.jsState.style[0].fontSize + 'px ' + self.jsState.style[0].font;
	    var fm = getTextHeight(f,s);
	    return {width: tm.width,height: fm.height};
	},
	font: function (f) {
	    self.jsState.style[0].font = f;
	    self.ctx.font = self.jsState.style[0].fontSize + 'px ' + f;
	},
	fontSize: function (f) {
	    if (typeof f !== 'undefined') {
		self.jsState.style[0].fontSize = f;
		self.ctx.font = f + 'px ' + self.jsState.style[0].font;
	    }
	    return self.jsState.style[0].fontSize;
	},
	ellipse: function (x,y,w,h) {
	    if (x instanceof Vec2) {
		h = w;
		w = y;
		y = x.y;
		x = x.x;
	    }
	    if (w instanceof Vec2) {
		h = w.y;
		w = w.x;
	    }
	    if (typeof(h) === "undefined") {
		h = w;
	    }
	    
	    if (self.jsState.style[0].ellipseMode == 0) {
		w /=2;
		h /=2;
		x += w;
		y += h;
	    } else if (self.jsState.style[0].ellipseMode == 1) {
		w -=x;
		h -=y;
		w /=2;
		h /=2;
		x += w;
		y += h;
	    } else if (self.jsState.style[0].ellipseMode == 2) {
		w /= 2;
		h /= 2;
	    }
	    var p = self.applyTransformation(x,y);
	    var r = self.applyTransformationNoShift(w,0);
	    var s = self.applyTransformationNoShift(0,h);
	    self.ctx.save();
	    self.ctx.beginPath();
	    self.ctx.setTransform(r.x,r.y,s.x,s.y,p.x,p.y);
	    self.ctx.arc(0,0,1,0, 2 * Math.PI,false);
	    self.ctx.restore();
	    if (self.jsState.style[0].fill) {
		self.ctx.fill();
	    }
	    if (self.jsState.style[0].stroke) {
		self.ctx.stroke();
	    }
	},
	circle: function (x,y,r) {
	    if (x instanceof Vec2) {
		r = y;
		y = x.y;
		x = x.x;
	    }

	    if (self.jsState.style[0].ellipseMode == 0) {
		r /=2;
		x += r;
		y += r;
	    } else if (self.jsState.style[0].ellipseMode == 1) {
		r -=Math.max(x,y);
		r /=2;
		x += r;
		y += r;
	    } else if (self.jsState.style[0].ellipseMode == 2) {
		r /= 2;
	    }
	    var p = self.applyTransformation(x,y);
	    var d = self.jsState.transformation[0].determinant();
	    d = Math.sqrt(d) * r;
	    self.ctx.save();
	    self.ctx.beginPath();
	    self.ctx.setTransform(d,0,0,d,p.x,p.y);
	    self.ctx.arc(0,0,1,0, 2 * Math.PI,false);
	    self.ctx.restore();
	    if (self.jsState.style[0].fill) {
		self.ctx.fill();
	    }
	    if (self.jsState.style[0].stroke) {
		self.ctx.stroke();
	    }
	},
	ellipseMode: function(m) {
	    if (typeof m !== 'undefined') {
		self.jsState.style[0].ellipseMode = m;
	    } else {
		return self.jsState.style[0].ellipseMode;
	    }
	},
	pushStyle: function() {
	    var s = {};
	    Object.keys(self.jsState.style[0]).forEach(function(v) {
		s[v] = self.jsState.style[0][v];
	    })
	    self.jsState.style.unshift(s);
	},
	popStyle: function() {
	    self.jsState.style.shift();
	    self.applyStyle(self.jsState.style[0]);
	},
	resetStyle: function() {
	    Object.keys(self.jsState.defaultStyle).forEach(function(v) {
		self.jsState.style[0][v] = self.jsState.defaultStyle[v];
	    })
	    self.applyStyle(self.jsState.style[0]);
	},
	pushTransformation: function() {
	    self.jsState.transformation.unshift(new Transformation(self.jsState.transformation[0]));
	},
	popTransformation: function() {
	    self.jsState.transformation.shift();
	},
	resetTransformation: function() {
	    self.jsState.transformation[0] = new Transformation();
	},
	translate: function(x,y) {
	    if (x instanceof Vec2) {
		y = x.y;
		x = x.x;
	    }
	    self.jsState.transformation[0] = self.jsState.transformation[0].translate(x,y);
	},
	scale: function(a,b) {
	    if (a instanceof Vec2) {
		b = a.y;
		a = a.x;
	    }
	    self.jsState.transformation[0] = self.jsState.transformation[0].scale(a,b);
	},
	xsheer: function(a) {
	    self.jsState.transformation[0] = self.jsState.transformation[0].xsheer(a);
	},
	ysheer: function(a) {
	    self.jsState.transformation[0] = self.jsState.transformation[0].ysheer(a);
	},
	rotate: function(ang,x,y) {
	    self.jsState.transformation[0] = self.jsState.transformation[0].rotate(ang,x,y);
	},
	applyTransformation: function(x,y) {
	    return self.jsState.transformation[0].applyTransformation(x,y);
	},
	composeTransformation: function(m) {
	    self.jsState.transformation[0] = self.jsState.transformation[0].composeTransformation(m);
	},
	modelTransformation: function(m) {
	    if (typeof m !== 'undefined') {
		self.jsState.transformation[0] = new Transformation(m);
	    } else {
		return self.jsState.transformation[0];
	    }
	},
	clearState: function() {
	    self.jsState = self.getState();
	},
	/* These aren't good javascript OO
	colour: function(r,g,b,a) {
	    return new Colour(r,g,b,a);
	},
	color: function(r,g,b,a) {
	    return new Colour(r,g,b,a);
	},
	transformation: function(a,b,c,d,e,f) {
	    return new Transformation(a,b,c,d,e,f);
	},
	vec2: function(x,y) {
	    return new Vec2(x,y);
	},
	point: function(x,y) {
	    return new Vec2(x,y);
	},
	path: function(a,b) {
	    return new Path(a,b);
	},
	*/
	log: function(s) {
	    console.log(s.toString());
	},
	image: function(w,h) {
	    if (w instanceof Vec2) {
		h = w.y;
		w = w.x;
	    }
	    var c = document.createElement('canvas');
	    c.width = w;
	    c.height = h;
	    return c.getContext('2d');
	},
	setContext: function(c) {
	    if (typeof c !== 'undefined') {
		self.ctx = c;
	    } else {
		self.ctx = gctx;
	    }
	},
	smooth: function() {
	    self.ctx.imageSmoothingEnabled = true;
	    self.ctx.canvas.classList.remove('pixelated');
	},
	noSmooth: function() {
	    self.ctx.imageSmoothingEnabled = false;
	    self.ctx.canvas.classList.add('pixelated');
	},
	sprite: function(img,x,y,w,h) {
	    if (img.canvas)
		img = img.canvas;
	    if (x instanceof Vec2) {
		h = w;
		w = y;
		y = x.y;
		x = x.x;
	    }
	    if (w instanceof Vec2) {
		h = w.y;
		w = w.x;
	    }
	    if (typeof(x) === 'undefined') {
		x = 0;
	    }
	    if (typeof(y) === 'undefined') {
		y = 0;
	    }
	    if (typeof(h) === 'undefined') {
		h = img.height;
	    }
	    if (typeof(w) === 'undefined') {
		w = img.width;
	    }
	    var p = self.applyTransformation(x,y+h);
	    var r = self.applyTransformationNoShift(1,0).normalise();
	    var s = self.applyTransformationNoShift(0,-1).normalise();
	    self.ctx.save();
	    self.ctx.setTransform(r.x,r.y,s.x,s.y,p.x,p.y);
	    self.ctx.drawImage(img,0,0,w,h);
	    self.ctx.restore();
	},
	saveImage: function(img,s) {
	    if (typeof(s) === 'undefined')
		s = document.getElementById('title').innerText + '-' + imgNum++;
	    img.canvas.toBlob(function(b) {
		var a = document.createElement('a');
		a.href = window.URL.createObjectURL(b);
		a.download = s + '.png';
		a.innerHTML = 'Download ' + s;
		a.classList.add('imgDownload');
		var pdiv = document.createElement('div');
		pdiv.classList.add('parameter');
		pdiv.appendChild(a);
		params.appendChild(pdiv);
	    });
	},
	output: {
	    clear: function() {
		if (output)
		    output.innerHTML = '';
	    }
	},
	parameters: {
	    clear: function() {
		if (params)
		    params.innerHTML = '';
	    }
	},
	displayMode: function(m) {
	    if (m == 0) {
		panel.style.display = 'block';
	    } else if (m == 1) {
		panel.style.display = 'none';
	    }
	    var evt = new Event ('resize');
	    window.dispatchEvent(evt);
	}
    }

    Path.prototype.jc = this;
    Parameter.prototype.jc = this;
    Parameter.prototype.params = params;

    return this;

}


/*
  Userdata

Available objects:
Colour
Transformation
Vec2
Path - subobject of jsCanvas
*/

var svg,x11;

function Colour(r,g,b,a) {
    var self = this;
    
    if (r instanceof String || typeof(r) === "string") {
	if (r.substr(0,1) == '#') {
	    if (r.length == 7) {
		b = parseInt(r.substr(5,2),16);
		g = parseInt(r.substr(3,2),16);
		r = parseInt(r.substr(1,2),16);
	    } else if (r.length === 4) {
		b = parseInt(r.substr(3,1),16)*17;
		g = parseInt(r.substr(2,1),16)*17;
		r = parseInt(r.substr(1,1),16)*17;
	    } else if (r.length === 2) {
		b = parseInt(r.substr(1,1),16)*17;
		g = parseInt(r.substr(1,1),16)*17;
		r = parseInt(r.substr(1,1),16)*17;
	    }
	} else if (r.substr(0,3) == 'rgb') {
	    var m = r.match(/(\d+)/g);
	    r = m[0];
	    g = m[1];
	    b = m[2];
	    a = m[3];
	} else if (r.substr(0,3) == 'hsl') {
	    var m = r.match(/(\d+)/g);
	    var h = (m[0]/60)%6;
	    var s = m[1]/100;
	    var l = m[2]/100;
	    var c = (1 - Math.abs(2*l - 1))*s;
	    var x = c * (1 - Math.abs(h%2 - 1));
	    var m = l - c/2;
	    if (h <= 1) {
		r = c + m;
		g = x + m;
		b = m;
	    } else if (h <= 2) {
		r = x + m;
		g = c + m;
		b = m;
	    } else if (h <= 3) {
		r = m;
		g = c + m;
		b = x + m;
	    } else if (h <= 4) {
		r = m;
		g = x + m;
		b = c + m;
	    } else if (h <= 5) {
		r = x + m;
		g = m;
		b = c + m;
	    } else {
		r = c + m;
		g = m;
		b = x + m;
	    }
	    r *= 255;
	    g *= 255;
	    b *= 255;
	    a = m[3];
	} else if (svg[r.replace(/\s+/g,'').toLowerCase()]) {
	    r = r.replace(/\s+/g,'').toLowerCase();
	    a = svg[r].a;
	    b = svg[r].b;
	    g = svg[r].g;
	    r = svg[r].r;
	} else if (x11[r.replace(/\s+/g,'').toLowerCase()]) {
	    r = r.replace(/\s+/g,'').toLowerCase();
	    a = x11[r].a;
	    b = x11[r].b;
	    g = x11[r].g;
	    r = x11[r].r;
	}
    } else if (r instanceof Colour) {
	a = r.a;
	b = r.b;
	g = r.g;
	r = r.r;
    } else if (!(r instanceof Number) && !(typeof(r) === "number")) {
	r = 255;
    }
    if (typeof(b) === "undefined") {
	a = g;
	g = r;
	b = r;
    }
    if (typeof(a) === "undefined") {
	a = 255;
    }
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;

    return this;
}

Colour.prototype.toString = function() {
    return '(' + this.r + ',' + this.g + ',' + this.b + ',' + this.a + ')';
}

Colour.prototype.toCSS = function() {
    var r,g,b,a;
    r = Math.floor(this.r);
    g = Math.floor(this.g);
    b = Math.floor(this.b);
    a = this.a/255;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

Colour.prototype.toHex = function() {
    return '#' + toHex(this.r) + toHex(this.g) + toHex(this.b);
}
    
Colour.prototype.is_a = function(c) {
    return (c instanceof Colour);
}
    
Colour.prototype.mix = function(c,t) {
    var r,g,b,a,s;
    s = 1 - t;
    r = t*c.r + s*this.r;
    g = t*c.g + s*this.g;
    b = t*c.b + s*this.b;
    a = t*c.a + s*this.a;
    return new Colour(r,g,b,a);
}

Colour.prototype.blend = function(c) {
    var r,g,b,a,s,t;
    s = this.a/255;
    t = 1 - s;
    r = t*c.r + s*this.r;
    g = t*c.g + s*this.g;
    b = t*c.b + s*this.b;
    a = t*c.a + s*this.a;
    return new Colour(r,g,b,a);
}


// For Americans ...
Color = Colour

/*
Transformation object for transformations
*/

function Transformation(a,b,c,d,e,f) {
    if (typeof(a) !== 'undefined') {
	if (a instanceof Vec2) {
	    f = e;
	    e = d;
	    d = c;
	    c = b;
	    b = a.y;
	    a = a.x;
	}
	if (c instanceof Vec2) {
	    f = e;
	    e = d;
	    d = c.y;
	    c = c.x;
	}
	if (e instanceof Vec2) {
	    f = e.y;
	    e = e.x;
	}
	if (a instanceof Transformation || Array.isArray(a)) {
	    for (var i = 1; i <= 6; i++) {
		this[i] = a[i];
	    }
	} else if (typeof(a) === 'number' || a instanceof Number) {
	    this[1] = a;
	    this[2] = b;
	    this[3] = c;
	    this[4] = d;
	    this[5] = e;
	    this[6] = f;
	} else {
	    this[1] = 1;
	    this[2] = 0;
	    this[3] = 0;
	    this[4] = 1;
	    this[5] = 0;
	    this[6] = 0;
	}
    } else {
	this[1] = 1;
	this[2] = 0;
	this[3] = 0;
	this[4] = 1;
	this[5] = 0;
	this[6] = 0;
    }
    return this;
}

// For those that know about matrices ...

Matrix = Transformation

Transformation.prototype.applyTransformation = function(x,y) {
    if (x instanceof Vec2 ) {
	y = x.y;
	x = x.x;
    }
    var xx = this[1]*x + this[3]*y + this[5];
    var yy = this[2]*x + this[4]*y + this[6];
    return new Vec2(xx,yy)
}

Transformation.prototype.applyTransformationNoShift = function(x,y) {
    if (x instanceof Vec2 ) {
	y = x.y;
	x = x.x;
    }
    var xx = this[1]*x + this[3]*y;
    var yy = this[2]*x + this[4]*y;
    return new Vec2(xx, yy)
}

Transformation.prototype.composeTransformation = function(mr) {
    var nm = [];
    nm[1] = this[1] * mr[1] + this[3] * mr[2];
    nm[2] = this[2] * mr[1] + this[4] * mr[2];
    nm[3] = this[1] * mr[3] + this[3] * mr[4];
    nm[4] = this[2] * mr[3] + this[4] * mr[4];
    nm[5] = this[1] * mr[5] + this[3] * mr[6] + this[5];
    nm[6] = this[2] * mr[5] + this[4] * mr[6] + this[6];
    return new Transformation(nm);
}

Transformation.prototype.translate = function(x,y) {
    var nm = new Transformation(this);
    nm[5] += nm[1]*x + nm[3]*y;
    nm[6] += nm[2]*x + nm[4]*y;
    return nm;
}
    
Transformation.prototype.scale = function(a,b) {
    if (typeof(b) === "undefined")
	b = a;
    var nm = new Transformation(this);
    nm[1] *= a;
    nm[2] *= a;
    nm[3] *= b;
    nm[4] *= b;
    return nm;
}
    
Transformation.prototype.postscale = function(a,b) {
    if (typeof(b) === "undefined")
	b = a;
    var nm = new Transformation(this);
    nm[1] *= a;
    nm[3] *= a;
    nm[5] *= a;
    nm[2] *= b;
    nm[4] *= b;
    nm[6] *= b;
    return nm;
}
    
Transformation.prototype.xsheer = function(a) {
    var nm = new Transformation(this);
    nm[3] += nm[1] * a;
    nm[4] += nm[2] * a;
    return nm;
}
    
Transformation.prototype.ysheer = function(a) {
    var nm = new Transformation(this);
    nm[1] += nm[3] * a;
    nm[2] += nm[4] * a;
    return nm;
}
    
Transformation.prototype.rotate = function(ang,x,y) {
    if (x instanceof Vec2) {
	y = x.y;
	x = x.x;
    }
    if (typeof(x) === "undefined")
	x = 0;
    if (typeof(y) === "undefined")
	y = 0;
    ang *= Math.PI/180;
    var cs = Math.cos(ang);
    var sn = Math.sin(ang);
    return this.composeTransformation([null,cs,sn,-sn,cs,x - cs * x + sn * y,y - sn * x - cs * y]);
}

Transformation.prototype.determinant = function() {
    return this[1] * this[4] - this[2] * this[3];
}

Transformation.prototype.inverse = function() {
    var nm = [];
    var d = this.determinant();
    if (d === 0)
	return false;
    nm[1] = this[4]/d;
    nm[2] = -this[2]/d;
    nm[3] = -this[3]/d;
    nm[4] = this[1]/d;
    nm[5] = - nm[1] * this[5] - nm[3] * this[6];
    nm[6] = - nm[2] * this[5] - nm[4] * this[6];
    return new Transformation(nm);
}

Transformation.prototype.multiply = function(a,b) {
    if (typeof(b) === 'undefined') {
	b = a;
	a = this;
    }
    if (a instanceof Number || typeof(a) === 'number') {
	return b.postscale(a);
    } else if (b instanceof Number || typeof(b) === 'number') {
	return a.scale(b);
    } else if (b instanceof Vec2) {
	return a.applyTransformation(b);
    } else {
	return a.composeTransformation(b);
    }
}

Transformation.prototype.divide = function(z) {
    if (z instanceof Number || typeof(z) === 'number') {
	var nm = new Transformation(this);
	nm[1] *= z;
	nm[2] *= z;
	nm[3] *= z;
	nm[4] *= z;
	nm[5] *= z;
	nm[6] *= z;
	return nm;
    }
}

Transformation.prototype.unminus = function() {
    return this.postscale(-1);
}

Transformation.prototype.equals = function(m) {
    return this[1] == nm[1]
	&& this[2] == nm[2]
	&& this[3] == nm[3]
	&& this[4] == nm[4]
	&& this[5] == nm[5]
	&& this[6] == nm[6]
}

Transformation.prototype.toString = function() {
    return '[' + this[1] + ',' + this[3] + ',' + this[5] + ']\n[' + this[2] + ',' + this[4] + ',' + this[6] + ']';
}


/*
Vec2 object for vectors and points
*/
function Vec2(a,b) {
    if (typeof(a) !== 'undefined') {
	if (typeof(a) === 'number' || a instanceof Number) {
	    this.x = a;
	    this.y = b;
	} else if (typeof(a) === 'array') {
	    this.x = a[0];
	    this.y = a[1];
	} else if (a instanceof Vec2) {
	    this.x = a.x;
	    this.y = a.y;
	} else if (typeof(a) === 'object' && a.x && a.y && (typeof(a.x) === 'number' || a.x instanceof Number) && (typeof(a.y) === 'number' || a.y instanceof Number)) {
	    this.x = a.x;
	    this.y = a.y;
	} else {
	    this.x = 0;
	    this.y = 0;
	}
    } else {
	this.x = 0;
	this.y = 0;
    }

    return this;
}

// Not everyone knows about vectors
Point = Vec2

/*
  Add, subtract, and divide can all take numbers on either side and
  treat the result as if a Vec2 was a complex number.
*/

Vec2.prototype.add = function(a) {
    if (a instanceof Number || typeof(a) === 'number') {
	return new Vec2(this.x+a,this.y);
    } else {
	return new Vec2(this.x + a.x, this.y + a.y);
    }
}

Vec2.prototype.increment = function(a) {
    if (a instanceof Number || typeof(a) === 'number') {
	this.x += a;
    } else {
	this.x += a.x;
	this.y += a.y;
    }
    return this;
}
    
Vec2.prototype.subtract = function(a) {
    if (a instanceof Number || typeof(a) === 'number') {
	return new Vec2(this.x - a,this.y);
    } else {
	return new Vec2(this.x - a.x, this.y - a.y);
    }
}

Vec2.prototype.decrement = function(a) {
    if (a instanceof Number || typeof(a) === 'number') {
	this.x -= a;
    } else {
	this.x -= a.x;
	this.y -= a.y;
    }
    return this;
}
    
Vec2.prototype.multiply = function(a) {
    if (a instanceof Number || typeof(a) === 'number') {
	return new Vec2(this.x*a,this.y*a);
    } else {
	return new Vec2(this.x * a.x - this.y * a.y, this.x * a.y + this.y * a.x);
    }
}

Vec2.prototype.multiplyBy = function(a) {
    if (a instanceof Number || typeof(a) === 'number') {
	this.x *= a;
	this.y *= a;
    } else {
	var x = this.x * a.x - this.y * a.y;
	var y = this.x * a.y + this.y * a.x;
	this.x = x;
	this.y = y;
    }
    return this;
}

Vec2.prototype.divide = function(a) {
    var l;
    if (a instanceof Number || typeof(a) === 'number') {
	return new Vec2(this.x/a,this.y/a);
    } else {
	l = a.lenSqr();
	return new Vec2((this.x * a.x + this.y * a.y)/l, (-this.x * a.y + this.y * a.x)/l);
    }
}

Vec2.prototype.divideBy = function(a) {
    if (a instanceof Number || typeof(a) === 'number') {
	this.x /= a;
	this.y /= a;
    } else {
	var l = a.lenSqr();
	var x = (this.x * a.x + this.y * a.y)/l;
	var y = (-this.x * a.y + this.y * a.x)/l;
	this.x = x;
	this.y = y;
    }
    return this;
}

Vec2.prototype.unminus = function() {
    return new Vec2(-this.x,-this.y);
}

Vec2.prototype.negate = function() {
    this.x *= -1;
    this.y *= -1;
    return this;
}

Vec2.prototype.equals = function(v) {
	return (this.x == v.x) && (this.y == v.y);
    }
    
Vec2.prototype.len = function() {
	return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    
Vec2.prototype.lenSqr = function() {
	return this.x * this.x + this.y * this.y;
    }

Vec2.prototype.normalise = function() {
    var l = this.len();
    if (l !== 0) {
	return new Vec2(this.x/l,this.y/l);
    } else {
	return new Vec2(1,0);
    }
}

Vec2.prototype.normalize = Vec2.prototype.normalise;

Vec2.prototype.renormalise = function() {
    var l = this.len();
    if (l !== 0) {
	this.x /= l;
	this.y /= l;
    } else {
	this.x = 1;
	this.y = 0;
    }
    return this;
}

Vec2.prototype.renormalize = Vec2.prototype.renormalise;

Vec2.prototype.dist = function(v) {
    var x = this.x - v.x;
    var y = this.y - v.y;
    return Math.sqrt(x*x + y*y);
}

Vec2.prototype.distSqr = function(v) {
    var x = this.x - v.x;
    var y = this.y - v.y;
    return x*x + y*y;
}

Vec2.prototype.rotate = function(a) {
    var x = this.x * Math.cos(a*Math.PI/180) - this.y * Math.sin(a*Math.PI/180);
    var y = this.x * Math.sin(a*Math.PI/180) + this.y * Math.cos(a*Math.PI/180);
    return new Vec2(x,y);
}

Vec2.prototype.rotateBy = function(a) {
    var x = this.x * Math.cos(a*Math.PI/180) - this.y * Math.sin(a*Math.PI/180);
    var y = this.x * Math.sin(a*Math.PI/180) + this.y * Math.cos(a*Math.PI/180);
    this.x = x;
    this.y = y;
    return this;
}

Vec2.prototype.rotate90 = function() {
    return new Vec2(-this.y,this.x);
}

Vec2.prototype.rotateBy90 = function() {
    var x= -this.y;
    this.y = this.x;
    this.x = x;
    return this;
}

Vec2.prototype.angleBetween = function(v) {
    return (Math.atan2(v.y,v.x) - Math.atan2(this.y,this.x))*180/Math.PI;
}

Vec2.prototype.angle = function(v) {
    return Math.atan2(this.y,this.x)*180/Math.PI;
}

Vec2.prototype.toString = function() {
    return '(' + this.x + ',' + this.y + ')';
}

/*
  Path is a subobject of jsCanvas so that it has access to the
  current transformation
*/

function Path(x,y) {
    var self = this;
    this.path = [];

    if (typeof x !== "undefined") {
	var p = this.jc.applyTransformation(x,y);
	this.path.push(["moveTo",[p.x,p.y]]);
	this.point = p;
    }
}

Path.prototype.moveTo = function(x,y) {
    var p = this.jc.applyTransformation(x,y);
    this.path.push(["moveTo",[p.x,p.y]]);
    this.point = p;
}

Path.prototype.moveToR = function(x,y) {
    var p = this.jc.applyTransformation(x,y);
    p.increment(this.point);
    this.path.push(["moveTo",[p.x,p.y]]);
    this.point = p
}
	    
Path.prototype.lineTo = function(x,y) {
    var p = this.jc.applyTransformation(x,y);
    this.path.push(["lineTo",[p.x,p.y]]);
    this.point = p;
}

Path.prototype.lineToR = function(x,y) {
    var p = this.jc.applyTransformation(x,y);
    p.increment(this.point);
    this.path.push(["lineTo",[p.x,p.y]]);
    this.point = p;
}

Path.prototype.close = function() {
    this.path.push(["closePath",[]]);
}

Path.prototype.curveTo = function(bx,by,cx,cy,dx,dy) {
    if (bx instanceof Vec2) {
	dy = dx
	dx = cy
	cy = cx
	cx = by
	by = bx.y
	bx = bx.x
    }
    if (cx instanceof Vec2) {
	dy = dx
	dx = cy
	cy = cx.y
	cx = cx.x
    }
    if (dx instanceof Vec2) {
	dy = dx.y
	dx = dx.x
    }
    if (this.jc.jsState.style[0].bezierMode == 1) {
	cy += dy;
	cx += dx;
	by += this.point.y;
	bx += this.point.x;
    }
    var p = this.jc.applyTransformation(dx,dy);
    var q = this.jc.applyTransformation(cx,cy);
    var r = this.jc.applyTransformation(bx,by);
    
    this.path.push(["bezierCurveTo",[r.x,r.y,q.x,q.y,p.x,p.y]]);
    this.point = p;
}

Path.prototype.curveToR = function(bx,by,cx,cy,dx,dy) {
    if (bx instanceof Vec2) {
	dy = dx
	dx = cy
	cy = cx
	cx = by
	by = bx.y
	bx = bx.x
    }
    if (cx instanceof Vec2) {
	dy = dx
	dx = cy
	cy = cx.y
	cx = cx.x
    }
    if (dx instanceof Vec2) {
	dy = dx.y
	dx = dx.x
    }
    if (this.jc.jsState.style[0].bezierMode == 1) {
	cy += dy;
	cx += dx;
	by += this.point.y;
	bx += this.point.x;
    }
    var p = this.jc.applyTransformation(dx,dy);
    var q = this.jc.applyTransformation(cx,cy);
    var r = this.jc.applyTransformation(bx,by);

    p.increment(this.point);
    r.increment(this.point);
    q.increment(p);
    
    this.path.push(["bezierCurveTo",[r.x,r.y,q.x,q.y,p.x,p.y]]);
    this.point = p;
}
/*
  Should the angles of an arc interact with the transformation?
*/
Path.prototype.arc = function(x,y,r,sa,ea,cl) {
    if (x instanceof Vec2) {
	ea = sa;
	sa = r;
	r = y;
	y = x.y;
	x = x.x;
    }
    if (this.jc.jsState.style[0].arcMode == 1)
	ea += sa;
    sa *= -Math.PI/180;
    ea *= -Math.PI/180;
    cl = !cl;
    var p = this.jc.applyTransformation(x,y);
    this.path.push(["arc",[p.x,p.y,r,sa,ea,cl]]);
    this.point = p; // this is wrong.
}

Path.prototype.arcR = function(x,y,r,sa,ea,cl) {
    if (x instanceof Vec2) {
	ea = sa;
	sa = r;
	r = y;
	y = x.y;
	x = x.x;
    }
    if (this.jc.jsState.style[0].arcMode == 1)
	ea += sa;
    sa *= -Math.PI/180;
    ea *= -Math.PI/180;
    cl = !cl;
    var p = this.jc.applyTransformation(x,y);
    p.increment(this.point);
    this.path.push(["arc",[p.x,p.y,r,sa,ea,cl]]);
    this.point = p; // this is wrong.
}


/*
  Consider replacing rect by a piece-wise rect.
*/
Path.prototype.rect = function(x,y,w,h) {
    if (x instanceof Vec2) {
	h = w;
	w = y;
	y = x.y;
	x = x.x;
    }
    if (w instanceof Vec2) {
	h = w.y;
	w = w.x;
    }
    if (this.jc.jsState.style[0].rectMode == 1) {
	w -=x;
	h -=y;
    } else if (this.jc.jsState.style[0].rectMode == 2) {
	x -= w/2;
	y -= h/2;
    } else if (this.jc.jsState.style[0].rectMode == 3) {
	x -= w/2;
	y -= h/2;
	w *= 2;
	h *= 2;
    }
    var p = this.jc.applyTransformation(x,y);
    this.path.push(["rect",[p.x,p.y,w,h]]);
    this.point = p;
}

Path.prototype.rectR = function(x,y,w,h) {
    if (x instanceof Vec2) {
	h = w;
	w = y;
	y = x.y;
	x = x.x;
    }
    if (w instanceof Vec2) {
	h = w.y;
	w = w.x;
    }
    if (this.jc.jsState.style[0].rectMode == 1) {
	w -=x;
	h -=y;
    } else if (this.jc.jsState.style[0].rectMode == 2) {
	x -= w/2;
	y -= h/2;
    } else if (this.jc.jsState.style[0].rectMode == 3) {
	x -= w/2;
	y -= h/2;
	w *= 2;
	h *= 2;
    }
    var p = this.jc.applyTransformation(x,y);
    p.increment(this.point);
    this.path.push(["rect",[p.x,p.y,w,h]]);
    this.point = p;
}

Path.prototype.draw = function(opts) {
    if (typeof opts === "undefined")
	opts = {};
    if (typeof opts.draw === "undefined")
	opts.draw = true;
    this.use(opts);
}

Path.prototype.fill = function(opts) {
    if (typeof opts === "undefined")
	opts = {};
    if (typeof opts.fill === "undefined")
	opts.fill = true;
    this.use(opts);
}

Path.prototype.filldraw = function(opts) {
    if (typeof opts === "undefined")
	opts = {};
    if (typeof opts.fill === "undefined")
	opts.fill = true;
    if (typeof opts.draw === "undefined")
	opts.draw = true;
    this.use(opts);
}

Path.prototype.use = function(opts) {
    var p,b,m,c,w,d,f,jc;
    jc = this.jc;
    if (typeof opts !== "undefined") {
	b = opts.transformShape;
	if (typeof b === "undefined")
	    b = false;
	m = opts.transformation;
	if (typeof m === "undefined") {
	    m = jc.jsState.transformation[0];
	} else {
	    b = true;
	}
	c = opts.colour;
	w = opts.strokeWidth;
	d = opts.draw;
	f = opts.fill;
    }
    if (b) {
	p = [];
	var self = this;
	this.path.forEach(function(v) {
	    var a = self.argTransform[v[0]](self,m,v[1]);
	    p.push([v[0],a]);
	});
    } else {
	p = this.path;
    }
    jc.ctx.save();
    jc.ctx.save();
    jc.ctx.setTransform(1,0,0,1,0,0);
    jc.ctx.beginPath();
    p.forEach(function(v) {
	jc.ctx[v[0]].apply(jc.ctx,v[1]);
    });
    jc.ctx.restore();
    if (c) {
	jc.ctx.strokeStyle = c.toCSS();
	jc.ctx.fillStyle = c.toCSS();
    }
    if (d instanceof Colour)
	jc.ctx.strokeStyle = d.toCSS();
    if (f instanceof Colour)
	jc.ctx.fillStyle = f.toCSS();
    if (w)
	jc.ctx.lineWidth = w;
    if (f)
	jc.ctx.fill()
    if (d)
	jc.ctx.stroke();
    jc.ctx.restore();
}

Path.prototype.clear = function() {
    this.path = [];
}

Path.prototype.argTransform = {
    moveTo: function(path,m,a) {
	var ch = path.jc.ctx.canvas.height;
	var x,y;
	x = a[0];
	y = ch - a[1];
	var p = m.applyTransformation(x,y);
	p.y *= -1;
	p.y += ch;
	return [p.x,p.y];
    },
    lineTo: function(path,m,a) {
	var ch = path.jc.ctx.canvas.height;
	var x,y;
	x = a[0];
	y = ch - a[1];
	var p = m.applyTransformation(x,y);
	p.y *= -1;
	p.y += ch;
	return [p.x,p.y];
    },
    bezierCurveTo: function(path,m,a) {
	var ch = path.jc.ctx.canvas.height;
	var x,y,p;
	x = a[0];
	y = ch - a[1];
	p = m.applyTransformation(x,y);
	x = a[2];
	y = ch - a[3];
	q = m.applyTransformation(x,y);
	x = a[4];
	y = ch - a[5];
	r = m.applyTransformation(x,y);
	p.y *= -1;
	p.y += ch;
	q.y *= -1;
	q.y += ch;
	r.y *= -1;
	r.y += ch;
	return [p.x,p.y,q.x,q.y,r.x,r.y];
    },
    arc: function(path,m,a) {
	var ch = path.jc.ctx.canvas.height;
	var x,y;
	x = a[0];
	y = ch - a[1];
	var p = m.applyTransformation(x,y);
	p.y *= -1;
	p.y += ch;
	return [p.x,p.y,a[2],a[3],a[4],a[5]];
    },
    rect: function(path,m,a) {
	var ch = path.jc.ctx.canvas.height;
	var x,y;
	x = a[0];
	y = ch - a[1];
	var p = m.applyTransformation(x,y);
	p.y *= -1;
	p.y += ch;
	return [p.x,p.y,a[2],a[3]];
    }
    
}

function Parameter(t) {
    this.value = t.value;

    if (typeof jQuery === 'function' && !(this.params instanceof jQuery))
	this.params = $(this.params);

    if (this.params && (typeof this[t.type] !== "undefined"))
	this[t.type](t);
}

/*
  Text box.
  Options:
  title - displayed above box
  value - initial text
  callback - callback function on changes
*/
Parameter.prototype.text = function(t) {
    var self,title,n,i,f;
    self = this;
    title = t.title;
    if (typeof title === "undefined")
	title = "Type some text";
    i = t.value;
    if (typeof(i) === "undefined")
	i = '';
    this.value = i;
    f = t.callback;
    var tname = $('<span>');
    if (title != "")
	tname.text(title + ':');
    tname.addClass('parameter');
    tname.addClass('text');
    var tfield = $('<input>');
    tfield.addClass('parameter');
    tfield.addClass('text');
    tfield.attr('type','text');
    tfield.val(i);
    var cfn;
    if (typeof(f) === "function") {
	cfn = function(e) {
	    self.value = $(e.target).val();
	    f($(e.target).val());
	    return false;
	}
    } else {
	cfn = function(e) {
	    self.value = $(e.target).val();
	    return false;
	}
    }
    tfield.change(cfn);
    this.setValue = function(v) {
	tfield.val(v);
    }
    var pdiv = $('<div>');
    pdiv.addClass('parameter');
    pdiv.append(tname);
    pdiv.append(tfield);
    this.params.append(pdiv);
}

Parameter.prototype.number = function(t) {
    var self,title,a,b,v,i,f;
    self = this;
    title = t.title;
    if (typeof title === "undefined")
	title = "Choose a number";
    a = t.min;
    b = t.max;
    v = t.step;
    i = t.value;
    f = t.callback;
    if (typeof a === 'undefined')
    {
	a = 0;
	b = 1;
	v = 0.1;
    }
    if (typeof i === 'undefined')
	i = a;
    if (typeof v === 'undefined')
	v = 1;
    this.value = i;
    var pdiv = $('<div>');
    pdiv.addClass('parameter');
    var slider = $('<div>');
    var tval = $('<span>');
    var sfn,cfn;
    cfn = function(e,u) {
	self.value = parseFloat(u.value);
	tval.text(u.value);
    }
    if (typeof(f) === "function") {
	sfn = function(e,u) {
	    self.value = parseFloat(u.value);
	    tval.text(u.value);
	    f(u.value);
	}
    }
    slider.slider({
	slide: cfn,
	stop: sfn,
	min: a,
	max: b,
	value: i,
	step: v
    });
    this.setValue = function(v) {
	slider.slider("value",v);
	tval.text(v);
    };
    var tname = $('<span>');
    tname.text(title);
    tname.addClass('parameter');
    tname.addClass('text');
    tval.text(i);
    tval.addClass('parameter');
    tval.addClass('value');
    pdiv.append(tname);
    pdiv.append(tval);
    pdiv.append(slider);
    this.params.append(pdiv);
}

Parameter.prototype.select = function(t) {
    var self,title,o,i,f;
    self = this;
    title = t.title;
    if (typeof title === "undefined")
	title = "Choose an option";
    o = t.options;
    i = t.value;
    f = t.callback;
    var pdiv = $('<div>');
    pdiv.addClass('parameter');
    var tname = $('<span>');
    tname.text(title);
    tname.addClass('parameter');
    tname.addClass('select');
    var sel = $('<select>');
    var op;
    var v;
    for (var j = 0; j < o.length; j++) {
	op = $('<option>');
	v = o[j];
	op.val(v);
	op.text(v);
	if (v === i) {
	    op.attr('selected',true);
	}
	sel.append(op);
    }
    this.setValue = function(v) {
	sel.val(v);
    };
    var cfn;
    if (typeof(f) === "function") {
	cfn = function(e) {
	    self.value = $(e.target).val();
	    f($(e.target).val());
	    return false;
	}
    } else {
	cfn = function(e) {
	    self.value = $(e.target).val();
	    return false;
	}
    }
    sel.change(cfn);
    pdiv.append(tname);
    pdiv.append(sel);
    this.params.append(pdiv);
}

Parameter.prototype.watch = function(t) {
    var title,f;
    title = t.title;
    if (typeof title === "undefined")
	title = "Watching";
    f = t.watch;
    var tname = $('<span>');
    if (title != "")
	tname.text(title + ':');
    tname.addClass('parameter');
    tname.addClass('watch_title');
    var tfield = $('<span>');
    tfield.addClass('parameter');
    tfield.addClass('watch_expression');
    var pdiv = $('<div>');
    pdiv.addClass('parameter');
    pdiv.append(tname);
    pdiv.append(tfield);
    this.params.append(pdiv);
    this.jc.jsState.watches.push(
	function() {
	    tfield.text(f());
	}
    );
}

Parameter.prototype.colour = function (t) {
    var self,title,ic,f;
    self = this;
    title = t.title;
    if (typeof title === "undefined")
	title = "Select a colour";
    ic = new Colour(t.value);
    this.value = ic;
    f = t.callback;
    var tname = $('<span>');
    if (title != "")
	tname.text(title + ':');
    tname.addClass('parameter');
    tname.addClass('colour');
    var tfield = $('<input>');
    tfield.addClass('parameter');
    tfield.addClass('colour');
    tfield.attr('type','color');
    tfield.val(ic.toHex());
    this.setValue = function(c) {
	tfield.val(new Colour(c).toHex());
    };
    var cfn;
    if (typeof(f) === "function") {
	cfn = function(e) {
	    self.value = new Colour($(e.target).val());
	    f(new Colour($(e.target).val()));
	    return false;
	}
    } else {
	cfn = function(e) {
	    self.value = new Colour($(e.target).val());
	    return false;
	}
    }
    tfield.on('input',cfn);
    var pdiv = $('<div>');
    pdiv.addClass('parameter');
    pdiv.append(tname);
    pdiv.append(tfield);
    this.params.append(pdiv);
}

Parameter.prototype.action = function(t) {
    var self,name,f;
    self = this;
    name = "Click";
    if (typeof t.name !== "undefined")
	name = t.name;
    if (typeof t.title !== "undefined")
	name = t.title;
    f = t.callback;
    var tfield = $('<input>');
    tfield.addClass('parameter');
    tfield.addClass('action');
    tfield.attr('type','button');
    tfield.val(name);
    tfield.click(function() {f(); return false;});
    var pdiv = $('<div>');
    pdiv.addClass('parameter');
    pdiv.append(tfield);
    this.params.append(pdiv);
}

Parameter.prototype.boolean = function(t) {
    var self,title,i,f;
    self = this;
    title = t.title;
    if (typeof title === "undefined")
	title = "True/False";
    i = t.value;
    f = t.callback;
    if (typeof(i) === "undefined")
	i = true;
    var tname = $('<span>');
    if (title != "")
	tname.text(title + ':');
    tname.addClass('parameter');
    tname.addClass('boolean');
    var tfield = $('<input>');
    tfield.addClass('parameter');
    tfield.addClass('boolean');
    tfield.addClass('onoffswitch-checkbox');
    tfield.attr('type','checkbox');
    tfield.attr('checked',i);
    tfield.uniqueId();
    this.setValue = function(v) {
	tfield.prop("checked",v);
    };
    var lbl = $('<label>');
    lbl.addClass('onoffswitch-label');
    lbl.attr('for',tfield.attr('id'));
    var spna = $('<div>');
    spna.addClass('onoffswitch-inner');
    var spnb = $('<span>');
    spnb.addClass('onoffswitch-switch');
    var dv = $('<div>');
    dv.addClass('onoffswitch');
    var cfn;
    if (typeof(f) === "function") {
	cfn = function(e) {
	    self.value = $(e.target).is(':checked');
	    f($(e.target).is(':checked'));
	    return false;
	}
    } else {
	cfn = function(e) {
	    self.value = $(e.target).is(':checked');
	    return false;
	}
    }
    tfield.change(cfn);
    var pdiv = $('<div>');
    pdiv.addClass('parameter');
    pdiv.append(tname);
    pdiv.append(dv);
    this.params.append(pdiv);
    dv.append(tfield);
    dv.append(lbl);
    lbl.append(spna);
    lbl.append(spnb);
}


/*
For inserting a load of variables into a JS block
*/

function Table() {
    var prop = {};
    var setter;

    this.get = function(s) {
	return prop[s];
    }

    this.set = function(s,v) {
	prop[s] = v;
	if (typeof setter !== 'undefined') {
	    setter(s,v);
	}
    }

    this.setAll = function(f) {
	Object.keys(prop).forEach(function(key,index) {
	    f(key,prop[key]);
	});
	setter = f;
    }

    this.getProperties = function() {
	var p = [];
	Object.keys(prop).forEach(function(k,i) {
	    p.push(k);
	});
	return 'var ' + p.join(', ') + ';';
    }
    
    this.makeSetter = function() {
	var s = '(function(a,b) {';
	Object.keys(prop).forEach(function(key,index) {
	    s += ' if (a == "' + key + '" ) { ' + key + ' = b; return; } ';
	})
	s += '})';
	return s;
    }
}


/*
  Utilities
*/

function Animation(callback) {
    var timerId, startTime = 0, previousTime = 0, pauseTime = 0;
    var self = this;
    var wrapper;
    wrapper = function(t) {
	var et = t - startTime;
	var dt = et - previousTime;
	callback(et,dt);
	previousTime = et;
	timerId = window.requestAnimationFrame(wrapper);
    };
    
    this.isPaused = false;
    
    this.pause = function() {
        window.cancelAnimationFrame(timerId);
	pauseTime =  window.performance.now();
	self.isPaused = true;
    };

    this.resume = function() {
        startTime += window.performance.now() - pauseTime;
        window.cancelAnimationFrame(timerId);
        timerId = window.requestAnimationFrame(wrapper);
	self.isPaused = false;
    };

    this.stop = function() {
	window.cancelAnimationFrame(timerId);
	wrapper = function() {};
    };
    
    this.resume();
}

function toHex(d) {
    return  ("0"+(Number(d).toString(16))).slice(-2).toUpperCase()
}

/*
  From: http://stackoverflow.com/a/9847841
*/

// Need to remove jQuery from this

var getTextHeight = function(font,s) {

    var sp = document.createElement('span');
    var txt = document.createTextNode(s);

    sp.style.font = font;
    sp.appendChild(txt);

    var blk = document.createElement('div');
    blk.style.display = 'inline-block';
    blk.style.width = '1px';
    blk.style.height = '0px';

    var dv = document.createElement('div');
    dv.appendChild(sp);
    dv.appendChild(blk);

    /*
  var text = $('<span>' + s + '</span>').css({ fontFamily: font });
  var block = $('<div style="display: inline-block; width: 1px; height: 0px;"></div>');

  var div = $('<div></div>');
  div.append(text, block);

    */
    
    document.body.appendChild(dv);

  try {

      var result = {};
      var blkstyle;
      var txtstyle;

      blk.style.verticalAlign = 'baseline';
      result.ascent = blk.offsetTop - sp.offsetTop;

      blk.style.verticalAlign = 'bottom';
      result.height = blk.offsetTop - sp.offsetTop;

      result.descent = result.height - result.ascent;

      /*
    block.css({ verticalAlign: 'baseline' });
    result.ascent = block.offset().top - text.offset().top;


    block.css({ verticalAlign: 'bottom' });
    result.height = block.offset().top - text.offset().top;

    result.descent = result.height - result.ascent;
      */

  } finally {
      document.body.removeChild(dv);
//    div.remove();
  }

  return result;
};

svg = {
    transparent: {r: 0, g: 0, b: 0, a: 0},
    aliceblue: {r: 239, g: 247, b: 255, a: 255},
    antiquewhite: {r: 249, g: 234, b: 215, a: 255},
    aqua: {r: 0, g: 255, b: 255, a: 255},
    aquamarine: {r: 126, g: 255, b: 211, a: 255},
    azure: {r: 239, g: 255, b: 255, a: 255},
    beige: {r: 244, g: 244, b: 220, a: 255},
    bisque: {r: 255, g: 227, b: 196, a: 255},
    black: {r: 0, g: 0, b: 0, a: 255},
    blanchedalmond: {r: 255, g: 234, b: 205, a: 255},
    blue: {r: 0, g: 0, b: 255, a: 255},
    blueviolet: {r: 137, g: 43, b: 226, a: 255},
    brown: {r: 165, g: 42, b: 42, a: 255},
    burlywood: {r: 221, g: 183, b: 135, a: 255},
    cadetblue: {r: 94, g: 158, b: 160, a: 255},
    chartreuse: {r: 126, g: 255, b: 0, a: 255},
    chocolate: {r: 210, g: 104, b: 29, a: 255},
    coral: {r: 255, g: 126, b: 79, a: 255},
    cornflowerblue: {r: 99, g: 149, b: 237, a: 255},
    cornsilk: {r: 255, g: 247, b: 220, a: 255},
    crimson: {r: 220, g: 20, b: 59, a: 255},
    cyan: {r: 0, g: 255, b: 255, a: 255},
    darkblue: {r: 0, g: 0, b: 138, a: 255},
    darkcyan: {r: 0, g: 138, b: 138, a: 255},
    darkgoldenrod: {r: 183, g: 133, b: 11, a: 255},
    darkgray: {r: 169, g: 169, b: 169, a: 255},
    darkgreen: {r: 0, g: 99, b: 0, a: 255},
    darkgrey: {r: 169, g: 169, b: 169, a: 255},
    darkkhaki: {r: 188, g: 182, b: 107, a: 255},
    darkmagenta: {r: 138, g: 0, b: 138, a: 255},
    darkolivegreen: {r: 84, g: 107, b: 47, a: 255},
    darkorange: {r: 255, g: 140, b: 0, a: 255},
    darkorchid: {r: 183, g: 49, b: 204, a: 255},
    darkred: {r: 138, g: 0, b: 0, a: 255},
    darksalmon: {r: 232, g: 150, b: 122, a: 255},
    darkseagreen: {r: 142, g: 187, b: 142, a: 255},
    darkslateblue: {r: 72, g: 61, b: 138, a: 255},
    darkslategray: {r: 47, g: 79, b: 79, a: 255},
    darkslategrey: {r: 47, g: 79, b: 79, a: 255},
    darkturquoise: {r: 0, g: 206, b: 209, a: 255},
    darkviolet: {r: 147, g: 0, b: 211, a: 255},
    deeppink: {r: 255, g: 20, b: 146, a: 255},
    deepskyblue: {r: 0, g: 191, b: 255, a: 255},
    dimgray: {r: 104, g: 104, b: 104, a: 255},
    dimgrey: {r: 104, g: 104, b: 104, a: 255},
    dodgerblue: {r: 29, g: 144, b: 255, a: 255},
    firebrick: {r: 177, g: 33, b: 33, a: 255},
    floralwhite: {r: 255, g: 249, b: 239, a: 255},
    forestgreen: {r: 33, g: 138, b: 33, a: 255},
    fuchsia: {r: 255, g: 0, b: 255, a: 255},
    gainsboro: {r: 220, g: 220, b: 220, a: 255},
    ghostwhite: {r: 247, g: 247, b: 255, a: 255},
    gold: {r: 255, g: 215, b: 0, a: 255},
    goldenrod: {r: 218, g: 165, b: 31, a: 255},
    gray: {r: 127, g: 127, b: 127, a: 255},
    green: {r: 0, g: 127, b: 0, a: 255},
    greenyellow: {r: 173, g: 255, b: 47, a: 255},
    grey: {r: 127, g: 127, b: 127, a: 255},
    honeydew: {r: 239, g: 255, b: 239, a: 255},
    hotpink: {r: 255, g: 104, b: 179, a: 255},
    indianred: {r: 205, g: 91, b: 91, a: 255},
    indigo: {r: 74, g: 0, b: 130, a: 255},
    ivory: {r: 255, g: 255, b: 239, a: 255},
    khaki: {r: 239, g: 229, b: 140, a: 255},
    lavender: {r: 229, g: 229, b: 249, a: 255},
    lavenderblush: {r: 255, g: 239, b: 244, a: 255},
    lawngreen: {r: 124, g: 252, b: 0, a: 255},
    lemonchiffon: {r: 255, g: 249, b: 205, a: 255},
    lightblue: {r: 173, g: 216, b: 229, a: 255},
    lightcoral: {r: 239, g: 127, b: 127, a: 255},
    lightcyan: {r: 224, g: 255, b: 255, a: 255},
    lightgoldenrod: {r: 237, g: 221, b: 130, a: 255},
    lightgoldenrodyellow: {r: 249, g: 249, b: 210, a: 255},
    lightgray: {r: 211, g: 211, b: 211, a: 255},
    lightgreen: {r: 144, g: 237, b: 144, a: 255},
    lightgrey: {r: 211, g: 211, b: 211, a: 255},
    lightpink: {r: 255, g: 181, b: 192, a: 255},
    lightsalmon: {r: 255, g: 160, b: 122, a: 255},
    lightseagreen: {r: 31, g: 177, b: 170, a: 255},
    lightskyblue: {r: 135, g: 206, b: 249, a: 255},
    lightslateblue: {r: 132, g: 112, b: 255, a: 255},
    lightslategray: {r: 119, g: 135, b: 153, a: 255},
    lightslategrey: {r: 119, g: 135, b: 153, a: 255},
    lightsteelblue: {r: 175, g: 196, b: 221, a: 255},
    lightyellow: {r: 255, g: 255, b: 224, a: 255},
    lime: {r: 0, g: 255, b: 0, a: 255},
    limegreen: {r: 49, g: 205, b: 49, a: 255},
    linen: {r: 249, g: 239, b: 229, a: 255},
    magenta: {r: 255, g: 0, b: 255, a: 255},
    maroon: {r: 127, g: 0, b: 0, a: 255},
    mediumaquamarine: {r: 102, g: 205, b: 170, a: 255},
    mediumblue: {r: 0, g: 0, b: 205, a: 255},
    mediumorchid: {r: 186, g: 84, b: 211, a: 255},
    mediumpurple: {r: 146, g: 112, b: 219, a: 255},
    mediumseagreen: {r: 59, g: 178, b: 113, a: 255},
    mediumslateblue: {r: 123, g: 104, b: 237, a: 255},
    mediumspringgreen: {r: 0, g: 249, b: 154, a: 255},
    mediumturquoise: {r: 72, g: 209, b: 204, a: 255},
    mediumvioletred: {r: 198, g: 21, b: 132, a: 255},
    midnightblue: {r: 24, g: 24, b: 112, a: 255},
    mintcream: {r: 244, g: 255, b: 249, a: 255},
    mistyrose: {r: 255, g: 227, b: 225, a: 255},
    moccasin: {r: 255, g: 227, b: 181, a: 255},
    navajowhite: {r: 255, g: 221, b: 173, a: 255},
    navy: {r: 0, g: 0, b: 127, a: 255},
    navyblue: {r: 0, g: 0, b: 127, a: 255},
    oldlace: {r: 252, g: 244, b: 229, a: 255},
    olive: {r: 127, g: 127, b: 0, a: 255},
    olivedrab: {r: 107, g: 141, b: 34, a: 255},
    orange: {r: 255, g: 165, b: 0, a: 255},
    orangered: {r: 255, g: 68, b: 0, a: 255},
    orchid: {r: 218, g: 112, b: 214, a: 255},
    palegoldenrod: {r: 237, g: 232, b: 170, a: 255},
    palegreen: {r: 151, g: 251, b: 151, a: 255},
    paleturquoise: {r: 175, g: 237, b: 237, a: 255},
    palevioletred: {r: 219, g: 112, b: 146, a: 255},
    papayawhip: {r: 255, g: 238, b: 212, a: 255},
    peachpuff: {r: 255, g: 218, b: 184, a: 255},
    peru: {r: 205, g: 132, b: 63, a: 255},
    pink: {r: 255, g: 191, b: 202, a: 255},
    plum: {r: 221, g: 160, b: 221, a: 255},
    powderblue: {r: 175, g: 224, b: 229, a: 255},
    purple: {r: 127, g: 0, b: 127, a: 255},
    red: {r: 255, g: 0, b: 0, a: 255},
    rosybrown: {r: 187, g: 142, b: 142, a: 255},
    royalblue: {r: 65, g: 104, b: 225, a: 255},
    saddlebrown: {r: 138, g: 68, b: 19, a: 255},
    salmon: {r: 249, g: 127, b: 114, a: 255},
    sandybrown: {r: 243, g: 164, b: 95, a: 255},
    seagreen: {r: 45, g: 138, b: 86, a: 255},
    seashell: {r: 255, g: 244, b: 237, a: 255},
    sienna: {r: 160, g: 81, b: 44, a: 255},
    silver: {r: 191, g: 191, b: 191, a: 255},
    skyblue: {r: 135, g: 206, b: 234, a: 255},
    slateblue: {r: 105, g: 89, b: 205, a: 255},
    slategray: {r: 112, g: 127, b: 144, a: 255},
    slategrey: {r: 112, g: 127, b: 144, a: 255},
    snow: {r: 255, g: 249, b: 249, a: 255},
    springgreen: {r: 0, g: 255, b: 126, a: 255},
    steelblue: {r: 70, g: 130, b: 179, a: 255},
    tan: {r: 210, g: 179, b: 140, a: 255},
    teal: {r: 0, g: 127, b: 127, a: 255},
    thistle: {r: 216, g: 191, b: 216, a: 255},
    tomato: {r: 255, g: 99, b: 71, a: 255},
    turquoise: {r: 63, g: 224, b: 207, a: 255},
    violet: {r: 237, g: 130, b: 237, a: 255},
    violetred: {r: 208, g: 31, b: 144, a: 255},
    wheat: {r: 244, g: 221, b: 178, a: 255},
    white: {r: 255, g: 255, b: 255, a: 255},
    whitesmoke: {r: 244, g: 244, b: 244, a: 255},
    yellow: {r: 255, g: 255, b: 0, a: 255},
    yellowgreen: {r: 154, g: 205, b: 49, a: 255}
}

x11 = {
    antiquewhite1: {r: 255, g: 238, b: 219, a: 255},
    antiquewhite2: {r: 237, g: 223, b: 204, a: 255},
    antiquewhite3: {r: 205, g: 191, b: 175, a: 255},
    antiquewhite4: {r: 138, g: 130, b: 119, a: 255},
    aquamarine1: {r: 126, g: 255, b: 211, a: 255},
    aquamarine2: {r: 118, g: 237, b: 197, a: 255},
    aquamarine3: {r: 102, g: 205, b: 170, a: 255},
    aquamarine4: {r: 68, g: 138, b: 116, a: 255},
    azure1: {r: 239, g: 255, b: 255, a: 255},
    azure2: {r: 224, g: 237, b: 237, a: 255},
    azure3: {r: 192, g: 205, b: 205, a: 255},
    azure4: {r: 130, g: 138, b: 138, a: 255},
    bisque1: {r: 255, g: 227, b: 196, a: 255},
    bisque2: {r: 237, g: 212, b: 182, a: 255},
    bisque3: {r: 205, g: 182, b: 158, a: 255},
    bisque4: {r: 138, g: 124, b: 107, a: 255},
    blue1: {r: 0, g: 0, b: 255, a: 255},
    blue2: {r: 0, g: 0, b: 237, a: 255},
    blue3: {r: 0, g: 0, b: 205, a: 255},
    blue4: {r: 0, g: 0, b: 138, a: 255},
    brown1: {r: 255, g: 63, b: 63, a: 255},
    brown2: {r: 237, g: 58, b: 58, a: 255},
    brown3: {r: 205, g: 51, b: 51, a: 255},
    brown4: {r: 138, g: 34, b: 34, a: 255},
    burlywood1: {r: 255, g: 211, b: 155, a: 255},
    burlywood2: {r: 237, g: 196, b: 145, a: 255},
    burlywood3: {r: 205, g: 170, b: 124, a: 255},
    burlywood4: {r: 138, g: 114, b: 84, a: 255},
    cadetblue1: {r: 151, g: 244, b: 255, a: 255},
    cadetblue2: {r: 141, g: 228, b: 237, a: 255},
    cadetblue3: {r: 122, g: 196, b: 205, a: 255},
    cadetblue4: {r: 82, g: 133, b: 138, a: 255},
    chartreuse1: {r: 126, g: 255, b: 0, a: 255},
    chartreuse2: {r: 118, g: 237, b: 0, a: 255},
    chartreuse3: {r: 102, g: 205, b: 0, a: 255},
    chartreuse4: {r: 68, g: 138, b: 0, a: 255},
    chocolate1: {r: 255, g: 126, b: 35, a: 255},
    chocolate2: {r: 237, g: 118, b: 33, a: 255},
    chocolate3: {r: 205, g: 102, b: 28, a: 255},
    chocolate4: {r: 138, g: 68, b: 19, a: 255},
    coral1: {r: 255, g: 114, b: 85, a: 255},
    coral2: {r: 237, g: 105, b: 79, a: 255},
    coral3: {r: 205, g: 90, b: 68, a: 255},
    coral4: {r: 138, g: 62, b: 47, a: 255},
    cornsilk1: {r: 255, g: 247, b: 220, a: 255},
    cornsilk2: {r: 237, g: 232, b: 205, a: 255},
    cornsilk3: {r: 205, g: 200, b: 176, a: 255},
    cornsilk4: {r: 138, g: 135, b: 119, a: 255},
    cyan1: {r: 0, g: 255, b: 255, a: 255},
    cyan2: {r: 0, g: 237, b: 237, a: 255},
    cyan3: {r: 0, g: 205, b: 205, a: 255},
    cyan4: {r: 0, g: 138, b: 138, a: 255},
    darkgoldenrod1: {r: 255, g: 184, b: 15, a: 255},
    darkgoldenrod2: {r: 237, g: 173, b: 14, a: 255},
    darkgoldenrod3: {r: 205, g: 149, b: 12, a: 255},
    darkgoldenrod4: {r: 138, g: 100, b: 7, a: 255},
    darkolivegreen1: {r: 201, g: 255, b: 112, a: 255},
    darkolivegreen2: {r: 187, g: 237, b: 104, a: 255},
    darkolivegreen3: {r: 161, g: 205, b: 89, a: 255},
    darkolivegreen4: {r: 109, g: 138, b: 61, a: 255},
    darkorange1: {r: 255, g: 126, b: 0, a: 255},
    darkorange2: {r: 237, g: 118, b: 0, a: 255},
    darkorange3: {r: 205, g: 102, b: 0, a: 255},
    darkorange4: {r: 138, g: 68, b: 0, a: 255},
    darkorchid1: {r: 191, g: 62, b: 255, a: 255},
    darkorchid2: {r: 177, g: 58, b: 237, a: 255},
    darkorchid3: {r: 154, g: 49, b: 205, a: 255},
    darkorchid4: {r: 104, g: 33, b: 138, a: 255},
    darkseagreen1: {r: 192, g: 255, b: 192, a: 255},
    darkseagreen2: {r: 179, g: 237, b: 179, a: 255},
    darkseagreen3: {r: 155, g: 205, b: 155, a: 255},
    darkseagreen4: {r: 104, g: 138, b: 104, a: 255},
    darkslategray1: {r: 150, g: 255, b: 255, a: 255},
    darkslategray2: {r: 140, g: 237, b: 237, a: 255},
    darkslategray3: {r: 121, g: 205, b: 205, a: 255},
    darkslategray4: {r: 81, g: 138, b: 138, a: 255},
    deeppink1: {r: 255, g: 20, b: 146, a: 255},
    deeppink2: {r: 237, g: 17, b: 136, a: 255},
    deeppink3: {r: 205, g: 16, b: 118, a: 255},
    deeppink4: {r: 138, g: 10, b: 79, a: 255},
    deepskyblue1: {r: 0, g: 191, b: 255, a: 255},
    deepskyblue2: {r: 0, g: 177, b: 237, a: 255},
    deepskyblue3: {r: 0, g: 154, b: 205, a: 255},
    deepskyblue4: {r: 0, g: 104, b: 138, a: 255},
    dodgerblue1: {r: 29, g: 144, b: 255, a: 255},
    dodgerblue2: {r: 28, g: 133, b: 237, a: 255},
    dodgerblue3: {r: 23, g: 116, b: 205, a: 255},
    dodgerblue4: {r: 16, g: 77, b: 138, a: 255},
    firebrick1: {r: 255, g: 48, b: 48, a: 255},
    firebrick2: {r: 237, g: 43, b: 43, a: 255},
    firebrick3: {r: 205, g: 38, b: 38, a: 255},
    firebrick4: {r: 138, g: 25, b: 25, a: 255},
    gold1: {r: 255, g: 215, b: 0, a: 255},
    gold2: {r: 237, g: 201, b: 0, a: 255},
    gold3: {r: 205, g: 173, b: 0, a: 255},
    gold4: {r: 138, g: 117, b: 0, a: 255},
    goldenrod1: {r: 255, g: 192, b: 36, a: 255},
    goldenrod2: {r: 237, g: 179, b: 33, a: 255},
    goldenrod3: {r: 205, g: 155, b: 28, a: 255},
    goldenrod4: {r: 138, g: 104, b: 20, a: 255},
    green1: {r: 0, g: 255, b: 0, a: 255},
    green2: {r: 0, g: 237, b: 0, a: 255},
    green3: {r: 0, g: 205, b: 0, a: 255},
    green4: {r: 0, g: 138, b: 0, a: 255},
    honeydew1: {r: 239, g: 255, b: 239, a: 255},
    honeydew2: {r: 224, g: 237, b: 224, a: 255},
    honeydew3: {r: 192, g: 205, b: 192, a: 255},
    honeydew4: {r: 130, g: 138, b: 130, a: 255},
    hotpink1: {r: 255, g: 109, b: 179, a: 255},
    hotpink2: {r: 237, g: 105, b: 167, a: 255},
    hotpink3: {r: 205, g: 95, b: 144, a: 255},
    hotpink4: {r: 138, g: 58, b: 98, a: 255},
    indianred1: {r: 255, g: 105, b: 105, a: 255},
    indianred2: {r: 237, g: 99, b: 99, a: 255},
    indianred3: {r: 205, g: 84, b: 84, a: 255},
    indianred4: {r: 138, g: 58, b: 58, a: 255},
    ivory1: {r: 255, g: 255, b: 239, a: 255},
    ivory2: {r: 237, g: 237, b: 224, a: 255},
    ivory3: {r: 205, g: 205, b: 192, a: 255},
    ivory4: {r: 138, g: 138, b: 130, a: 255},
    khaki1: {r: 255, g: 246, b: 142, a: 255},
    khaki2: {r: 237, g: 229, b: 132, a: 255},
    khaki3: {r: 205, g: 197, b: 114, a: 255},
    khaki4: {r: 138, g: 133, b: 77, a: 255},
    lavenderblush1: {r: 255, g: 239, b: 244, a: 255},
    lavenderblush2: {r: 237, g: 224, b: 228, a: 255},
    lavenderblush3: {r: 205, g: 192, b: 196, a: 255},
    lavenderblush4: {r: 138, g: 130, b: 133, a: 255},
    lemonchiffon1: {r: 255, g: 249, b: 205, a: 255},
    lemonchiffon2: {r: 237, g: 232, b: 191, a: 255},
    lemonchiffon3: {r: 205, g: 201, b: 165, a: 255},
    lemonchiffon4: {r: 138, g: 136, b: 112, a: 255},
    lightblue1: {r: 191, g: 238, b: 255, a: 255},
    lightblue2: {r: 177, g: 223, b: 237, a: 255},
    lightblue3: {r: 154, g: 191, b: 205, a: 255},
    lightblue4: {r: 104, g: 130, b: 138, a: 255},
    lightcyan1: {r: 224, g: 255, b: 255, a: 255},
    lightcyan2: {r: 209, g: 237, b: 237, a: 255},
    lightcyan3: {r: 179, g: 205, b: 205, a: 255},
    lightcyan4: {r: 122, g: 138, b: 138, a: 255},
    lightgoldenrod1: {r: 255, g: 235, b: 138, a: 255},
    lightgoldenrod2: {r: 237, g: 220, b: 130, a: 255},
    lightgoldenrod3: {r: 205, g: 189, b: 112, a: 255},
    lightgoldenrod4: {r: 138, g: 128, b: 75, a: 255},
    lightpink1: {r: 255, g: 174, b: 184, a: 255},
    lightpink2: {r: 237, g: 161, b: 173, a: 255},
    lightpink3: {r: 205, g: 140, b: 149, a: 255},
    lightpink4: {r: 138, g: 94, b: 100, a: 255},
    lightsalmon1: {r: 255, g: 160, b: 122, a: 255},
    lightsalmon2: {r: 237, g: 149, b: 114, a: 255},
    lightsalmon3: {r: 205, g: 128, b: 98, a: 255},
    lightsalmon4: {r: 138, g: 86, b: 66, a: 255},
    lightskyblue1: {r: 175, g: 226, b: 255, a: 255},
    lightskyblue2: {r: 164, g: 211, b: 237, a: 255},
    lightskyblue3: {r: 140, g: 181, b: 205, a: 255},
    lightskyblue4: {r: 95, g: 123, b: 138, a: 255},
    lightsteelblue1: {r: 201, g: 225, b: 255, a: 255},
    lightsteelblue2: {r: 187, g: 210, b: 237, a: 255},
    lightsteelblue3: {r: 161, g: 181, b: 205, a: 255},
    lightsteelblue4: {r: 109, g: 123, b: 138, a: 255},
    lightyellow1: {r: 255, g: 255, b: 224, a: 255},
    lightyellow2: {r: 237, g: 237, b: 209, a: 255},
    lightyellow3: {r: 205, g: 205, b: 179, a: 255},
    lightyellow4: {r: 138, g: 138, b: 122, a: 255},
    magenta1: {r: 255, g: 0, b: 255, a: 255},
    magenta2: {r: 237, g: 0, b: 237, a: 255},
    magenta3: {r: 205, g: 0, b: 205, a: 255},
    magenta4: {r: 138, g: 0, b: 138, a: 255},
    maroon1: {r: 255, g: 52, b: 178, a: 255},
    maroon2: {r: 237, g: 48, b: 167, a: 255},
    maroon3: {r: 205, g: 40, b: 144, a: 255},
    maroon4: {r: 138, g: 28, b: 98, a: 255},
    mediumorchid1: {r: 224, g: 102, b: 255, a: 255},
    mediumorchid2: {r: 209, g: 94, b: 237, a: 255},
    mediumorchid3: {r: 179, g: 81, b: 205, a: 255},
    mediumorchid4: {r: 122, g: 54, b: 138, a: 255},
    mediumpurple1: {r: 170, g: 130, b: 255, a: 255},
    mediumpurple2: {r: 159, g: 121, b: 237, a: 255},
    mediumpurple3: {r: 136, g: 104, b: 205, a: 255},
    mediumpurple4: {r: 93, g: 71, b: 138, a: 255},
    mistyrose1: {r: 255, g: 227, b: 225, a: 255},
    mistyrose2: {r: 237, g: 212, b: 210, a: 255},
    mistyrose3: {r: 205, g: 182, b: 181, a: 255},
    mistyrose4: {r: 138, g: 124, b: 123, a: 255},
    navajowhite1: {r: 255, g: 221, b: 173, a: 255},
    navajowhite2: {r: 237, g: 206, b: 160, a: 255},
    navajowhite3: {r: 205, g: 178, b: 138, a: 255},
    navajowhite4: {r: 138, g: 121, b: 94, a: 255},
    olivedrab1: {r: 191, g: 255, b: 62, a: 255},
    olivedrab2: {r: 178, g: 237, b: 58, a: 255},
    olivedrab3: {r: 154, g: 205, b: 49, a: 255},
    olivedrab4: {r: 104, g: 138, b: 33, a: 255},
    orange1: {r: 255, g: 165, b: 0, a: 255},
    orange2: {r: 237, g: 154, b: 0, a: 255},
    orange3: {r: 205, g: 132, b: 0, a: 255},
    orange4: {r: 138, g: 89, b: 0, a: 255},
    orangered1: {r: 255, g: 68, b: 0, a: 255},
    orangered2: {r: 237, g: 63, b: 0, a: 255},
    orangered3: {r: 205, g: 54, b: 0, a: 255},
    orangered4: {r: 138, g: 36, b: 0, a: 255},
    orchid1: {r: 255, g: 130, b: 249, a: 255},
    orchid2: {r: 237, g: 122, b: 232, a: 255},
    orchid3: {r: 205, g: 104, b: 201, a: 255},
    orchid4: {r: 138, g: 71, b: 136, a: 255},
    palegreen1: {r: 154, g: 255, b: 154, a: 255},
    palegreen2: {r: 144, g: 237, b: 144, a: 255},
    palegreen3: {r: 124, g: 205, b: 124, a: 255},
    palegreen4: {r: 84, g: 138, b: 84, a: 255},
    paleturquoise1: {r: 186, g: 255, b: 255, a: 255},
    paleturquoise2: {r: 174, g: 237, b: 237, a: 255},
    paleturquoise3: {r: 150, g: 205, b: 205, a: 255},
    paleturquoise4: {r: 102, g: 138, b: 138, a: 255},
    palevioletred1: {r: 255, g: 130, b: 170, a: 255},
    palevioletred2: {r: 237, g: 121, b: 159, a: 255},
    palevioletred3: {r: 205, g: 104, b: 136, a: 255},
    palevioletred4: {r: 138, g: 71, b: 93, a: 255},
    peachpuff1: {r: 255, g: 218, b: 184, a: 255},
    peachpuff2: {r: 237, g: 202, b: 173, a: 255},
    peachpuff3: {r: 205, g: 175, b: 149, a: 255},
    peachpuff4: {r: 138, g: 119, b: 100, a: 255},
    pink1: {r: 255, g: 181, b: 196, a: 255},
    pink2: {r: 237, g: 169, b: 183, a: 255},
    pink3: {r: 205, g: 145, b: 158, a: 255},
    pink4: {r: 138, g: 99, b: 108, a: 255},
    plum1: {r: 255, g: 186, b: 255, a: 255},
    plum2: {r: 237, g: 174, b: 237, a: 255},
    plum3: {r: 205, g: 150, b: 205, a: 255},
    plum4: {r: 138, g: 102, b: 138, a: 255},
    purple1: {r: 155, g: 48, b: 255, a: 255},
    purple2: {r: 145, g: 43, b: 237, a: 255},
    purple3: {r: 124, g: 38, b: 205, a: 255},
    purple4: {r: 84, g: 25, b: 138, a: 255},
    red1: {r: 255, g: 0, b: 0, a: 255},
    red2: {r: 237, g: 0, b: 0, a: 255},
    red3: {r: 205, g: 0, b: 0, a: 255},
    red4: {r: 138, g: 0, b: 0, a: 255},
    rosybrown1: {r: 255, g: 192, b: 192, a: 255},
    rosybrown2: {r: 237, g: 179, b: 179, a: 255},
    rosybrown3: {r: 205, g: 155, b: 155, a: 255},
    rosybrown4: {r: 138, g: 104, b: 104, a: 255},
    royalblue1: {r: 72, g: 118, b: 255, a: 255},
    royalblue2: {r: 67, g: 109, b: 237, a: 255},
    royalblue3: {r: 58, g: 94, b: 205, a: 255},
    royalblue4: {r: 38, g: 63, b: 138, a: 255},
    salmon1: {r: 255, g: 140, b: 104, a: 255},
    salmon2: {r: 237, g: 130, b: 98, a: 255},
    salmon3: {r: 205, g: 112, b: 84, a: 255},
    salmon4: {r: 138, g: 75, b: 57, a: 255},
    seagreen1: {r: 84, g: 255, b: 159, a: 255},
    seagreen2: {r: 77, g: 237, b: 147, a: 255},
    seagreen3: {r: 67, g: 205, b: 127, a: 255},
    seagreen4: {r: 45, g: 138, b: 86, a: 255},
    seashell1: {r: 255, g: 244, b: 237, a: 255},
    seashell2: {r: 237, g: 228, b: 221, a: 255},
    seashell3: {r: 205, g: 196, b: 191, a: 255},
    seashell4: {r: 138, g: 133, b: 130, a: 255},
    sienna1: {r: 255, g: 130, b: 71, a: 255},
    sienna2: {r: 237, g: 121, b: 66, a: 255},
    sienna3: {r: 205, g: 104, b: 57, a: 255},
    sienna4: {r: 138, g: 71, b: 38, a: 255},
    skyblue1: {r: 135, g: 206, b: 255, a: 255},
    skyblue2: {r: 125, g: 191, b: 237, a: 255},
    skyblue3: {r: 108, g: 165, b: 205, a: 255},
    skyblue4: {r: 73, g: 112, b: 138, a: 255},
    slateblue1: {r: 130, g: 110, b: 255, a: 255},
    slateblue2: {r: 122, g: 103, b: 237, a: 255},
    slateblue3: {r: 104, g: 89, b: 205, a: 255},
    slateblue4: {r: 71, g: 59, b: 138, a: 255},
    slategray1: {r: 197, g: 226, b: 255, a: 255},
    slategray2: {r: 184, g: 211, b: 237, a: 255},
    slategray3: {r: 159, g: 181, b: 205, a: 255},
    slategray4: {r: 108, g: 123, b: 138, a: 255},
    snow1: {r: 255, g: 249, b: 249, a: 255},
    snow2: {r: 237, g: 232, b: 232, a: 255},
    snow3: {r: 205, g: 201, b: 201, a: 255},
    snow4: {r: 138, g: 136, b: 136, a: 255},
    springgreen1: {r: 0, g: 255, b: 126, a: 255},
    springgreen2: {r: 0, g: 237, b: 118, a: 255},
    springgreen3: {r: 0, g: 205, b: 102, a: 255},
    springgreen4: {r: 0, g: 138, b: 68, a: 255},
    steelblue1: {r: 99, g: 183, b: 255, a: 255},
    steelblue2: {r: 91, g: 172, b: 237, a: 255},
    steelblue3: {r: 79, g: 147, b: 205, a: 255},
    steelblue4: {r: 53, g: 99, b: 138, a: 255},
    tan1: {r: 255, g: 165, b: 79, a: 255},
    tan2: {r: 237, g: 154, b: 73, a: 255},
    tan3: {r: 205, g: 132, b: 63, a: 255},
    tan4: {r: 138, g: 89, b: 43, a: 255},
    thistle1: {r: 255, g: 225, b: 255, a: 255},
    thistle2: {r: 237, g: 210, b: 237, a: 255},
    thistle3: {r: 205, g: 181, b: 205, a: 255},
    thistle4: {r: 138, g: 123, b: 138, a: 255},
    tomato1: {r: 255, g: 99, b: 71, a: 255},
    tomato2: {r: 237, g: 91, b: 66, a: 255},
    tomato3: {r: 205, g: 79, b: 57, a: 255},
    tomato4: {r: 138, g: 53, b: 38, a: 255},
    turquoise1: {r: 0, g: 244, b: 255, a: 255},
    turquoise2: {r: 0, g: 228, b: 237, a: 255},
    turquoise3: {r: 0, g: 196, b: 205, a: 255},
    turquoise4: {r: 0, g: 133, b: 138, a: 255},
    violetred1: {r: 255, g: 62, b: 150, a: 255},
    violetred2: {r: 237, g: 58, b: 140, a: 255},
    violetred3: {r: 205, g: 49, b: 119, a: 255},
    violetred4: {r: 138, g: 33, b: 81, a: 255},
    wheat1: {r: 255, g: 230, b: 186, a: 255},
    wheat2: {r: 237, g: 216, b: 174, a: 255},
    wheat3: {r: 205, g: 186, b: 150, a: 255},
    wheat4: {r: 138, g: 125, b: 102, a: 255},
    yellow1: {r: 255, g: 255, b: 0, a: 255},
    yellow2: {r: 237, g: 237, b: 0, a: 255},
    yellow3: {r: 205, g: 205, b: 0, a: 255},
    yellow4: {r: 138, g: 138, b: 0, a: 255},
    gray0: {r: 189, g: 189, b: 189, a: 255},
    green0: {r: 0, g: 255, b: 0, a: 255},
    grey0: {r: 189, g: 189, b: 189, a: 255},
    maroon0: {r: 175, g: 48, b: 95, a: 255},
    purple0: {r: 160, g: 31, b: 239, a: 255}
}
