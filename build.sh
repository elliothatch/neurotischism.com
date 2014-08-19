#!/bin/bash
sass source/sass/main.scss source/css-pretty/main.css
cleancss -o source/css/main.css source/css-pretty/main.css
uglifyjs source/javascript-pretty/default.js > source/javascript/default.js
jekyll build
