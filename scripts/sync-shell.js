#!/usr/bin/env node
/* Development-only: stamps the shared static shell (skip link, head assets, nav, scripts) into public pages.
   Output is committed static HTML; nothing here runs in production. Idempotent via marker comments.
   Usage: node scripts/sync-shell.js */
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

const PAGES = {
  'index.html': {},
  'start-here.html': { current: '/start-here.html' },
  'faq.html': { current: '/faq.html', learn: true },
  'about.html': { current: '/about.html' },
  'reviews.html': { current: '/reviews.html' },
  'contact.html': { current: '/contact.html' },
  'california-guide.html': { current: '/california-guide.html', learn: true },
  'energy-costs.html': { current: '/energy-costs.html', learn: true },
  'pge-service-area.html': { current: '/pge-service-area.html', learn: true }
};
const DESCRIPTIONS = {
  'reviews.html': 'Read real homeowner experiences from California families who worked with Solar With Philip to understand solar, batteries and their options.',
  'contact.html': 'Talk with Philip about home solar, batteries or a quote you already have. Call, text, email or request an advisor-first review from Solar With Philip.'
};
const LEARN = [
  ['/california-guide.html', 'California Solar Guide'],
  ['/energy-costs.html', 'Future of Energy Costs'],
  ['/faq.html', 'FAQ'],
  ['/pge-service-area.html', 'PG&amp;E Service Area'],
  ['/energy-strategies.html', 'Build My Solar Plan']
];

function link(href, label, cur, cls) {
  const c = cur === href ? ' aria-current="page"' : '';
  return `<a class="swp-shell__link${cls ? ' ' + cls : ''}" href="${href}"${c}>${label}</a>`;
}
function navHtml(cfg) {
  const cur = cfg.current;
  const subs = LEARN.map(([h, l]) => `<li>${link(h, l, cur)}</li>`).join('');
  return [
    '<header class="swp-shell">',
    '<nav class="swp-shell__inner" aria-label="Primary">',
    '<a class="swp-shell__brand" href="/">Solar With <span>Philip</span></a>',
    '<button class="swp-shell__toggle" type="button" aria-label="Open navigation menu" aria-expanded="false" aria-controls="swp-shell-menu"><span></span><span></span><span></span></button>',
    '<ul class="swp-shell__list" id="swp-shell-menu">',
    `<li>${link('/proposal.html', 'Compare My Quote', cur)}</li>`,
    `<li class="swp-shell__has-sub"><button class="swp-shell__sub-toggle${cfg.learn ? ' is-current' : ''}" type="button" aria-expanded="false" aria-controls="swp-shell-learn">Learn <span aria-hidden="true">&#9662;</span></button><ul class="swp-shell__sub" id="swp-shell-learn">${subs}</ul></li>`,
    `<li>${link('/reviews.html', 'Reviews', cur)}</li>`,
    `<li>${link('/about.html', 'About', cur)}</li>`,
    `<li>${link('/start-here.html', 'Get Started', cur, 'swp-shell__cta')}</li>`,
    '</ul>',
    '</nav>',
    '</header>'
  ].join('');
}
const HEAD = [
  '<link rel="icon" href="/favicon.ico" sizes="any">',
  '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">',
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
  '<script>document.documentElement.classList.add("swp-js")</script>',
  '<link rel="stylesheet" href="/assets/css/swp-tokens.css">',
  '<link rel="stylesheet" href="/assets/css/swp-base.css">'
].join('');
const SHELL_CSS = '<link rel="stylesheet" href="/assets/css/swp-shell.css">';
const SCRIPTS = ['swp-analytics', 'swp-attribution', 'swp-links', 'swp-nav']
  .map(n => `<script src="/assets/js/${n}.js"></script>`).join('');

const mark = (n, body) => `<!-- swp-shell:${n}:start -->${body}<!-- swp-shell:${n}:end -->`;
const markRe = n => new RegExp(`<!-- swp-shell:${n}:start -->[\\s\\S]*?<!-- swp-shell:${n}:end -->`);

function stamp(file, cfg) {
  const p = path.join(root, file);
  let t = fs.readFileSync(p, 'utf8');
  const eol = t.includes('\r\n') ? '\r\n' : '\n';
  t = t.replace(/\r\n/g, '\n');

  if (DESCRIPTIONS[file] && !/<meta[^>]+name="description"/i.test(t)) {
    t = t.replace(/<\/title>/, `</title>\n<meta name="description" content="${DESCRIPTIONS[file]}">`);
  }
  t = t.replace(markRe('head'), '').replace(markRe('css'), '');
  t = t.replace(/<link[^>]*href="assets\/css\/site-nav\.css"[^>]*>\s*/g, '');
  t = t.replace(/<\/title>/, m => `${m}${mark('head', HEAD)}`);
  t = t.replace(/<\/head>/, m => `${mark('css', SHELL_CSS)}\n${m}`);

  const bodyShell = mark('nav', `<a class="swp-skip" href="#main">Skip to main content</a>${navHtml(cfg)}`);
  if (markRe('nav').test(t)) t = t.replace(markRe('nav'), () => bodyShell);
  else t = t.replace(/<nav class="swp-site-nav">[\s\S]*?<\/nav>/, () => bodyShell);

  t = t.replace(markRe('js'), '');
  t = t.replace(/<script[^>]*src="assets\/js\/site-nav\.js"[^>]*><\/script>\s*/g, '');
  t = t.replace(/<\/body>/, m => `${mark('js', SCRIPTS)}\n${m}`);

  if (/<main[\s>]/.test(t)) {
    t = t.replace(/<main(?![^>]*\bid=)([^>]*)>/, '<main id="main"$1>');
  } else {
    t = t.replace(/(<!-- swp-shell:nav:end -->)/, '$1\n<main id="main">');
    t = t.replace(/(\s*)(<footer[\s>])/, '$1</main>$1$2');
  }
  fs.writeFileSync(p, t.replace(/\n/g, eol));
}

for (const [file, cfg] of Object.entries(PAGES)) {
  stamp(file, cfg);
  console.log('stamped', file);
}
