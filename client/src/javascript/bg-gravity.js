(function(window) {

	/**
	 * bodies in a gravity simulation
	 */
	var GravityAnimation = function(gallery) {
		this.gallery = gallery;
	};

	GravityAnimation.prototype.init = function() {
		this.gallery.ctx.fillStyle = '#000';
		this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);

		var sideCount = Math.floor(Math.random()*11);
		if(sideCount > 8) {
			sideCount = 198;
		}
		this.bodies = this.createBodiesPolygon(sideCount+2,5,3,200);

		this.wells = [{
			position: {
				x: 0,
				y: 0,
			},
			velocity: {
				x: 0,
				y: 0
			},
			mass: 500,
			radius: 0,
			color: '#fff',
			trail: 'none'
		}];

		this.bodies.concat(this.wells).forEach(function(body) {
			body.lastPosition = Object.assign({}, body.position);
		});

		//var aspectRatio = this.gallery.width / this.gallery.height;

		this.simulation = {
			bodies: this.bodies,
			wells: this.wells,
			scale: this.gallery.height/30,
			timeScale: 1/1000,
			debug: false,
			bodyGravity: true,
			/*edges: {
				x: [-15*aspectRatio,15*aspectRatio],
				y: [-15,15]
			},*/
		};
	};

	GravityAnimation.prototype.draw = function(t, deltaT)
	{
		//this.gallery.ctx.fillStyle = '#000';
		//this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);
		
		this.wells[0].position.x = (this.gallery.mouseX - this.gallery.width/2) / this.simulation.scale;
		this.wells[0].position.y = (this.gallery.mouseY - this.gallery.height/2) / this.simulation.scale;
		this.physicsStep(this.simulation, deltaT);

		this.drawSimulation(this.simulation, deltaT);
	};

	GravityAnimation.prototype.physicsStep = function(simulation, deltaT) {
		var dt = deltaT * simulation.timeScale;
		// calc new accelerations
		simulation.bodies.forEach(function(body) {
			var wells = simulation.wells;
			if(simulation.bodyGravity) {
				wells = wells.concat(simulation.bodies);
			}

			body.acceleration.x = 0;
			body.acceleration.y = 0;
			wells.forEach(function(well) {
				if(body === well) {
					return;
				}
				var acceleration = calcGravityAcceleration(body, well);
				body.acceleration.x += acceleration.x*dt;
				body.acceleration.y += acceleration.y*dt;
			});
		});

		// update velocities and positions
		simulation.bodies.forEach(function(body) {
			Object.assign(body.lastPosition, body.position);
			body.velocity.x += body.acceleration.x*dt;
			body.velocity.y += body.acceleration.y*dt;

			if(simulation.edges) {
				var x2 = body.position.x + body.velocity.x*dt;
				var y2 = body.position.y + body.velocity.y*dt;

				if(x2 <= simulation.edges.x[0] || x2 >= simulation.edges.x[1]) {
					body.velocity.x = -body.velocity.x;
				}

				if(y2 <= simulation.edges.y[0] || y2 >= simulation.edges.y[1]) {
					body.velocity.y = -body.velocity.y;
				}
			}

			body.position.x += body.velocity.x*dt;
			body.position.y += body.velocity.y*dt;
		});
	};

	GravityAnimation.prototype.drawSimulation = function(simulation, deltaT) {
		var _this = this;
		var ctx = this.gallery.ctx;
		var entities = simulation.bodies.concat(simulation.wells);
		entities.forEach(function(entity) {
			//translate position to screen space
			var x = entity.position.x * simulation.scale + _this.gallery.width/2;
			var y = entity.position.y * simulation.scale + _this.gallery.height/2;
			var lastX = entity.lastPosition.x * simulation.scale + _this.gallery.width/2;
			var lastY = entity.lastPosition.y * simulation.scale + _this.gallery.height/2;
			var vx = entity.velocity.x * simulation.scale * 0.1;
			var vy = entity.velocity.y * simulation.scale * 0.1;
			var colorStr = typeof entity.color === 'string' ? entity.color : _this.gallery.helpers.HSVtoRGBStr(entity.color);
			ctx.beginPath();
			ctx.fillStyle = colorStr;
			ctx.arc(x, y, entity.radius, 0, 2*Math.PI);
			ctx.closePath();
			ctx.fill();

			if(entity.trail !== 'none') {
				if(typeof entity.color !== 'string') {
					//hsv has fancy effects
					if(entity.trail === 'pulse') {
						colorStr = _this.gallery.helpers.HSVtoRGBStr(entity.color.h, entity.color.s, entity.color.v*Math.abs(Math.sin(entity.trailOptions.t)));
						entity.trailOptions.t += entity.trailOptions.rate*deltaT;
					}
					if(entity.trail === 'rainbow') {
						colorStr = _this.gallery.helpers.HSVtoRGBStr((entity.color.h+entity.trailOptions.t) % 1, entity.color.s, entity.color.v);
						entity.trailOptions.t += entity.trailOptions.rate*deltaT;
					}
				}
				var thickness = entity.thickness != null ? entity.thickness : 1;
				ctx.beginPath();
				ctx.lineWidth = thickness;
				ctx.strokeStyle = colorStr;
				ctx.moveTo(lastX, lastY);
				ctx.lineTo(x, y);
				ctx.closePath();
				ctx.stroke();
			}

			if(simulation.debug) {
				ctx.beginPath();
				ctx.lineWidth = 1;
				ctx.strokeStyle = '#f00';
				ctx.moveTo(x, y);
				ctx.lineTo(x+vx, y+vy);
				ctx.closePath();
				ctx.stroke();
			}
		});
	};

	GravityAnimation.prototype.createBodiesPolygon = function(sides, size, velocity, count) {
		var bodies = [];
		for(var i = 0; i < sides; i++) {
			var angle1 = (i/sides)*2*Math.PI;
			var p1 = {
				x: size*Math.cos(angle1),
				y: size*Math.sin(angle1),
			};
			var angle2 = ((i+1)/sides)*2*Math.PI;
			var p2 = {
				x: size*Math.cos(angle2),
				y: size*Math.sin(angle2),
			};
			var angleBisector = ((i+0.5)/sides)*2*Math.PI;
			var normal = {
				x: Math.cos(angleBisector+Math.PI/2),
				y: Math.sin(angleBisector+Math.PI/2),
			};

			var edgeBodyCount = count/sides;
			for(var j = 0; j < edgeBodyCount; j++) {

				var edgeT = j/edgeBodyCount;
				bodies.push({
					position: {
						x: this.gallery.helpers.lerp(p1.x, p2.x, edgeT),
						y: this.gallery.helpers.lerp(p1.y, p2.y, edgeT),
					},
					velocity: {
						x: velocity*normal.x,
						y: velocity*normal.y,
					},
					acceleration: {
						x: 0,
						y: 0
					},
					mass: 10/*size*/,
					radius: 0,
					color: {
						h: (i*edgeBodyCount+j)/count,
						s: 0.8,
						v: 0.9
					},
					//trail: 'pulse',
					//trail: 'rainbow',
					trailOptions: {
						// pulse
						//t: Math.random() * 2 * Math.PI,
						//rate: 1/100,
						//rainbow
						t: 0,
						rate: 1/10000
					}
					//thickness: size/10
				});
			}
		}

		return bodies;
	};


	function calcGravityAcceleration(b1, b2) {
		var dx = b1.position.x - b2.position.x;
		var dy = b1.position.y - b2.position.y;
		var distanceSquare = Math.pow(dx, 2) + Math.pow(dy, 2);
		var force = 0;
		if(distanceSquare > 0.1) {
			force = b2.mass / distanceSquare;
		}
		var direction = Math.atan2(dy, dx);
		return {
			x: -force * Math.cos(direction),
			y: -force * Math.sin(direction),
		};
	}

	window.AnimationGallery.addAnimation('gravity', GravityAnimation);
})(window);
