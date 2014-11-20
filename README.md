neurotischism.com
=================

this is the repository for my website, here if anyone wants to know how i made it, as well as for backup purposes  
pages are generated with jekyll and served using nodejs + express. i also use sass (scss) as a css preprocessor. javascript is minified using uglify-js and css is minified with clean-css.

features
-------
### static comments with jekyll
nodejs receives POST requests and adds the comment info to jekyll's _data/ directory. then it runs the custom build script.  
spam is filtered by using the recaptcha system hosted by google
ive also set it up to email me whenever anyone leaves a comment

### tags with jekyll
any pages with the YAML front matter key `tags` defined will be added to the tags index.html page when jekyll rebuilds the website. mutliple tags can be defined as space delimited list

build
-----
build by running `build.sh` and run `nodejs app.js` to serve pages. the `start.sh` and `stop.sh` scripts run the server using `forever` which can be found in the npm. the app probably won't work unless you change some site-specific values

license
-------
the website/webapp is licensed under the MIT license, but the content on the website is not.
but most of the things i have on it are on github under the MIT license anyway  
