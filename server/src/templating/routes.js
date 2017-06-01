var Path = require('path');
var fs = require('fs');
var Url = require('url');
var express = require('express');
var Handlebars = require('handlebars');


/* options (object):
 *   - clientPath {string}: path to client directory, which should contain site/layouts/partials
 */
module.exports = function(options) {
	options = Object.assign({}, options);

	Handlebars.registerHelper('create-context', function(context, options) {
		return options.fn(Object.assign(Object.assign({}, this), JSON.parse(context)));
	});
	var templates = loadTemplates(options.clientPath);

	var router = express.Router();

	router.get('/*', function(req, res, next) {
		var path = req.path;

		// strip trailing slash
		if(path.substr(-1) === '/') {
			path = path.substr(0, path.length-1);
		}

		// strip leading slash
		if(path.substr(0,1) === '/') {
			path = path.substr(1, path.length-1);
		}

		//find matching file
		var pathParts = path.split('/');
		var currentDir = templates;
		var template = null;
		if(path === '') {
			var indexEntry = currentDir['index.html'];
			if(indexEntry && indexEntry.type === 'file') {
				template = indexEntry.contents;
			}
		}

		for(var i = 0; i < pathParts.length; i++) {
			var fileEntry = currentDir[pathParts[i]];
			if(!fileEntry) {
				break;
			}
			if(i < pathParts.length - 1) {
				if(fileEntry.type !== 'dir') {
					break;
				}
				currentDir = fileEntry.contents;
			}
			else {
				if(fileEntry.type === 'file') {
					template = fileEntry.contents;
				}
				else if(fileEntry.type === 'dir') {
					var indexEntry = fileEntry.contents['index.html'];
					if(indexEntry && indexEntry.type === 'file') {
						currentDir = fileEntry.contents;
						template = indexEntry.contents;
					}
				}
			}
		}
		if(!template) {
			res.status(404).send('File not found'); //TODO: fancy 404 page
			return;
		}

		var context = {
			backUrl: '/' + pathParts.slice(0, -1).join('/')
			//posts: Object.keys(currentDir).filter(function(k) { return currentDir[k].type === 'dir' && currentDir[k].contents['index.html']; }).map(function(dirName) { return { url: dirName};})
		};
		var html = template(context);
		res.status(200).send(html);
	});

	return router;
}
/*
 * Registers all partials, using their relative path from "partials" directory as the name,
 * then compiles all templates in "pages" directory
 * clientPath {string}: path to client directory, which should contain partials and pages directories
 * @returns {object}: represents the pages directory tree, file.contents are compiled handlebars templates
 */
function loadTemplates(clientPath) {
	var templates = {};
	var partialsDir = Path.join(clientPath, 'partials');
	var pagesDir = Path.join(clientPath, 'pages')

	// register all partials
	walkDirectory(partialsDir, function(path) {
		var name = path.substring(partialsDir.length+1).replace('\\', '/');
		Handlebars.registerPartial(name, fs.readFileSync(path, 'utf8'));
	});

	return walkDirectory(pagesDir, function(path) {
		return Handlebars.compile(fs.readFileSync(path, 'utf8'));
	});
}

function walkDirectory(dirPath, f) {
	return fs.readdirSync(dirPath).reduce(function(out, file) {
		var filePath = Path.join(dirPath, file);
		var stats = fs.lstatSync(filePath);
		if(stats.isFile()) {
			out[file] = { type: 'file', contents: f(filePath)};
		}
		else if(stats.isDirectory()) {
			out[file] = {type: 'dir', contents: walkDirectory(filePath, f)};
		}

		return out;
	}, {});
}
