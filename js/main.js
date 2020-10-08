
/*
  Parse the query string
*/

var qs = (function(a) {
    if (a == "") return {};
    var b = {};
    for (var i = 0; i < a.length; ++i)
    {
        var p=a[i].split('=', 2);
        if (p.length == 1)
            b[p[0]] = "";
        else
            b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
    }
    return b;
})(window.location.search.substr(1).split('&'));

/*
Initialise code editor
*/
function init() {
    var cm = CodeMirror.fromTextArea(document.getElementById('code'),
				 {
				     lineNumbers: true,
				     tabSize: 2,
				     electricChars: true,
				     autoCloseBrackets: true,
				     matchBrackets: true,
				     mode: "javascript"
				 }
				    );

    var cvs = $('#cvs')[0];
    var ctx = cvs.getContext('2d');
    var out = document.getElementById('output');
    var param = document.getElementById('parameters');
    var panel = document.getElementById('panel');
    var jc = new jsCanvas(ctx,out,param,panel); //$('#output'),$('#parameters'),$('#panel'));

    var tabs = new Tabs($('#tabs'),cm);
    var code = localStorage.getItem('code');
    if (code !== null) {
	tabs.setCode(code);
	var title = localStorage.getItem('title');
	if (title !== null) {
	    $('#title').text(title);
	}
    } else {
	cm.setValue($('#js_template').text().trim());
    }
    $('#panel').data('origWidth',$('#panel').width());
    $('#canvas').data('origMargin',$('#canvas').css('marginLeft'));

    $('#execute').click(function() {
	runCode(jc,tabs);
	return false;
    });
    $('#edit').click(function() { 
	startEditing(jc); 
	return false;
    });
    $('#pause').click(jc.pauseCode);
    $('#restart').click(function() {
	$('#pause').text('Pause');
	jc.restartCode();
	return false;
    });
    $('#save').click(function(e) {tabs.saveCode(e,cm)});
    $('#load').change(function(e) {tabs.loadCode(e,cm)});
    $('#export').click(function(e) {exportCode(e,jc,tabs)});
    $('#clear').click(function(e) {
	tabs.reset();
	$('#title').text('Project');
	cm.setValue($('#js_template').text().trim());
	return false;
    });
    $('#theme').change(function() {
	selectTheme(cm);
	return false;
    });

    startEditing(jc);

    var theme = localStorage.getItem('theme');
    if (theme != '') {
	$('#theme option').filter(function () { return $(this).html() == theme}).attr('selected', 'selected');
    };
    $('#theme').trigger('change');
    if (qs['project']) {
	var project = qs['project'];
	if (project.slice(-1) == '/') {
	    project = project.slice(0,-1);
	}
	$.ajax({
	    url: "projects/" + project + ".js",
	}).done(function(data) {
	    tabs.setCode(data);
	    $('#title').text(project);
	    if ("run" in qs){
		runCode(jc,tabs);
	    }
	}).fail(function() { alert("Failed to get project " + project); });
    }
}

$(document).ready(init);

/*
  Apply selected theme to codemirror editor
*/
function selectTheme(cm) {
    var theme = $('#theme option:selected').text();
    localStorage.setItem("theme",theme);
    if (theme !== 'default') {
	$.ajax({
	    url: "css/theme/" + theme + ".css",
	}).done(function(data) {
	    $("head").append("<style>" + data + "</style");
	    cm.setOption("theme",theme);
	}).fail(function() { alert("Failed to load editor theme " + theme); });
    } else {
	cm.setOption("theme","default");
    }
}

/*
Start editing: ensure that the js draw cycle isn't running and show the relevant divs.
*/
function startEditing(jc) {
    if (jc)
	jc.stopJS();
    $('#run').css('display','none');
    $('#runButtons').css('display','none');
    $('#editButtons').css('display','block');
    $('#editor').css('display','block');
    setEditorSize();
    return false;
}

/*
Set the editor size to be as big as possible on the screen.
*/
function setEditorSize() {
    var w = $('#container').width();
    $('#codediv').width(w - 6);
    $('#codediv').height($(window).height());
    var h = 2*$(window).height() - $(document).height();
    $('#codediv').height(h);
    $('.CodeMirror').height(h);
}

