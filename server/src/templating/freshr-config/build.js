var Path = require('path');
var Observable = require('rxjs/Rx').Observable;
var Promise = require('bluebird');
var fs = require('fs-extra');

var sass = require('node-sass');
var babel = require('babel-core');

var rollup = require('rollup');
var rollupBabel = require('rollup-plugin-babel');
var rollupCjs = require('rollup-plugin-commonjs');
var rollupResolve = require('rollup-plugin-node-resolve');
var rollupNodeBuiltins = require('rollup-plugin-node-builtins');
var rollupNodeGlobals = require('rollup-plugin-node-globals');

//Tasks start at status 0 and are overwritten if a higher status is set
var TaskStatuses = {
	none: 0,
	success: 1,
	warn: 2,
	error: 3
};

//paths to tasks in the task structure are described by an array of ints
//an empty array means the root task, the first value is the index into rootTask.tasks, the second value is the index into that task's tasks array, and so on
var TaskLogger = function(task, observer, taskPath) {
	this.task = task;
	this.observer = observer;
	this.taskPath = taskPath;
	this.status = TaskStatuses.none;
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
};

var LoggerLevelFunc = function(level, updateStatus) {
	return function(message, data) {
		if(updateStatus && TaskStatuses[level] > this.status) {
			this.status = TaskStatuses[level];
		}

		var log = {level: level, message: message, data: data};
		this.logs.push(log);
		this.observer.next({eType: 'task/log', path: this.taskPath, status: this.status, log: log});
	};
};

TaskLogger.prototype.info = new LoggerLevelFunc('info', false);
TaskLogger.prototype.warn = new LoggerLevelFunc('warn', true);
TaskLogger.prototype.error = new LoggerLevelFunc('error', true);

TaskLogger.prototype.start = function() {
	this.observer.next({eType: 'task/start', path: this.taskPath});
	this.running = true;
};
TaskLogger.prototype.done = function() {
	if(this.status < TaskStatuses['success']) {
		this.status = TaskStatuses['success'];
	}
	this.running = false;
	this.observer.next({eType: 'task/done', path: this.taskPath, status: this.status});
};

TaskLogger.prototype.serializeTaskStructure = function() {
	return {
		name: this.task.name,
		status: this.status,
		running: this.running,
		tasks: this.subloggers.map(function(sublogger) { return sublogger.serializeTaskStructure(); })
	};
};


function makeCleanTask(dir) {
	return {
		name: 'clean',
		func: function(clientPath, logger) {
			var fullPath = Path.join(clientPath, dir);
			logger.info("Removing '" + fullPath + "'");
			return fs.remove(fullPath);
		}
	};
}

/**
 * @param dir{string} - subdirectory path
 */
function makeCopySrcToDistTask(dir, ignoreFiles) {
	return function(clientPath, logger) {
		var srcPath = Path.join(clientPath, 'src', dir);
		var distPath = Path.join(clientPath, 'dist', dir);

		logger.info("Copying '" + srcPath + "' to '" + distPath + "'");
		return fs.copy(srcPath, distPath, {
			filter: function(src, dest) { return !ignoreFiles.includes(src.slice(srcPath.length+1).replace(/\\/g, '/'));}
		});
	};
}

/**
 * @param srcName{string}
 * @param distName{string}
 */
function makeCompileSassTask(srcName, distName, files) {
	return function(clientPath, logger) {
		var srcPath = Path.join(clientPath, 'src', srcName);
		var distPath = Path.join(clientPath, 'dist', distName);

		return Promise.all(files.map(function(f) {
			var inFile = Path.join(srcPath, f + '.scss');
			var outFile = Path.join(distPath, f + '.css');
			logger.info("Compiling '" + inFile + "' to '" + outFile + "'");
			return Promise.promisify(sass.render)({
				file: inFile,
				outFile: outFile,
				sourceMap: true
			}).then(function(result) {
				return Promise.all([
					fs.outputFile(outFile, result.css),
					fs.outputFile(outFile + '.map', result.map)
				]);
			});
		}));
	};
}

