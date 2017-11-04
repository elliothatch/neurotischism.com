var Path = require('path');
var fs = require('fs-extra');
var express = require('express');
var BuildManager = require('./build');
var Ip = require('ip');
var PublicIp = require('public-ip');

/* Constructs a freshr-config instance which has two properties:
 * exoressRouter - an express middleware which accepts a POST to `/` containing JSON of configuration fields that should be updated, then redirects
 * freshrHandler - a Freshr middleware that loads configuration omeptions when visiting `/~config`
 * parameters:
 * options{object}
 */
module.exports = function(options) {
	options = Object.assign({}, options);

	options.socketServer.of('/~config').use(makeSocketHandler(options));

	return {
		expressRouter: makeExpressRouter(options),
		freshrHandler: makeFreshrHandler(options)
		//freshrConfig: makeFreshrConfig(options)
	};

};

//CONFIG FOR THE CONFIG???? 0_0
//function makeFreshrConfig(options) {
//return {};
//}

//Configuration
//configuration is stored as a JSON object--config values are passed to the context as the "config" property
//plugins must be able to add arbitrary data to the config file (int, float, string, array, object). should allow plugins
//to add arbitrary validation code for any given field
//it should be really easy to add static configuration (arbitrary fields like {site: {title, email}}, etc)
//CORE: timezone, date format, tags config, template paths, etc
//TODO: allow arbitrary "sites" paths (useful for plugins)
//TODO: require password to view and save config (add plugin for password-protected pages?)
function makeExpressRouter(options, dbWrap) {
	var router = express.Router();

	router.post('/', function(req, res, next) {
		try {
			//TODO: save config to file, reload config and templates, then redirect to ~config
			res.status(200).send('hi');
		}
		catch(err) {
			next(err);
		}
	});

	return router;
}

function makeFreshrHandler(options, dbWrap) {
	return function(next, context, req, res) {
		var configCategories = [];

		configCategories.push({
			name: 'core',
			fields: [
				{name: 'timezone', dataType: 'string'}
			]
		}, {
			name: 'freshr-comments',
			fields: [{name: 'hello', dataType: 'string'}, {name: 'hi', dataType: 'string'}]
		});

		context.config = {
			categories: configCategories,
			serverLocalIp: Ip.address(),
			serverPort: req.socket.server.address().port
		};
		return next();
	};
}

function makeSocketHandler(options) {
	/*
	var tasks = [
		{ name: 'clean', sync: true, tasks: [
			BuildManager.tasks.makeCleanTask('dist'),
			{ name: 'build', tasks: [
				{name: 'javascript', func: BuildManager.tasks.makeCopySrcToDistTask('javascript', ['config-react.jsx'])},
				{name: 'sass', func: BuildManager.tasks.makeCompileSassTask('sass', 'css', ['main', 'shakespeare', 'config'])},
				BuildManager.tasks.makeCompileReactTask('react', 'javascript', ['config/config-react', 'config/FileExplorer'])
			]}
		]}
	];*/
	
	var tasks = [
		{ name: 'clean', sync: true, tasks: [
			BuildManager.tasks.makeCleanTask('dist'),
			{ name: 'build', tasks: [
				{name: 'javascript', func: BuildManager.tasks.makeCopySrcToDistTask('javascript', ['config/config-react.jsx', 'config/FileExplorer.jsx', 'config/QRComponent.jsx', 'config/TaskDisplay.jsx'])},
				{name: 'sass', func: BuildManager.tasks.makeCompileSassTask('sass', 'css', ['main', 'shakespeare', 'config'])},
				BuildManager.tasks.makeCompileReactRollupTask('react', 'javascript', 'config/config-react', 'FreshrConfig')
			]}
		]}
	];
	
	BuildManager.buildProject(options.clientPath, tasks).filter(function(e) {return e.eType === 'task/log';}).subscribe(function(event) {
		if(event.level === 'error' || event.log.level === 'error') {
			console.log(event);
		}
	});

	return function(socket, next) {
		socket.on('files/src', function(data) {
			socket.emit('files/src', getFileEntry(options.clientPath, 'src'));
		});
		socket.on('build', function(data) {
			BuildManager.buildProject(options.clientPath, tasks).subscribe(function(event) {
				var eType = event.eType;
				delete event.eType;
				socket.emit('build/' + eType, event);
			});
		});
		socket.on('publicip', function(data) {
			PublicIp.v4().then(function(ip) {
				socket.emit('publicip', ip);
			});
		});
		next();
	};
}


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

/**
 * TaskDefintion -- defines a type of task (copy, compile sass)
 *  input/output params should define the minimum files necessary for one execution of the task (e.g. copy only needs one in file and one out file)
 *  The Task engine handles calling the TaskDefintion func mutliple times if multiple files are specified, so that logic doesn't need to be implemented in the TaskDefintion
 *   name{string}
 *   func{function}
 *   inputs{FileSpec[]}
 *   outputs{FileSpec[]}
 */

// eslint-disable-next-line no-unused-vars
var CopyTaskDefintion = {
	name: 'copy',
	//func:
	inputs: [{
		name: 'in',
		type: 'file',
		hint: null
	}],
	outputs: [{
		name: 'out',
		type: 'file',
		hint: null
	}]
};

// eslint-disable-next-line no-unused-vars
var SassTaskDefintion = {
	name: 'sass',
	//func:
	inputs: ['files'],
	outputs: ['file', 'file'] //.css, .css.map
};

// eslint-disable-next-line no-unused-vars
var TemplateTaskDefinition = {
	name: 'sass',
	//func:
	inputs: ['file', 'file'],
	outputs: ['files'] //.css, .css.map
};


/**
 * FileSpec -- specifies allowed types of file/dir as an input/output of a task
 *    name{string}
 *    type{'file' | 'files' | 'dir' | 'dirs'}
 *    hint{string|null}: expected name format. Matches input names for filtering, autogenerates suggested output name
 *       e.g. *.js -- input matches all files with .js extension. output 
 */

/**
 * Task -- instance of a task
 *    definition{string}
 *    sync{boolean}
 *    tasks{Task[]}
 */
