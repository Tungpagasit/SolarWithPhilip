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

const SHELL_PAGES = ['index', 'start-here', 'faq', 'about', 'reviews', 'contact', 'california-guide', 'energy-costs', 'pge-service-area'].map(p => p + '.html').concat(['get-started/index.html', 'compare-my-quote/index.html']);
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
  const changed = git(['diff', '--name-only', '--diff-filter=MDR', baseRef]).split('\n').filter(Boolean);
  const prot = [/^proposal\//, /^energy-strategies\//, /^pge-homeowners\//, /^landing\//, /^pge-landing-v1\.html$/, /^assets\/js\/oaiq\.js$/, /^robots\.txt$/, /^_headers$/];
  const hits = changed.filter(f => prot.some(r => r.test(f)));
  ok('protected files unchanged', hits.length === 0, hits.join(', '));
  const smDiff = git(['diff', '-U0', baseRef, '--', 'sitemap.xml']).split(/\r?\n/).filter(l => /^[-+][^-+]/.test(l));
  const ntDiff = git(['diff', '-U0', baseRef, '--', 'netlify.toml']).split(/\r?\n/).filter(l => /^[-+][^-+]/.test(l));
  const ntNew = fs.readFileSync(path.join(root, 'netlify.toml'), 'utf8');
  ok('netlify.toml: additions only, deny /db/* and /scripts/* (404, forced); publish/functions unchanged', ntDiff.length > 0 && ntDiff.every(l => l.startsWith('+')) && /from = "\/db\/\*"[\s\S]*?status = 404[\s\S]*?force = true/.test(ntNew) && /from = "\/scripts\/\*"[\s\S]*?status = 404[\s\S]*?force = true/.test(ntNew) && /publish = "\."/.test(ntNew) && /functions = "proposal\/functions"/.test(ntNew), ntDiff.join(' | '));
  ok('sitemap.xml: additions only (get-started, compare-my-quote)', smDiff.length === 2 && smDiff.every(l => l.startsWith('+') && /\/(get-started|compare-my-quote)\/</.test(l)), smDiff.join(' | '));
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
for (const f of ['favicon.ico', 'apple-touch-icon.png', 'assets/images/favicon-32.png', 'assets/images/apple-touch-icon.png', 'assets/images/solar-with-philip-logo.png', 'assets/images/swp-logo-header.webp', 'assets/images/swp-logo-full-900.webp', 'assets/images/swp-logo-full-480.webp', 'assets/css/swp-tokens.css', 'assets/css/swp-base.css', 'assets/css/swp-shell.css', 'assets/js/swp-nav.js', 'assets/js/swp-analytics.js', 'assets/js/swp-attribution.js', 'assets/js/swp-links.js']) ok(`asset exists: ${f}`, exists(f));

// 10b. Phase 2B conversion pages
{
  const home = read('index.html'), gs = read('get-started/index.html'), cq = read('compare-my-quote/index.html');
  ok('nav: Get Started -> /get-started/, Compare -> /compare-my-quote/', [home, gs, cq, read('about.html')].every(t => /class="swp-shell__link swp-shell__cta" href="\/get-started\/"/.test(t) && /href="\/compare-my-quote\/"/.test(t)));
  ok('home: canonical, JSON-LD once, hero H1', /rel="canonical" href="https:\/\/solarwithphilip\.com\/"/.test(home) && count(home, /application\/ld\+json/g) === 1 && /See What Solar and Battery Options Fit Your Home/.test(home));
  ok('home: calm advisor-first first-screen line (no local-installer claim)', /Explore solar, battery, cash, financing, lease and PPA options with guidance built around your home, energy use and goals\./.test(home) && !/not available through local installers/.test(home.split('More Than One Door')[0]));
  ok('home: compensation disclosure visible', /Philip may receive compensation if you choose a solution offered through him\./.test(home));
  ok('home: no old index.js router or star ratings', !/assets\/js\/index\.js|index\.css|★|AggregateRating/.test(home));
  ok('get-started: canonical + form source', /get-started\/"/.test(gs) && /data-form-source="get_started_page"/.test(gs) && /data-form-source="homepage_primary"/.test(home));
  ok('compare: canonical + upload + AEO Q&A', /compare-my-quote\/"/.test(cq) && /name="quoteFile"/.test(cq) && count(cq, /<h3>[^<]*\?<\/h3>/g) >= 5);
  ok('forms: honeypot, consent unchecked, no autocomplete off', [home, gs, cq].every(t => /name="hp_fax"/.test(t) && /name="consent"/.test(t) && !/name="consent"[^>]*checked/.test(t) && !/autocomplete="off"[^>]*name="(email|phone)"/.test(t)));
  ok('forms: no PII fields in data-cta/analytics attrs', ![home, gs, cq].some(t => /data-(cta|link-location)="[^"]*@/.test(t)));
  const fn = ['proposal/functions/save-intake.js', 'proposal/functions/intake-upload.js'];
  ok('new functions exist, reuse SUPABASE env names only', fn.every(f => exists(f) && /process\.env\.SUPABASE_URL/.test(read(f)) && /process\.env\.SUPABASE_SERVICE_ROLE_KEY/.test(read(f)) && !/process\.env\.(?!SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)[A-Z_]+/.test(read(f))));
  ok('migration not wired anywhere (SQL file only, rollback present)', exists('db/migrations/2026-11-lead-intake.sql') && exists('db/migrations/2026-11-lead-intake.rollback.sql'));
  const an = read('assets/js/swp-analytics.js');
  ok('analytics: generate_lead not allow-listed', !/generate_lead/.test(an));

  // Pre-launch polish checks
  const norm = s => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\s+/g, ' ').trim();
  const stage1 = gs.match(/<div data-stage="1">([\s\S]*?)<div data-stage="2">/)[1];
  const outside = stage1.replace(/<details[\s\S]*?<\/details>/, '');
  const names = h => [...h.matchAll(/<(?:input|select|textarea)[^>]*name="([^"]+)"/g)].map(m => m[1]);
  ok('get-started: stage 1 visible fields are firstName, zip, goal only', names(outside).join(',') === 'firstName,zip,goal', names(outside).join(','));
  ok('get-started: bill and utility under optional progressive section', /<details class="swp-more"><summary>Want to tell us a little more\? \(optional\)<\/summary>[\s\S]*name="billBand"[\s\S]*name="utility"[\s\S]*<\/details>/.test(stage1));
  ok('forms: utility hint disclaims service/program/qualification', [home, gs, cq].every(x => /Availability of specific programs varies, and listing a utility here does not mean service or qualification\./.test(x)));
  const cqForm = cq.match(/<!-- swp-form:compare:start -->([\s\S]*?)<!-- swp-form:compare:end -->/)[1];
  ok('compare: upload trust copy exact, no unverified security claims', cqForm.includes('Your proposal is used to help review your request. Upload only the solar proposal you want reviewed and avoid including unrelated identification, banking or tax documents.') && !/secure|encrypt|private|safe/i.test(norm(cqForm)));
  ok('forms: SMS scope note + privacy link present', [home, gs, cq].every(x => /Choosing Text means you agree to a text response about this request\. It is not sign-up for recurring promotional text messages\./.test(x) && /href="\/privacy\/">Privacy page/.test(x)));
  ok('footers link to /privacy/', [home, gs, cq].every(x => /<footer[\s\S]*href="\/privacy\/">Privacy<\/a>[\s\S]*<\/footer>/.test(x)));
  const rv = norm(read('reviews.html'));
  const quotes = [...home.matchAll(/<blockquote>([\s\S]*?)<\/blockquote>/g)].map(m => norm(m[1]));
  ok('testimonials: 3 excerpts, each marked with ellipsis, wording verbatim to reviews.html', quotes.length === 3 && quotes.every(q => /\u2026/.test(q) && rv.includes(q.replace(/\u2026/g, '').replace(/^"\s*|\s*"$/g, '').replace(/\s+/g, ' ').trim())), quotes.map(q => q.slice(0, 30)).join(' | '));
  const sm = read('sitemap.xml');
  for (const [u, p] of [['https://solarwithphilip.com/get-started/', gs], ['https://solarwithphilip.com/compare-my-quote/', cq]]) {
    ok('sitemap + SEO basics: ' + u, sm.includes('<loc>' + u + '</loc>') && !/name="robots"[^>]*noindex/i.test(p) && p.includes('<link rel="canonical" href="' + u + '"') && /<title>[^<]{5,}<\/title>/.test(p) && /name="description" content="[^"]{40,}"/.test(p) && count(p, /<h1[\s>]/g) === 1);
  }
  const pv = read('privacy/index.html');
  ok('privacy: draft, noindex, self-canonical, one H1, required sections, not in sitemap', /noindex/.test(pv) && /rel="canonical" href="https:\/\/solarwithphilip\.com\/privacy\/"/.test(pv) && count(pv, /<h1[\s>]/g) === 1 && ['Information You Provide', 'How Information Is Used', 'Contact Preferences', 'Uploaded Documents', 'Analytics and Attribution', 'Who May Respond to Your Request', 'External Sharing', 'Data Retention', 'Your Choices', 'Contact'].every(h => pv.includes('<h2>' + h + '</h2>')) && /DRAFT\. Not approved for production/.test(pv) && !sm.includes('/privacy/'));
  ok('privacy: makes no unverified security/compliance claims', !/\b(secure|encrypted|we never share|CCPA|GDPR|we do not sell|compliant)\b/i.test(norm(pv.replace(/<mark[\s\S]*?<\/mark>/g, ''))));
  ok('start-here keeps content and links to /get-started/', /href="\/get-started\/"/.test(read('start-here.html')) && /We Know What Matters to Homeowners/.test(read('start-here.html')));
  const sql = read('db/migrations/2026-11-lead-intake.sql');
  ok('migration: DB-level updated_at trigger + rollback drops it', /create trigger lead_intake_set_updated_at\s+before update on public\.lead_intake/.test(sql) && /drop function if exists public\.lead_intake_set_updated_at/.test(read('db/migrations/2026-11-lead-intake.rollback.sql')));
}

// 11. Global-selector guard

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
