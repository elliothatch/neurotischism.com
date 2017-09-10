var Path = require('path');
var fs = require('fs-extra');
var express = require('express');
var Handlebars = require('handlebars');
var Moment = require('moment-timezone');
var Promise = require('bluebird');

var CustomErrors = require('../util/custom-errors');
var FreshrConfig = require('./freshr-config');

var defaultDateFormat = 'MMMM D, YYYY [at] h:mm a z';
var timezone = 'America/Los_Angeles';
var tagsOrderField = 'page.date';
var tagsDescending = true;

/* options (object):
 *   - clientPath {string}: path to client directory, which should contain site/layouts/partials
 */
module.exports = function(options, middleware) {
	options = Object.assign({}, options);

	var config = FreshrConfig(options);

	var middlewareStack = Array.isArray(middleware) && middleware.slice() || [];
	//default middlewares
	middlewareStack.push(config.freshrHandler);

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

	Handlebars.registerHelper('truncate', function(str, charCount, options) {
		if(str == undefined) {
			return str;
		}

		if(str.length <= charCount) {
			return str;
		}

		return str.substring(0, charCount) + '...';
	});

	Handlebars.registerHelper('toJSON', function(object) {
		return new Handlebars.SafeString(JSON.stringify(object));
	});

	var siteData = loadTemplates(options.clientPath);
	var tagsArray = Object.keys(siteData.tags).map(function(tagName) {
		return {name: tagName, posts: siteData.tags[tagName]};
	});

	tagsArray.sort(function(a,b) {
		return a.name.localeCompare(b.name);
	});

	var router = express.Router();

	router.use('/~config', config.expressRouter);

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

		var requestedFile = findFile(siteData.templates, path);

		if(!requestedFile.file || requestedFile.file.fType !== 'template') {
			return next();
		}

		var context = {
			url: '/' + path,
			backUrl: '/' + path.split('/').slice(0, -1).join('/'),
			tags: tagsArray
		};

		if(requestedFile.directory['posts.json']) {
			context.posts = requestedFile.directory['posts.json'].data.contents.posts;
		}

		processMiddleware(middlewareStack, context, req, res)
			.then(function(context) {
				var html = requestedFile.file.contents(context);
				res.status(200).send(html);
			})
			.catch(function(err) {
				next(err);
			});

		//TODO: load dynamically
		//context.comments = [
		//{isowner: true, author: '[neurotischism', message: 'hello there!', timestamp: Moment().toISOString()},
		//{isowner: false, author: 'sam', message: 'good game', timestamp: Moment().toISOString()}
		//];

	});

	return router;
};

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
	//var templates = {};
	var partialsDir = Path.join(clientPath, 'src', 'partials');
	var pagesDir = Path.join(clientPath, 'src', 'pages');

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
			var contextMatch = templateText.match(/\s*{{#\s*extend-context\s+'([\s\S]*)'}}/m);
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
 * @returns {object}
 *  - templates {object}: maps each file/directory to a file entry
 *  - tags {object}: maps tags to arrays of posts that used that tag
 */
function walkDirectory(dirPath, f, urlPath, isInnerCall) {
	if(!urlPath) {
		urlPath = '';
	}
	var tags = {};
	var dir = fs.readdirSync(dirPath).reduce(function(out, file) {
		var filePath = Path.join(dirPath, file);
		var stats = fs.lstatSync(filePath);
		if(stats.isFile()) {
			out[file] = {type: 'file', data: f(filePath)};
		}
		else if(stats.isDirectory()) {
			var dirData = walkDirectory(filePath, f, [urlPath, file].join('/'), true);
			out[file] = {type: 'dir', contents: dirData.templates};
			//merge tags
			Object.keys(dirData.tags).forEach(function(tagName) {
				if(!tags[tagName]) {
					tags[tagName] = [];
				}

				tags[tagName] = tags[tagName].concat(dirData.tags[tagName]);
			});
		}

		return out;
	}, {});

	// populate posts.json and tags with template contexts
	var posts = dir['posts.json'];
	if(posts) {
		var postsContent = posts.data.contents;

		if(!postsContent.type) {
			postsContent.type = 'template';
		}
		if(postsContent.posts === 'files') {
			postsContent.posts = Object.keys(dir)
				.filter(function(k) { return dir[k].type === 'file' && k !== 'posts.json' && (postsContent.type === 'any' || dir[k].data.fType === postsContent.type);})
				.map(function(k) { return { url: k }; });
		}
		if(postsContent.posts === 'dirs') {
			postsContent.posts = Object.keys(dir)
				.filter(function(k) {
					if(dir[k].type !== 'dir') {
						return false;
					}
					let dirIndex = dir[k].contents['index.html'];
					return dirIndex && dirIndex.type === 'file' && (postsContent.type === 'any' || dirIndex.data.fType === postsContent.type);
				}).map(function(k) { return { url: k}; });
		}

		if(!postsContent.ignore) {
			postsContent.ignore = [];
		}
		
		if(!postsContent.order) {
			postsContent.order = {};
		}

		if(!postsContent.order.field) {
			postsContent.order.field = 'url';
		}

		if(postsContent.order.descending !== false) {
			postsContent.order.descending = true;
		}

		postsContent.posts = postsContent.posts.filter(function(post) {
			return !postsContent.ignore.includes(post.url);
		}).map(function(post) {
			var f = findFile(dir, post.url);
			if(f.file && f.file.fType === 'template') {
				post = Object.assign(Object.assign({}, f.file.context), post);
			}

			post.filename = post.url;
			//convert to absolute url
			post.url = [urlPath, post.url].join('/');
			return post;
		});

		postsContent.posts.sort(function(a, b) {
			var aVal = postsContent.order.field.split('.').reduce(function(o,i) {return o[i];}, a);
			var bVal = postsContent.order.field.split('.').reduce(function(o,i) {return o[i];}, b);

			if(postsContent.order.descending) {
				var temp = aVal;
				aVal = bVal;
				bVal = temp;
			}

			return aVal < bVal ? -1: (aVal > bVal ? 1 : 0);
		});

		//add posts to tags
		postsContent.posts.forEach(function(post) {
			if(post.page && Array.isArray(post.page.tags)) {
				post.page.tags.forEach(function(tag) {
					if(!tags[tag]) {
						tags[tag] = [];
					}
					tags[tag].push(post);
				});
			}
		});

	}

	//sort the tags posts once we're done
	if(!isInnerCall) {
		Object.keys(tags).forEach(function(tagName) {
			tags[tagName].sort(function(a, b) {
				var aVal = tagsOrderField.split('.').reduce(function(o,i) {return o[i];}, a);
				var bVal = tagsOrderField.split('.').reduce(function(o,i) {return o[i];}, b);

				if(tagsDescending) {
					var temp = aVal;
					aVal = bVal;
					bVal = temp;
				}

				return aVal < bVal ? -1: (aVal > bVal ? 1 : 0);
			});
		});
	}
	return {templates: dir, tags: tags};
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
				var indexFileEntry = fileEntry.contents['index.html'];
				if(indexFileEntry && indexFileEntry.type === 'file') {
					currentDir = fileEntry.contents;
					requestedFile = indexFileEntry.data;
				}
			}
		}
	}

	return { file: requestedFile, directory: currentDir};
}

function processMiddleware(stack, context, req, res) {
	
	return new Promise(function(resolve, reject) {
		var stackIndex = -1;
		var next = function(err) {
			if(err) {
				//err should be an error
				return reject(err);
			}

			stackIndex++;
			if(stackIndex >= stack.length) {
				return resolve(context);
			}
			stack[stackIndex](next, context, req, res);
		};

		next();
	});

	//stack.forEach(function(middleware) {
	//middleware(next, context, req, res);
	//});
	//return context;
}

