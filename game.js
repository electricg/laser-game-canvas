var GAME_OPTS = {
	canvasId : 'game',
	canvasClass : 'game-clone layer-'
};
var ALPHA = 0.5;
var COLORS = {
	laser : '#F00',
	grid : '#FF0',
	text : '#000',
	stroke : '#000',

	none : 'transparent',
	empty : rgba('#F00', ALPHA),
	mirror : rgba('#FFF', ALPHA),
	blackhole : rgba('#444', ALPHA),
	glass : rgba('#F90', ALPHA),
	prism : rgba('#FF0', ALPHA),
	mirror_stuck : rgba('#0F0', ALPHA),
	blackhole_stuck : rgba('#0FF', ALPHA)
};
var LAYOUT = {
	padding : 10, // px padding
	line : 1
};


var cellStructure = {
	a : {		// top left point
		x : 0,	// coordinate x
		y : 0	// coordinate y
	},
	b : {		// bottom right corner
		x : 0,	// coordinate x
		y : 0	// coordinate y
	},
	type : 'empty'	// type of block present in the cell
					// possible valuse: 'empty', 'none', 'mirror', 'blackhole', 'glass', 'prism', 'mirror_stuck', 'blackhole_stuck'
					// default is 'empty'
};

var cellType = {
	/* cell that is empty with the possibility to move a block in, the laser goes through it with no changes */
	empty : {},
	/* cell with no possibility to move a block in, the laser goes through it with no changes */
	none : {},
	/* cell that reflects the laser with a 90deg angle */
	mirror : {},
	/* cell that absorbs the laser and doesn't let it go through nor reflects it */
	blackhole : {},
	/* cell that both let the laser go through and reflects it with a 90deg angle */
	glass : {},
	/* the laser is translated to the opposite side of the entrance and it goes out with the same direction it came in */
	prism : {},
	/* same as mirror, but without the possibility to move the cell */
	mirror_stuck : {},
	/* same as blackhole, but without the possibility to move the cell */
	blackhole_stuck : {}
};

// example of level configuration
var levelConfig = {
	rows : 12,
	columns : 12,
	lasers : [
		{
			cell : 66,
			side : 's',
			dir : 'ne'
		}/*,
		{
			cell : 117,
			side : 'n',
			dir : 'nw'
		}*/
	],
	points : [
		{
			cell : 41,
			side : 'e'
		},
		{
			cell : 133,
			side : 'w'
		}
	],
	none : [],	//set apart because it's drawn on a different layer
	cells : [
		{
			type : 'mirror',
			arr : [54, 55, 65, 68, 77, 79]
		},
		{
			type : 'blackhole',
			arr : []
		},
		{
			type : 'glass',
			arr : []
		},
		{
			type : 'prism',
			arr : []
		},
		{
			type : 'mirror_stuck',
			arr : []
		},
		{
			type : 'blackhole_stuck',
			arr : []
		}
	]
};



