(function(window) {

	var RadialAnimation = function(gallery) {
		this.gallery = gallery;
	};

	RadialAnimation.prototype.init = function() {
		this.gallery.ctx.fillStyle = '#000';
		this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);

		this.pendulumOffset = 0.1*this.gallery.height;
		this.pendulumLength = 0.8*this.gallery.height + this.pendulumOffset;
		this.pendulumPeriod = 1/3;
		this.pendulumAmplitude = Math.PI/6;
	};

	RadialAnimation.prototype.draw = function(t, deltaT)
	{
		this.gallery.ctx.fillStyle = 'white';
		this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);
        const period = 60000;
        const theta = t/period / 2*Math.PI;
        this.drawOverlay(theta, 2*Math.PI/(60*7), 7, 400);
	};



	RadialAnimation.prototype.drawOverlay = function(theta, minWindowTheta, frameCount, radius) {
		var center = {
			x: this.gallery.width / 2,
            y: this.gallery.height / 2,
		};

        var minLoopTheta = minWindowTheta*frameCount;
        var loops = Math.floor(2*Math.PI/minLoopTheta);

        var loopTheta = 2*Math.PI/loops;
        var windowTheta = loopTheta/frameCount;

        // draw background
        for(var i = 0; i < frameCount; i++) {
            const frameInnerRadius = i*(radius/frameCount);
            const frameOuterRadius = (i+1)*(radius/frameCount);
            for(var j = 0; j < loops; j++) {
                const currentTheta = j*loopTheta + i*windowTheta;
                const nextTheta = j*loopTheta + (i+1)*windowTheta;
                // this.gallery.ctx.lineWidth = 15;//radius/frameCount/2; // TODO: calculate better
                this.gallery.ctx.fillStyle = 'red';
                this.gallery.ctx.beginPath();
                this.gallery.ctx.moveTo(frameInnerRadius*Math.cos(currentTheta)+center.x, frameInnerRadius*Math.sin(currentTheta)+center.y);
                this.gallery.ctx.lineTo(frameOuterRadius*Math.cos(currentTheta)+center.x, frameOuterRadius*Math.sin(currentTheta)+center.y);
                this.gallery.ctx.lineTo(frameOuterRadius*Math.cos(nextTheta)+center.x, frameOuterRadius*Math.sin(nextTheta)+center.y);
                this.gallery.ctx.lineTo(frameInnerRadius*Math.cos(nextTheta)+center.x, frameInnerRadius*Math.sin(nextTheta)+center.y);

                // not sure why this offset of 1 degree is needed for these to line up...
                // this.gallery.ctx.arc(center.x, center.y, frameRadius, currentTheta + Math.PI/360, currentTheta + windowTheta);
                // this.gallery.ctx.arc(center.x, center.y, frameRadius, currentTheta, currentTheta + windowTheta);
                this.gallery.ctx.closePath();
                // this.gallery.ctx.stroke();
                this.gallery.ctx.fill();
            }
        }

        // debug
        // for(var currentTheta = 0; currentTheta < Math.PI*2; currentTheta += windowTheta) {
        //     // const currentTheta = i*loopTheta;
        //     this.gallery.ctx.lineWidth = 2;
        //     this.gallery.ctx.strokeStyle = 'black';
        //     this.gallery.ctx.beginPath();
        //     this.gallery.ctx.moveTo(center.x, center.y); // looks pretty cool without this
        //     this.gallery.ctx.lineTo(radius*Math.cos(currentTheta)+center.x, radius*Math.sin(currentTheta)+center.y);
        //     this.gallery.ctx.closePath();
        //     this.gallery.ctx.stroke();
        // }

        // draw overlay
        for(var i = 0; i < loops; i++) {
            const currentTheta = i*loopTheta + theta;
            this.gallery.ctx.fillStyle = 'black';
            this.gallery.ctx.beginPath();
            this.gallery.ctx.moveTo(center.x, center.y); // looks pretty cool without this
            this.gallery.ctx.arc(center.x, center.y, radius, currentTheta + windowTheta, (i+1)*loopTheta + theta);
            this.gallery.ctx.closePath();
            this.gallery.ctx.fill();
        }
	};

	window.AnimationGallery.addAnimation('radial', RadialAnimation);
})(window);
