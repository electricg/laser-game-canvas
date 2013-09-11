var $ = document.querySelectorAll.bind(document);
var $$ = document.querySelector.bind(document);
Element.prototype.on = Element.prototype.addEventListener;

function hasClass(ele,cls) {
	if (ele) {
		return ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
	}
}
function addClass(ele,cls) {
	if (ele) {
		if (!hasClass(ele,cls)) ele.className += " "+cls;
	}
}
function removeClass(ele,cls) {
	if (ele) {
		if (hasClass(ele,cls)) {
			var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
			ele.className=ele.className.replace(reg,'');
		}
	}
}

function hexToRgb(hex) {
	var reg,
		res,
		result;

	if (hex.length === 7) {
		reg = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
		result = reg.exec(hex);
	}
	else if (hex.length === 4) {
		reg = /^#?([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})$/i;
		res = reg.exec(hex);
		result = [];
		for (var i = 1; i <= res.length; i++) {
			result[i] = res[i] + res[i];
		}
	}
	else {
		return false;
	}
		return result ? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		} : false;
}

function rgb(hex) {
	var res = hexToRgb(hex),
		color = '';

	if (res) {
		color = 'rgb(' + res.r + ', ' + res.g + ', ' + res.b + ')';
	}

	return color;
}

function rgba(hex, a) {
	var res = hexToRgb(hex),
		color = '';

	if (res) {
		color = 'rgba(' + res.r + ', ' + res.g + ', ' + res.b + ', ' + a + ')';
	}

	return color;
}

function isEven(number) {
	if (number % 2 === 0) {
		return true;
	}
	return false;
}

function prev(event) {
	if (event.preventDefault) { event.preventDefault(); }
	else { event.returnValue = false; }
}