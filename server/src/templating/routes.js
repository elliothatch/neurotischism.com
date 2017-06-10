var Path = require('path');
var fs = require('fs');
var Url = require('url');
var express = require('express');
var Handlebars = require('handlebars');
var Moment = require('moment-timezone');

var CustomErrors = require('../util/custom-errors');

var defaultDateFormat = 'MMMM D, YYYY [at] h:mm a z';
var timezone = 'America/Los_Angeles';

/* options (object):
 *   - clientPath {string}: path to client directory, which should contain site/layouts/partials
 */
module.exports = function(options) {
	options = Object.assign({}, options);

	Handlebars.registerHelper('extend-context', function(context, options) {
		return options.fn(Object.assign(Object.assign({}, this), JSON.parse(context)));
	});

	Handlebars.registerHelper('eq', function(lhs, rhs) {
		return lhs == rhs;
	});

	Handlebars.registerHelper('contains', function(str, target) {
		return (typeof str === 'string') && (typeof target === 'string')
		 && str.includes(target);
	});

	Handlebars.registerHelper('downcase', function(str) {
		return str.toLowerCase();
	});

	Handlebars.registerHelper('date', function(dateStr, formatStr, options) {
		return Moment(dateStr).tz(timezone).format(formatStr || defaultDateFormat);
	});

	Handlebars.registerHelper('time-tag', function(contents, dateStr, options) {
		return new Handlebars.SafeString('<time datetime="' + Moment(dateStr).toISOString() + '">' + contents + '</time>');
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

		var requestedFile = findFile(templates, path);

		if(!requestedFile.file || requestedFile.file.fType !== 'template') {
			res.status(404).send('File not found'); //TODO: fancy 404 page
			return;
		}

		var context = {
			backUrl: '/' + path.split('/').slice(0, -1).join('/')
		};

		if(requestedFile.directory['posts.json']) {
			context.posts = requestedFile.directory['posts.json'].data.contents.posts;
		}

		//TODO: load dynamically
		context.comments = [
			{isowner: true, author: '[neurotischism', message: 'hello there!', timestamp: Moment().toISOString()},
			{isowner: false, author: 'sam', message: 'good game', timestamp: Moment().toISOString()}
		];

		var html = requestedFile.file.contents(context);
		res.status(200).send(html);
	});

	return router;
}
/*
 * Registers all partials, using their relative path from "partials" directory as the name,
 * then compiles all templates in "pages" directory
 *
 * You can include a 'posts.json' file in any 'pages' directory. This file lets you specify a list of files that should be added to the "posts" context for any template in the
 * directory. This context is an array of post entries, which contain outermost 'extend-context' context, so you can use the title of files in a post listing, for example.
 * The contents of 'posts.json' be JSON of the form { posts: [{path, ...optional fields to override the post context}] | 'files' | 'dirs' }
 * If posts is the string 'files' all templates in the directory are included, 'dirs' all index.html of subdirs in the directory are included
 * clientPath {string}: path to client directory, which should contain partials and pages directories
 * @returns {object}: represents the pages directory tree, file.contents are compiled handlebars templates
 */
