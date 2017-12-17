(function(window) {

	var SunsetAnimation = function(gallery) {
		this.gallery = gallery;
	};

	SunsetAnimation.prototype.init = function() {
		this.gallery.ctx.fillStyle = '#000';
		this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);
		//var aspectRatio = this.gallery.width / this.gallery.height;
		
		this.rowHeight = 10;
		this.rowSpacing = 2;
		this.segmentSpacing = 2;
		this.rowCount = this.gallery.height / (this.rowHeight+this.rowSpacing);

	};

	SunsetAnimation.prototype.draw = function(t, deltaT)
	{
		//t+=15000;
		this.gallery.ctx.fillStyle = '#000';
		this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);

		//var rows = this.makeRowsCircle(this.gallery.width/2, this.gallery.height/2, 310, '#f00', '#ff0');
		var circleX = this.gallery.width/2 + sigmoid((this.gallery.mouseX - this.gallery.width/2)/this.gallery.width/2, this.gallery.width*0.8, 3);
		var circleY = this.gallery.height + this.gallery.height*0.4*Math.cos(t/1000*0.3 + Math.PI/8);
		var rows = this.makeRowsCircle(circleX, circleY, this.gallery.width * 0.2, '#f00', '#ff0');
		var moonY = this.gallery.height*0.4*Math.cos(t/1000*0.3 + Math.PI/8);
		//make moon

		var starColors = [
			'#fff',
			'#aaf',
		];

		var starSizes = [
			[this.gallery.width * 0.03, this.gallery.width * 0.03*0.4],
			[this.gallery.width * 0.05, this.gallery.width * 0.05*0.4],
		];
		
		var _this = this;
		//var nightX = Math.exp(0.1*(this.gallery.width/2 - this.gallery.mouseX));
		var nightX = sigmoid((this.gallery.width/2 - this.gallery.mouseX)/this.gallery.width/2, 500, 3);
		var nightY = this.gallery.height*(0.6*Math.cos(t/1000*0.3 + Math.PI/8) - 0.1);
		var stars = [
			this.createStar(nightX + this.gallery.width*0.1, nightY - this.gallery.height*0.2,  starSizes[0][0], starSizes[0][1], Math.PI/4*Math.sin(-t/1500) - 2*Math.PI/3, starColors[0]),
			this.createStar(nightX + this.gallery.width*0.2, nightY - this.gallery.height*0.01, starSizes[0][0], starSizes[0][1], Math.PI/4*Math.sin(t/2000), starColors[0]),
			this.createStar(nightX + this.gallery.width*0.25, nightY - this.gallery.height*0.4, starSizes[0][0], starSizes[0][1], Math.PI/4*Math.sin(-t/1500) - Math.PI/3, starColors[0]),
			this.createStar(nightX + this.gallery.width*0.7, nightY - this.gallery.height*0.25, starSizes[0][0], starSizes[0][1], Math.PI/4*Math.sin(-t/4000), starColors[0]),
			this.createStar(nightX + this.gallery.width*0.95, nightY - this.gallery.height*0.35, starSizes[0][0], starSizes[0][1], Math.PI/4*Math.sin(-t/4000), starColors[0]),

			this.createStar(nightX + this.gallery.width*0.4, nightY - this.gallery.height*0.3,  starSizes[1][0], starSizes[1][1], Math.PI/4*Math.sin(-t/3000)+Math.PI/3, starColors[1]),
			this.createStar(nightX + this.gallery.width*0.9, nightY - this.gallery.height*0.15, starSizes[1][0], starSizes[1][1], Math.PI/4*Math.sin(t/3000)+ Math.PI/3, starColors[1]),
		];
		stars.forEach(function(star) {
			_this.mergeRows(rows, star);
		});

		var moon = this.createMoon(nightX + this.gallery.width * 0.6, nightY - this.gallery.height*0.2, 150, Math.PI/8*Math.sin(t/1000) - Math.PI/3, '#ff0');
		this.mergeRows(rows, moon);


		var _this = this;
		var waveHeight = 100;
		var waveY = (_this.gallery.height+waveHeight)*(t%3000)/3000-waveHeight;
		rows.forEach(function(row, i) {
			//var rowHeight = _this.rowHeight + 2*Math.sin(t/1000*Math.PI) + 2*Math.cos(i/rows.length);
			var y = i*(_this.rowHeight+_this.rowSpacing);// + 30*Math.sin(t/2000);
			//var xOffset = 5*Math.sin(Math.PI/2*(i%8));//Math.sin(t/1000);
			var xOffset = 0;//((waveY+y) % _this.gallery.height);
			var waveDistance = 2*((y-waveY)/waveHeight - 0.5);
			if(y > waveY && y <= waveY + waveHeight) {
				xOffset = sigmoid(waveDistance,100,3);
				//xOffset = Math.max(-300, Math.min(300, 40*Math.tan(Math.PI/2*waveDistance)));
				//xOffset = 5/(1-waveDistance) - 5;
				//xOffset = 80*(waveDistance + Math.pow(waveDistance, 3));
				//xOffset = 1/((y-waveY)/waveHeight);
				//xOffset = 100*Math.sqrt((y-waveY)/waveHeight);
				//xOffset = 100*(y-waveY)/waveHeight;
			}
			_this.drawRow(y, _this.rowHeight, row, xOffset);
		});

		//var star = this.createStar(300, 300, 170, 100, 0, '#fff');
		//var star = this.createStar(300, 300, 70, 40, 0, '#fff');
		//this.gallery.ctx.strokeStyle = '#fff';
		//this.gallery.ctx.beginPath();
		//this.gallery.ctx.moveTo(0,0);
		//star.forEach(function(s) {
			//s.segments.forEach(function(segment) { 
				//_this.gallery.ctx.lineTo(segment.x, s.row*_this.rowHeight);
			//});
		//});
		////this.gallery.ctx.closePath();
		//this.gallery.ctx.stroke();
	};

	SunsetAnimation.prototype.makeRowsCircle = function(cx, cy, radius, bgColor, fgColor) {
		var rows = [];
		//var bgStops = [
		//{ t: 0, h: 0.66, s: 0.6, v: 0.15},
		//{ t: 0.4, h: 0.9, s: 0.8, v: 0.2},
		//{ t: 0.6, h: 0.0, s: 0.7, v: 0.4},
		//{ t: 0.7, h: 0.12, s: 1, v: 0.8},
		//{ t: 0.8, h: 0.08, s: 1, v: 0.8},
		//{ t: 0.95, h: 0.04, s: 1, v: 0.8},
		//{ t: 1, h: 0, s: 1, v: 0.8},
		//];

		var _this = this;
		var cyPercent = cy / this.gallery.height;
		var gradient1t = cyPercent-0.1;
		var gradient2t = (1-cyPercent-0.05);
		var bgStops = [
			{ t: gradient1t*0, h: 0.66, s: 0.6, v: 0.15},
			{ t: gradient1t*0.66, h: 0.9, s: 0.8, v: 0.2},
			{ t: gradient1t*1, h: 0.0, s: 0.7, v: 0.4},
			//.6
			{ t: cyPercent, h: 0.12, s: 1, v: 0.9}, //yellow
			//.85
			{ t: cyPercent + 0.05 + gradient2t*0, h: 0.11, s: 1, v: 0.8},
			{ t: cyPercent + 0.05 + gradient2t*0.4, h: 0.04, s: 1, v: 0.8},
			{ t: cyPercent + 0.05 + gradient2t*1, h: 0, s: 1, v: 0.8},
		].map(function(s) {
			s.s *= Math.sqrt(cyPercent);
			//s.v *= Math.sqrt(cyPercent);
			//s.v = Math.min(1, _this.gallery.helpers.lerp(s.v, s.v+0.1, Math.sqrt(1-cyPercent)));
			return s;
		});
		var fgStops = [
			{t: 0, h: 0.16, s: 1, v: 1},
			{t: 0.33, h: 0.12, s: 0.9, v: 0.9},
			{t: 0.5, h: 0.9, s: 0.7, v: 0.3},
			{t: 1, h: 0.12, s: 0.9, v: 0.9},
		];
		for(var i = 0; i < this.rowCount; i++) {
			var y = i*(this.rowHeight+this.rowSpacing);
			var yDist = y - cy;
			var xDist = Math.sqrt(radius*radius - yDist*yDist);
			//var bgColor = this.gallery.helpers.rgbStr(Math.floor(this.gallery.helpers.lerp(0, 255, i/this.rowCount)), 0, 0);
			var bgColorHsv = this.gallery.helpers.lerpGradientHsv(bgStops, i/this.rowCount);
			bgColor = this.gallery.helpers.hsvStr(bgColorHsv.h, bgColorHsv.s, bgColorHsv.v);
			var fgOuterColor = this.gallery.helpers.hsvStr(0.1, 1, 0.9);
			var fgColorHsv = this.gallery.helpers.lerpGradientHsv(fgStops, cy/(this.gallery.width*2));
			fgColor = this.gallery.helpers.hsvStr(fgColorHsv.h, fgColorHsv.s, fgColorHsv.v);
			if(Math.abs(yDist) < radius) {
				rows.push([
					{x: cx - xDist, color: bgColor},
					//{x: cx - xDist*0.8, color: fgOuterColor},
					//{x: cx + xDist*0.8, color: fgColor},
					{x: cx + xDist, color: fgColor},
					{x: this.gallery.width, color: bgColor},
				]);
			}
			else {
				rows.push([{x: this.gallery.width, color: bgColor}]);
			}
		}
		return rows;
	};

	SunsetAnimation.prototype.drawRow = function(y, height, segments, xOffset) {
		var _this = this;
		var lastX = 0;
		segments.forEach(function(segment, i) {
			_this.gallery.ctx.fillStyle = segment.color;
			var x = lastX + xOffset;
			var width = segment.x - lastX;
			if(i === 0) {
				// fill left edge
				x = 0;
				width = segment.x + xOffset;
			}
			if(i === segments.length-1) {
				// fill right edge
				width = _this.gallery.width - x;
			}
			_this.gallery.ctx.fillRect(x, y, width, height);
			lastX = segment.x + _this.segmentSpacing;
		});
	};

	// a is all the rows, b is a map rowIndex => {row, ranges: [x1, x2]...} intervals
	SunsetAnimation.prototype.mergeRows = function(a, b) {
		b.forEach(function(row) {
			if(row.row < 0 || row.row >= a.length) {
				return;
			}
			var baseRow = a[row.row];

			// insert each segment to the base row in x sorted order
			row.ranges.forEach(function(range, i) {
				var segmentIndex = baseRow.findIndex(function(r) { return range[0] < r.x;});
				if(segmentIndex === -1) {
					return;
				}

				// copy background between ranges
				var bgRow = {x: range[0], color: baseRow[segmentIndex].color};
				baseRow.splice(segmentIndex, 0, bgRow);

				baseRow.splice(segmentIndex+1, 0, {x: range[1], color: row.color});

				// delete segments in range
				var deleteCount = baseRow.filter(function(s) { return s.x > range[0] && s.x < range[1];}).length;
				baseRow.splice(segmentIndex+2, deleteCount);
				//a[row.row] = baseRow.filter(function(s) { return (s.x <= range[0] || s.x >= range[1])});
			});
		});
	};

	SunsetAnimation.prototype.createStar = function(x, y, outerRadius, innerRadius, angleOffset, color) {
		var points = 5;
		var verticies = [];
		var angle = angleOffset;
		for(var i = 0; i < points; i++) {
			verticies.push({
				x: Math.cos(angle)*outerRadius + x,
				y: Math.sin(angle)*outerRadius + y,
			});
			angle += Math.PI/points;

			verticies.push({
				x: Math.cos(angle)*innerRadius + x,
				y: Math.sin(angle)*innerRadius + y,
			});
			angle += Math.PI/points;
		}

		return this.makeRanges(verticies, color, 1);
	};

	SunsetAnimation.prototype.createMoon = function(x, y, radius, angleOffset, color) {
		var verticies = [];
		var points = 50;
		var cx = radius/3;
		var cy = radius/3
		for(var i = 0; i < points; i++) {
			// base circle
			var x1 = radius*Math.cos(i/points*Math.PI*2);
			var y1 = radius*Math.sin(i/points*Math.PI*2);
			if(Math.pow(x1-cx, 2) + Math.pow(y1-cy,2) < Math.pow(radius,2)) {
				// in eclipsing circle
				x1 = radius*Math.cos(-i/points*Math.PI*2 - Math.PI/2) + cx;
				y1 = radius*Math.sin(-i/points*Math.PI*2 - Math.PI/2) + cy;
			}
			verticies.push({
				x: x1*Math.cos(angleOffset) - y1*Math.sin(angleOffset) + x,
				y: y1*Math.cos(angleOffset) + x1*Math.sin(angleOffset) + y
			});
		}

		/*
		var _this = this;
		this.gallery.ctx.strokeStyle = '#fff';
		this.gallery.ctx.beginPath();
		this.gallery.ctx.moveTo(0,0);
		verticies.forEach(function(v) {
			_this.gallery.ctx.lineTo(v.x, v.y);
		});
		//this.gallery.ctx.closePath();
		this.gallery.ctx.stroke();
		*/

		return this.makeRanges(verticies, color);
	};

	SunsetAnimation.prototype.makeRanges = function(verticies, color, minRangeLength) {
		if(minRangeLength == null) {
			minRangeLength = 3;
		}
		var minY = Infinity;
		var maxY = -Infinity;
		verticies.forEach(function(v) {
			if(v.y < minY) {
				minY = v.y;
			}
			if(v.y > maxY) {
				maxY = v.y;
			}
		});

		var totalRowHeight = this.rowHeight + this.rowSpacing;
		var _this = this;
		var rows = [];
		var rowCount = Math.ceil((maxY - minY)/totalRowHeight);

		var firstRowIdx = Math.floor(minY/totalRowHeight);
		for(var i = 0; i < rowCount; i++) {
			rows.push({row: firstRowIdx + i, points: []});
		}

		verticies.forEach(function(v1, i) {
			var v2 = verticies[(i+1)%verticies.length];
			var row1Idx = Math.floor(v1.y/totalRowHeight);
			var row2Idx = Math.floor(v2.y/totalRowHeight);

			if(row2Idx < row1Idx) {
				var temp = row1Idx;
				row1Idx = row2Idx;
				row2Idx = temp;

				temp = v1;
				v1 = v2;
				v2 = temp;
			}
			for(var i = 0; i < row2Idx - row1Idx; i++) {
			//for(var i = 0; i < 1; i++) {
				var row = rows[i+(row1Idx-firstRowIdx)];
				var pointX = _this.gallery.helpers.lerp(v1.x, v2.x, i/(row2Idx-row1Idx));
				//var pointX = _this.gallery.helpers.lerp(v1.x, v2.x, 0);//i/(row2Idx-row1Idx));

				//insert point in sorted x order
				var pointIndex = row.points.findIndex(function(r) { return pointX < r;});
				if(pointIndex === -1) {
					pointIndex = row.points.length;
				}
				row.points.splice(pointIndex, 0, pointX);
			}
		});

		// turn points into ranges
		return rows.map(function(r) {
			var ranges = [];
			for(var i = 0; i < r.points.length; i+=2) {
				if(i === r.points.length-1) {
					// ignore single points
					break;
				}

				ranges.push([r.points[i], r.points[i+1]]);
			}
			return {
				row: r.row,
				ranges: ranges,
				color: color
			};
		}).map(function(r) {
			// remove small ranges and gaps
			r.ranges = r.ranges.reduce(function(a, range, i) {
				if(range[1] - range[0] > minRangeLength) {
					if(a.length > 0 && range[0] - a[a.length-1][1] < minRangeLength) {
						//coalese range
						a[a.length-1][1] = range[1];
					}
					else {
						a.push(range);
					}
				}
				return a;
			}, []);
			return r;
		});
	};

	function sigmoid(x, a, c) {
		return (a*2)/(1+Math.exp(-c*x))-a;
	};

	window.AnimationGallery.addAnimation('sunset', SunsetAnimation);
})(window);
