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