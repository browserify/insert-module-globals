#!/usr/bin/env node

var browserify = require('browserify');
var cp = require('child_process');
var fs = require('fs');

var b = browserify({
  detectGlobals: false
});
b.require('native-buffer-browserify');

b.bundle()
  .pipe(fs.createWriteStream('buffer.js'))
  .on('close', function () {
    fs.appendFileSync('buffer.js', ';module.exports=require("native-buffer-browserify").Buffer;\n');
  });
