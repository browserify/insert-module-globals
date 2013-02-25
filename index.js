var parseScope = require('lexical-scope');
var browserResolve = require('browser-resolve');
var commondir = require('commondir');
var through = require('through');
var mdeps = require('module-deps');

var path = require('path');
var processModulePath = require.resolve('process/browser.js');

module.exports = function (files, opts) {
    if (!Array.isArray(files)) {
        opts = files;
        files = [];
    }
    if (!opts) opts = {};
    if (!files) files = [];
    var resolver = opts.resolve || browserResolve;
    
    var basedir = opts.basedir || (files.length
        ? commondir(files.map(function (x) {
            return path.resolve(path.dirname(x));
        }))
        : '/'
    );
    var resolvedProcess = false, hardPause = false;
    
    var tr = through(write, end);
    
    function write (row) {
        if(hardPause) throw new Error('this should never happen')
        var tr = this;
        if (!opts.always
            && !/\bprocess\b/.test(row.source)
            && !/\bglobal\b/.test(row.source)
            && !/\b__filename\b/.test(row.source)
            && !/\b__dirname\b/.test(row.source)
        ) return tr.queue(row);
        
        var scope = opts.always
            ? { globals: {
                implicit: [ 'process', 'global', '__filename', '__dirname' ]
            } }
            : parseScope(row.source)
        ;
        var globals = {};
        
        if (scope.globals.implicit.indexOf('process') >= 0) {
            if (!resolvedProcess) {
                hardPause = true;
                tr.pause();
                
                var d = mdeps(processModulePath, { resolve: resolver });
                d.on('data', function (r) {
                    r.entry = false;
                    tr.queue(r);
                });
                d.on('end', function () {
                    hardPause = false;
                    tr.resume();
                });
            }
            
            resolvedProcess = true;
            row.deps.__browserify_process = processModulePath;
            globals.process = 'require("__browserify_process")';
        }
        if (scope.globals.implicit.indexOf('global') >= 0) {
            globals.global = 'window';
        }
        if (scope.globals.implicit.indexOf('__filename') >= 0) {
            var file = '/' + path.relative(basedir, row.id);
            globals.__filename = JSON.stringify(file);
        }
        if (scope.globals.implicit.indexOf('__dirname') >= 0) {
            var dir = path.dirname('/' + path.relative(basedir, row.id));
            globals.__dirname = JSON.stringify(dir);
        }
        
        row.source = closeOver(globals, row.source);
        tr.queue(row);
    }
    
    function end () {
        this.ended = true;
        this.queue(null);
    }

    var resume = tr.resume;

    tr.resume = function () {
        if(hardPause) return;
        resume.call(tr);
    }

    return tr
};

function closeOver (globals, src) {
    var keys = Object.keys(globals);
    return '(function(' + keys + '){' + src + '\n})('
        + keys.map(function (key) { return globals[key] }).join(',') + ')'
    ;
}
