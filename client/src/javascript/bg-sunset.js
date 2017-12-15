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
		var rows = this.makeRowsCircle(this.gallery.mouseX, this.gallery.mouseY, 310, '#f00', '#ff0');

		var _this = this;
		rows.forEach(function(row, i) {
			//var rowHeight = _this.rowHeight + 2*Math.sin(t/1000*Math.PI) + 2*Math.cos(i/rows.length);
			var y = i*(_this.rowHeight+_this.rowSpacing);
			_this.drawRow(y, _this.rowHeight, row);
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
		for(var i = 0; i < this.rowCount; i++) {
			var y = i*(this.rowHeight+this.rowSpacing);
			var yDist = y - cy;
			var xDist = Math.sqrt(radius*radius - yDist*yDist);
			//var bgColor = this.gallery.helpers.rgbStr(Math.floor(this.gallery.helpers.lerp(0, 255, i/this.rowCount)), 0, 0);
			var bgColorHsv = this.gallery.helpers.lerpGradientHsv(bgStops, i/this.rowCount);
			bgColor = this.gallery.helpers.hsvStr(bgColorHsv.h, bgColorHsv.s, bgColorHsv.v);
			if(Math.abs(yDist) < radius) {
				rows.push([
					{x: cx - xDist, color: bgColor},
					{x: cx + xDist, color: fgColor},
					{x: this.gallery.width, color: bgColor}
				]);
			}
			else {
				rows.push([{x: this.gallery.width, color: bgColor}]);
			}
		}
		return rows;
	};

	SunsetAnimation.prototype.drawRow = function(y, height, segments) {
		var _this = this;
		var lastX = 0;
		segments.forEach(function(segment, i) {
			_this.gallery.ctx.fillStyle = segment.color;
			_this.gallery.ctx.fillRect(lastX, y, segment.x - lastX, height);
			lastX = segment.x + _this.segmentSpacing;
		});
	};

	window.AnimationGallery.addAnimation('sunset', SunsetAnimation);
})(window);