//actually returns a task instead of a func--fix names of other funcs (well make them actually tasks instead of just funcs)
function makeCompileReactTask(name, dir, files) {
	return {
		name: name,
		tasks: [
			{name: 'babel', func: function(clientPath, logger) {
				var srcPath = Path.join(clientPath, 'src', dir);
				var distPath = Path.join(clientPath, 'dist', dir);

				return Promise.all(files.map(function(f) {
					var inFile = Path.join(srcPath, f + '.jsx');
					var outFile = Path.join(distPath, f + '.js');
					logger.info("Compiling '" + inFile + "' to '" + outFile + "'");
					return Promise.promisify(babel.transformFile)(inFile, {
						babelrc: false,
						filename: f,
						presets: ['react', 'es2015'],
						sourceMaps: true,
						sourceRoot: clientPath
					}).then(function(result) {
						return Promise.all([
							fs.outputFile(outFile, result.code),
							fs.outputFile(outFile + '.map', result.map)
						]);
					});
				}));
			}}
		]
	};
}

function makeCompileReactRollupTask(name, dir, file, bundleName) {
	return {
		name: name,
		tasks: [
			{name: 'rollup react', func: function(clientPath, logger) {
				var srcPath = Path.join(clientPath, 'src', dir);
				var distPath = Path.join(clientPath, 'dist', dir);
				var inFile = Path.join(srcPath, file + '.jsx');
				var outFile = Path.join(distPath, file + '.js');

				var inputOptions = {
					input: inFile,
					plugins: [
						rollupBabel({
							exclude: 'node_modules/**',
							babelrc: false,
							presets: [
								'react',
								['es2015', {'modules': false}]
							],
							plugins: ['external-helpers']
						}),
						rollupResolve({
							browser: true,
							main: true,
							extensions: ['.js', '.jsx']
						}),
						rollupCjs({
							exclude: [
								'node_modules/process-es6/**',
								'node_modules/buffer-es6/**',
							],
							include: [

								'node_modules/dijkstrajs/**',
								'node_modules/qrcode/**',

								'node_modules/create-react-class/**',
								'node_modules/fbjs/**',
								'node_modules/object-assign/**',
								'node_modules/react/**',
								'node_modules/react-dom/**',
								'node_modules/prop-types/**',
							]
						}),
						rollupNodeGlobals(),
						rollupNodeBuiltins(),
					]
				};
				var outputOptions = {
					file: outFile,
					format: 'iife',
					name: bundleName,
					sourcemap: true
				};
				
				logger.info("Compiling '" + inFile + "' to '" + outFile + "'");
				return rollup.rollup(inputOptions).then(function(bundle) {
					return bundle.write(outputOptions);
				});
			}}
		]
	};
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
				buildPromise = buildPromise.then(function(results) {
					return {success: results.filter(function(r) { return !r.success;}).length > 0, data: results};
				});
			} else if(task.func) {
				//resolve is to convert non-bluebird promises, so we can use bluebird helpers
				buildPromise = Promise.resolve(task.func(clientPath, logger))
					.then(function(result) {
						return { success: true, data: result};
					}).catch(function(error) {
						logger.error(error && error.message, error);
						return { success: false, data: error};
					});
			} else {
				logger.warn('Task "' + task.name + '" has no build function or subtasks');
				buildPromise = Promise.resolve({success: true, data: null});
			}

			return buildPromise.finally(function() {
				logger.done();
			});
		}

		buildTask(rootTask, rootLogger)
			.then(function(result) {
				if(result.success) {
					buildEventsObserver.next({eType: 'success', result: result});
				} else {
					buildEventsObserver.next({eType: 'fail', result: result});
				}
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
		makeCleanTask: makeCleanTask,
		makeCopySrcToDistTask: makeCopySrcToDistTask,
		makeCompileSassTask: makeCompileSassTask,
		makeCompileReactTask: makeCompileReactTask,
		makeCompileReactRollupTask: makeCompileReactRollupTask
	}
};
