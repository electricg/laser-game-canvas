var levelConfig = {
	rows : 12,
	columns : 8,
	lasers : [
		{
			cell : 66,
			side : 's',
			dir : 'ne'
		},
		{
			cell : 95,
			side : 'n',
			dir : 'nw'
		}
	],
	targets : [
		{
			cell : 41,
			side : 'e'
		},
		{
			cell : 89,
			side : 's'
		},
		{
			cell : 67,
			side : 's'
		}
	],
	none : [1],	//set apart because it's drawn on a different layer
	cells : [
		{
			type : 'mirror',
			arr : [30, 56, 63, 79]
		},
		{
			type : 'blackhole',
			arr : [6]
		},
		{
			type : 'glass',
			arr : [2]
		},
		{
			type : 'prism',
			arr : [3]
		},
		{
			type : 'mirror_stuck',
			arr : [4]
		},
		{
			type : 'blackhole_stuck',
			arr : [5]
		}
	]
};