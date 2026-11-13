#!/usr/bin/env node
/* Phase 2A static regression harness. Node only, no dependencies.
   Usage: node scripts/check-site.js [baseRef=Upgrade]
   Exits 1 on any failure. */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const root = path.resolve(__dirname, '..');
const baseRef = process.argv[2] || 'Upgrade';
const GA = 'G-4QNK224PTM';
const results = [];
const ok = (name, pass, detail) => results.push({ name, pass, detail: detail || '' });
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const exists = f => fs.existsSync(path.join(root, f));
const count = (s, re) => (s.match(re) || []).length;

const SHELL_PAGES = ['index', 'start-here', 'faq', 'about', 'reviews', 'contact', 'california-guide', 'energy-costs', 'pge-service-area'].map(p => p + '.html');
const ALL_PAGES = [...SHELL_PAGES, 'proposal.html', 'energy-strategies.html', 'pge-landing-v1.html', 'pge-homeowners/index.html', 'landing/index.html'];

// 1. Internal links and assets (static HTML files in the public pages)
function resolveRef(from, ref) {
  ref = ref.split('#')[0].split('?')[0];
  if (!ref) return null;
  const p = ref.startsWith('/') ? ref.slice(1) : path.posix.join(path.posix.dirname(from), ref);
  const f = p === '' || p.endsWith('/') ? p + 'index.html' : p;
  return f;
}
const brokenLinks = [];
for (const page of ALL_PAGES) {
  const t = read(page);
  for (const m of t.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const r = m[1];
    if (/^(https?:|mailto:|tel:|sms:|data:|javascript:|#|\/\/)/.test(r)) continue;
    const f = resolveRef(page, r);
    if (f && !exists(f)) brokenLinks.push(`${page} -> ${r}`);
  }
}
ok('internal links/assets resolve (public pages)', brokenLinks.length === 0, brokenLinks.join('; '));

// 2. Per-page SEO / a11y structure
for (const page of SHELL_PAGES) {
  const t = read(page);
  const issues = [];
  if (count(t, /<title>[^<]*\S[^<]*<\/title>/g) !== 1) issues.push('title');
  if (!/<meta[^>]+name="description"[^>]+content="[^"]{40,}"/i.test(t) && !/<meta[^>]+content="[^"]{40,}"[^>]+name="description"/i.test(t)) issues.push('description');
  if (count(t, /<link[^>]+rel="canonical"/g) !== 1) issues.push('canonical');
  if (count(t, /<h1[\s>]/g) !== 1) issues.push('h1 count=' + count(t, /<h1[\s>]/g));
  if (count(t, /<main\b[^>]*\bid="main"/g) !== 1) issues.push('main#main');
  if (count(t, /<a class="swp-skip" href="#main"/g) !== 1) issues.push('skip link');
  if (count(t, /<nav[^>]+aria-label="Primary"/g) !== 1) issues.push('labelled nav');
  if (/swp-site-nav|site-nav\.(js|css)/.test(t)) issues.push('old nav remnants');
  if (!/rel="icon"/.test(t) || !/rel="apple-touch-icon"/.test(t)) issues.push('favicon refs');
  if (count(t, /<a class="swp-shell__link[^"]*" href="[^"]+"/g) < 9) issues.push('nav anchors');
  if (/<nav[^>]*>[\s\S]*?data-p=/.test(t.slice(0, t.indexOf('</header>')))) issues.push('data-p in nav');
  ok(`${page}: structure`, issues.length === 0, issues.join(', '));
}

// 3. GA4 and OpenAI Pixel exactly once on each tracked page
for (const page of [...SHELL_PAGES, 'proposal.html', 'energy-strategies.html']) {
  const t = read(page);
  ok(`${page}: GA4 once`, count(t, new RegExp(`googletagmanager\\.com/gtag/js\\?id=${GA}`, 'g')) === 1 && count(t, new RegExp(`gtag\\('config', '${GA}'\\)`, 'g')) === 1);
  ok(`${page}: OpenAI pixel once`, count(t, /\/assets\/js\/oaiq\.js/g) === 1);
}

// 4. Protected paths unchanged relative to baseRef
function git(args) { return cp.execFileSync(process.env.GIT_EXE || 'git', args, { cwd: root, encoding: 'utf8' }).trim(); }
try {
  const changed = git(['diff', '--name-only', baseRef]).split('\n').filter(Boolean);
  const prot = [/^proposal\//, /^energy-strategies\//, /^pge-homeowners\//, /^landing\//, /^pge-landing-v1\.html$/, /^assets\/js\/oaiq\.js$/, /^netlify\.toml$/, /^sitemap\.xml$/, /^robots\.txt$/, /^_headers$/];
  const hits = changed.filter(f => prot.some(r => r.test(f)));
  ok('protected files unchanged', hits.length === 0, hits.join(', '));
  const es = git(['diff', '--numstat', baseRef, '--', 'energy-strategies.html']);
  const del = es ? Number(es.split('\t')[1]) : 0;
  ok('energy-strategies.html: additions only (GA4 snippet)', del === 0, es);
} catch (e) { ok('protected files unchanged', false, 'git failed: ' + e.message); }

// 5. generate_lead call site intact, and proposal manifest components exist
const save = read('proposal/components/strategy-save/component.js');
ok('generate_lead present and guarded', /generate_lead/.test(save) && /typeof window\.gtag\s*===\s*'function'/.test(save) && /proposal_confirm_my_choice/.test(save));
try {
  const manifestFile = ['proposal/manifest.json', 'proposal/components/manifest.json'].find(exists);
  if (manifestFile) {
    const mf = JSON.parse(read(manifestFile));
    const arr = Array.isArray(mf) ? mf : (mf.components || mf.modules || []);
    const missing = arr.map(x => (typeof x === 'string' ? x : x.id || x.name)).filter(Boolean)
      .filter(n => !exists(`proposal/components/${n}/component.js`) && !exists(`proposal/components/${n}`));
    ok('proposal manifest components exist', missing.length === 0, `${manifestFile}: ${missing.join(', ')}`);
  } else {
    const dirs = fs.readdirSync(path.join(root, 'proposal/components')).filter(d => exists(`proposal/components/${d}/component.js`));
    ok('proposal components present', dirs.length >= 10, `${dirs.length} components`);
  }
} catch (e) { ok('proposal manifest components exist', false, e.message); }

// 6. PG&E 725-location integrity (listed items on the service-area page)
{
  const t = read('pge-service-area.html');
  const n = count(t, /<li\b/g);
  ok('pge-service-area: location list intact', exists('pge-service-area.html') && n >= 725, `${n} <li> items`);
}

// 7. Analytics call-site PII check + helper unit tests
{
  const pii = [];
  const files = ['assets/js/swp-links.js', 'assets/js/swp-nav.js', 'assets/js/swp-attribution.js'];
  for (const f of files) {
    const t = read(f);
    if (/\.(value|innerText|textContent)\b[\s\S]{0,40}swpTrack|swpTrack\([^)]*\b(email|phone|name|address|zip)\b/i.test(t)) pii.push(f);
  }
  ok('no PII passed to swpTrack in helper call sites', pii.length === 0, pii.join(', '));

  const A = require(path.join(root, 'assets/js/swp-analytics.js'));
  const sent = [];
  const s = A.sanitize({ cta_name: 'start', email: 'a@b.com', destination: 'https://x.com/start-here.html?a=1', phone: '555', cta_location: 'a@b.com', page_type: '916-524-7187', goal: 'x'.repeat(300), has_upload: true, step_number: 3, free_text: 'hi' });
  ok('swpTrack allow-list drops unknown keys', !('email' in s) && !('phone' in s) && !('free_text' in s));
  ok('swpTrack drops email/phone-like values', !('cta_location' in s) && !('page_type' in s));
  ok('swpTrack destination is path only', s.destination === '/start-here.html', s.destination);
  ok('swpTrack truncates long strings', s.goal && s.goal.length === 100);
  ok('swpTrack keeps categorical values', s.cta_name === 'start' && s.has_upload === true && s.step_number === 3);
  ok('swpTrack rejects unknown events', A.track('purchase', {}) === false);
  ok('swpTrack is no-op without gtag', A.track('cta_click', { cta_name: 'x' }) === false && sent.length === 0);

  const store = () => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, m }; };
  const mk = search => ({ location: { search, pathname: '/start-here.html' }, localStorage: store(), sessionStorage: store() });
  const Attr = require(path.join(root, 'assets/js/swp-attribution.js'));
  const p = Attr.parse('?utm_source=google&gclid=abc123&email=a@b.com&name=Joe&lp_id=pge1');
  ok('attribution whitelist excludes PII-like keys', p && p.utm_source === 'google' && p.gclid === 'abc123' && p.lp_id === 'pge1' && !('email' in p) && !('name' in p));
  ok('attribution sanitizes values', JSON.stringify(Attr.parse('?utm_source=<script>x</script>')).indexOf('<') === -1);
  ok('attribution returns null without params', Attr.parse('?foo=bar') === null);
  ok('attribution expiry policy is 90 days', Attr.TTL_MS === 90 * 86400000);
}

// 8. Sitemap / indexing consistency
{
  const sm = read('sitemap.xml');
  const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  const bad = [];
  for (const u of urls) {
    const p = u.replace('https://solarwithphilip.com', '');
    const f = p === '/' ? 'index.html' : p.endsWith('/') ? p.slice(1) + 'index.html' : p.slice(1);
    if (!exists(f)) bad.push(u);
    else if (/<meta[^>]+name="robots"[^>]+noindex/i.test(read(f))) bad.push(u + ' (noindex)');
  }
  ok('sitemap URLs exist and are indexable', bad.length === 0, bad.join(', '));
  const proposal = read('proposal.html');
  ok('proposal.html not noindex', !/noindex/i.test(proposal));
  ok('robots.txt references sitemap', /Sitemap:\s*https:\/\/solarwithphilip\.com\/sitemap\.xml/i.test(read('robots.txt')));
}

// 9. Favicon assets
for (const f of ['favicon.ico', 'favicon-32.png', 'apple-touch-icon.png', 'assets/css/swp-tokens.css', 'assets/css/swp-base.css', 'assets/css/swp-shell.css', 'assets/js/swp-nav.js', 'assets/js/swp-analytics.js', 'assets/js/swp-attribution.js', 'assets/js/swp-links.js']) ok(`asset exists: ${f}`, exists(f));

// 10. Global-selector guard for new CSS
for (const f of ['assets/css/swp-tokens.css', 'assets/css/swp-base.css', 'assets/css/swp-shell.css']) {
  const css = read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '');
  const sels = [...css.matchAll(/(^|\})\s*([^{}@]+)\{/g)].map(m => m[2].trim());
  const risky = sels.filter(s => s.split(',').some(p => /^(\*|html|body|a|button|input|select|textarea|h[1-6]|p|ul|li|nav|header|footer|section|\.card|\.btn|\.wrap|\.container)(\s|$|:)/.test(p.trim()) && !p.includes('swp')));
  ok(`${f}: no global/unscoped selectors`, risky.filter(s => !/^:where|^:root|^main:focus/.test(s)).length === 0, risky.join(' | '));
}

const failed = results.filter(r => !r.pass);
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass || !r.detail ? '' : '  :: ' + r.detail}`);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
