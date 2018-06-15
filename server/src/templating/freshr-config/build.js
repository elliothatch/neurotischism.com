const Rx = require('rxjs');
var Path = require('path');
var Promise = require('bluebird');
var fs = require('fs-extra');
var minimatch = require('minimatch');

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


function getFileMatches(fileEntry, pattern) {
	if(fileEntry.type === 'file') {
		if(minimatch(fileEntry.path, pattern)) {
			return [fileEntry];
		}
	}
	else if(fileEntry.type === 'directory') {
		return fileEntry.entries.map(function(entry) {
			return getFileMatches(entry, pattern);
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
function buildProject(clientPath, taskDefinitions, tasks) {
	var rootTask = {name: 'Build', tasks: tasks};
	var fileEntries = {
		name: 'build',
		path: 'build',
		type: 'directory',
		entries: [
			getFileEntry(clientPath, 'src'),
			getFileEntry(clientPath, 'dist')
		]
	};

	return Rx.Observable.create(function(buildEventsObserver) {
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
					return {success: results.filter(function(r) { return !r.success;}).length === 0, data: results};
				});
			} else if(task.definition) {
				var taskDefinition = taskDefinitions[task.definition];
				if(!taskDefinition) {
					throw new Error('Task Definition \'' + task.definition + '\' not found');
				}

				//resolve is to convert non-bluebird promises, so we can use bluebird helpers
				buildPromise = Promise.all(task.files.map(function(f) {
					return Promise.try(() => {
						var inputs = f.inputs && f.inputs.map(function(inF) { return Path.join(clientPath, inF);});
						var outputs = f.outputs && f.outputs.map(function(outF) { return Path.join(clientPath, outF);});
						var options = Object.assign(Object.assign({}, task.options), f.options); //copy the overall options, then overwrite file specific options
						return taskDefinition.func(inputs, outputs, options, logger);
					}).then(function(result) {
						return { success: true, data: result};
					}).catch(function(error) {
						logger.error(error && error.message, error);
						return { success: false, data: error};
					});
				})).then(function(results) {
					return {success: results.filter(function(r) { return !r.success;}).length === 0, data: results};
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

/**
 * TaskDefinition -- defines a type of task (copy, compile sass)
 *  input/output params should define the minimum files necessary for one execution of the task (e.g. copy only needs one in file and one out file)
 *  The Task engine handles calling the TaskDefinition func mutliple times if multiple files are specified, so that logic doesn't need to be implemented in the TaskDefinition
 *   name{string}
 *   func{function}
 *   inputs{FileSpec[]}
 *   outputs{FileSpec[]}
 */

/**
 * FileSpec -- specifies allowed types of file/dir as an input/output of a task
 *    name{string}
 *    type{'file' 'dir'}
 *    count{int | [int, (int)]): number of files/dirs. if an int, specifies exact count, if array it is an inclusive range [min, max], if max is omitted there is no upper limit
 *    hint{string| string[] | null}: expected name format. Matches input names for filtering, autogenerates suggested output name. if array, all hints are applied (only allowed on input)
 *       e.g. '*.js' -- input matches all files with .js extension.
 *
 *       output hints can use the input name as a parameter. anything in '{}' is interpolated, parts of the name can be specified after a pipe (|)
 *       {0}, {1}, ..., {n} : input at array index n
 *       {0 | basename}: input at index 0 without extension
 *       {}: user provided, allows hints for just an extension, prefix, etc (e.g. {}.html)
 */

var CleanTaskDefinition = {
	name: 'clean',
	func: cleanTaskFunc,
	inputs: [{
		name: 'in',
		type: 'dir',
		count: [1],
		hint: null
	}],
	outputs: []
};

function cleanTaskFunc(inputs, outputs, options, logger) {
	logger.info("Removing '" + inputs[0] + "'");
	return fs.remove(inputs[0]);
}

var CopyTaskDefintion = {
	name: 'copy',
	func: copyTaskFunc,
	inputs: [{
		name: 'in',
		type: 'file',
		count: 1,
		hint: null
	}],
	outputs: [{
		name: 'out',
		type: 'file',
		count: 1,
		hint: '{0}'
	}]
};

function copyTaskFunc(inputs, outputs, options, logger) {
	logger.info("Copying '" + inputs[0] + "' to '" + outputs[0] + "'");
	return fs.copy(inputs[0], outputs[0]);
}

var CompileSassTaskDefinition = {
	name: 'sass',
	func: compileSassFunc,
	inputs: [{
		type: 'file',
		count: [1],
		hint: ['*.sass', '*.scss']
	}],
	outputs: [{
		type: 'file',
		count: 1,
		hint: '{0 | basename}.css'
	}, {
		type: 'file',
		count: 1,
		hint: '{0 | basename}.css.map'
	}]
};

function compileSassFunc(inputs, outputs, options, logger) {
	logger.info("Compiling '" + inputs[0] + "' to '" + outputs[0] + "' and '" + outputs[1] + "'");
	return Promise.promisify(sass.render)({
		file: inputs[0],
		outFile: outputs[0],
		sourceMap: true
	}).then(function(result) {
		return Promise.all([
			fs.outputFile(outputs[0], result.css),
			fs.outputFile(outputs[1], result.map)
		]);
	});
}

var CompileReactRollupTaskDefinition = {
	name: 'react-rollup',
	func: compileReactRollupFunc,
	inputs: [{
		type: 'file',
		count: [1],
		hint: ['*.js', '*.jsx']
	}],
	outputs: [{
		type: 'file',
		count: 1,
		hint: '{0 | basename}.js'
	}]
};

function compileReactRollupFunc(inputs, outputs, options, logger) {
	var inputOptions = {
		input: inputs[0],
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
					'node_modules/can-promise/**',
					'node_modules/window-or-global/**',
				]
			}),
			rollupNodeGlobals(),
			rollupNodeBuiltins(),
		]
	};
	var outputOptions = {
		file: outputs[0],
		format: 'iife',
		name: options.bundleName,
		sourcemap: true
	};

	logger.info("Compiling '" + inputs[0] + "' to '" + outputs[0] + "'");
	return rollup.rollup(inputOptions).then(function(bundle) {
		return bundle.write(outputOptions);
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

/*
 * entry:
 *   name{string}
 *   path{string}
 *   type{'file' | 'directory'}
 *   entries{entry[]}
 */

/*
 * Get the file entry for the specified path. If it is a directory recursively gets the directory contents. base path is not included in the 'path' property
 * @param basePath {string}: path to the base directory
 * @param relativePath {string}: relative path to the target file/directory
 * @returns {entry}
 */
function getFileEntry(basePath, relativePath) {
	var fullPath = Path.join(basePath, relativePath);
	var stats = fs.lstatSync(fullPath);
	if(stats.isFile()) {
		return {
			name: Path.basename(relativePath),
			path: relativePath.replace(/\\/g, '/'),
			type: 'file',
			entries: null
		};
	}
	else if(stats.isDirectory()) {
		return {
			name: Path.basename(relativePath),
			path: relativePath.replace(/\\/g, '/'),
			type: 'directory',
			entries: fs.readdirSync(fullPath).map(function(filename) {
				return getFileEntry(basePath, Path.join(relativePath, filename));
			})
		};
	}
}


module.exports = {
	buildProject: buildProject,
	getFileEntry: getFileEntry,
	tasks: {
		makeCleanTask: makeCleanTask,
		makeCopySrcToDistTask: makeCopySrcToDistTask,
		makeCompileSassTask: makeCompileSassTask,
		makeCompileReactTask: makeCompileReactTask,
		makeCompileReactRollupTask: makeCompileReactRollupTask
	},
	taskDefinitions: {
		CopyTaskDefintion: CopyTaskDefintion,
		CompileSassTaskDefinition: CompileSassTaskDefinition,
		CleanTaskDefinition: CleanTaskDefinition,
		CompileReactRollupTaskDefinition: CompileReactRollupTaskDefinition,
	}
};
