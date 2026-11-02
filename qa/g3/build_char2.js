// G3 (Claude · 2 Nov 2569): build char2.js (what pages load) from char2.src.js (what people read and edit).
// K6 says char2.js <= 30 KiB on disk, not gzipped. The readable source with its comments is bigger, so the shipped file is minified
// with terser (compress + mangle of LOCAL names only: the Char2 API names and every pack / save field name stay as they are).
// usage: NODE_PATH=<dir with terser 5.36.0> node qa/g3/build_char2.js [--check]     --check: exit 1 if char2.js is not the build of char2.src.js
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { minify } = require('terser'); const TV = require('terser/package.json').version;
const root = path.join(__dirname, '..', '..'), src = fs.readFileSync(path.join(root, 'char2.src.js'), 'utf8');
const sha = crypto.createHash('sha256').update(src).digest('hex').slice(0, 16);
(async () => {
  if (TV !== '5.36.0') { console.log('terser ' + TV + ' != 5.36.0 (pinned) -> the bytes would differ'); process.exit(2); }
  const r = await minify(src, { ecma: 2020, compress: { passes: 2 }, mangle: { toplevel: false }, format: { comments: false } });
  const out = '/* char2.js · built from char2.src.js sha256:' + sha + ' by qa/g3/build_char2.js (terser ' + TV + ') · edit char2.src.js, not this file */\n' + r.code + '\n';
  const f = path.join(root, 'char2.js');
  if (process.argv.includes('--check')) { const same = fs.existsSync(f) && fs.readFileSync(f, 'utf8') === out; console.log('char2.js', same ? 'is' : 'is NOT', 'the build of char2.src.js ·', Buffer.byteLength(out), 'B'); process.exit(same ? 0 : 1); }
  fs.writeFileSync(f, out); console.log('char2.js', Buffer.byteLength(out), 'B (source', Buffer.byteLength(src), 'B)');
})();
