DEBUG = false;
var GAME_OPTS = {
	canvasId : 'game',
	canvasClass : 'game-clone layer-'
};
var ALPHA = 1;
if (DEBUG === true) {
	ALPHA = 0.5;
}
var COLORS = {
	laser : '#F00',
	grid : '#FF0',
	text : '#000',
	stroke : '#333',
	empty_stroke : '#DDD',

	none : 'transparent',
	empty : rgba('#BBB', ALPHA),
	mirror : rgba('#FFF', ALPHA),
	blackhole : rgba('#444', ALPHA),
	glass : rgba('#FFF', ALPHA),
	prism : rgba('#FF0', ALPHA),
	mirror_stuck : rgba('#FFF', ALPHA),
	blackhole_stuck : rgba('#444', ALPHA)
};
var LAYOUT = {
	padding : 10, // px padding
	line : 2,
	empty_line : 1
};