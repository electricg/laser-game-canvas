/**
 * Cell types
 * == empty:
 * cell that is empty with the possibility to move a block in, the laser goes through it with no changes;
 * == none:
 * cell with no possibility to move a block in, the laser goes through it with no changes;
 * == mirror:
 * cell that reflects the laser with a 90deg angle;
 * == blackhole:
 * cell that absorbs the laser and doesn't let it go through nor reflects it;
 * == glass:
 * cell that both let the laser go through and reflects it with a 90deg angle;
 * == prism:
 * the laser is translated to the opposite side of the entrance and it goes out with the same direction it came in;
 * == mirror_stuck:
 * same as mirror, but without the possibility to move the cell;
 * == blackhole_stuck:
 * same as blackhole, but without the possibility to move the cell.
 * == glass_stuck:
 * same as glass, but without the possibility to move the cell.
 */



var LaserGame = function() {
	var canvas = document.getElementById(GAME_OPTS.canvasId);
	if (!canvas.getContext) {
		return false;
	}

	var _opt;

	var _docWidth = LAYOUT.maxWidth,
		_docHeight = LAYOUT.maxHeight,
		_canvasW,
		_canvasH,
		_canvasD, // measure of the diagonal of the canvas
		_cellW,
		_cellH,
		_startX, // x coordinate of where the actual grid starts
		_startY, // y coordinate of where the actual grid starts
		_endX, // x coordinate of where the actual grid ends
		_endY; // y coordinate of where the actual grid ends

	var _ctx = canvas.getContext('2d'),
		_cellW_2,
		_cellH_2,
		_cellR,
		_cells,
		_cellsLength,
		_movingCell,
		_points,
		_lasersCounter,
		_targetRadius,
		_starterRadius,
		_screwRadius,
		_screwDistance,
		_targets,
		_victory;

	/**
	 * Layers:
	 * bg - empty and none cells, targets
	 * debug - grids and cell numbers
	 * cells - all the other cells
	 * laser
	 * moving - where the moving cell is drawn
	 * touch - captures events and coordinates - it's the main canvas
	 */
	var _layers = ['bg', 'debug', 'cells', 'laser', 'moving'],
		_canvases,
		_ctxs,
		_canvasParent = canvas.parentNode;

	if (DEBUG === false) {
		_layers.splice(1, 1);
	}


	/**
	 * Initiate the game
	 */
	this.init = function(opt) {
		_opt = opt;
		initCanvas();
		calcCells();
		initCells();
		initTargets();
		initVictory();
		drawStuff();
		initLasers();
		checkVictory();
		canvas.on('mousedown', click);
		canvas.on('touchstart', click);
		// console.log(_cells);
	};


	/**
	 * Show solution
	 */
	this.solution = function() {
		var n = _opt.solution,
			len = n.length;
		// reset cells if not none
		for (var i = 1; i <= _cellsLength; i++) {
			if (_cells[i].type !== 'none') {
				_cells[i].type = 'empty';
			}
		}
		// load solution
		for (var i = 0; i < len; i++) {
			for (var l = 0; l < n[i].arr.length; l++) {
				_cells[ n[i].arr[l] ].type = n[i].type;
			}
		}
		// reset canvas cells
		_ctxs['cells'].clearRect(0, 0, _canvasW, _canvasH);
		// draw normal cells
		drawLayerCells(n);
		// redraw lasers
		initLasers();
	};


	/**
	 * Redraw the current arrangement with the new size
	 * @param {number} w - Width of the canvas
	 * @param {number} h - Height of the canvas
	 */
	this.reload = function(w, h) {
		_docWidth = w;
		_docHeight = h;

		calcSizes();

		canvas.setAttribute('height', _canvasH);
		canvas.setAttribute('width', _canvasW);

		for (var i = 0; i < _layers.length; i++) {
			var li = _layers[i];
			_canvases[li].setAttribute('height', _canvasH);
			_canvases[li].setAttribute('width', _canvasW);
			_ctxs[li].clearRect(0, 0, _canvasW, _canvasH);
		}

		// calcCells();
		var x, y,
			gy = _startY,
			counter = 1;
		for (var r = 0; r < _opt.rows; r++) {
			x = _startX;
			y = gy;
			gy += _cellH;
			for (var c = 0; c < _opt.columns; c++) {
				_cells[counter].x = x;
				_cells[counter].y = y;
				x += _cellW;
				counter++;
			}
		}

		// initCells();
		// not needed

		initTargets();
		initVictory();
		drawStuff(true);
		initLasers();
		checkVictory();
	};


	/**
	 * Prepare the canvas elements
	 */
	var initCanvas = function() {
		calcSizes();
		
		canvas.setAttribute('height', _canvasH);
		canvas.setAttribute('width', _canvasW);

		_cells = [{}]; // first item empty
		_cellsLength = _opt.rows * _opt.columns;
		_movingCell = null;

		_canvases = [];
		_ctxs = [];

		// Remove canvas elements if they already exist
		if (document.getElementsByTagName('canvas').length > 1) {
			for (var i = 0; i < _layers.length; i++) {
				var t = document.getElementsByClassName(GAME_OPTS.canvasClass + _layers[i]);
				if (t.length > 0) {
					t[0].parentNode.removeChild(t[0]);
				}
			}
		}

		for (var i = 0; i < _layers.length; i++) {
			var li = _layers[i];
			_canvases[li] = document.createElement('canvas');
			_canvasParent.appendChild(_canvases[li]);
			_canvases[li].className = GAME_OPTS.canvasClass + li;
			_canvases[li].setAttribute('height', _canvasH);
			_canvases[li].setAttribute('width', _canvasW);
			_ctxs[li] = _canvases[li].getContext('2d');
		}
	};


	/**
	 * Calculate sizes of the elements
	 */
	var calcSizes = function() {
		_canvasW = _docHeight * (_opt.columns + LAYOUT.padding) / (_opt.rows + LAYOUT.padding);

		if (_canvasW > _docWidth) {
			_canvasW = _docWidth;
		}

		_cellW = Math.floor(_canvasW / (_opt.columns + LAYOUT.padding));

		if (isEven(_cellW)) {
			_cellW = _cellW - 1;
		}

		_cellH = _cellW;
		_canvasW = _docWidth;
		_canvasH = _docHeight;
		_startX = Math.floor((_canvasW - (_cellW * _opt.columns)) / 2);
		_startY = Math.floor((_canvasH - (_cellH * _opt.rows)) / 2);
		_endX = _cellW * _opt.columns + _startX;
		_endY = _cellH * _opt.rows + _startY;
		_canvasD = Math.sqrt(Math.pow(_canvasW, 2) + Math.pow(_canvasH, 2));

		_cellW_2 = _cellW / 2;
		_cellH_2 = _cellH / 2;
		_cellR = _cellW / 4; // radius of cell corners
		_targetRadius = _cellW / 8;
		_starterRadius = _cellW / 16;
		_screwRadius = _cellW / 12;
		_screwDistance = _cellW / 5;
	};


	/**
	 * Calculate cells coordinate
	 */
	var calcCells = function() {
		var x, y,
			gy = _startY,
			counter = 0;
		for (var r = 0; r < _opt.rows; r++) {
			x = _startX;
			y = gy;
			gy += _cellH;
			for (var c = 0; c < _opt.columns; c++) {
				_cells.push({
					x: x,
					y: y,
					type: 'empty'
				});
				x += _cellW;
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
	 * Save targets coordinates
	 */
	var initTargets = function() {
		var o = _opt.targets,
			target;
		_targets = [];
		for (var i = 0; i < o.length; i++) {
			target = calcCoordinate(o[i].cell, o[i].side);
			_targets.push(target.x + '_' + target.y);
		}
		// console.log(_targets);
	};


	/**
	 * Reset victory targets
	 */
	var initVictory = function() {
		_victory = [];
		for (var i = 0; i < _targets.length; i++) {
			_victory.push(_targets[i]);
		}
	};


	/* Score victory point by removing the target from the stack
	 * @returns {boolean} true if won, false otherwise
	 */
	var checkVictory = function() {
		if (_victory.length === 0) {
			drawVictory();
			saveVictory(_opt.l1, _opt.l2);
			return true;
		}
		return false;
	};


	/**
	 * Draw the initial game
	 * @param {boolean} true if drawing current cells arrangement
	 */
	var drawStuff = function(current) {
		// draw cell numbers
		if (DEBUG === true) {
			drawCellNumbers();
		}

		// draw background cells
		drawLayerBg();

		// draw targets background
		drawTargetBg();

		if (current) {
			// draw current cells arrangement
			drawCurrentCells();
		}
		else {
			// draw normal cells
			drawLayerCells(_opt.cells);
		}

		// draw grid
		if (DEBUG === true) {
			drawGrid();
		}
	};


	/**
	 * Starts the lasers
	 */
	var initLasers = function() {
		_ctxs['laser'].clearRect(0, 0, _canvasW, _canvasH);
		resetPoints();
		_lasersCounter = 0;
		var n = _opt.lasers;
		for (var i = 0; i < n.length; i++) {
			_lasersCounter++;
			var t = calcCoordinate(n[i].cell, n[i].side);

			// draw starter point
			drawStarter(t.x, t.y);

			// save point
			savePoint(t.x, t.y, n[i].dir, i);

			// check if the point is a target
			checkPoint(t.x, t.y);

			// start drawing laser
			drawLaser(n[i].cell, n[i].side, n[i].dir, _lasersCounter);
		}
		// console.log(_points);
	};


	/**
	 * Draw cell from id
	 * @param {object} ctx - Canvas context to work on
	 * @param {number} cell - Cell id
	 */
	var drawCellFromId = function(ctx, cell) {
		var c = _cells[cell];
		drawCell(ctx, c.x, c.y, c.type);
	};


	/**
	 * Draw cell from id with the given type
	 * @param {object} ctx - Canvas context to work on
	 * @param {number} cell - Cell id
	 * @param {string} type - Cell type
	 */
	var drawCellFromType = function(ctx, cell, type) {
		var c = _cells[cell];
		drawCell(ctx, c.x, c.y, type);
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
		ctx.strokeStyle = COLORS.stroke;
		// ctx.fillRect(x, y, _cellW, _cellH);
		drawRoundRect(ctx, x, y, _cellW, _cellH, _cellR);
		ctx.fill();
		ctx.stroke();

		if (type === 'glass' || type === "glass_stuck") {
			var d = _cellW / 10;
			ctx.fillStyle = COLORS['blackhole'];
			drawRoundRect(ctx, x+1, y+1, _cellW-d, _cellH-d, _cellR-2);
			ctx.fill();

			ctx.fillStyle = COLORS['empty'];
			drawRoundRect(ctx, x+d-2, y+d-2, _cellW-d*2+3, _cellH-d*2+3, _cellR-d);
			ctx.fill();
			drawCircle(ctx, x + _screwDistance, y + _screwDistance, _screwRadius, COLORS[type]);
		}

		if (type.indexOf('stuck') != -1) {
			drawScrews(ctx, x, y);
		}

		if (type === 'prism') {
			var xt = x + 3,
				yt = y + 3,
				_cellWt = _cellW - 6,
				_cellHt = _cellH - 6,
				b = _cellWt / 4;

			drawRect(ctx, xt+_cellWt/2, yt, xt+_cellWt, yt+_cellHt/2, xt+_cellWt/2, yt+_cellHt, xt, yt+_cellHt/2, '#AAA', COLORS['prism']);
			drawRect(ctx, xt+_cellWt/2-b, yt, xt+_cellWt, yt+_cellHt/2+b, xt+_cellWt/2+b, yt+_cellHt, xt, yt+_cellHt/2-b, '#888', COLORS['prism']);
			drawRect(ctx, xt+_cellWt/2+b, yt, xt+_cellWt, yt+_cellHt/2-b, xt+_cellWt/2-b, yt+_cellHt, xt, yt+_cellHt/2+b, '#888', COLORS['prism']);
			drawRect(ctx, xt+_cellWt/2, yt+b, xt+_cellWt/2+b, yt+_cellHt/2, xt+_cellWt/2, yt+_cellHt-b, xt+b, yt+_cellHt/2, '#666', COLORS['prism']);
			drawRect(ctx, xt+_cellWt-b, yt, xt+_cellWt, yt+_cellHt/2-b, xt+_cellWt-b/2, yt+_cellHt/2-b/2, xt+_cellWt/2+b/2, yt+b/2, COLORS['empty'], COLORS['prism']);
			drawRect(ctx, xt+_cellWt-b/2, yt+_cellHt/2+b/2, xt+_cellWt, yt+_cellHt/2+b, xt+_cellWt/2+b, yt+_cellHt, xt+_cellWt/2+b/2, yt+_cellHt-b/2, COLORS['empty'], COLORS['prism']);
			drawRect(ctx, xt+b/2, yt+_cellHt/2+b/2, xt+_cellWt/2-b/2, yt+_cellHt-b/2, xt+_cellWt/2-b, yt+_cellHt, xt, yt+_cellHt/2+b, COLORS['empty'], COLORS['prism']);
			drawRect(ctx, xt+_cellWt/2-b, yt, xt+_cellWt/2-b/2, yt+b/2, xt+b/2, yt+_cellHt/2-b/2, xt, yt+_cellHt/2-b, COLORS['glass'], COLORS['prism']);
		}
	};


	var drawCellEmpty = function(cell) {
		var ctx = _ctxs['bg'],
			c = _cells[cell],
			d = _cellW / 10,
			x = c.x + d,
			y = c.y + d,
			w = _cellW - d * 2,
			h = _cellH - d * 2,
			r = _cellR - d / 2;

		ctx.lineWidth = LAYOUT.empty_line;
		ctx.fillStyle = COLORS['empty'];
		ctx.strokeStyle = COLORS['empty_stroke'];
		drawRoundRect(ctx, x, y, w, h, r);
		ctx.fill();
		ctx.stroke();
	};


	/**
	 * Draw four sides shape
	 * @param {object} ctx - Canvas context to work on
	 * @param {number} x{1,4} - Point{1,4} x coordinate
	 * @param {number} y{1,4} - Point{1,4} y coordinate
	 * @param {string} - Fill style if any
	 * @param {string} - Stroke style if any
	 */
	var drawRect = function(ctx, x1, y1, x2, y2, x3, y3, x4, y4, fill, stroke) {
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.lineTo(x3, y3);
		ctx.lineTo(x4, y4);
		ctx.closePath();
		if (fill) {
			ctx.fillStyle = fill;
			ctx.fill();
		}
		if (stroke) {
			ctx.strokeStyle = stroke;
			ctx.stroke();
		}
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
	var drawRoundRect = function(ctx, x, y, w, h, r) {
		x = x + 1;
		y = y + 1;
		w = w - 2;
		h = h - 2;
		r = r - 1;
		var r1_x = r4_x = x + r,
			r1_y = r2_y = y + r,
			r2_x = r3_x = x + w - r,
			r3_y = r4_y = y + h - r;
		var a_x = x + w - r,
			a_y = y,
			b_x = x + w,
			b_y = y + h - r,
			c_x = x + r,
			c_y = y + h,
			d_x = x,
			d_y = y + r;

		ctx.beginPath();
		ctx.arc(r1_x, r1_y, r, Math.PI, 1.5 * Math.PI);
		ctx.lineTo(a_x, a_y);
		ctx.arc(r2_x, r2_y, r, 1.5 * Math.PI, 0);
		ctx.lineTo(b_x, b_y);
		ctx.arc(r3_x, r3_y, r, 0, 0.5 * Math.PI);
		ctx.lineTo(c_x, c_y);
		ctx.arc(r4_x, r4_y, r, 0.5 * Math.PI, Math.PI);
		ctx.lineTo(d_x, d_y);
	};


	/**
	 * Draw circle
	 * @param {object} ctx - Canvas context to work on
	 * @param {number} x - Center point x coordinate
	 * @param {number} y - Center point y coordinate
	 * @param {number} radius - Circle radius
	 * @param {string} bg - Background color
	 */
	var drawCircle = function(ctx, x, y, radius, bg) {
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
		ctx.fillStyle = bg;
		ctx.fill();
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
	 * Draw screw
	 * @param {object} ctx - Canvas context to work on
	 * @param {number} x - Screw center point x coordinate
	 * @param {number} y - Screw center point y coordinate
	 * @param {number} r - Screw radius
	 */
	var drawScrew = function(ctx, x, y, r) {
		var r_2 = r / 2;
		ctx.strokeStyle = COLORS['empty_stroke'];
		drawCircle(ctx, x, y, r, COLORS['empty']);
		ctx.stroke();
		drawLine(ctx, x-r_2, y-r_2, x+r_2, y+r_2);
		drawLine(ctx, x+r_2, y-r_2, x-r_2, y+r_2);
	};


	/**
	 * Draw screws inside cell
	 * @param {object} ctx - Canvas context to work on
	 * @param {number} x - Cell x coordinate
	 * @param {number} y - Cell y coordinate
	 */
	var drawScrews = function(ctx, x, y) {
		var r = _screwRadius,
			d = _screwDistance;
		drawScrew(ctx, x + d, y + d, r);
		drawScrew(ctx, x +_cellW - d, y + d, r);
		drawScrew(ctx, x + d, y + _cellH - d, r);
		drawScrew(ctx, x + _cellW - d, y + _cellH - d, r);
	};


	/**
	 * Draw grid - for debug
	 */
	var drawGrid = function() {
		var ctx = _ctxs['debug'],
			x1, y1, x2, y2;
		ctx.strokeStyle = COLORS.grid;

		// vertical
		x1 = _startX;
		y1 = 0;
		y2 = _canvasH;
		for (var i = 0; i <= _opt.columns; i++) {
			drawLine(ctx, x1, y1, x1, y2);
			x1 += _cellW;
		}
		// horizontal
		x1 = 0;
		x2 = _canvasW;
		y1 = _startY;
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
			ctx.fillText(i, c.x + _cellW_2, c.y + _cellH_2);
		}
	};


	/**
	 * Draw background cells
	 */
	var drawLayerBg = function() {
		for (var i = 1; i <= _cellsLength; i++) {
			// check that is not none
			if (_cells[i].type != 'none') {
				//drawCellFromType(_ctxs['bg'], i, 'empty');
				drawCellEmpty(i);
			}
		}
	};


	/**
	 * Draw block cells
	 * @param {array} conf - Cells type
	 */
	var drawLayerCells = function(conf) {
		var m = conf;
		for (var i = 0; i < m.length; i++) {
			for (var h = 0; h < m[i].arr.length; h++) {
				drawCellFromId(_ctxs['cells'], m[i].arr[h]);
			}
		}
	};


	/**
	 * Draw current cells arrangement
	 */
	var drawCurrentCells = function() {
		for (var i = 0; i < _cells.length; i++) {
			if (_cells[i].type && _cells[i].type !== 'empty' && _cells[i].type !== 'none') {
				drawCellFromId(_ctxs['cells'], i);
			}
		}
	};


	/**
	 * Draw target points background
	 */
	var drawTargetBg = function() {
		var o = _opt.targets;
		for (var i = 0; i < o.length; i++) {
			drawTarget(_ctxs['bg'], o[i].cell, o[i].side, COLORS.stroke);
		}
	};


	/**
	 * Draw target point hit by laser
	 * @param {number} x - Target point x coordinate
	 * @param {number} y - Target point y coordinate
	 */
	var drawTargetHit = function(x, y) {
		drawCircle(_ctxs['laser'], x, y, _targetRadius, COLORS.laser);
	};


	/**
	 * Draw target point
	 * @param {object} ctx - Canvas context to work on
	 * @param {number} cell - Cell id
	 * @param {string} side - Side of the cell
	 * @param {string} bg - Background color
	 */
	var drawTarget = function(ctx, cell, side, bg) {
		var target = calcCoordinate(cell, side);
		drawCircle(ctx, target.x, target.y, _targetRadius, bg);
	};


	/**
	 * Draw laser starter point
	 * @param {number} x - Starter point x coordinate
	 * @param {number} y - Starter point y coordinate
	 */
	var drawStarter = function(x, y) {
		drawCircle(_ctxs['laser'], x, y, _starterRadius, COLORS['laser']);
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
				res.x = c.x + _cellW_2;
				res.y = c.y;
				break;

			case 'e':
				res.x = c.x + _cellW;
				res.y = c.y + _cellH_2;
				break;

			case 's':
				res.x = c.x + _cellW_2;
				res.y = c.y + _cellH;
				break;

			case 'w':
				res.x = c.x;
				res.y = c.y + _cellH_2;
				break;
		}

		return res;
	};


	/**
	 * Return cell id from x,y coordinates
	 * @param {number} x - X coordinate of the cell
	 * @param {number} y - Y coordinate of the cell
	 * @returns {number} Cell id
	 */
	var getSelectedCell = function(x, y) {
		var index = 0;

		if (y >= _startY && y <= _endY &&
			x >= _startX && x <= _endX) {
			for (var r = 0; r < _opt.rows; r++) {
				if (y <= (r + 1) * _cellH + _startY) {
					for (var c = 1; c <= _opt.columns; c++) {
						if (x <= c * _cellW + _startX) {
							index = r * _opt.columns + c;
							return index;
						}
					}
				}
			}
		}
		return index;
	};


	/**
	 *	Click on cell
	 */
	var click = function(event) {
		var pos = mousePositionElement(event),
			cell = getSelectedCell(pos.x, pos.y);

		if (cell === 0) {
			return;
		}

		// console.log(cell);

		// check if it's possible to move this cell
		if (_cells[cell].type === 'empty' ||
			_cells[cell].type === 'none' ||
			_cells[cell].type === 'mirror_stuck' ||
			_cells[cell].type === 'blackhole_stuck' ||
			_cells[cell].type === 'glass_stuck') {
			return false;
		}
		else {
			// clear canvas
			clearMovingCanvas();

			// draw cell at current mouse point
			drawCell(_ctxs['moving'], pos.x - _cellW_2, pos.y - _cellH_2, _cells[cell].type);

			_movingCell = cell;

			canvas.on('mousemove', updateLayerMoving);
			canvas.on('touchmove', updateLayerMoving);
			canvas.on('mouseup', pieceDropped);
			canvas.on('touchend', pieceDropped);
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
	 * @param {number} cell - Cell id
	 */
	var clearCell = function(cell) {
		_ctxs['cells'].clearRect( _cells[cell].x, _cells[cell].y, _cellW, _cellH );
	};


	/**
	 * Update moving layer while moving mouse
	 */
	var updateLayerMoving = function(event) {
		// console.log('moving');
		var pos = mousePositionElement(event);
		clearMovingCanvas();
		// draw cell at current mouse point
		drawCell(_ctxs['moving'], pos.x - _cellW_2, pos.y - _cellH_2, _cells[_movingCell].type);
	};


	/**
	 * Dropped piece
	 */
	var pieceDropped = function(event) {
		// console.log('dropped');
		canvas.removeEventListener('mousemove', updateLayerMoving);
		canvas.removeEventListener('touchmove', updateLayerMoving);
		canvas.removeEventListener('mouseup', pieceDropped);
		canvas.removeEventListener('touchend', pieceDropped);
		clearMovingCanvas();

		var pos = mousePositionElement(event),
			cell = getSelectedCell(pos.x, pos.y);

		if (cell === 0) {
			return;
		}

		// check if it's possible to drop the cell here
		if (_cells[cell].type === 'empty') {
			// update cells status
			_cells[cell].type = _cells[_movingCell].type;
			_cells[_movingCell].type = 'empty';

			// delete old cell
			clearCell(_movingCell);

			// draw new cell
			drawCellFromId(_ctxs['cells'], cell);

			// play sound
			if (_cells[cell].type === 'prism' || _cells[cell].type === 'mirror' || _cells[cell].type === 'glass' || _cells[cell].type === 'blackhole') {
				playSound(_cells[cell].type);
			}

			initVictory();

			// update lasers
			initLasers();

			// check victory
			checkVictory();
		}
		else {
			// nothing for the moment
		}

		// reset the moving cell id
		_movingCell = null;
	};


	/**
	 * Check if the laser goes through the cell
	 * @param {string} side - Side of the cell
	 * @param {string} dir - Laser direction
	 * @returns {boolean} true if the laser goes through
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

		row = Math.ceil(cell / _opt.columns);
		col = cell % _opt.columns;

		if (col === 0) {
			col = _opt.columns;
		}

		return {r: row, c: col};
	};


	/** Calc cell id from row and column position
	 * @param {number} row - Row
	 * @param {number} col - Column
	 * @returns {number} cell id
	 */
	var calcCellFromRowAndCol = function(row, col) {
		return (row - 1) * _opt.columns + col;
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
			tot = _opt.rows * _opt.columns;

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


	/**
	 * Save point coordinates and laser direction
	 * @param {number} x - X coordinate
	 * @param {number} y - Y coordinate
	 * @param {string} dir - Laser direction
	 * @param {number} laser - laser id
	 */
	var savePoint = function(x, y, dir, laser) {
		_points.push({
			x: x,
			y: y,
			dir : dir,
			laser : laser
		});
	};


	/**
	 * Reset points stack
	 */
	var resetPoints = function() {
		_points = [];
	};


	/**
	 * Check if the same laser goes through the point with the same direction - to avoid infinite loops
	 * @param {number} x - X coordinate
	 * @param {number} y - Y coordinate
	 * @param {string} dir - Laser direction
	 * @param {number} laser - laser id
	 * @returns boolean - Returns true if it exists
	 */
	var isAlreadyPoint = function(x, y, dir, laser) {
		var l = _points.length;

		for (var i = 0; i < l; i++) {
			if (_points[i].x === x &&
				_points[i].y === y &&
				_points[i].dir === dir &&
				_points[i].laser === laser) {
				return true;
			}
		}

		return false;
	};


	/**
	 * Check if there is a laser that goes through the point with the same direction - to avoid infinite loops
	 * @param {number} x - X coordinate
	 * @param {number} y - Y coordinate
	 * @param {string} dir - Laser direction
	 * @returns boolean - Returns true if it exists
	 */
	var isAlreadyLaser = function(x, y, dir) {
		var l = _points.length;

		for (var i = 0; i < l; i++) {
			if (_points[i].x === x &&
				_points[i].y === y &&
				_points[i].dir === dir) {
				return true;
			}
		}

		return false;
	};


	/** Check if the point is a target
	 * @param {number} x - Center point x coordinate
	 * @param {number} y - Center point y coordinate
	 * @returns {boolean} true if is a target
	 */
	var isTargetPoint = function(x, y) {
		if (_targets.indexOf(x + '_' + y) === -1) {
			return false;
		}
		return true;
	};


	/**
	 * If the point is a target, light it up and sign in score
	 * @param {number} x - Point x coordinate
	 * @param {number} y - Point y coordinate
	 */
	var checkPoint = function(x, y) {
		if (isTargetPoint(x, y)) {
			drawTargetHit(x, y);

			var index = _victory.indexOf(x + '_' + y);
			if (index != -1) {
				_victory.splice(index, 1);
			}
		}
	};


	/**
	 * Draw the laser from the edge of the grid to the edge of the canvas
	 * @param {string} dir - Laser direction
	 * @param {number} x - Starting point x coordinate
	 * @param {number} y - Starting point y coordinate
	 */
	var drawEndingLaser = function(dir, x, y) {
		var angle = 0;
		switch(dir) {
			case 'se':
				angle = 45;
				break;
			case 'sw':
				angle = 135;
				break;
			case 'nw':
				angle = 225;
				break;
			case 'ne':
				angle = 315;
				break;
		}
		var radians = angle * (Math.PI / 180);
		// the canvas diagonal is the longest distance between two points,
		// therefore it's used to draw the ending laser
		var end = {
			x: x + _canvasD * Math.cos(radians),
			y: y + _canvasD * Math.sin(radians)
		};
		_ctxs['laser'].strokeStyle = COLORS.laser;
		drawLine(_ctxs['laser'], x, y, end.x, end.y);
	};


	/**
	 * Draw lasers
	 * @param {number} cell - Cell id
	 * @param {string} side - Side of the cell
	 * @param {string} dir - Laser direction
	 * @param {number} laserId - laser id 
	 */
	var drawLaser = function(cell, side, dir, laserId) {
		var endSide, endDir, endPoint;

		// calc entrance point coordinates
		var startPoint = calcCoordinate(cell, side);

		// check if the laser goes through the cell itself
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
				case 'glass_stuck':
					// laser #1 go through
					endDir = dir;
					endSide = dir.replace(side, "").replace(oppositeSide(side), "");
					endPoint = calcCoordinate(cell, endSide);
					// laser #2 reflects with a 90deg angle
					var endSide2 = side,
						endDir2 = dir.replace(oppositeSide(endSide2), endSide2);
					var cell2 = calcCoordinate(cell, endSide2)
					if (!isAlreadyLaser(cell2.x, cell2.y, endDir2)) {
						drawLaser(cell, endSide2, endDir2, _lasersCounter++);
					}
					break;

				case 'prism':
					endDir = dir;
					endSide = oppositeSide(side);
					endPoint = calcCoordinate(cell, endSide);
					break;
			}
		}

		// exit if this laser is going through an existing point with the same direction
		if (isAlreadyPoint(endPoint.x, endPoint.y, endDir, laserId)) {
			return false;
		}

		// save point
		savePoint(endPoint.x, endPoint.y, endDir, laserId);

		// check if the point is a target
		checkPoint(endPoint.x, endPoint.y);

		if (startPoint.x != endPoint.x || startPoint.y != endPoint.y) {
			// draw laser
			_ctxs['laser'].strokeStyle = COLORS.laser;
			drawLine(_ctxs['laser'], startPoint.x, startPoint.y, endPoint.x, endPoint.y);
		}

		// calc next cell, side, dir
		var nextCellId = calcNextCell(cell, endSide);
		var nextCellSide = oppositeSide(endSide);
		var nextCellDir = endDir;

		// draw a line to the edge of the canvas if out of the grid
		if (nextCellId === false) {
			drawEndingLaser(nextCellDir, endPoint.x, endPoint.y);
			return false;
		}

		// richiama questa funzione
		drawLaser(nextCellId, nextCellSide, nextCellDir);
	};
};