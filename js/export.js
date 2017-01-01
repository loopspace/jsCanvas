
/*
Initialise canvas
*/
function init() {
    var cvs = $('#cvs')[0];
    var ctx = cvs.getContext('2d');
    var jc = new jsCanvas(ctx,$('#output'),$('#parameters'));
    $('#panel').data('origWidth',$('#panel').width());
    $('#pause').click(jc.pauseCode);
    $('#restart').click(function() {
	$('#pause').text('Pause');
	jc.restartCode();
	return false;
    });
    setExecuteSize();
    jc.executeJS(Project);
}

$(document).ready(init);

/*
Set the canvas to be as big as possible on the screen.
*/
function setExecuteSize() {
    $('#panel').height($(window).height());
    var h = 2*$(window).height() - $(document).height();
    $('#panel').height(h);
    $('#panel').width($('#panel').data('origWidth'));
    $('#canvas').css('display','block');
    var w = $('#container').width();
    w -= $('#panel').outerWidth() + 30;
    $('#canvas').height(h);
    $('#cvs').attr('width',w);
    $('#cvs').attr('height',h - 6); // not sure why 6 here
    $('#restart').css('display','inline');
    $('#pause').css('display','inline');
    $('#paramdiv').css('display','block');
    $('#outdiv').css('height','50%');
}