$(window).on('resize',setEditorSize);

/*
Set the canvas to be as big as possible on the screen.
*/
function setExecuteSize() {
    var p = $('#panel');
    var pd = p.css('display');
    var c = $('#canvas');
    p.css('display','block');
    p.height($(window).height());
    var h = 2*$(window).height() - $(document).height();
    p.height(h);
    p.width(p.data('origWidth'));
    p.css('display',pd);
    c.css('display','block');
    var w = $('#container').width();
    if (pd == 'block') {
	w -= p.outerWidth();
	c.css('marginLeft',c.data('origMargin'));
    } else {
	c.css('marginLeft','0px');
    }
    w -= 30;
    c.height(h);
    $('#cvs').attr('width',w);
    $('#cvs').attr('height',h - 6); // not sure why 6 here
    $('#restart').css('display','inline');
    $('#pause').css('display','inline');
    $('#paramdiv').css('display','block');
    $('#outdiv').css('height','50%');
}

$(window).on('resize',setExecuteSize);

/*
Get the code from the editor and pass it to the interpreter
*/
function runCode(jc,tabs) {
    $('#editor').css('display','none');
    $('#editButtons').css('display','none');
    $('#runButtons').css('display','block');
    $('#run').css('display','block');
    $('#pause').text('Pause');
    setExecuteSize();
    var code = tabs.getCode();
    localStorage.setItem('code',code);
    localStorage.setItem('title',$('#title').text());
    code = tabs.getCode();
    jc.executeJS(code,true);
    return false;
}

/*
Export the code with a suitable wrapper
*/
function exportCode(e,jc,tabs) {
    var code = tabs.getCode();
    var expt = jc.exportCode(code);
    var title = 'project';
    var blob = new Blob([expt], {'type':'text/plain'});
    if (typeof window.navigator.msSaveBlob === 'function') {
	window.navigator.msSaveBlob(blob, title + '.js');
    } else {
	var a = $(e.currentTarget);
	a.attr('href', window.URL.createObjectURL(blob));
	a.attr('download', title + '.js');
    }
    return false;
}

