var Promise = require('bluebird');
var Path = require('path');
var fs = require('fs-extra');

var sass = require('node-sass');

//Tasks start at status 0 and are overwritten if a higher status is set
var TaskStatuses = {
	none: 0,
	success: 1,
	warn: 2,
	error: 3
}

var TaskLogger = function(task) {
	this.task = task;
	this.status = TaskStatuses['none'];
	this.logs = [];
	this.running = false;

	function makeSubloggers(t) {
		if(!t.tasks) {
			return [];
		}

		return t.tasks.map(function(st) {
			return new TaskLogger(st);
		});
	}

	this.subloggers = makeSubloggers(task);
}

var LoggerLevelFunc = function(level, updateStatus) {
	return function(message, data) {
		if(updateStatus && TaskStatuses[level] > this.status) {
			this.status = TaskStatuses[level];
		}

		console.log(level + ": " + this.task.name + ": " + message);
		this.logs.push({level: level, message: message, data: data});
	};
}

TaskLogger.prototype.info = new LoggerLevelFunc('info', false);
TaskLogger.prototype.warn = new LoggerLevelFunc('warn', true);
TaskLogger.prototype.error = new LoggerLevelFunc('error', true);

TaskLogger.prototype.start = function() {
	console.log('Start: ' + this.task.name);
	this.running = true;
};
TaskLogger.prototype.done = function() {
	console.log('Done: ' + this.task.name);
	this.running = false;
};

/**
 * @param dir{string} - subdirectory path
 */
function makeCopySrcToDistTask(dir) {
	return function(clientPath, logger) {
		var srcPath = Path.join(clientPath, 'src', dir);
		var distPath = Path.join(clientPath, 'dist', dir);

		logger.info("Removing '" + distPath + "'");
		return fs.remove(distPath).then(function() {
			logger.info("Copying '" + srcPath + "' to '" + distPath + "'");
			return fs.copy(srcPath, distPath);
		});
	}
}
/**
 * @param srcName{string}
 * @param distName{string}
 */
function makeCompileSassTask(srcName, distName, files) {
	return function(clientPath, logger) {
		var srcPath = Path.join(clientPath, 'src', srcName);
		var distPath = Path.join(clientPath, 'dist', distName);

		logger.info("Removing '" + distPath + "'");
		return fs.remove(distPath).then(function() {
			return Promise.all(files.map(function(f) {
				var outFile = Path.join(distPath, f + '.css');
				return Promise.promisify(sass.render)({
					file: Path.join(srcPath, f + '.scss'),
					outFile: outFile,
					sourceMap: true
				}).then(function(result) {
					return Promise.all([
						fs.outputFile(outFile, result.css),
						fs.outputFile(outFile + '.map', result.map)
					]);
				});
			}));
			logger.info("Compiling '" + srcPath + "' to '" + distPath + "'");
			return fs.copy(srcPath, distPath);
		});
	}
}

/*
 * Builds the project
 * @param clientPath{string}: path to client directory
 * @param tasks{object[]}: array of build tasks. All tasks should be paralellizable, but tasks can have sub-tasks that are performed in sequence
 *      - name{string}: name of the build step
 *      - func{Promise<> function(taskLogger)}
 *      OR
 *      - tasks{tasks[]}: subtasks
 *      - sync{boolean}: subtasks should be executed in synchronously
 */
function buildProject(clientPath, tasks) {
	var srcPath = Path.join(clientPath, 'src');
	var distPath = Path.join(clientPath, 'dist');

	var rootTask = {name: 'All tasks', tasks: tasks};

	var rootLogger = new TaskLogger(rootTask);

	//TODO: make this wait for all tasks to finish, even if some were rejected
	//TODO: standard error log for rejected promises
	function buildTask(task, logger) {
		logger.start();
		var buildPromise = null;
		if(task.tasks && task.tasks.length > 0) {
			if(task.sync) {
				buildPromise = Promise.mapSeries(task.tasks, function(t,i) {
					return buildTask(t, logger.subloggers[i]);
				});
			} else {
				buildPromise = Promise.all(task.tasks.map(function(t,i) {
					return buildTask(t, logger.subloggers[i]);
				}));
			}
		} else if(task.func) {
			//resolve is to convert non-bluebird promises, so we can use bluebird helpers
			buildPromise = Promise.resolve(task.func(clientPath, logger));
		} else {
			console.warn('Task "' + task.name + '" has no build function or subtasks');
			buildPromise = Promise.resolve();
		}

		return buildPromise.finally(function() {
			logger.done();
		});
	}

	buildTask(rootTask, rootLogger)
		.then(function(result) {
			console.log('build successful: ' + result);
		})
		.catch(function(error) {
			console.error('Build failed: ' + error);
		});
}

	/*
	var buildResults = buildProject(options.clientPath, [
		{name: 'javascript', sync: true, tasks: [
			//{name: 'minify', func: function(logger) {logger.info('minifying'); return Promise.reject();}},
				{name: 'minify', func: function(logger) {logger.info('minifying'); return Promise.resolve();}},
				{name: 'concat', func: function(logger) {logger.warn('concat warn'); return Promise.resolve();}}
		]},
		{name: 'sass', func: function(logger) {logger.info('sassin'); return Promise.resolve();}},
		{name: 'copy a bunch', tasks: [
			{name: 'copy 1', func: function(logger) {logger.info('copy 1 going'); return Promise.resolve();}},
			{name: 'copy recursive', tasks: [
				{name: 'copy r1', func: function(logger) {logger.info('copy r1 going'); return Promise.resolve();}},
				{name: 'copy double recursive', tasks: [
					{name: 'copy rr1', func: function(logger) {logger.info('copy rr1 going'); return Promise.resolve();}},
					{name: 'copy rr2', func: function(logger) {logger.info('copy rr2 going'); return Promise.resolve();}},
				]},
			]},
			{name: 'copy 2', func: function(logger) {return Promise.delay(1000).then(function(){logger.info('copy 2 going'); return Promise.resolve();})}}
		]}
	]);
	*/
