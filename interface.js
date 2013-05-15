var init = function() {
	var _headerHeight = document.getElementById('header').offsetHeight;

	LAYOUT.maxHeight -= _headerHeight;

	game(levels[0]);
};

window.onload = init;