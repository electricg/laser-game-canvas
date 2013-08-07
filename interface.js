var init = function() {
	// Prevent scrolling http://www.html5rocks.com/en/mobile/touch/
	document.body.on('touchmove', function(event) {
		if (event.preventDefault) { event.preventDefault(); }
		else { event.returnValue = false; }
	}, false);

	var _headerHeight = document.getElementById('header').offsetHeight;

	LAYOUT.maxHeight -= _headerHeight;

	game(levels[0][0]);

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
			if (event.preventDefault) { event.preventDefault(); }
			else { event.returnValue = false; }

			var id = this.getAttribute('href'),
				$id = $$(id);

			if (hasClass(this, s)) {
				removeClass(this, s);
				removeClass($id, o);
				removeClass($main, o);
			}
			else {
				for (var m = 0; m < $overlayLinks.length; m++) {
					removeClass($overlayLinks[m], s);
					removeClass($overlayDivs[ $overlayLinks[m].getAttribute('href') ], o);
				}
				addClass(this, s);
				addClass($id, o);
				addClass($main, o);
			}
		});
	}

	// Levels menu
	var $overlayLevels = $$('#levels'),
		len = levels.length;

	var $ul = document.createElement('ul');
	$ul.className = 'l1';
	$overlayLevels.appendChild($ul);

	for (var m = 0; m < 10; m++) {
		var $li = document.createElement('li'),
			$span = document.createElement('span'),
			$ul2 = document.createElement('ul'),
			len2 = levels[0].length;

		$ul2.className = 'l2';
		$span.innerHTML = 'Level ' + (m + 1);
		$span.className = 'l1-title';
		$li.appendChild($span);
		$li.appendChild($ul2);
		$ul.appendChild($li);

		for (n = 0; n < 10; n++) {
			var $li2 = document.createElement('li'),
				$a2 = document.createElement('a');

			$a2.innerHTML = (n + 1);
			$a2.href = m + '-' + n;
			$ul2.appendChild($li2);
			$li2.appendChild($a2);
		}
	}
};

window.onload = init;