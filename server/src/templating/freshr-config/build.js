var Path = require('path');
var Observable = require('rxjs/Rx').Observable;
var Promise = require('bluebird');
var fs = require('fs-extra');

var sass = require('node-sass');

//Tasks start at status 0 and are overwritten if a higher status is set
var TaskStatuses = {
	none: 0,
	success: 1,
	warn: 2,
	error: 3
}

//paths to tasks in the task structure are described by an array of ints
//an empty array means the root task, the first value is the index into rootTask.tasks, the second value is the index into that task's tasks array, and so on
var TaskLogger = function(task, observer, taskPath) {
	this.task = task;
	this.observer = observer;
	this.taskPath = taskPath;
	this.status = TaskStatuses['none'];
	this.logs = [];
	this.running = false;

	function makeSubloggers(t) {
		if(!t.tasks) {
			return [];
		}

		return t.tasks.map(function(st, i) {
			return new TaskLogger(st, observer, taskPath.concat([i]));
		});
	}

	this.subloggers = makeSubloggers(task);
}

var LoggerLevelFunc = function(level, updateStatus) {
	return function(message, data) {
		if(updateStatus && TaskStatuses[level] > this.status) {
			this.status = TaskStatuses[level];
		}

		var log = {level: level, message: message, data: data};
		this.logs.push(log);
		this.observer.next({eType: 'task/log', path: this.taskPath, status: this.status, log: log});
	};
}

TaskLogger.prototype.info = new LoggerLevelFunc('info', false);
TaskLogger.prototype.warn = new LoggerLevelFunc('warn', true);
TaskLogger.prototype.error = new LoggerLevelFunc('error', true);

TaskLogger.prototype.start = function() {
	this.observer.next({eType: 'task/start', path: this.taskPath});
	this.running = true;
};
TaskLogger.prototype.done = function() {
	this.observer.next({eType: 'task/done', path: this.taskPath});
	this.running = false;
};

TaskLogger.prototype.serializeTaskStructure = function() {
	return {
		name: this.task.name,
		status: this.status,
		running: this.running,
		tasks: this.subloggers.map(function(sublogger) { return sublogger.serializeTaskStructure(); })
	};
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
 *
 * @returns {EventEmitter}: emits following events:
 *      - 'start'{SerializedTask}
 *      - 'success'{}
 *      - 'fail'{}
 *      - 'task/start'{{path}}
 *      - 'task/log'{{path, status, log}}
 *      - 'task/done'{{path}}
 */
function buildProject(clientPath, tasks) {
	var srcPath = Path.join(clientPath, 'src');
	var distPath = Path.join(clientPath, 'dist');

	var rootTask = {name: 'Build', tasks: tasks};

	return Observable.create(function(buildEventsObserver) {
		var rootLogger = new TaskLogger(rootTask, buildEventsObserver, []);
		buildEventsObserver.next({eType: 'start', tasks: rootLogger.serializeTaskStructure()});

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
				buildEventsObserver.next({eType: 'success', result: result});
			})
			.catch(function(error) {
				buildEventsObserver.next({eType: 'fail', error: error});
			})
			.finally(function() {
				buildEventsObserver.complete();
			});
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

module.exports = {
	buildProject: buildProject,
	tasks: {
		makeCopySrcToDistTask: makeCopySrcToDistTask,
		makeCompileSassTask: makeCompileSassTask
	}
};
