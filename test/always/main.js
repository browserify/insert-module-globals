t.equal(Function('return typeof process')(), 'object');
t.equal(Function('return typeof process.nextTick')(), 'function');
t.equal(Function('return typeof global')(), 'object');
t.equal(Function('return global.xyz')(), 555);
t.equal(Function('return typeof __filename')(), 'string');
t.equal(Function('return typeof __filename')(), 'string');
