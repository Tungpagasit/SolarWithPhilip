// Build step for Netlify branch deploys and deploy previews ONLY.
// Writes a _headers file so non-production deploys send X-Robots-Tag: noindex, nofollow.
// Production builds never run this (it is wired only to [context.branch-deploy] and
// [context.deploy-preview]) and it refuses to run if CONTEXT is production.
const fs = require('fs');
const path = require('path');

const context = process.env.CONTEXT || '';
if (context === 'production' || !context) {
  console.log('preview-noindex: skipped (context "' + context + '")');
  process.exit(0);
}

const file = path.join(__dirname, '..', '_headers');
const rule = '/*\n  X-Robots-Tag: noindex, nofollow\n';
const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') + '\n' : '';
fs.writeFileSync(file, existing + rule);
console.log('preview-noindex: wrote _headers for context ' + context);