var game = function(_opt) {
	var canvas = document.getElementById(GAME_OPTS.canvasId);
	if (!canvas.getContext) {
		return false;
	}

	var _ctx = canvas.getContext('2d'),
		_canvasW = canvas.width,
		_canvasH = canvas.height,
		_cellW = _canvasW / _opt.columns,
		_cellW_2 = _cellW / 2,
		_cellH = _canvasH / _opt.rows,
		_cellH_2 = _cellH / 2,
		_cellR = _cellW / 4,
		_padding_2 = LAYOUT.padding / 2,
		_cells = [{}], // first item empty
		_cellsLength = _opt.rows * _opt.columns;
		_lean = {
			'n' : 0,
			'ne' : -1,
			'e' : 0,
			'se' : 1,
			's' : 0,
			'sw' : -1,
			'w' : 0,
			'nw' : 1
		},
		_movingCell = null,
		_points = [];

	/**
	 * Layers:
	 * bg - empty and none cells
	 * debug - grids and cell numbers
	 * cells - all the other cells
	 * laser
	 * moving - where the moving cell is drawn
	 * touch - captures events and coordinates - it's the main canvas
	 */
	var _layers = ['bg', 'debug', 'cells', 'laser', 'moving'],
		_canvases = [],
		_ctxs = [];
	for (var i = 0; i < _layers.length; i++) {
		_canvases[_layers[i]] = document.createElement('canvas');
		canvas.parentNode.appendChild(_canvases[_layers[i]]);
		_canvases[_layers[i]].className = GAME_OPTS.canvasClass + _layers[i];
		_canvases[_layers[i]].setAttribute('height', canvas.height);
		_canvases[_layers[i]].setAttribute('width', canvas.width);
		_ctxs[_layers[i]] = _canvases[_layers[i]].getContext('2d');
	}


	/**
	 * Draw cell from id
	 * @param {object} ctx - Canvas context to work on
	 * @param {number} cell - Cell id
	 */
	var drawCellFromId = function(ctx, cell) {
		var c = _cells[cell];
		drawCell(ctx, c.a.x, c.a.y, c.type);
	};

	/**
	 * Draw cell from id with the given type
	 * @param {object} ctx - Canvas context to work on
	 * @param {number} cell - Cell id
	 * @param {string} type - Cell type
	 */
	var drawCellFromType = function(ctx, cell, type) {
		var c = _cells[cell];
		drawCell(ctx, c.a.x, c.a.y, type);
	};

	/**
	 * Draw cell
	 * @param {object} ctx - Canvas context to work on
	 * @param {number} x - Starting point x coordinate
	 * @param {number} y - Starting point y coordinate
	 * @param {string} type - Cell type
	 */
	var drawCell = function(ctx, x, y, type) {
		ctx.lineWidth = LAYOUT.line;
		ctx.fillStyle = COLORS[type];
		ctx.strokeStyle = COLORS['stroke'];
		// ctx.fillRect(x, y, _cellW, _cellH);
		roundRect(ctx, x, y, _cellW, _cellH, _cellR);
		ctx.fill();
		ctx.stroke();
	};

	/**
	 * Draw rounded rectangle
	 * @param {object} ctx - Canvas context to work on
	 * @param {number} x - Starting point x coordinate
	 * @param {number} y - Starting point y coordinate
	 * @param {number} w - Total width
	 * @param {number} h - Total height
	 * @param {number} r - Border radius
	 */
	var roundRect = function(ctx, x, y, w, h, r) {
		var a_x = h_x = 				x + r,
			a_y = b_y = c_y = n_y = 	y,
			b_x = g_x = 				x + w - r,
			c_x = d_x = e_x = f_x = 	x + w,
			d_y = m_y = 				y + r,
			e_y = l_y = 				y + h - r,
			f_y = g_y = h_y = i_y = 	y + h,
			i_x = l_x = m_x = n_x = 	x;

		ctx.beginPath();
		ctx.moveTo(a_x, a_y);
		ctx.lineTo(b_x, b_y);
		ctx.arcTo(c_x, c_y, d_x, d_y, r);
		ctx.lineTo(e_x, e_y);
		ctx.arcTo(f_x, f_y, g_x, g_y, r);
		ctx.lineTo(h_x, h_y);
		ctx.arcTo(i_x, i_y, l_x, l_y, r);
		ctx.lineTo(m_x, m_y);
		ctx.arcTo(n_x, n_y, a_x, a_y, r);
	};

	/**
	 * Draw line given start and end points coordinates
	 * @param {object} ctx - Canvas context to work on
	 * @param {number} x1 - Starting point x coordinate
	 * @param {number} y1 - Starting point y coordinate
	 * @param {number} x2 - Ending point x coordinate
	 * @param {number} y2 - Ending point y coordinate
	 */
	var drawLine = function(ctx, x1, y1, x2, y2) {
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();
		ctx.closePath();
	};

	/**
	 * Draw grid - for debug
	 */
	var drawGrid = function() {
		var ctx = _ctxs['debug'],
			x1, y1, x2, y2;
		ctx.strokeStyle = COLORS.grid;

		// vertical
		x1 = 0;
		y1 = 0;
		y2 = _canvasH;
		for (var i = 0; i <= _opt.columns; i++) {
			drawLine(ctx, x1, y1, x1, y2);
			x1 += _cellW;
		}
		// horizontal
		x1 = 0;
		x2 = _canvasW;
		y1 = 0;
		for (var l = 0; l <= _opt.rows; l++) {
			drawLine(ctx, x1, y1, x2, y1);
			y1 += _cellH;
		}
	};

	/**
	 * Draw cells numbers - for debug
	 */
	var drawCellNumbers = function() {
		var ctx = _ctxs['debug'];
		ctx.fillStyle = COLORS.text;
		ctx.font = "bold 12px sans-serif";
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		for (var i = 1; i <= _cellsLength; i++) {
			var c = _cells[i];
			ctx.fillText(i, c.a.x + _cellW_2, c.a.y + _cellH_2);
		}
	};

	/**
	 * Draw background cells
	 */
	var drawLayerBg = function() {
		for (var i = 1; i <= _cellsLength; i++) {
			// check that is not none
			if (_cells[i].type != 'none') {
				drawCellFromType(_ctxs['bg'], i, 'empty');
			}
		}
	};

	/**
	 * Draw block cells
	 */
	var drawLayerCells = function() {
		var m = _opt.cells;
		for (var i = 0; i < m.length; i++) {
			for (var h = 0; h < m[i].arr.length; h++) {
				drawCellFromId(_ctxs['cells'], m[i].arr[h]);
			}
		}
	};

	/**
	 * Calc point coordinates given cell id and side of the cell (n, e, s, w)
	 * @param {number} cell - Cell id
	 * @param {string} side - Side of the cell. Possible values n e s w (noth east south west)
	 * @returns {object} x,y coordinate
	 */
	var calcCoordinate = function(cell, side) {
		var c = _cells[cell],
			res = { x: 0, y: 0 };

		switch(side) {
			case 'n':
				res.x = c.a.x + _cellW_2;
				res.y = c.a.y;
				break;

			case 'e':
				res.x = c.b.x;
				res.y = c.a.y + _cellH_2;
				break;

			case 's':
				res.x = c.a.x + _cellW_2;
				res.y = c.b.y;
				break;

			case 'w':
				res.x = c.a.x;
				res.y = c.a.y + _cellH_2;
				break;
		}

		return res;
	};

	/**
	 * Calc ending point y coordinate
	 * @param {number} x1 - Starting point x coordinate
	 * @param {number} y1 - Starting point y coordinate
	 * @param {number} x2 - Ending point x coordinate
	 * param {string} dir - Direction of the laser
	 * @returns {number} Ending point y coordinate
	 */
	var calcLineY = function(x1, y1, x2, dir) {
		return _lean[dir] * (x2 - x1) + y1;
	};

	/**
	 * Draw laser
	 * @param {number} cell - Cell id to start from
	 * @param {string} side - Side of the cell. Possible values n e s w (noth east south west)
	 * @param {string} dir - Direction of the laser
	 */
	var drawLaser = function(cell, side, dir) {
		var start = calcCoordinate(cell, side),
			end = {};

		switch(dir) {
			case 'n':
				end.x = start.x;
				end.y = 0;
				break;

			case 'ne':
				end.x = _canvasW;
				end.y = calcLineY(start.x, start.y, end.x, dir);
				break;

			case 'e':
				end.x = _canvasW;
				end.y = start.y;
				break;

			case 'se':
				end.x = _canvasW;
				end.y = calcLineY(start.x, start.y, end.x, dir);
				break;

			case 's':
				end.x = start.x;
				end.y = _canvasH;
				break;

			case 'sw':
				end.x = 0;
				end.y = calcLineY(start.x, start.y, end.x, dir);
				break;

			case 'w':
				end.x = 0;
				end.y = start.y;
				break;

			case 'nw':
				end.x = 0;
				end.y = calcLineY(start.x, start.y, end.x, dir);
				break;
		}

		_ctxs['laser'].strokeStyle = COLORS.laser;
		drawLine(_ctxs['laser'], start.x, start.y, end.x, end.y);
	};

	/**
	 * Calculate cells coordinate
	 */
	var calcCells = function() {
		var x = 0,
			y = 0,
			gy = 0,
			counter = 0;
		for (var r = 0; r < _opt.rows; r++) {
			x = 0;
			y = gy;
			gy += _cellH;
			for (var c = 0; c < _opt.columns; c++) {
				var a = {
					x : x,
					y : y
				};
				x += _cellW;
				var b = {
					x : x,
					y : gy
				};
				_cells.push({a:a, b:b, type:'empty'});
				counter++;
			}
		}
	};

	/**
	 * Assign cells types according to initial config
	 */
	var initCells = function() {
		var n = _opt.cells,
			len = n.length;
		// normal block cells
		for (var i = 0; i < len; i++) {
			for (var l = 0; l < n[i].arr.length; l++) {
				_cells[ n[i].arr[l] ].type = n[i].type;
			}
		}
		// none cells
		for (var l = 0; l < _opt.none.length; l++) {
			_cells[ _opt.none[l] ].type = 'none';
		}
	};

	/**
	 * Draw the initial game
	 */
	var drawStuff = function() {
		// draw cell numbers
		drawCellNumbers();

		// draw background cells
		drawLayerBg();

		// draw normal cells
		drawLayerCells();

		// draw grid
		drawGrid();
	};

	/**
	 * Return cell id from x,y coordinates
	 * @param {number} x - X coordinate of the cell
	 * @param {number} y - Y coordinate of the cell
	 * @returns {number} Cell id
	 */
	var getSelectedCell = function(x, y) {
		var index = 0;

		for (var r = 0; r < _opt.rows; r++) {
			if (y <= (r + 1) * _cellH) {
				for (var c = 1; c <= _opt.columns; c++) {
					if (x <= c * _cellW) {
						index = r * _opt.columns + c;
						return index;
					}
				}
			}
		}
		return index;
	};

	/**
	 *	Click on cell
	 */
	var click = function() {
		var pos = mousePositionElement(),
			cell = getSelectedCell(pos.x, pos.y);

		// console.log(cell);

		// check if it's possible to move this cell
		if (_cells[cell].type === 'empty' ||
			_cells[cell].type === 'none' ||
			_cells[cell].type === 'mirror_stuck' ||
			_cells[cell].type === 'blackhole_stuck') {
			return false;
		}
		else {
			// clear canvas
			clearMovingCanvas();
			// draw cell at current mouse point
			drawCell(_ctxs['moving'], pos.x - _cellW_2, pos.y - _cellH_2, _cells[cell].type);

			_movingCell = cell;
			
			canvas.onmousemove = updateLayerMoving;
			canvas.onmouseup = pieceDropped;
		}
	};

	/**
	 * Clear moving canvas
	 */
	var clearMovingCanvas = function() {
		_ctxs['moving'].clearRect(0, 0, _canvasW, _canvasH);
	};

	/**
	 * Clear cell
	 */
	var clearCell = function(cell) {
		_ctxs['cells'].clearRect( _cells[cell].a.x, _cells[cell].a.y, _cellW, _cellH );
	};

	/**
	 * Update moving layer while moving mouse
	 */
	var updateLayerMoving = function() {
		console.log('moving');
		var pos = mousePositionElement();
		clearMovingCanvas();
		// draw cell at current mouse point
		drawCell(_ctxs['moving'], pos.x - _cellW_2, pos.y - _cellH_2, _cells[_movingCell].type);
	};

	/**
	 * Dropped piece
	 */
	var pieceDropped = function() {
		console.log('dropped');
		canvas.onmousemove = null;
		canvas.onmouseup = null;
		clearMovingCanvas();
		
		var pos = mousePositionElement(),
			cell = getSelectedCell(pos.x, pos.y);

		// check if it's possible to drop the cell here
		if (_cells[cell].type === 'empty') {
			// update cells status
			_cells[cell].type = _cells[_movingCell].type;
			_cells[_movingCell].type = 'empty';

			// delete old cell
			clearCell(_movingCell);
			
			// draw new cell
			drawCellFromId(_ctxs['cells'], cell);
			
			// update lasers
			initLasers();
		}
		else {
			// nothing for the moment
		}

		// reset the moving cell id
		_movingCell = null;
	};

	/**
	 * Starts the lasers
	 */
	var initLasers = function() {
		_ctxs['laser'].clearRect(0, 0, _canvasW, _canvasH);
		_points = [];
		var n = _opt.lasers;
		for (var i = 0; i < n.length; i++) {
			// drawLaser(n[i].cell, n[i].side, n[i].dir);
			
			var t = calcCoordinate(n[i].cell, n[i].side);
			_points.push({x: t.x, y: t.y});
			drawLaser2(n[i].cell, n[i].side, n[i].dir);
		}
		console.log(_points);
	};

	/**
	 * Check if the laser goes through the cell
	 * @returns {boolean} if the laser goes through
	 */
	var isPassingThrough = function(side, dir) {
		if (dir.indexOf(side) === -1) {
			return true;
		}
		return false;
	};

	/**
	 * Calc where is the next cell - same row, previous, next, same column, previous, next
	 * @param {string} side - Side we are leaving
	 * @returns {object} r is for row, c is for column
	 */
	var nextCellSide = function(side) {
		var row = 0,
			col = 0;

		switch(side) {
			case 'n':
				row = -1;
				break;

			case 'e':
				col = 1;
				break;

			case 's':
				row = 1;
				break;

			case 'w':
				col =-1;
				break;
		}

		return {r: row, c: col};
	};

	/**
	 * Calc row and columns of the selected cell
	 * @param {number} cell - Cell id
	 * @returns {object} r is for row, c is for column, false if cell doesn't exist
	 */
	var calcRowAndCol = function(cell) {
		var tot = _opt.rows * _opt.columns;
		
		if (cell <= 0 || cell > tot) {
			return false;
		}
		
		var row = 0,
			col = 0;

		row = Math.ceil(cell / _opt.rows);
		col = cell % _opt.columns;

		if (col === 0) {
			col = _opt.rows;
		}

		return {r: row, c: col};
	};

	/** Calc cell id from row and column position
	 * @param {number} row - Row
	 * @param {number} col - Column
	 * @returns {number} cell id
	 */
	var calcCellFromRowAndCol = function(row, col) {
		return (row - 1) * _opt.rows + col
	};

	/**
	 * Calc next cell base on the current exit side
	 * @param {number} cell - Cell id
	 * @param {string} side - Current cell exit side
	 * @returns {number} next cell id
	 */
	var calcNextCell = function(cell, side) {
		var row = 0,
			col = 0,
			nextSide = nextCellSide(side),
			thisCell = calcRowAndCol(cell),
			nextCellId,
			tot = _opt.rows * _opt.columns;;

		row = thisCell.r + nextSide.r;
		col = thisCell.c + nextSide.c;

		if (row <= 0 || row > _opt.rows || col <= 0 || col > _opt.columns) {
			return false;
		}
		
		nextCellId = calcCellFromRowAndCol(row, col);
		
		if (nextCellId <= 0 || nextCellId > tot) {
			return false;
		}
		
		return nextCellId;
	};

	/**
	 * Returns the opposite side of the given one
	 * @param {string} side - Previous cell side
	 * @returns {string} next cell side
	 */
	var oppositeSide = function(side) {
		var opposite;

		switch(side) {
			case 'n':
				opposite = 's';
				break;
			case 'e':
				opposite = 'w';
				break;
			case 's':
				opposite = 'n';
				break;
			case 'w':
				opposite = 'e';
				break;
		}

		return opposite;
	};

	var drawLaser2 = function(cell, side, dir) {
		var endSide, endDir, endPoint;
		// calcola coordinate punto d'entrata
		var startPoint = calcCoordinate(cell, side);

		// se non passa attraverso
		if (isPassingThrough(side, dir) === false) {
			endSide = side;
			endDir = dir;
			endPoint = startPoint;
		}
		else {
			switch(_cells[cell]['type']) {
				case 'empty':
				case 'none':
					endDir = dir;
					endSide = dir.replace(side, "").replace(oppositeSide(side), "");
					endPoint = calcCoordinate(cell, endSide);
					break;

				case 'mirror':
				case 'mirror_stuck':
					endSide = side;
					endDir = dir.replace(oppositeSide(endSide), endSide);
					endPoint = startPoint;
					break;

				case 'blackhole':
				case 'blackhole_stuck':
					return false;
					break;

				case 'glass':
					// laser #1 go through
					endDir = dir;
					endSide = dir.replace(side, "").replace(oppositeSide(side), "");
					endPoint = calcCoordinate(cell, endSide);
					// laser #2 reflects with a 90deg angle
					var endSide2 = side,
						endDir2 = dir.replace(oppositeSide(endSide2), endSide2);
					drawLaser2(cell, endSide2, endDir2);
					break;

				case 'prism':
					endDir = dir;
					endSide = oppositeSide(side);
					endPoint = calcCoordinate(cell, endSide);
					break;
			}
		}

		if (startPoint.x != endPoint.x || startPoint.y != endPoint.y) {
			// memorizza punti
			_points.push({x: endPoint.x, y: endPoint.y});

			// disegna laser
			_ctxs['laser'].strokeStyle = COLORS.laser;
			drawLine(_ctxs['laser'], startPoint.x, startPoint.y, endPoint.x, endPoint.y);
		}

		// calcola prossima cella, lato, direzione
		var nextCellId = calcNextCell(cell, endSide);
		var nextCellSide = oppositeSide(endSide);
		var nextCellDir = endDir;

		// se sono fuori dal canvas, fine
		if (nextCellId === false) {
			return false;
		}

		// richiama questa funzione
		drawLaser2(nextCellId, nextCellSide, nextCellDir);
	};

	/**
	 * Initiate the game
	 */
	var init = function() {
		calcCells();
		initCells();
		drawStuff();
		// console.log(_cells);
		initLasers();
		canvas.onmousedown = click;
	};


	init();
};