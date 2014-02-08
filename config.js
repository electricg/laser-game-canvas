DEBUG = false;
var GAME_OPTS = {
	canvasId : 'game-main',
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
	prism : rgba('#CCC', ALPHA),
	mirror_stuck : rgba('#FFF', ALPHA),
	blackhole_stuck : rgba('#444', ALPHA),
	glass_stuck : rgba('#FFF', ALPHA)
};
var LAYOUT = {
	padding : 1, // left+right space around the grid, in cell size
	line : 2,
	empty_line : 1,
	maxWidth : document.documentElement.clientWidth,
	maxHeight : document.documentElement.clientHeight
};

/**
 * Example of level config structure
 * == side: n, e, s, w
 * == dir: ne, se, sw, nw
 */
/*
var emtpy_level = {
	rows : 0, columns : 0,
	lasers : [
		{ cell : 0, side : '', dir : '' }
	],
	targets : [
		{ cell : 0, side : '' }
	],
	none : [],
	cells : [
		{ type : 'mirror', arr : [] },
		{ type : 'blackhole', arr : [] },
		{ type : 'glass', arr : [] },
		{ type : 'prism', arr : [] },
		{ type : 'mirror_stuck', arr : [] },
		{ type : 'blackhole_stuck', arr : [] },
		{ type : 'glass_stuck', arr : [] }
	],
	solution: [
		{ type : 'mirror', arr : [] },
		{ type : 'blackhole', arr : [] },
		{ type : 'glass', arr : [] },
		{ type : 'prism', arr : [] },
		{ type : 'mirror_stuck', arr : [] },
		{ type : 'blackhole_stuck', arr : [] },
		{ type : 'glass_stuck', arr : [] }
	]
};
*/