#!/bin/bash
sass source/sass/main.scss source/css-pretty/main.css
sass source/sass/shakespeare.scss source/css-pretty/shakespeare.css
cleancss -o source/css/main.css source/css-pretty/main.css
cleancss -o source/css/shakespeare.css source/css-pretty/shakespeare.css
uglifyjs source/javascript-pretty/default.js > source/javascript/default.js
uglifyjs source/javascript-pretty/shakespeare.js > source/javascript/shakespeare.js
jekyll build