function Tabs(t,cm) {
    var self = this;
    var tabs = {};
    var tabol = t;
    var cm = cm;

    var add = $('<li>');
    add.addClass('tabstyle');
    add.addClass('control');
    var addlink = $('<a>');
    addlink.addClass('nolink');
    addlink.attr('href','#');
    addlink.attr('id','add');
    addlink.text('+');
    add.append(addlink);
    tabol.append(add);

    $(document).on('keypress', '.tabtitle', function(e){
	return e.which != 13; 
    }); 

    tabol.sortable({
	axis: "x",
	distance: 5,
	handle: ".handle",
	cancel: ".control",
	stop: function(e, ui) {
	    if (ui.position.left - add.position().left > 0) {
		if (ui.item.attr('id') == 'Main') {
		    tabol.sortable("cancel");
		} else {
		    if (ui.item.children().last().hasClass('current')) {
			$('#Main').children().first().trigger('click');
		    }
		    ui.item.remove();
		}
	    }
	},
    });

    /*
      Get the code from the tabs, if b is true, wrap each tab in do ... end
    */
    this.getCode = function(b) {
	var pre;
	var post;
	if (b) {
	    pre = '\n(function() {\n';
	    post = '\n})();\n';
	} else {
	    pre = '\n\n';
	    post = '\n\n';
	}
	var code = '';
	var ctab = $('.current').text().trim();
	tabs[ctab] = cm.getValue().trim() + '\n';
	$('.tabtitle').each(function(e) {
	    if (tabs[$(this).last().text()])
		code += '\n//## ' + $(this).last().text() + pre + tabs[$(this).last().text()] + post;
	});
	return code;
    }
    
    /*
      Save the code to a file
    */
    this.saveCode = function(e) {
	var code = self.getCode();
	var title = $('#title').text().trim();
	var blob = new Blob([code], {'type':'text/plain'});
	if (typeof window.navigator.msSaveBlob === 'function') {
	    window.navigator.msSaveBlob(blob, title + '.js');
	} else {
	    var a = $(e.currentTarget);
	    a.attr('href', window.URL.createObjectURL(blob));
	    a.attr('download', title + '.js');
	}
    }
    
    /*
      Load the code from a file
    */
    this.loadCode = function(f) {
	var reader = new FileReader();

	reader.onload = function(e){
	    self.setCode(e.target.result);
	}
	var t = f.target.files[0].name;
	var re = new RegExp('\\.[^/.]+$');
	t = t.replace(re, "");
	$('#title').text(t);
	reader.readAsText(f.target.files[0]);
    }

    /*
      Insert the code into tabs
    */
    this.setCode = function(c) {
	var code = c.split(/^(\/\/## [^\n]*)\n/m);
	var i = 0;
	var match;
	var tab;
	var curr;
	var first = true;
	tabs = {};
	$('.tab').remove();
	while(i < code.length) {
	    match = code[i].match(/^\/\/## ([^\n]+)/);
	    if (match !== null) {
		if (typeof tabs[match[1]] === "undefined") {
		    // this tab doesn't already exist
		    tabs[match[1]] = code[++i].trim();
		    if (first || match[1] == "Main" ) {
			curr = true;
			cm.setValue(code[i].trim());
		    } else {
			curr = false;
		    }
		    tab = self.makeTab(match[1],curr);
		    tab.insertBefore($("#add").parent());
		    first = false;
		} else {
		    // this tab does exist so we'll overwrite it
		    tabs[match[1]] = code[++i].trim();
		    if (first || match[1] == "Main" ) {
			curr = true;
			cm.setValue(code[i].trim());
		    } else {
			curr = false;
		    }
		    first = false;
		}
	    }
	    i++;
	}
	$('.current').parent().attr('id','Main');
	$('.current').attr('contenteditable',false);
    }

    /*
      Add a tab to the list
    */
    this.addTab = function(e,t,id) {
	if (typeof(t) === 'undefined')
	    t = 'New Tab';
	var tab = self.makeTab(t,false,id);
	tab.insertBefore(add);
	$(tab.children()[0]).trigger('click');
	return false;
    }

    /*
      Auxiliary for making a tab
    */
    this.makeTab = function(t,b,id) {
	var tab = $('<li>');
	var hdle = $('<span>');
	hdle.text("⇔");
	hdle.addClass("handle");
	hdle.click(self.switchTab);
	tab.append(hdle);
	var title = $('<span>');
	title.text(t);
	title.attr('contenteditable','true');
	title.addClass('tabtitle');
	title.on('focus', self.startRename).on('blur keyup paste input', self.renameTab);
	if (b) {
	    $('current').removeClass('current');
	    title.addClass('current');
	}
	if (id) {
	    tab.attr('id',id);
	}
	tab.append(title);
	tab.addClass('tab');
	tab.addClass('tabstyle');
	return tab;
    }

    /*
      When renaming a tab, we need to save the old name first
    */
    this.startRename = function() {
	var $this = $(this);
	$this.data('before', $this.html());
	return $this;
    }

    /*
      Rename a tab, transfering its contents in the tabs object
    */
    this.renameTab = function() {
	var $this = $(this);
	if ($this.data('before') !== $this.html()) {
	    tabs[$this.html()] = tabs[$this.data('before')];
	    tabs[$this.data('before')] = '';
	}
	return $this;
    }

    /*
      Switch tab
    */
    this.switchTab = function(e) {
	var ctab = $('.current').text().trim();
	var ntab = $(e.target).next().text().trim();
	if (ctab != ntab) {
	    tabs[ctab] = cm.getValue().trim() + '\n';
	    if (tabs[ntab]) {
		cm.setValue(tabs[ntab]);
	    } else {
		cm.setValue('');
	    }
	    $('.current').removeClass('current');
	    $(e.target).next().addClass('current');
	}
    }

    /*
      Reset
    */

    this.reset = function() {
	tabs = {};
	tabol.empty();
	addlink.click(self.addTab);
	tabol.append(add);
	self.addTab(false,'Main','Main');
    }
    
    addlink.click(self.addTab);
    this.addTab(false,'Main','Main');
    $('.current').attr('contenteditable',false);

    return this;
}
