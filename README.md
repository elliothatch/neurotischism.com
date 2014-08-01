neurotischism.com
=================

this is the repository for my website, here if anyone wants to know how i made it, as well as for backup purposes  
pages are generated with jekyll and served using nodejs + express. i also use sass and will be using minifiers and javascript preprocessors and anything else in the future

features
-------
### static comments  
nodejs receives POST requests and adds the comment info to jekyll's _data/ directory. then it runs the custom build script.  
ive also set it up to email me whenever anyone leaves a comment

### fancy javascript
i do a lot of stuff with javascript and a little stuff with css. i have no idea if im doing it the right way but it works on chrome on my desktop.  
i'll try to make it more browser compatible when it's finished

build
-----
build by running `build.sh` and run `nodejs app.js` to serve pages.  
it probably won't work at all because i use values that are specific to my site  

license
-------
the website itself is licensed under the MIT license, but the content on the website is not.
but most of the things i have on it are on github under the MIT license anywayic comments:  