function loadTemplates(clientPath) {
	var templates = {};
	var partialsDir = Path.join(clientPath, 'src', 'partials');
	var pagesDir = Path.join(clientPath, 'src', 'pages')

	// register all partials
	walkDirectory(partialsDir, function(path) {
		var name = path.substring(partialsDir.length+1).replace('\\', '/');
		Handlebars.registerPartial(name, fs.readFileSync(path, 'utf8'));
	});

	return walkDirectory(pagesDir, function(path) {
		try {
			if(Path.basename(path) === 'posts.json') {
				return {fType: 'posts', contents: JSON.parse(fs.readFileSync(path, 'utf8'))};
			}

			if(Path.extname(path) !== '.html') {
				return {fType: 'unknown'};
			}

			var templateText = fs.readFileSync(path, 'utf8');
			var template = Handlebars.compile(templateText);
			//execute each template on an empty context to test for syntax errors
			template();

			//if the first text in the template extends the context, parse it
			var context = null;
			var contextMatch = templateText.match(/\s*{{#\s*extend\-context\s+'([\s\S]*)'}}/m);
			if(contextMatch) {
				context = JSON.parse(contextMatch[1]);
			}
			return {fType: 'template', contents: template, context: context};
		}
		catch(e) {
			var err = new CustomErrors.TemplateLoadError('Failed to load template', path, e);
			console.error(err.message);
			throw err;
		}
	});
}

/*
 * executes f for every file in dirPath, returning an object representing the file tree
 * @param dirPath {string}: target path
 * @param f {string => {fType: 'template' | 'posts', contents: string | object}}: function that takes an absolute path to a file and returns an object with the fType and contents of the file
 */
function walkDirectory(dirPath, f, urlPath) {
	if(!urlPath) {
		urlPath = '';
	}
	var dir = fs.readdirSync(dirPath).reduce(function(out, file) {
		var filePath = Path.join(dirPath, file);
		var stats = fs.lstatSync(filePath);
		if(stats.isFile()) {
			out[file] = {type: 'file', data: f(filePath)};
		}
		else if(stats.isDirectory()) {
			out[file] = {type: 'dir', contents: walkDirectory(filePath, f, [urlPath, file].join('/'))};
		}

		return out;
	}, {});

	// populate posts.json with template contexts
	var posts = dir['posts.json'];
	if(posts) {
		var postsContent = posts.data.contents;
		if(postsContent.posts === 'files') {
			postsContent.posts = Object.keys(dir)
				.filter(function(k) { return dir[k].type === 'file' && dir[k].data.fType === 'template';})
				.map(function(k) { return { path: k }; });
		}
		if(postsContent.posts === 'dirs') {
			postsContent.posts = Object.keys(dir)
				.filter(function(k) {
					if(dir[k].type !== 'dir') {
						return false;
					}
					let dirIndex = dir[k].contents['index.html'];
					return dirIndex && dirIndex.type === 'file' && dirIndex.data.fType === 'template';
				}).map(function(k) { return { path: k}; });
		}

		if(!postsContent.ignore) {
			postsContent.ignore = [];
		}
		
		if(!postsContent.order) {
			postsContent.order = {}
		}

		if(!postsContent.order.field) {
			postsContent.order.field = 'path';
		}

		if(postsContent.order.descending !== false) {
			postsContent.order.descending = true;
		}

		postsContent.posts = postsContent.posts.filter(function(post) {
			return !postsContent.ignore.includes(post.path);
		}).map(function(post) {
			var f = findFile(dir, post.path);
			if(f.file && f.file.fType === 'template') {
				var finalPost = Object.assign(Object.assign({}, f.file.context), post);
				//convert to absolute path
				finalPost.path = [urlPath, finalPost.path].join('/');
				return finalPost;
			}
			return post;
		});

		postsContent.posts.sort(function(a, b) {
			//no field, sort by path
			var aVal = postsContent.order.field.split('.').reduce(function(o,i) {return o[i];}, a);
			var bVal = postsContent.order.field.split('.').reduce(function(o,i) {return o[i];}, b);

			if(postsContent.order.descending) {
				var temp = aVal;
				aVal = bVal;
				bVal = temp;
			}

			return aVal < bVal ? -1: (aVal > bVal ? 1 : 0);
		});
	}
	return dir;
}

/* Navigates a template object to find a specified file
 * @param templates {object}: template object
 * @param path {string}: relative path
 * @returns {object}: {f: the requested file, null if not found, dir: dir the file was in}
 */
function findFile(templates, path) {
	var pathParts = path.split('/');
	var currentDir = templates;
	var requestedFile = null;
	if(path === '') {
		var indexEntry = currentDir['index.html'];
		if(indexEntry && indexEntry.type === 'file') {
			requestedFile = indexEntry.data;
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
				requestedFile = fileEntry.data;
			}
			else if(fileEntry.type === 'dir') {
				var indexEntry = fileEntry.contents['index.html'];
				if(indexEntry && indexEntry.type === 'file') {
					currentDir = fileEntry.contents;
					requestedFile = indexEntry.data;
				}
			}
		}
	}

	return { file: requestedFile, directory: currentDir};
}
