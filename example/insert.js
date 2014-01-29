var mdeps = require('module-deps');
var bpack = require('browser-pack');
var insert = require('../');

var files = [ __dirname + '/files/main.js' ];
mdeps(files, { transform: insert })
    .pipe(bpack({ raw: true }))
    .pipe(process.stdout)
;
