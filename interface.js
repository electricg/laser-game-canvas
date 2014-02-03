var l1 = 0, l2 = 0;
var init = function() {
	// Prevent scrolling http://www.html5rocks.com/en/mobile/touch/
	document.body.on('touchmove', function(event) {
		// Let the menu content scroll
		if (!hasClass(event.target, 'menu-content')) {
			prev(event);
		}
	}, false);

	var _headerHeight = document.getElementById('header').offsetHeight;

	LAYOUT.maxHeight -= _headerHeight;

	var $title = $$('#title');

	var game = new LaserGame();
	setGame();

	window.onresize = function() {
		_headerHeight = document.getElementById('header').offsetHeight;
		var w = document.documentElement.clientWidth,
			h = document.documentElement.clientHeight - _headerHeight;
		game.reload(w, h);
	};

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
			}
			else {
				for (var m = 0; m < $overlayLinks.length; m++) {
					removeClass($overlayLinks[m], s);
					removeClass($overlayDivs[ $overlayLinks[m].getAttribute('href') ], o);
				}
				addClass(this, s);
				addClass($id, o);
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
	var $victory = $('.victory')[0],
		$canvas = $$('#' + GAME_OPTS.canvasId);
	window.drawVictory = function() {
		// alert('won');
		addClass($victory, 'show');
		$canvas.on('mousedown', eraseVictory);
		$canvas.on('touchstart', eraseVictory);
	}
	function eraseVictory() {
		removeClass($victory, 'show');
		$canvas.removeEventListener('mousedown', eraseVictory);
		$canvas.removeEventListener('touchstart', eraseVictory);
	}

	// Init level
	function setGame() {
		game.init(levels[l1][l2]);
		setTitle();
	}
};

window.onload = init;