var Promise = require('bluebird');
var express = require('express');
var BuildManager = require('./build');

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

}

//CONFIG FOR THE CONFIG???? 0_0
function makeFreshrConfig(options) {
	return {};
}

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
		});

		context.config = { categories: configCategories };
		return next();
	};
}

function makeSocketHandler(options) {
	var buildEmitter = BuildManager.buildProject(options.clientPath, [
		{ name: 'clean', sync: true, tasks: [
			BuildManager.tasks.makeCleanTask('dist'),
			{ name: 'build', tasks: [
				{name: 'javascript', func: BuildManager.tasks.makeCopySrcToDistTask('javascript', ['config-react.jsx'])},
				{name: 'sass', func: BuildManager.tasks.makeCompileSassTask('sass', 'css', ['main', 'shakespeare', 'config'])},
				BuildManager.tasks.makeCompileReactTask('react', 'javascript', ['config-react'])
			]}
		]}
	]).subscribe(function(event) {
		console.log(event);
	});
	return function(socket, next) {
		socket.on('build', function(data) {
			console.log('build', data);
			BuildManager.buildProject(options.clientPath, [
				{ name: 'clean', sync: true, tasks: [
					BuildManager.tasks.makeCleanTask('dist'),
					{ name: 'build', tasks: [
						{name: 'javascript', func: BuildManager.tasks.makeCopySrcToDistTask('javascript', ['config-react.jsx'])},
						{name: 'sass', func: BuildManager.tasks.makeCompileSassTask('sass', 'css', ['main', 'shakespeare', 'config'])},
						BuildManager.tasks.makeCompileReactTask('react', 'javascript', ['config-react'])
					]}
				]}
			]).subscribe(function(event) {
				var eType = event.eType;
				delete event.eType;
				socket.emit('build/' + eType, event);
			});
		});
		next();
	};
}
