(function(window) {

	var MazeAnimation = function(gallery) {
		this.gallery = gallery;
		this.mode = Math.floor(Math.random()*2); //[0,1]
		this.countWeights = [1, 1/100];
		this.particleHoverStepCounts  = [3, 200];

		this.particleColors = [
			{ hue: 1, hueOffset: 0, saturation: 0.8, value: 0.8 },
			{ hue: 0.1 + (1-0.1)*Math.random(), hueOffset: Math.random(), saturation: 0.8, value: 0.8 }
		];

	};

	MazeAnimation.prototype.init = function() {
		//var gridSize = parseInt(window.localStorage.getItem("bg-maze:gridSize"));
		//if(!gridSize) {
			//gridSize = 20;
		//}
		var gridSize = 3;
		var startTime = performance.now();
		//this.gallery.canvas.style.background = '#555';
		this.gallery.ctx.fillStyle = '#555';
		this.gallery.ctx.fillRect(0, 0, this.gallery.width, this.gallery.height);

		this.particleColor = this.particleColors[1];
		this.gridSize = gridSize;
		this.mazeWidth = this.gallery.width/this.gridSize;
		this.mazeHeight = this.gallery.height/this.gridSize;
		this.maze = generateMaze(this.mazeWidth, this.mazeHeight);
		this.particles = [];
		this.countWeight = this.countWeights[this.mode];
		this.particleHoverStepCount  = this.particleHoverStepCounts[this.mode];
		this.particlesCount = Math.floor(this.countWeight * (this.gallery.width+this.gallery.height));
		this.particleHueSpeed = 0.001;
		for(var i = 0; i < this.particlesCount; i++) {
			this.particles.push({
				direction: Math.floor(Math.random()*4),
				x: Math.floor(Math.random()*this.mazeWidth),
				y: Math.floor(Math.random()*this.mazeHeight),
				hue: Math.random()
			});
		}

		//draw maze
		for(i = 0; i < this.mazeWidth; i++) {
			for(var j = 0; j < this.mazeHeight; j++) {
				this.gallery.ctx.strokeStyle = this.gallery.helpers.rgbStr(0,0,0);
				this.gallery.ctx.strokeWidth = 1;
				this.gallery.ctx.beginPath();
				if(!this.maze[i][j].paths[0]) {
					this.gallery.ctx.moveTo(i*this.gridSize, (j+1)*this.gridSize);
					this.gallery.ctx.lineTo((i+1)*this.gridSize, (j+1)*this.gridSize);
				}
				if(!this.maze[i][j].paths[1]) {
					this.gallery.ctx.moveTo((i+1)*this.gridSize, j*this.gridSize);
					this.gallery.ctx.lineTo((i+1)*this.gridSize, (j+1)*this.gridSize);
				}
				if(!this.maze[i][j].paths[2]) {
					this.gallery.ctx.moveTo(i*this.gridSize, j*this.gridSize);
					this.gallery.ctx.lineTo((i+1)*this.gridSize, j*this.gridSize);
				}
				if(!this.maze[i][j].paths[3]) {
					this.gallery.ctx.moveTo(i*this.gridSize, j*this.gridSize);
					this.gallery.ctx.lineTo(i*this.gridSize, (j+1)*this.gridSize);
				}
				this.gallery.ctx.stroke();
			}
		}

		/*
		var endTime = performance.now();
		var loadTime = endTime - startTime;
		console.log(gridSize, loadTime);
		var loadMinThreshold = 300;
		var loadMaxThreshold = 500;
		if(loadTime < loadMinThreshold) {
			gridSize -= 1;
		} else if(loadTime > loadMaxThreshold) {
			gridSize += 1;
		}

		window.localStorage.setItem('bg-maze:gridSize', gridSize);
		*/
	};


	MazeAnimation.prototype.draw = function(t, deltaT)
	{
		var _this = this;
		this.particles.forEach(function(p) {

			var stepDrawCount = 1;
			//on hover
			//mode 0: step several times after draw
			//mode 1: step several times and draw each step
			if(_this.gallery.linkHovered && _this.mode === 1) {
				stepDrawCount = _this.particleHoverStepCount;
			}
			for(var i = 0; i < stepDrawCount; i++) {
				_this.gallery.ctx.fillStyle = _this.gallery.helpers.HSVtoRGBStr(p.hue * _this.particleColor.hue + _this.particleColor.hueOffset, _this.particleColor.saturation, _this.particleColor.value);
				_this.gallery.ctx.strokeStyle = _this.gallery.helpers.HSVtoRGBStr(p.hue * _this.particleColor.hue + _this.particleColor.hueOffset, _this.particleColor.saturation, _this.particleColor.value);
				_this.gallery.ctx.beginPath();
				_this.gallery.ctx.rect(p.x * _this.gridSize, p.y * _this.gridSize, _this.gridSize, _this.gridSize);
				_this.gallery.ctx.fill();
				/*
				if(!linkHovered) {
					ctx.rect(p.x * gridSize, p.y * gridSize, gridSize, gridSize);
					ctx.fill();
				}
				else {
					//draw a little starburst insead of rectangle
					var lineCount = 3;
					for(var i  = 0; i < lineCount; i++) {
						ctx.moveTo(p.x*gridSize + 5*gridSize*Math.cos(i*Math.PI*2/lineCount),
									p.y*gridSize + 5*gridSize*Math.sin(i*Math.PI*2/lineCount));
						ctx.lineTo(p.x*gridSize + 5*gridSize*Math.cos(i*Math.PI*2/lineCount + Math.PI),
									p.y*gridSize + 5*gridSize*Math.sin(i*Math.PI*2/lineCount + Math.PI));
					}
					ctx.stroke();
				}
				*/

				var stepCount = 1;
				if(_this.gallery.linkHovered && _this.mode === 0) {
					stepCount = _this.particleHoverStepCount;
				}

				for(var j = 0; j < stepCount; j++) {
					//move
					//randomly pick available direction, not including backwards
					var dirs = [0,1,2,3];
					dirs.splice((p.direction+2)%4,1);
					dirs = shuffle(dirs.filter(function(idx) { return _this.maze[p.x][p.y].paths[idx]; }));
					if(dirs.length === 0) {
						//no more directions, go back
						p.direction = (p.direction+2)%4;
					}
					else {
						p.direction = dirs[0];
					}
					var n = goDirection(p.x, p.y, p.direction);
					p.x = n.x;
					p.y = n.y;
					p.hue = (p.hue + _this.particleHueSpeed) % 1;
				}
			}
		});

	};

	//maze is 2d array of [u,r,d,l, visited] bools, true if no wall
	function generateMaze(width, height) {
		var maze = [];
		for(var i = 0; i < width; i++) {
			maze.push([]);
			for(var j = 0; j < height; j++) {
				maze[i].push({ paths: [false, false, false, false], visited: false });
			}
		}

		/*
		function carve(x, y) {
			maze[x][y].visited = true;
			var directions = shuffle([0,1,2,3]);
	//var directions = [0,1,2,3];
			directions.forEach(function(direction) {
	//0: up, 1: right, 2: down, 3: left
				var n = goDirection(x,y, direction);
				if(n.x >= 0 && n.x < width && n.y >= 0 && n.y < height && !maze[n.x][n.y].visited) {
	//open this wall and the opposite wall of the other cell
					maze[x][y].paths[direction] = true;
					maze[n.x][n.y].paths[(direction+2) % 4] = true;
					carve(n.x,n.y);
				}
			});
		}
		carve(0,0);
		*/

		var stack = [];
		//0: up, 1: right, 2: down, 3: left
		//add 4 starting directions
		shuffle([0,1,2,3]).forEach(function(dir) {
			stack.push({x: 0, y: 0, dir: dir});
		});

		while(stack.length > 0) {
			var current = stack.pop();
			var x = current.x;
			var y = current.y;
			var direction = current.dir;

			maze[x][y].visited = true;

			var n = goDirection(x,y, direction);
			if(n.x >= 0 && n.x < width && n.y >= 0 && n.y < height && !maze[n.x][n.y].visited) {
				//open this wall and the opposite wall of the other cell
				maze[x][y].paths[direction] = true;
				maze[n.x][n.y].paths[(direction+2) % 4] = true;

				//add new cell dirs to stack
				shuffle([0,1,2,3]).forEach(function(dir) {
					stack.push({x: n.x, y: n.y, dir: dir});
				});
			}
		}

		return maze;
	}

	function goDirection(x,y,direction) {
		return {
			x: x + (direction%2 * (direction%2 - 2*Math.floor(direction/2))),
			y: y + ((direction+1)%2 * ((direction+1)%2 - 2*Math.floor(direction/2)))
		};
	}

	function shuffle(array) {
		let counter = array.length;

		// While there are elements in the array
		while (counter > 0) {
			// Pick a random index
			let index = Math.floor(Math.random() * counter);

			// Decrease counter by 1
			counter--;

			// And swap the last element with it
			let temp = array[counter];
			array[counter] = array[index];
			array[index] = temp;
		}

		return array;
	}

	window.AnimationGallery.addAnimation('maze', MazeAnimation);
	//window.AnimationGallery.startAnimation(0);
})(window);
