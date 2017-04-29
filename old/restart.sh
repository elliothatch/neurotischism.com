#!/bin/bash
/usr/local/bin/forever stop /srv/nodeserver/neurotischism/app.js
/usr/local/bin/forever -a -l forever.log -o out.log -e err.log start /srv/nodeserver/neurotischism/app.js
