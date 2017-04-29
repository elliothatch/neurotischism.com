var Path = require('path');
var fs = require('fs');
var Url = require('url');
var express = require('express');
var mustache = require('mustache');


/* options (object):
 *   - clientPath {string}: path to client directory, which should contain site/layouts/partials
 */
module.exports = function(options) {
	options = Object.assign({}, options);

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
		var currentDir = templates.site;
		var fileContents = null;
		if(path === '') {
			var indexEntry = currentDir['index.html'];
			if(indexEntry && indexEntry.type === 'file') {
				fileContents = indexEntry.contents;
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
					fileContents = fileEntry.contents;
				}
				else if(fileEntry.type === 'dir') {
					var indexEntry = fileEntry.contents['index.html'];
					if(indexEntry && indexEntry.type === 'file') {
						fileContents = indexEntry.contents;
					}
				}
			}
		}

		if(!fileContents) {
			res.status(404).send('File not found'); //TODO: fancy 404 page
			return;
		}

		//render the page
		var renderProperties = {
			site: { title: 'neurotischism' } //TODO: pull this from config
		};

		renderProperties.layout = renderLayout(renderProperties);

		var html = mustache.render(fileContents, renderProperties, templates.partials);
		res.status(200).send(html);
	});

	return router;

	function renderLayout(renderProperties) {
		return function() {
			return function(text, render) {
				var options = Object.assign({}, renderProperties, JSON.parse(text));
				options.content = mustache.render(options.content, options, templates.partials);
				console.log(options.content);
				return mustache.render(templates.layouts[options.layout], options, templates.partials);
			};
		};
	}
}


/*
 * clientPath {string}: path to client directory, which should contain site/layouts/partials
 * @returns {object}:
 *  - layouts {object}: maps layout name->layout file contents {string}
 *  - partials {object}: maps partial name->partial file contents {string}
 *  - site {object}: recursively maps site file path
 */
function loadTemplates(clientPath) {
	var templates = {};
	var layoutsDir = Path.join(clientPath, 'layouts');
	var partialsDir = Path.join(clientPath, 'partials')
	var siteDir = Path.join(clientPath, 'site')
	//try {
		templates.layouts = fs.readdirSync(layoutsDir).reduce(function(layouts, file) {
			layouts[file] = fs.readFileSync(Path.join(layoutsDir, file), 'utf8');
			return layouts;
		}, {});

		templates.partials = fs.readdirSync(partialsDir).reduce(function(partials, file) {
			partials[file] = fs.readFileSync(Path.join(partialsDir, file), 'utf8');
			return partials;
		}, {});

		templates.site = walkDirectory(siteDir, function(path) {
			return fs.readFileSync(path, 'utf8');
		});
	//}

	return templates;
}

function walkDirectory(dirPath, f) {
	return fs.readdirSync(dirPath).reduce(function(out, file) {
		var filePath = Path.join(dirPath, file)
		var stats = fs.lstatSync(filePath);
		if(stats.isFile()) {
			out[file] = { type: 'file', contents: f(filePath)};
		}
		else if(stats.isDirectory()) {
			out[file] = {type: 'dir', contents: walkDirectory(filePath)};
		}

		return out;
	}, {});
}
