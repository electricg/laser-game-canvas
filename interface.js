var l1 = 0, l2 = 0;
var init = function() {
	// Prevent scrolling http://www.html5rocks.com/en/mobile/touch/
	function noScroll(event) {
		prev(event);
	}
	document.body.on('touchmove', noScroll);

	var _headerHeight = document.getElementById('header').offsetHeight;

	LAYOUT.maxHeight -= _headerHeight;

	var $title = $$('#title');

	// var levels = JSON.parse(localStorage['levels']);

	var game = new LaserGame();
	setGame();

	// Resize
	localStorage['reload'] = localStorage['reload'] || false;
	var timeoutID;
	function t() {
		_headerHeight = document.getElementById('header').offsetHeight;
		var w = document.documentElement.clientWidth,
			h = document.documentElement.clientHeight - _headerHeight;
		game.reload(w, h);
	}
	function resize() {
		window.clearTimeout(timeoutID);
		timeoutID = window.setTimeout(t, 500);
	}
	var $reload = $$('#reload');
	if (localStorage['reload'] === "true") {
		$reload.checked = true;
		window.addEventListener('resize', resize);
	}
	$reload.on('change', function(event) {
		if (this.checked) {
			localStorage['reload'] = true;
			resize();
			window.addEventListener('resize', resize);
		}
		else {
			localStorage['reload'] = false;
			window.removeEventListener('resize', resize);
		}
	});

	// Audio
	localStorage['audio'] = localStorage['audio'] || false;
	var $audio = $$('#audio');
	if (localStorage['audio'] === "true") {
		$audio.checked = true;
	}
	$audio.on('change', function(event) {
		if (this.checked) {
			localStorage['audio'] = true;
		}
		else {
			localStorage['audio'] = false;
		}
	});
	function loadSound(prop) {
		var request = new XMLHttpRequest();
		request.open('GET', audios[prop], true);
		request.responseType = 'arraybuffer';
		// Decode asynchronously
		request.onload = function() {
			context.decodeAudioData(request.response, function(buffer) {
				audios[prop + '_buffer'] = buffer;
			});
		}
		request.send();
	}
	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	window.sourceAudio = {};
	window.audios = {
		victory: 'sounds/Bravo.wav',
		prism: 'sounds/Crystal.wav',
		glass: 'sounds/Glass1.wav',
		solution: 'sounds/Hint1.wav',
		init: 'sounds/Lazer1.wav',
		tap1: 'sounds/Tap01.wav',
		mirror: 'sounds/Tap03.wav',
		blackhole: 'sounds/Tap09.wav'
	};
	var context = new AudioContext();
	for (var prop in audios) {
		if (audios.hasOwnProperty(prop)) {
			loadSound(prop);
		}
	}
	window.playSound = function(prop) {
		if (localStorage['audio'] === "true") {
			sourceAudio[prop] = context.createBufferSource();
			sourceAudio[prop].buffer = audios[prop + '_buffer'];
			sourceAudio[prop].connect(context.destination);
			sourceAudio[prop].start(0);
		}
	}

	// Overlay
	var $overlayLinks = $('.js-overlay'),
		$overlayDivs = {},
		$main = $$('.main'),
		s = 'selected',
		o = 'overlay-show';
	for (var i = 0; i < $overlayLinks.length; i++) {
		var id = $overlayLinks[i].getAttribute('href');
		$overlayDivs[id] = $$(id);

		$overlayLinks[i].on('click', function(event) {
			prev(event);

			var id = this.getAttribute('href'),
				$id = $$(id);

			if (hasClass(this, s)) {
				removeClass(this, s);
				removeClass($id, o);
				document.body.on('touchmove', noScroll);
			}
			else {
				for (var m = 0; m < $overlayLinks.length; m++) {
					removeClass($overlayLinks[m], s);
					removeClass($overlayDivs[ $overlayLinks[m].getAttribute('href') ], o);
				}
				addClass(this, s);
				addClass($id, o);
				document.body.removeEventListener('touchmove', noScroll);
			}
			eraseVictory();
		});
	}

	// Levels menu
	var $overlayLevels = $$('#levels'),
		len = levels.length;

	var $ul = document.createElement('ul');
	$ul.className = 'l1';
	$overlayLevels.appendChild($ul);

	for (var m = 0; m < len; m++) {
		var $li = document.createElement('li'),
			$span = document.createElement('span'),
			$ul2 = document.createElement('ul'),
			len2 = levels[m].length;

		$ul2.className = 'l2';
		$span.innerHTML = 'Level ' + (m + 1);
		$span.className = 'l1-title';
		$li.appendChild($span);
		$li.appendChild($ul2);
		$ul.appendChild($li);

		(function(m) {
			$span.on('click', function(event) {
				prev(event);
				l1 = m;
				l2 = 0;
				setGame();
				$overlayLinks[1].click();
			});
		})(m);

		for (n = 0; n < len2; n++) {
			var $li2 = document.createElement('li'),
				$a2 = document.createElement('a'),
				a2Id = 'l' + m + '-' + n;

			$a2.innerHTML = (n + 1);
			$a2.id = a2Id;
			$a2.href = '#' + a2Id;
			$ul2.appendChild($li2);
			$li2.appendChild($a2);
			(function(m, n) {
				$a2.on('click', function(event) {
					prev(event);
					l1 = m;
					l2 = n;
					setGame();
					$overlayLinks[1].click();
				});
			})(m, n);
		}
	}

	// Prev/next buttons
	var $navButtons = $('.js-nav-button');
	for (var m = 0; m < $navButtons.length; m++) {
		$navButtons[m].on('click', function(event) {
			prev(event);
			if (this.id === 'next') {
				l2++;
				if (l2 >= levels[l1].length) {
					l2 = 0;
					l1++;
					if (l1 >= levels.length) {
						l1 = 0;
					}
				}
			}
			else if (this.id === 'prev') {
				l2--;
				if (l2 < 0) {
					l1--;
					if (l1 < 0) {
						l1 = levels.length - 1;
					}
					l2 = levels[l1].length - 1;
				}
			}
			eraseVictory();
			setGame();
		});
	}

	// Level title
	function setTitle() {
		$title.innerHTML = 'L1: ' + (l1 + 1) + ' - L2: ' + (l2 + 1);
	}

	// Victory
	var victory = [];
	if (window.localStorage && typeof localStorage.victory !== "undefined") {
		victory = JSON.parse(localStorage.victory);
	}
	for (var i = 0; i < victory.length; i++) {
		addClass($$('#l' + victory[i].l1 + '-' + victory[i].l2), 'level-done');
	}
	var $victory = $('.victory')[0],
		$canvas = $$('#' + GAME_OPTS.canvasId);
	window.drawVictory = function() {
		// alert('won');
		addClass($victory, 'show');
		$canvas.on('mousedown', eraseVictory);
		$canvas.on('touchstart', eraseVictory);
	};
	function eraseVictory() {
		removeClass($victory, 'show');
		$canvas.removeEventListener('mousedown', eraseVictory);
		$canvas.removeEventListener('touchstart', eraseVictory);
	}
	window.saveVictory = function(l1, l2) {
		var _l1 = l1 - 1,
			_l2 = l2 - 1;
		victory.push({ l1: _l1, l2: _l2 });
		addClass($$('#l' + _l1 + '-' + _l2), 'level-done');
		if (window.localStorage) {
			localStorage.victory = JSON.stringify(victory);
		}
	};

	// Solution
	function eraseSolution() {
		removeClass($solution, 'show');
		removeClass($title, s);
		document.body.removeEventListener('mousedown', checkSolution);
		document.body.removeEventListener('touchstart', checkSolution);
	}
	function checkSolution(event) {
		if (event.target.id !== 'level-solution' && event.target.id !== 'title') {
			eraseSolution();
		}
	}
	var $levelSolution = $$('#level-solution'),
		$solution = $$('#solution');
	$levelSolution.on('click', function(event) {
		prev(event);
		eraseSolution();
		game.solution();
	});
	$title.on('click', function(event) {
		if (hasClass($solution, 'show')) {
			eraseSolution();
		}
		else {
			removeClass($$('.' + s), s);
			removeClass($$('.' + o), o);
			addClass($solution, 'show');
			addClass(this, s);
			document.body.on('mousedown', checkSolution);
			document.body.on('touchstart', checkSolution);
		}
	});

	// Reset progress
	var $reset = $$('#reset');
	$reset.on('click', function(event) {
		prev(event);
		if (window.confirm('Do you really want to reset your progress?')) {
			victory = [];
			localStorage.victory = JSON.stringify(victory);
			var l = $('.level-done'),
				ll = l.length;
			for (var i = 0; i < ll; i++) {
				removeClass(l[i], 'level-done');
			}
		}
	});

	// Init level
	function setGame() {
		game.init(levels[l1][l2]);
		setTitle();
	}
};

window.onload = init;