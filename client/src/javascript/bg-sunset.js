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
		this.gallery.ctx.fillStyle = '#000';
		this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);

		//var rows = this.makeRowsCircle(this.gallery.width/2, this.gallery.height/2, 310, '#f00', '#ff0');
		var circleY = this.gallery.height + this.gallery.height*0.4*Math.cos(t/1000*0.3 + Math.PI/8);
		var rows = this.makeRowsCircle(this.gallery.mouseX, circleY, 310, '#f00', '#ff0');
		var moonY = this.gallery.height*0.4*Math.cos(t/1000*0.3 + Math.PI/8);
		//make moon

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
				var sigmoid = function(x, a, c) {
					return (a*2)/(1+Math.exp(-c*x))-a;
				};
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

	window.AnimationGallery.addAnimation('sunset', SunsetAnimation);
})(window);
