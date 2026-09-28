/* ═══ AGENT BUILDER — views: Home · LLM Gateway · Evals (datasets + experiments) · Observability · library detail drawers ═══ */
(function () {
  'use strict';
  const NF = window.NF, NS = window.NS, X = window.NexusFeatures;
  const { shell, head, close, toast, esc, elFrom, wireSwitch } = NF;
  const { LIBS, libTop, statCard, usedStack, showView } = NS;
  const q = (s, r) => (r || document).querySelector(s);
  const qa = (s, r) => [...(r || document).querySelectorAll(s)];
  const hero = (ic, eyebrow, title, lead, act) => '<div class="lib-hero"><div class="lh-ic"><i class="ti ' + ic + '"></i></div><div class="lh-main"><div class="lib-eyebrow">' + eyebrow + '</div><h1 class="lib-title">' + title + '</h1><p class="lib-lead">' + lead + '</p></div>' + (act ? '<div class="lh-act">' + act + '</div>' : '') + '</div>';
  const bars = (vals, errIdx) => '<div class="spark">' + vals.map((v, i) => '<div style="height:' + Math.round(v / Math.max(...vals) * 100) + '%" title="' + v + '"' + (errIdx && errIdx.includes(i) ? ' class="err"' : '') + '></div>').join('') + '</div>';
  const DAYS = ['Aug 31', 'Sep 3', 'Sep 6', 'Sep 9', 'Sep 12'];
  const axis = '<div class="spark-x">' + DAYS.map(d => '<span>' + d + '</span>').join('') + '</div>';
  const RUNS14 = [2900, 3100, 2800, 3600, 3900, 4100, 3300, 2700, 3800, 4200, 4400, 4000, 3700, 3500];

  /* ═══ HOME ═══ */
  LIBS.home = function () {
    const A = X.AGENTS;
    const cards = Object.keys(A).map(h => { const a = A[h]; return '<div class="acard" data-open-agent="' + h + '"><div class="at"><div class="ag-tile-sm" style="background:' + NS.COLOR_BG[a.color] + ';color:' + NS.COLORS[a.color] + '"><i class="ti ' + a.icon + '"></i></div><div class="an">' + esc(a.name) + '</div><span class="m-badge ' + (a.status === 'published' ? 'good' : 'warn') + ' sm"><span class="dot"></span> ' + (a.status === 'published' ? 'Live' : 'Draft') + '</span></div><div class="ad">' + esc(a.desc) + '</div><div class="af"><span><i class="ti ti-player-play" style="font-size:12px"></i> ' + a.runs + ' runs</span><span class="sp"></span><span>' + a.last + '</span></div></div>'; }).join('');
    const acts = [['ti-rocket', '<b>m.chen</b> published <b>Outbound SDR</b> v12 to production', '2h ago'], ['ti-plug-connected', '<b>admin</b> connected <b>GitHub</b> to Bug Reproducer', '5h ago'], ['ti-target-arrow', 'Nightly eval passed for <b>Invoice Reconciler</b> \u00b7 94% groundedness', 'Yesterday'], ['ti-puzzle', '<b>priya</b> composed skill <b>Resolve billing dispute</b>', 'Yesterday'], ['ti-database', '<b>Eng runbooks</b> finished indexing \u00b7 312 docs', '2 days ago'], ['ti-user-plus', '<b>priya</b> joined as Editor', '2 days ago']];
    const hour = new Date().getHours(), greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return libTop('Home') + '<div class="lib-page">' + hero('ti-layout-dashboard', 'Project Nexus', greet + ', admin', '6 agents handled 48.2k runs in the last 30 days at a 2.1% escalation rate.', '<button class="m-btn primary" data-flow="new-agent"><i class="ti ti-plus"></i> New agent</button>') +
      '<div class="lib-stats">' + statCard('48.2k', '', 'Runs (30d)') + statCard('97.9', '%', 'Resolved without human') + statCard('$612', '', 'Spend (30d)') + statCard('1.9', 's', 'p50 latency') + '</div>' +
      '<div class="attn" data-attn><i class="ti ti-alert-triangle w"></i><div class="ab"><b>Zendesk needs reauthorization</b> \u2014 Support Triage can\u2019t read new tickets until it\u2019s fixed.</div><button class="m-btn accent sm">Fix now</button></div>' +
      '<div class="home-grid"><div><div class="h-sec">Agents<span class="sp"></span><button class="m-btn ghost sm" data-goto="agents">Open builder <i class="ti ti-arrow-right"></i></button></div><div class="home-agents">' + cards + '<div class="acard new" data-flow="new-agent"><span><i class="ti ti-plus"></i> New agent</span></div></div></div>' +
      '<div><div class="h-sec">Activity</div><div class="act-list">' + acts.map(a => '<div class="act"><div class="ai"><i class="ti ' + a[0] + '"></i></div><div class="ab">' + a[1] + '<div class="am">' + a[2] + '</div></div></div>').join('') + '</div>' +
      '<div class="h-sec" style="margin-top:22px">Runs \u00b7 14 days</div><div class="chart-card">' + bars(RUNS14) + axis + '</div></div></div></div>';
  };

  /* ═══ LLM GATEWAY ═══ */
  const PROVIDERS = [
    ['ti-sparkles', 'Anthropic', 'sk-ant-\u2022\u2022\u2022\u2022 7f3a', true, '31.2k', '$388', 3],
    ['ti-circle-dashed', 'OpenAI', 'sk-\u2022\u2022\u2022\u2022 c91e', true, '12.8k', '$164', 3],
    ['ti-circle', 'Google', 'AIza\u2022\u2022\u2022\u2022 0d2b', true, '4.2k', '$60', 2],
    ['ti-brand-azure', 'Azure OpenAI', '', false, '\u2014', '\u2014', 0],
    ['ti-brand-aws', 'Amazon Bedrock', '', false, '\u2014', '\u2014', 0],
    ['ti-server', 'Self-hosted (vLLM / Ollama)', '', false, '\u2014', '\u2014', 0]
  ];
  const GW_MODELS = [
    ['Claude Opus 4.1', 'Anthropic', '200k', '$15 / $75', 2400, 99.9, true], ['Claude Sonnet 4.5', 'Anthropic', '200k', '$3 / $15', 1100, 99.9, true], ['Claude Haiku 4', 'Anthropic', '200k', '$0.80 / $4', 480, 99.8, true],
    ['GPT-4o', 'OpenAI', '128k', '$5 / $15', 1300, 99.7, true], ['GPT-4o mini', 'OpenAI', '128k', '$0.60 / $2.40', 520, 99.8, true], ['o3', 'OpenAI', '200k', '$10 / $40', 4100, 99.5, false],
    ['Gemini 2.5 Pro', 'Google', '1M', '$3.50 / $10.50', 1500, 99.6, true], ['Gemini 2.5 Flash', 'Google', '1M', '$0.30 / $2.50', 390, 99.7, true]
  ];
  const ROUTES = [['Default', ['Claude Sonnet 4.5', 'GPT-4o mini'], '38.1k req', 'Fallback on 429 / 5xx'], ['Cost-saver', ['Claude Haiku 4', 'Gemini 2.5 Flash'], '6.4k req', 'Used by Invoice Reconciler'], ['Frontier', ['Claude Opus 4.1', 'o3'], '1.9k req', 'Revenue Analyst \u00b7 reasoning tasks']];
  LIBS.models = function () {
    const provs = PROVIDERS.map((p, i) => '<div class="prov" data-prov="' + i + '"><div class="pt"><div class="pl"><i class="ti ' + p[0] + '"></i></div><div class="pn">' + p[1] + '</div>' + (p[3] ? '<span class="m-badge good sm"><span class="dot"></span> Active</span>' : '<button class="m-btn secondary sm" data-prov-connect="' + i + '">Connect</button>') + '</div>' + (p[3] ? '<div class="pk"><span class="kdot"></span>' + p[2] + ' \u00b7 ' + p[6] + ' models</div><div class="pm"><div>Requests (30d)<b>' + p[4] + '</b></div><div>Spend<b>' + p[5] + '</b></div></div>' : '<div class="pk" style="color:var(--ink-400)">Add an API key to route traffic here</div>') + '</div>').join('');
    const rows = GW_MODELS.map((m, i) => '<tr class="clickable' + (m[6] ? '' : ' off') + '" data-gwm="' + i + '"><td><div class="tl-row-name"><div class="tl-ic"><i class="ti ' + PROVIDERS.find(p => p[1] === m[1])[0] + '"></i></div><span style="font-weight:600">' + m[0] + '</span></div></td><td style="color:var(--ink-600)">' + m[1] + '</td><td class="num" style="font-family:var(--font-mono);font-size:var(--fs-xs)">' + m[2] + '</td><td style="font-family:var(--font-mono);font-size:var(--fs-xs);color:var(--ink-600)">' + m[3] + '</td><td><span class="lat"><span style="width:' + Math.round(m[4] / 4100 * 100) + '%"></span></span><span style="font-family:var(--font-mono);font-size:var(--fs-xs)">' + m[4] + 'ms</span></td><td><span class="m-badge ' + (m[5] >= 99.7 ? 'good' : 'warn') + ' sm"><span class="dot"></span> ' + m[5] + '%</span></td><td class="sw-cell"><div class="m-switch' + (m[6] ? ' on' : '') + '" data-switch data-gw-toggle="' + i + '"></div></td></tr>').join('');
    const routes = ROUTES.map(r => '<div class="route"><div class="rn">' + r[0] + '</div><div class="rchain">' + r[1].map((m, i) => (i ? '<i class="ti ti-arrow-right"></i>' : '') + '<span class="m-chip">' + m + '</span>').join('') + '</div><div class="rstat">' + r[2] + ' \u00b7 ' + r[3] + '</div><button class="m-btn icon ghost sm" data-route-edit="' + esc(r[0]) + '"><i class="ti ti-pencil"></i></button></div>').join('');
    return libTop('LLM Gateway') + '<div class="lib-page">' + hero('ti-cpu', 'Platform', 'LLM Gateway', 'One endpoint in front of every provider. Keys, routing, fallbacks, rate limits and spend live here \u2014 agents just pick a model.', '<button class="m-btn secondary" data-gw-endpoint><i class="ti ti-link"></i> Endpoint &amp; keys</button> <button class="m-btn primary" data-gw-add><i class="ti ti-plus"></i> Add provider</button>') +
      '<div class="lib-stats">' + statCard('48.2k', '', 'Requests (30d)') + statCard('$612', '', 'Spend (30d)') + statCard('1.1', 's', 'p50 latency') + statCard('0.4', '%', 'Error rate') + '</div>' +
      '<div class="two-col" style="margin-bottom:26px"><div class="chart-card"><div class="ch"><span class="t">Requests per day</span><span class="v">48.2k</span></div>' + bars(RUNS14) + axis + '</div><div class="chart-card"><div class="ch"><span class="t">Spend per day</span><span class="v">$612</span></div>' + bars([38, 41, 36, 47, 52, 55, 44, 35, 49, 56, 58, 53, 49, 46]) + axis + '</div></div>' +
      '<div class="lib-cat"><span>Providers</span><span class="ln"></span><span class="gc">' + PROVIDERS.filter(p => p[3]).length + ' active</span></div><div class="prov-grid">' + provs + '</div>' +
      '<div class="lib-cat"><span>Routing &amp; fallbacks</span><span class="ln"></span></div><div class="route-card">' + routes + '<div class="add-row" data-route-new><i class="ti ti-plus"></i> New route</div></div>' +
      '<div class="lib-cat"><span>Model catalog</span><span class="ln"></span><span class="gc">' + GW_MODELS.filter(m => m[6]).length + ' enabled</span></div><div class="lib-table-wrap"><table class="m-table"><thead><tr><th>Model</th><th>Provider</th><th class="num">Context</th><th>Price in / out (1M)</th><th>p50 latency</th><th>Uptime</th><th class="sw-cell">Enabled</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  };

  function providerDrawer(i) {
    const p = PROVIDERS[i];
    const d = shell('drawer', '<div class="m-drawer">' + head(p[0], '', '', p[1], p[3] ? 'Active provider \u00b7 ' + p[6] + ' models routed' : 'Not connected') +
      '<div class="ov-body"><div class="fld"><label class="fld-label">API key</label><div class="m-input-group"><i class="ti ti-key"></i><input value="' + (p[3] ? p[2] : '') + '" placeholder="Paste a key from the provider console" data-key></div></div>' +
      '<div class="fld"><label class="fld-label">Base URL <span class="opt">\u2014 optional</span></label><input class="m-input" placeholder="https://api.' + p[1].toLowerCase().split(' ')[0] + '.com" style="font-family:var(--font-mono)"></div>' +
      '<div class="frow two"><div class="fld"><label class="fld-label">Rate limit (RPM)</label><input class="m-input" value="600" type="number"></div><div class="fld"><label class="fld-label">Monthly budget</label><input class="m-input" value="$800"></div></div>' +
      '<div class="cat-label" style="margin-top:8px"><span>Options</span><span class="ln"></span></div>' + [['Zero data retention', 'Ask the provider not to store prompts', true], ['Prompt caching', 'Cache long system prompts to cut cost', true], ['Log request bodies', 'Store full prompts in traces (PII redaction applies)', false]].map(o => '<div class="set-row"><div class="sk"><div class="n">' + o[0] + '</div><div class="d">' + o[1] + '</div></div><div class="m-switch' + (o[2] ? ' on' : '') + '" data-switch></div></div>').join('') +
      (p[3] ? '<div class="danger-zone"><div class="dz"><b>Remove provider</b><span>Routes using its models fall through to the next fallback.</span></div><button class="m-btn danger sm" data-rm>Remove</button></div>' : '') + '</div>' +
      '<div class="ov-foot"><button class="m-btn ghost sm" data-test><i class="ti ti-activity"></i> Test key</button><div class="sp"></div><button class="m-btn ghost" data-close>Cancel</button><button class="m-btn primary" data-save>' + (p[3] ? 'Save' : 'Connect') + '</button></div></div>');
    qa('[data-switch]', d).forEach(wireSwitch);
    q('[data-test]', d).addEventListener('click', e => { const b = e.currentTarget; b.innerHTML = '<span class="m-spin" style="width:13px;height:13px;border-width:2px"></span> Testing\u2026'; setTimeout(() => b.innerHTML = '<i class="ti ti-circle-check" style="color:var(--good)"></i> Key valid \u00b7 ' + p[6] + ' models', 900); });
    q('[data-save]', d).addEventListener('click', () => { if (!p[3]) { p[3] = true; p[2] = q('[data-key]', d).value.slice(0, 6) + '\u2022\u2022\u2022\u2022'; p[4] = '0'; p[5] = '$0'; p[6] = 2; } rerender('models'); close(); toast(p[1] + (p[3] ? ' saved' : ' connected'), 'ti-cpu'); });
    const rm = q('[data-rm]', d); if (rm) rm.addEventListener('click', () => { p[3] = false; rerender('models'); close(); toast(p[1] + ' removed'); });
  }
  function routeEditor(name) {
    const r = ROUTES.find(x => x[0] === name) || [name || 'New route', ['Claude Sonnet 4.5'], '0 req', 'New'];
    const enabled = GW_MODELS.filter(m => m[6]).map(m => m[0]);
    const chain = () => r[1].map((m, i) => '<div class="pick-tool on" data-ci="' + i + '"><div class="pt-ic"><span style="font-family:var(--font-mono);font-size:11px">' + (i + 1) + '</span></div><div class="pt-name" style="font-family:inherit">' + esc(m) + '</div><i class="ti ti-x" style="color:var(--ink-500);cursor:pointer" data-rm-c="' + i + '"></i></div>').join('');
    const d = shell('modal', '<div class="m-modal lg">' + head('ti-route', '', '', name ? 'Edit route' : 'New route', 'Ordered chain \u2014 the gateway tries each model in turn.') +
      '<div class="ov-body"><div class="fld"><label class="fld-label">Route name</label><input class="m-input" data-n value="' + esc(r[0]) + '"></div><div class="fld"><label class="fld-label">Chain</label><div data-chain>' + chain() + '</div><div style="display:flex;gap:8px;margin-top:10px"><select class="m-input" data-add-m>' + enabled.map(m => '<option>' + m + '</option>').join('') + '</select><button class="m-btn secondary" data-add>Add</button></div></div>' +
      '<div class="fld"><label class="fld-label">Fall back when</label><div class="cron-row">' + ['429 rate limit', '5xx error', 'Timeout > 20s', 'Context overflow'].map((c, i) => '<span class="preset' + (i < 3 ? ' on' : '') + '">' + c + '</span>').join('') + '</div></div>' +
      '<div class="set-row"><div class="sk"><div class="n">Sticky sessions</div><div class="d">Keep one model for the whole conversation</div></div><div class="m-switch on" data-switch></div></div></div>' +
      '<div class="ov-foot"><div class="sp"></div><button class="m-btn ghost" data-close>Cancel</button><button class="m-btn primary" data-save>Save route</button></div></div>');
    qa('[data-switch]', d).forEach(wireSwitch);
    qa('.cron-row .preset', d).forEach(p => p.addEventListener('click', () => p.classList.toggle('on')));
    const rebind = () => qa('[data-rm-c]', d).forEach(x => x.addEventListener('click', () => { r[1].splice(+x.dataset.rmC, 1); q('[data-chain]', d).innerHTML = chain(); rebind(); }));
    rebind();
    q('[data-add]', d).addEventListener('click', () => { r[1].push(q('[data-add-m]', d).value); q('[data-chain]', d).innerHTML = chain(); rebind(); });
    q('[data-save]', d).addEventListener('click', () => { r[0] = q('[data-n]', d).value || r[0]; if (!ROUTES.includes(r)) ROUTES.push(r); rerender('models'); close(); toast('Route saved', 'ti-route'); });
  }
  function endpointModal() {
    shell('modal', '<div class="m-modal lg">' + head('ti-link', '', '', 'Gateway endpoint', 'OpenAI-compatible. Point any SDK at it and pick a model or a route name.') +
      '<div class="ov-body"><div class="fld"><label class="fld-label">Base URL</label><div class="copy-row"><span>https://gateway.nexus.ai/v1</span><i class="ti ti-copy" data-copy></i></div></div><div class="fld"><label class="fld-label">Example</label><div class="pv-code">curl https://gateway.nexus.ai/v1/chat/completions \\\n  -H "Authorization: Bearer $NEXUS_KEY" \\\n  -d \'{"model": "route:default", "messages": [{"role":"user","content":"hi"}]}\'</div></div><div class="m-alert info"><div class="a-ic"><i class="ti ti-info-circle"></i></div><div class="a-body"><div class="a-title">Keys are managed in Settings \u2192 API keys</div><div class="a-text">Every request is traced and attributed to the calling agent or key.</div></div></div></div>' +
      '<div class="ov-foot"><div class="sp"></div><button class="m-btn secondary" data-close>Done</button></div></div>');
    qa('[data-copy]').forEach(c => c.addEventListener('click', () => toast('Copied')));
  }

  /* ═══ EVALS — datasets + experiments ═══ */
  const DATASETS = [
    ['Golden tickets', 'Hand-labelled support tickets with ideal replies', 240, 'Support Triage', '3d ago', ['input', 'expected_intent', 'expected_reply', 'should_escalate']],
    ['Angry customers', 'Negative-sentiment tickets sampled from production', 96, 'Support Triage', '1w ago', ['input', 'should_escalate']],
    ['Revenue Q&A', 'Questions with verified SQL and answers', 120, 'Revenue Analyst', '2d ago', ['question', 'expected_sql', 'expected_answer']],
    ['Lead briefs', 'Prospects with approved outreach emails', 64, 'Outbound SDR', '5d ago', ['lead', 'approved_email']],
    ['Invoice pairs', 'Invoice / payment pairs with known variance', 410, 'Invoice Reconciler', 'Yesterday', ['invoice', 'payment', 'expected_variance']]
  ];
  const EXPERIMENTS = [
    ['exp-0918', 'Support Triage v7', 'Golden tickets', [['Resolution', '74%'], ['Groundedness', '91%'], ['Escalation precision', '86%']], 'pass', '2h ago', '$0.84'],
    ['exp-0917', 'Support Triage v6', 'Golden tickets', [['Resolution', '69%'], ['Groundedness', '88%'], ['Escalation precision', '80%']], 'fail', 'Yesterday', '$0.81'],
    ['exp-0916', 'Support Triage v7 \u00b7 Haiku', 'Angry customers', [['Resolution', '61%'], ['Escalation precision', '92%']], 'pass', 'Yesterday', '$0.12'],
    ['exp-0915', 'Invoice Reconciler v3', 'Invoice pairs', [['Groundedness', '94%'], ['Exact match', '97%']], 'pass', 'Yesterday', '$1.10'],
    ['exp-0914', 'Revenue Analyst v2', 'Revenue Q&A', [['SQL correctness', '82%'], ['Answer match', '77%']], 'warn', '2d ago', '$2.40'],
    ['exp-0912', 'Outbound SDR v12', 'Lead briefs', [['Approval rate', '71%'], ['Factuality', '98%']], 'pass', '3d ago', '$0.33']
  ];
  const ST = { pass: ['good', 'Pass'], fail: ['bad', 'Fail'], warn: ['warn', 'Below target'] };
  LIBS.evals = function () {
    const ds = DATASETS.map((d, i) => '<div class="lcard" data-ds="' + i + '"><div class="lcard-top"><div class="lcard-ic"><i class="ti ti-table"></i></div><div style="flex:1"><div class="lcard-title">' + esc(d[0]) + '</div><div class="lcard-sub">' + d[2] + ' examples \u00b7 updated ' + d[4] + '</div></div></div><div class="lcard-desc">' + esc(d[1]) + '</div><div class="lcard-tags">' + d[5].map(c => '<span class="m-chip"><span class="mono" style="font-family:var(--font-mono);font-size:10.5px">' + c + '</span></span>').join('') + '</div><div class="lcard-foot"><span class="mu"><i class="ti ti-robot" style="font-size:13px"></i> ' + esc(d[3]) + '</span><span class="sp"></span><button class="m-btn secondary sm" data-run-ds="' + i + '"><i class="ti ti-player-play"></i> Run experiment</button></div></div>').join('');
    const ex = EXPERIMENTS.map((e, i) => '<tr class="clickable" data-exp="' + i + '"><td><span class="mono" style="font-family:var(--font-mono);font-weight:600">' + e[0] + '</span></td><td style="font-weight:600">' + esc(e[1]) + '</td><td style="color:var(--ink-600)">' + esc(e[2]) + '</td><td>' + e[3].map(m => '<span class="item-tag" style="margin-right:5px">' + m[0] + ' ' + m[1] + '</span>').join('') + '</td><td><span class="m-badge ' + ST[e[4]][0] + ' sm"><span class="dot"></span> ' + ST[e[4]][1] + '</span></td><td class="num" style="font-family:var(--font-mono);font-size:var(--fs-xs)">' + e[6] + '</td><td style="font-family:var(--font-mono);font-size:var(--fs-xs);color:var(--ink-500)">' + e[5] + '</td></tr>').join('');
    return libTop('Evals') + '<div class="lib-page">' + hero('ti-test-pipe', 'Quality', 'Evals', 'Datasets are the ground truth; experiments run an agent version against one and score every example. Goals in the builder gate publishes on these scores.', '<button class="m-btn secondary" data-new-ds><i class="ti ti-plus"></i> New dataset</button> <button class="m-btn primary" data-new-exp><i class="ti ti-player-play"></i> Run experiment</button>') +
      '<div class="lib-stats">' + statCard(DATASETS.length, '', 'Datasets') + statCard(DATASETS.reduce((s, d) => s + d[2], 0), '', 'Examples') + statCard(EXPERIMENTS.length, '', 'Experiments (7d)') + statCard('4', '/6', 'Passing') + '</div>' +
      '<div class="lib-cat"><span>Datasets</span><span class="ln"></span><span class="gc">' + DATASETS.length + '</span></div><div class="lib-grid">' + ds + '</div>' +
      '<div class="lib-cat"><span>Experiments</span><span class="ln"></span><span class="gc">' + EXPERIMENTS.length + '</span></div><div class="lib-table-wrap"><table class="m-table"><thead><tr><th>Run</th><th>Agent \u00b7 version</th><th>Dataset</th><th>Scores</th><th>Result</th><th class="num">Cost</th><th>When</th></tr></thead><tbody>' + ex + '</tbody></table></div></div>';
  };
  function datasetDrawer(i) {
    const d = DATASETS[i];
    const sample = [['My invoice charged me twice', 'billing', 'true'], ['How do I export to CSV?', 'how-to', 'false'], ['App crashes on login', 'bug', 'false'], ['Love the new dashboard!', 'feedback', 'false']];
    const p = shell('drawer', '<div class="m-drawer" style="width:min(640px,100%)">' + head('ti-table', '', '', d[0], d[2] + ' examples \u00b7 ' + d[5].length + ' columns \u00b7 owner ' + d[3]) +
      '<div class="ov-body"><div class="kv"><span class="k">Description</span><span class="v">' + esc(d[1]) + '</span><span class="k">Schema</span><span class="v">' + d[5].map(c => '<span class="item-tag" style="margin-right:4px">' + c + '</span>').join('') + '</span><span class="k">Source</span><span class="v">Production traces \u00b7 hand-labelled</span><span class="k">Splits</span><span class="v">train 80% \u00b7 test 20%</span></div>' +
      '<div class="cat-label"><span>Examples</span><span class="ln"></span></div><div class="lib-table-wrap"><table class="m-table"><thead><tr><th>input</th><th>expected_intent</th><th>should_escalate</th></tr></thead><tbody>' + sample.map(s => '<tr><td style="font-size:var(--fs-xs)">' + s[0] + '</td><td><span class="item-tag">' + s[1] + '</span></td><td style="font-family:var(--font-mono);font-size:var(--fs-xs)">' + s[2] + '</td></tr>').join('') + '</tbody></table></div><div style="font-size:var(--fs-xs);color:var(--ink-500);margin-top:8px">Showing 4 of ' + d[2] + '</div>' +
      '<div class="cat-label" style="margin-top:22px"><span>Add examples</span><span class="ln"></span></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="m-btn secondary sm" data-t><i class="ti ti-upload"></i> Upload CSV / JSONL</button><button class="m-btn secondary sm" data-t><i class="ti ti-timeline"></i> From production traces</button><button class="m-btn secondary sm" data-t><i class="ti ti-wand"></i> Generate synthetic</button></div></div>' +
      '<div class="ov-foot"><button class="m-btn ghost sm" data-t><i class="ti ti-download"></i> Export</button><div class="sp"></div><button class="m-btn secondary" data-close>Close</button><button class="m-btn primary" data-run><i class="ti ti-player-play"></i> Run experiment</button></div></div>');
    qa('[data-t]', p).forEach(b => b.addEventListener('click', () => toast(b.textContent.trim() + ' \u2014 opens importer', 'ti-upload')));
    q('[data-run]', p).addEventListener('click', () => newExperiment(d[0]));
  }
  function newExperiment(dsName) {
    const A = X.AGENTS;
    const p = shell('modal', '<div class="m-modal lg">' + head('ti-player-play', '', '', 'Run experiment', 'Score an agent version against a dataset.') +
      '<div class="ov-body"><div class="frow two"><div class="fld"><label class="fld-label">Agent</label><select class="m-input" data-a>' + Object.keys(A).map(h => '<option value="' + h + '"' + (h === X.current() ? ' selected' : '') + '>' + esc(A[h].name) + '</option>').join('') + '</select></div><div class="fld"><label class="fld-label">Version</label><select class="m-input"><option>Current draft</option><option>v7 (published)</option><option>v6</option></select></div></div>' +
      '<div class="fld"><label class="fld-label">Dataset</label><select class="m-input" data-ds>' + DATASETS.map(d => '<option' + (d[0] === dsName ? ' selected' : '') + '>' + esc(d[0]) + '</option>').join('') + '</select></div>' +
      '<div class="fld"><label class="fld-label">Evaluators</label>' + [['Intent match', 'Exact match on expected_intent', true], ['Groundedness', 'LLM-as-judge \u00b7 cites a retrieved source', true], ['Escalation precision', 'Compares should_escalate', true], ['Tone', 'LLM-as-judge \u00b7 warm, concise, on-brand', false], ['Custom code', 'Python evaluator from the library', false]].map(e => '<div class="scope-row"><div class="sb"><div style="font-size:var(--fs-sm);font-weight:600">' + e[0] + '</div><div class="sd">' + e[1] + '</div></div><div class="m-switch' + (e[2] ? ' on' : '') + '" data-switch></div></div>').join('') + '</div>' +
      '<div class="frow two"><div class="fld"><label class="fld-label">Model override <span class="opt">\u2014 optional</span></label><select class="m-input"><option>None (agent\u2019s model)</option>' + GW_MODELS.filter(m => m[6]).map(m => '<option>' + m[0] + '</option>').join('') + '</select></div><div class="fld"><label class="fld-label">Repetitions</label><input class="m-input" type="number" value="1"></div></div></div>' +
      '<div class="ov-foot"><div class="sp"></div><button class="m-btn ghost" data-close>Cancel</button><button class="m-btn primary" data-go><i class="ti ti-player-play"></i> Start</button></div></div>');
    qa('[data-switch]', p).forEach(wireSwitch);
    q('[data-go]', p).addEventListener('click', () => {
      const a = A[q('[data-a]', p).value], ds = q('[data-ds]', p).value, id = 'exp-' + (919 + EXPERIMENTS.length - 6);
      EXPERIMENTS.unshift([id, a.name + ' \u00b7 draft', ds, [['Running', '\u2026']], 'warn', 'just now', '\u2014']);
      rerender('evals'); showView('evals'); close(); toast('Experiment ' + id + ' started', 'ti-player-play');
      setTimeout(() => { EXPERIMENTS[0][3] = [['Resolution', '76%'], ['Groundedness', '93%'], ['Escalation precision', '88%']]; EXPERIMENTS[0][4] = 'pass'; EXPERIMENTS[0][6] = '$0.79'; rerender('evals'); toast(id + ' finished \u2014 pass', 'ti-circle-check'); }, 3500);
    });
  }
  function experimentDrawer(i) {
    const e = EXPERIMENTS[i];
    const rows = [['My invoice charged me twice\u2026', 'billing \u2713', 'escalate \u2713', 0.92], ['How do I export to CSV?', 'how-to \u2713', 'no \u2713', 0.97], ['App crashes on login', 'bug \u2713', 'no \u2717 (expected escalate)', 0.41], ['Cancel my subscription now', 'billing \u2713', 'escalate \u2713', 0.88]];
    shell('drawer', '<div class="m-drawer" style="width:min(640px,100%)">' + head('ti-flask', '', '', e[0] + ' \u00b7 ' + e[1], e[2] + ' \u00b7 ' + e[5] + ' \u00b7 cost ' + e[6]) +
      '<div class="ov-body"><div class="lib-stats" style="grid-template-columns:repeat(' + e[3].length + ',1fr);margin-bottom:18px">' + e[3].map(m => statCard(m[1], '', m[0])).join('') + '</div><span class="m-badge ' + ST[e[4]][0] + '"><span class="dot"></span> ' + ST[e[4]][1] + (e[4] === 'pass' ? ' \u00b7 all goals met' : ' \u00b7 escalation precision under 85%') + '</span>' +
      '<div class="cat-label" style="margin-top:22px"><span>Per-example results</span><span class="ln"></span></div><div class="lib-table-wrap"><table class="m-table"><thead><tr><th>Input</th><th>Intent</th><th>Escalation</th><th class="num">Score</th></tr></thead><tbody>' + rows.map(r => '<tr class="clickable"><td style="font-size:var(--fs-xs)">' + r[0] + '</td><td style="font-size:var(--fs-xs)">' + r[1] + '</td><td style="font-size:var(--fs-xs);color:' + (r[2].includes('\u2717') ? 'var(--bad)' : 'inherit') + '">' + r[2] + '</td><td class="num" style="font-family:var(--font-mono);font-size:var(--fs-xs)">' + r[3] + '</td></tr>').join('') + '</tbody></table></div><div style="font-size:var(--fs-xs);color:var(--ink-500);margin-top:8px">Showing 4 of 240 \u00b7 click a row to open its trace</div></div>' +
      '<div class="ov-foot"><button class="m-btn ghost sm" data-cmp><i class="ti ti-arrows-diff"></i> Compare with\u2026</button><div class="sp"></div><button class="m-btn secondary" data-close>Close</button></div></div>');
    q('[data-cmp]').addEventListener('click', () => toast('Pick a second experiment to diff', 'ti-arrows-diff'));
  }

  /* ═══ OBSERVABILITY ═══ */
  const TRACES = [
    ['Support Triage', 'Zendesk ticket', 'escalated', 1420, 1812, 0.011, '2m ago'], ['Invoice Reconciler', 'Schedule', 'ok', 880, 940, 0.002, '3m ago'], ['Outbound SDR', 'Manual', 'ok', 2100, 2410, 0.014, '5m ago'], ['Bug Reproducer', 'GitHub issue', 'error', 30000, 4100, 0.031, '41m ago'], ['Ontology Curator', 'Schedule', 'ok', 1210, 1330, 0.006, '1h ago'], ['Support Triage', 'Webhook', 'ok', 990, 1210, 0.007, '1h ago'], ['Revenue Analyst', 'Manual', 'ok', 4400, 3820, 0.058, '2h ago'], ['Support Triage', 'Zendesk ticket', 'ok', 1030, 1150, 0.006, '2h ago'], ['Invoice Reconciler', 'Schedule', 'ok', 910, 960, 0.002, '3h ago'], ['Outbound SDR', 'Manual', 'escalated', 1980, 2200, 0.013, '3h ago']
  ];
  const TST = { ok: 'good', escalated: 'warn', error: 'bad' };
  LIBS.analytics = function () {
    const rows = f => TRACES.map((t, i) => [t, i]).filter(([t]) => f === 'All' || (f === 'Errors' ? t[2] === 'error' : t[2] === 'escalated')).map(([t, i]) => '<tr class="clickable" data-tr="' + i + '"><td style="font-weight:600">' + t[0] + '</td><td style="color:var(--ink-600)">' + t[1] + '</td><td><span class="m-badge ' + TST[t[2]] + ' sm"><span class="dot"></span> ' + t[2] + '</span></td><td class="num" style="font-family:var(--font-mono);font-size:var(--fs-xs)">' + (t[3] / 1000).toFixed(2) + 's</td><td class="num" style="font-family:var(--font-mono);font-size:var(--fs-xs)">' + t[4].toLocaleString() + '</td><td class="num" style="font-family:var(--font-mono);font-size:var(--fs-xs)">$' + t[5].toFixed(3) + '</td><td style="font-family:var(--font-mono);font-size:var(--fs-xs);color:var(--ink-500)">' + t[6] + '</td></tr>').join('');
    return libTop('Observability') + '<div class="lib-page">' + hero('ti-chart-dots-3', 'Monitor', 'Observability', 'Every run is traced. Watch latency, cost, tool errors and outcomes across all agents.') +
      '<div class="lib-stats">' + statCard('48.2k', '', 'Runs (30d)') + statCard('1.9', 's', 'p50 latency') + statCard('$612', '', 'Spend (30d)') + statCard('2.1', '%', 'Escalation rate') + '</div>' +
      '<div class="two-col" style="margin-bottom:26px"><div class="chart-card"><div class="ch"><span class="t">Runs per day</span><span class="v">48.2k</span></div>' + bars(RUNS14) + axis + '</div><div class="chart-card"><div class="ch"><span class="t">Errors per day</span><span class="v" style="color:var(--bad)">61</span></div>' + bars([3, 5, 4, 6, 2, 3, 9, 4, 3, 5, 6, 4, 3, 4], [6]) + axis + '</div></div>' +
      '<div class="tbl-filter"><div class="m-seg" data-trf><button class="on">All</button><button>Escalated</button><button>Errors</button></div><span class="sp"></span><div class="lib-search" style="max-width:260px"><i class="ti ti-search"></i><input placeholder="Search runs\u2026" data-libsearch></div></div>' +
      '<div class="lib-table-wrap"><table class="m-table"><thead><tr><th>Agent</th><th>Trigger</th><th>Status</th><th class="num">Latency</th><th class="num">Tokens</th><th class="num">Cost</th><th>When</th></tr></thead><tbody data-trb>' + rows('All') + '</tbody></table></div></div>';
  };
  LIBS.analytics.rows = f => LIBS.analytics.toString() && null; // placeholder for clarity; filter handled in wire()
  function traceDrawer(i) {
    const t = TRACES[i]; const err = t[2] === 'error';
    const steps = err ? [['ti-tag', 'classify()', 'intent: bug \u00b7 priority: high', true], ['ti-terminal-2', 'run_python(repro.py)', 'timed out after 30s', false, 'err'], ['ti-alert-triangle', 'run aborted', 'Run budget guardrail \u00b7 30s cap', false, 'err']] : [['ti-tag', 'classify()', 'intent: ' + (t[0] === 'Support Triage' ? 'billing' : 'task') + ' \u00b7 priority: normal', true], ['ti-search', 'search_kb(\u2026)', '3 results \u00b7 top score 0.91', false, '240ms'], ['ti-pencil', 'draft_reply()', 'staged for review \u00b7 84 words', true]];
    shell('drawer', '<div class="m-drawer" style="width:min(560px,100%)">' + head('ti-timeline', '', '', t[0] + ' \u00b7 run', t[1] + ' \u00b7 ' + t[6]) +
      '<div class="ov-body"><div class="run-kv" style="margin-bottom:18px"><div>Status<b><span class="m-badge ' + TST[t[2]] + ' sm"><span class="dot"></span> ' + t[2] + '</span></b></div><div>Latency<b>' + (t[3] / 1000).toFixed(2) + 's</b></div><div>Tokens<b>' + t[4].toLocaleString() + '</b></div><div>Cost<b>$' + t[5].toFixed(3) + '</b></div></div>' +
      '<div class="cat-label"><span>Trace</span><span class="ln"></span></div><div class="trace">' + steps.map(s => '<div class="trace-step"><div class="trace-ic"><i class="ti ' + s[0] + '"></i></div><div class="trace-main"><div class="trace-name">' + s[1] + '</div><div class="trace-detail">' + s[2] + '</div></div>' + (s[3] ? '<i class="ti ti-circle-check-filled trace-check"></i>' : s[4] === 'err' ? '<i class="ti ti-circle-x-filled" style="color:var(--bad);font-size:15px"></i>' : '<span class="trace-time">' + s[4] + '</span>') + '</div>').join('') + '</div>' +
      '<div class="cat-label" style="margin-top:22px"><span>Input</span><span class="ln"></span></div><div class="pre">' + (t[0] === 'Support Triage' ? 'My invoice charged me twice this month and I\u2019m pretty annoyed. Can you fix it?' : t[0] === 'Bug Reproducer' ? 'Issue #4471: login button unresponsive on Safari 17 after session timeout' : 'Reconcile invoices for batch 2026-09-12') + '</div>' +
      '<div class="cat-label" style="margin-top:22px"><span>Metadata</span><span class="ln"></span></div><div class="kv"><span class="k">Run ID</span><span class="v mono">run_' + Math.random().toString(36).slice(2, 12) + '</span><span class="k">Model</span><span class="v">' + (X.AGENTS[Object.keys(X.AGENTS).find(h => X.AGENTS[h].name === t[0])] || {}).model + '</span><span class="k">Version</span><span class="v">v7</span><span class="k">Route</span><span class="v">Default</span></div></div>' +
      '<div class="ov-foot"><button class="m-btn ghost sm" data-ds-add><i class="ti ti-table-plus"></i> Add to dataset</button><button class="m-btn ghost sm" data-replay><i class="ti ti-refresh"></i> Replay in Test</button><div class="sp"></div><button class="m-btn secondary" data-close>Close</button></div></div>');
    q('[data-ds-add]').addEventListener('click', () => { DATASETS[0][2]++; rerender('evals'); toast('Added to Golden tickets', 'ti-table-plus'); });
    q('[data-replay]').addEventListener('click', () => { close(); showView('agents'); X.selectAgent(Object.keys(X.AGENTS).find(h => X.AGENTS[h].name === t[0]) || 'support-triage'); setTimeout(() => window.NexusTest.run('My invoice charged me twice this month. Can you fix it?'), 300); });
  }

  /* ═══ library detail drawers ═══ */
  const TOOL_SCHEMAS = { search_kb: { query: 'string', top_k: 'integer (default 5)' }, classify: { text: 'string' }, draft_reply: { ticket_id: 'string', tone: '"warm" | "neutral"', max_words: 'integer' }, escalate: { ticket_id: 'string', reason: 'string', queue: 'string' }, web_search: { query: 'string', recency_days: 'integer' }, query_db: { sql: 'string (read-only)' }, run_python: { code: 'string', timeout_s: 'integer' }, http_request: { method: 'string', url: 'string', body: 'object' }, send_email: { to: 'string', subject: 'string', body: 'string' }, assign_queue: { ticket_id: 'string', queue: 'string' } };
  const PROCEDURES = { 'Triage & route ticket': ['Read the ticket and call classify() to get intent and priority.', 'If priority is urgent or sentiment negative, set escalation flag.', 'Search the knowledge base for similar resolved tickets.', 'Assign to the queue that matches intent via assign_queue().'], 'Draft customer reply': ['Retrieve the top 3 KB articles for the ticket.', 'Draft a reply under 120 words citing at least one article.', 'Stage the draft for human review with draft_reply().'] };
  function openDetail(name, kind) {
    const A = X.agent();
    const s = NS.SKILLS.find(x => x[3] === name); if (s) return window.NexusSkills ? window.NexusSkills.open(s) : skillConfig(s);
    const t = NS.TOOLS_LIB.find(x => x[3] === name); if (t) return toolDetail(t);
    const k = NS.KNOWLEDGE_LIB.find(x => x[3] === name); if (k) return knowledgeDetail(k);
    toast('Opening "' + name + '"', 'ti-arrow-up-right');
  }
  function skillConfig(s) {
    const A = X.agent(); const proc = PROCEDURES[s[3]] || ['Understand the request and gather context.', 'Call the listed tools in order.', 'Return a structured result to the agent.'];
    const allTools = NS.TOOLS_LIB.map(t => t[3]); let sel = new Set(s[5]); let tab = 'Configure';
    const panes = {
      Configure: () => '<div class="fld"><label class="fld-label">Name</label><input class="m-input" value="' + esc(s[3]) + '" data-n></div><div class="fld"><label class="fld-label">Goal <span class="opt">\u2014 what the agent reads</span></label><input class="m-input" value="' + esc(s[4]) + '"></div><div class="fld"><label class="fld-label">Procedure</label><div class="instr-editor" contenteditable="true" spellcheck="false" style="min-height:120px">' + proc.map((p, i) => (i + 1) + '. ' + esc(p)).join('\n') + '</div></div><div class="fld"><label class="fld-label">Tools this skill may call</label><div style="display:flex;flex-wrap:wrap;gap:7px">' + allTools.map(t => '<span class="m-chip' + (sel.has(t) ? ' on' : '') + '" data-tl="' + t + '" style="cursor:pointer;' + (sel.has(t) ? 'border-color:var(--accent);color:var(--accent);background:var(--accent-bg)' : '') + '"><i class="ti ' + (sel.has(t) ? 'ti-check' : 'ti-plus') + '" style="font-size:12px"></i> ' + t + '</span>').join('') + '</div></div><div class="frow two"><div class="fld"><label class="fld-label">Max steps</label><input class="m-input" type="number" value="8"></div><div class="fld"><label class="fld-label">On failure</label><select class="m-input"><option>Escalate to human</option><option>Retry once</option><option>Return error to agent</option></select></div></div><div class="set-row"><div class="sk"><div class="n">Requires approval</div><div class="d">Pause before the final tool call</div></div><div class="m-switch" data-switch></div></div>',
      'Input / output': () => '<div class="fld"><label class="fld-label">Input schema</label><div class="pre">{\n  "ticket_id": "string",\n  "text": "string",\n  "customer": { "id": "string", "tier": "free | pro | enterprise" }\n}</div></div><div class="fld"><label class="fld-label">Output schema</label><div class="pre">{\n  "intent": "billing | bug | how-to | feedback",\n  "priority": "low | normal | high | urgent",\n  "queue": "string",\n  "confidence": "number 0\u20131"\n}</div></div>',
      Versions: () => [['v4', 'Added assign_queue fallback', 'priya', '2d ago', true], ['v3', 'Tightened procedure wording', 'm.chen', '1w ago'], ['v2', 'Added search_kb step', 'admin', '3w ago'], ['v1', 'Created', 'admin', 'Mar 28']].map(v => '<div class="ver-row"><div class="ver-rail"><div class="ver-dot' + (v[4] ? ' cur' : '') + '"></div></div><div class="ver-body"><div class="ver-top"><span class="ver-tag">' + v[0] + '</span>' + (v[4] ? '<span class="m-badge accent sm">Current</span>' : '<span class="ver-restore">Restore</span>') + '</div><div class="ver-msg">' + v[1] + '</div><div class="ver-meta">' + v[2] + ' \u00b7 ' + v[3] + '</div></div></div>').join(''),
      Usage: () => '<div class="lib-stats" style="grid-template-columns:1fr 1fr 1fr;margin-bottom:16px">' + statCard(s[8], '', 'Runs (30d)') + statCard('96.2', '%', 'Success') + statCard('1.4', 's', 'p50') + '</div><div class="cat-label"><span>Used by</span><span class="ln"></span></div>' + Object.values(X.AGENTS).slice(0, s[7]).map(a => '<div class="scope-row"><div class="ag-tile-sm" style="background:' + NS.COLOR_BG[a.color] + ';color:' + NS.COLORS[a.color] + '"><i class="ti ' + a.icon + '"></i></div><div class="sb"><div style="font-size:var(--fs-sm);font-weight:600">' + esc(a.name) + '</div></div><span class="m-badge ' + (a.status === 'published' ? 'good' : 'warn') + ' sm"><span class="dot"></span> ' + a.status + '</span></div>').join('')
    };
    const p = shell('drawer', '<div class="m-drawer" style="width:min(600px,100%)">' + head(s[0], '', '', s[3], s[6] + ' \u00b7 ' + s[8] + ' runs \u00b7 v4') + '<div style="padding:14px 22px 0"><div class="m-seg">' + Object.keys(panes).map(t => '<button' + (t === tab ? ' class="on"' : '') + ' data-tab="' + t + '">' + t + '</button>').join('') + '</div></div><div class="ov-body" data-pane></div>' +
      '<div class="ov-foot"><button class="m-btn ghost sm" data-attach><i class="ti ti-plus"></i> Attach to ' + esc(A.name) + '</button><div class="sp"></div><button class="m-btn ghost" data-close>Cancel</button><button class="m-btn primary" data-save>Save skill</button></div></div>');
    const render = t => { q('[data-pane]', p).innerHTML = panes[t](); qa('[data-switch]', p).forEach(wireSwitch); qa('[data-tl]', p).forEach(c => c.addEventListener('click', () => { sel.has(c.dataset.tl) ? sel.delete(c.dataset.tl) : sel.add(c.dataset.tl); render(t); })); qa('.ver-restore', p).forEach(r => r.addEventListener('click', () => toast('Restored', 'ti-history'))); };
    qa('[data-tab]', p).forEach(b => b.addEventListener('click', () => render(b.dataset.tab)));
    render(tab);
    q('[data-attach]', p).addEventListener('click', () => { NF.addSkillToList(s[3], s[4], [...sel]); close(); showView('agents'); toast('Attached to ' + A.name, 'ti-puzzle'); });
    q('[data-save]', p).addEventListener('click', () => { s[5] = [...sel]; const n = q('[data-n]', p); if (n) s[3] = n.value; rerender('skills'); close(); toast('Skill saved as v5', 'ti-puzzle'); });
  }
  function toolDetail(t) {
    const A = X.agent(); const sc = TOOL_SCHEMAS[t[3]] || { input: 'string' };
    const p = shell('drawer', '<div class="m-drawer" style="width:min(560px,100%)">' + head(t[0], '', '', t[3], t[5] + ' \u00b7 v2 \u00b7 ' + t[8]) +
      '<div class="ov-body"><div class="fld"><label class="fld-label">Description <span class="opt">\u2014 the model reads this</span></label><textarea class="m-textarea">' + esc(t[4]) + '</textarea></div>' +
      '<div class="fld"><label class="fld-label">Parameters</label><div class="pre">' + esc(JSON.stringify({ type: 'object', properties: Object.fromEntries(Object.entries(sc).map(([k, v]) => [k, { type: v }])), required: Object.keys(sc).slice(0, 1) }, null, 2)) + '</div></div>' +
      '<div class="cat-label"><span>Policy</span><span class="ln"></span></div>' + [['Requires human approval', t[3] === 'escalate' || t[3] === 'send_email'], ['Log arguments in traces', true], ['Allow in production', true]].map(o => '<div class="set-row"><div class="sk"><div class="n">' + o[0] + '</div></div><div class="m-switch' + (o[1] ? ' on' : '') + '" data-switch></div></div>').join('') +
      '<div class="cat-label" style="margin-top:22px"><span>Health</span><span class="ln"></span></div><div class="kv"><span class="k">Calls (24h)</span><span class="v">' + (200 + t[6] * 340).toLocaleString() + '</span><span class="k">p50 latency</span><span class="v">' + (120 + t[6] * 30) + 'ms</span><span class="k">Error rate</span><span class="v">' + (t[7] === 'warn' ? '4.1%' : '0.3%') + '</span><span class="k">Used by</span><span class="v">' + usedStack(t[6]) + '</span></div></div>' +
      '<div class="ov-foot"><button class="m-btn ghost sm" data-add><i class="ti ti-plus"></i> Add to ' + esc(A.name) + '</button><div class="sp"></div><button class="m-btn ghost" data-close>Cancel</button><button class="m-btn primary" data-save>Save</button></div></div>');
    qa('[data-switch]', p).forEach(wireSwitch);
    q('[data-add]', p).addEventListener('click', () => { NF.addToolToList([t[0], t[1], t[2], t[3], t[4]]); close(); showView('agents'); toast(t[3] + ' added to ' + A.name, 'ti-tool'); });
    q('[data-save]', p).addEventListener('click', () => { close(); toast('Tool saved as v3', 'ti-tool'); });
  }
  function knowledgeDetail(k) {
    const p = shell('drawer', '<div class="m-drawer">' + head(k[0], '', '', k[3], k[4] + ' \u00b7 ' + k[5] + ' docs') +
      '<div class="ov-body"><div class="kv"><span class="k">Status</span><span class="v"><span class="m-badge ' + k[7] + ' sm"><span class="dot"></span> ' + k[8] + '</span></span><span class="k">Last sync</span><span class="v">' + k[6] + '</span><span class="k">Chunks</span><span class="v">' + (parseInt(k[5].replace(/,/g, '')) * 6 || 1200).toLocaleString() + '</span><span class="k">Embedding</span><span class="v mono">text-embedding-3-large</span><span class="k">Used by</span><span class="v">' + usedStack(2) + '</span></div>' +
      '<div class="cat-label"><span>Sync</span><span class="ln"></span></div><div class="set-row"><div class="sk"><div class="n">Schedule</div></div><select class="m-input"><option>Nightly</option><option>Hourly</option><option>Manual</option></select></div><div class="set-row"><div class="sk"><div class="n">Chunk size</div><div class="d">Tokens per chunk</div></div><input class="m-input" value="512" type="number"></div><div class="set-row"><div class="sk"><div class="n">Include metadata</div><div class="d">Title, URL, updated-at in each chunk</div></div><div class="m-switch on" data-switch></div></div>' +
      '<div class="danger-zone"><div class="dz"><b>Remove source</b><span>Agents will stop retrieving from it immediately.</span></div><button class="m-btn danger sm" data-rm>Remove</button></div></div>' +
      '<div class="ov-foot"><button class="m-btn ghost sm" data-re><i class="ti ti-refresh"></i> Re-index now</button><div class="sp"></div><button class="m-btn secondary" data-close>Done</button></div></div>');
    qa('[data-switch]', p).forEach(wireSwitch);
    q('[data-re]', p).addEventListener('click', () => { k[7] = 'warn'; k[8] = 'Syncing'; k[6] = 'Syncing\u2026'; rerender('knowledge'); close(); toast('Re-index started for ' + k[3], 'ti-refresh'); setTimeout(() => { k[7] = 'good'; k[8] = 'Synced'; k[6] = 'just now'; rerender('knowledge'); }, 3000); });
    q('[data-rm]', p).addEventListener('click', () => { NS.KNOWLEDGE_LIB.splice(NS.KNOWLEDGE_LIB.indexOf(k), 1); rerender('knowledge'); close(); toast(k[3] + ' removed'); });
  }
  function newTool() {
    const p = shell('modal', '<div class="m-modal lg">' + head('ti-tool', '', '', 'New tool', 'Register a function agents can call. Versioned and permissioned from day one.') +
      '<div class="ov-body"><div class="frow two"><div class="fld"><label class="fld-label">Name</label><input class="m-input" data-n placeholder="lookup_order" style="font-family:var(--font-mono)"></div><div class="fld"><label class="fld-label">Type</label><select class="m-input" data-t><option>Action</option><option>Retrieval</option><option>Code</option><option>Data</option></select></div></div>' +
      '<div class="fld"><label class="fld-label">Description <span class="opt">\u2014 the model reads this to decide when to call it</span></label><textarea class="m-textarea" data-d placeholder="Look up an order by ID and return status, items and tracking."></textarea></div>' +
      '<div class="fld"><label class="fld-label">Implementation</label><div class="m-seg"><button class="on">HTTP endpoint</button><button>Python function</button><button>MCP server</button></div><input class="m-input" style="margin-top:9px;font-family:var(--font-mono)" placeholder="https://api.example.com/orders/{id}"></div>' +
      '<div class="fld"><label class="fld-label">Parameters (JSON Schema)</label><textarea class="m-textarea" style="font-family:var(--font-mono);font-size:var(--fs-xs);min-height:110px">{\n  "type": "object",\n  "properties": { "order_id": { "type": "string" } },\n  "required": ["order_id"]\n}</textarea></div>' +
      '<div class="set-row"><div class="sk"><div class="n">Requires human approval</div><div class="d">Pause the run before executing</div></div><div class="m-switch" data-switch></div></div></div>' +
      '<div class="ov-foot"><div class="sp"></div><button class="m-btn ghost" data-close>Cancel</button><button class="m-btn primary" data-save><i class="ti ti-check"></i> Register tool</button></div></div>');
    qa('[data-switch]', p).forEach(wireSwitch);
    q('[data-save]', p).addEventListener('click', () => { const n = q('[data-n]', p).value.trim().replace(/\W+/g, '_').toLowerCase() || 'new_tool'; NS.TOOLS_LIB.push(['ti-function', '', '', n, q('[data-d]', p).value || 'No description yet.', q('[data-t]', p).value, 0, 'good', 'Healthy']); rerender('tools'); close(); toast(n + ' registered', 'ti-tool'); });
  }
  function newDataset() {
    const p = shell('modal', '<div class="m-modal lg">' + head('ti-table', '', '', 'New dataset', 'Ground truth for experiments.') + '<div class="ov-body"><div class="fld"><label class="fld-label">Name</label><input class="m-input" data-n placeholder="Refund edge cases"></div><div class="fld"><label class="fld-label">Description</label><input class="m-input" data-d placeholder="What these examples cover"></div><div class="fld"><label class="fld-label">Start from</label><div class="opt-list">' + [['ti-upload', 'Upload CSV / JSONL', 'Bring labelled examples from a file'], ['ti-timeline', 'Production traces', 'Pick real runs and label them'], ['ti-wand', 'Generate synthetic', 'Have a model draft examples from your instructions'], ['ti-square-plus', 'Empty', 'Add examples by hand']].map((o, i) => '<div class="trig-opt' + (i === 1 ? ' sel' : '') + '" data-o><div class="to-ic"><i class="ti ' + o[0] + '"></i></div><div><div class="to-name">' + o[1] + '</div><div class="to-desc">' + o[2] + '</div></div></div>').join('') + '</div></div></div><div class="ov-foot"><div class="sp"></div><button class="m-btn ghost" data-close>Cancel</button><button class="m-btn primary" data-save>Create dataset</button></div></div>');
    qa('[data-o]', p).forEach(o => o.addEventListener('click', () => qa('[data-o]', p).forEach(x => x.classList.toggle('sel', x === o))));
    q('[data-save]', p).addEventListener('click', () => { DATASETS.unshift([q('[data-n]', p).value || 'Untitled dataset', q('[data-d]', p).value || 'No description yet.', 0, X.agent().name, 'just now', ['input', 'expected_output']]); rerender('evals'); close(); toast('Dataset created', 'ti-table'); });
  }
  function newItem(k) { if (k === 'skill') return window.NexusSkills ? window.NexusSkills.compose() : NF.flowComposeSkill(); if (k === 'tool') return newTool(); if (k === 'knowledge') return NF.flowKnowledge(); }

  /* ═══ wiring for view-specific controls ═══ */
  function rerender(name) { const v = q('#view-' + name); if (!v || !NS.rendered[name]) return; v.innerHTML = LIBS[name](); NS.wireLibrary(v, name); wire(v, name); }
  function wire(root, name) {
    root.addEventListener('click', e => {
      const t = e.target;
      const ag = t.closest('[data-open-agent]'); if (ag) { showView('agents'); X.selectAgent(ag.dataset.openAgent); return; }
      if (t.closest('[data-attn]')) { showView('agents'); X.selectAgent('support-triage'); NF.expand('connectors'); return; }
      if (t.closest('[data-goto]')) return showView(t.closest('[data-goto]').dataset.goto);
      const pc = t.closest('[data-prov-connect]'); if (pc) { e.stopPropagation(); return providerDrawer(+pc.dataset.provConnect); }
      const pv = t.closest('[data-prov]'); if (pv) return providerDrawer(+pv.dataset.prov);
      const gm = t.closest('[data-gwm]'); if (gm && !t.closest('[data-gw-toggle]')) return toast(GW_MODELS[+gm.dataset.gwm][0] + ' \u2014 open provider card to configure', 'ti-cpu');
      if (t.closest('[data-gw-add]')) return providerDrawer(PROVIDERS.findIndex(p => !p[3]));
      if (t.closest('[data-gw-endpoint]')) return endpointModal();
      const re = t.closest('[data-route-edit]'); if (re) return routeEditor(re.dataset.routeEdit);
      if (t.closest('[data-route-new]')) return routeEditor(null);
      const rd = t.closest('[data-run-ds]'); if (rd) { e.stopPropagation(); return newExperiment(DATASETS[+rd.dataset.runDs][0]); }
      const ds = t.closest('[data-ds]'); if (ds) return datasetDrawer(+ds.dataset.ds);
      const ex = t.closest('[data-exp]'); if (ex) return experimentDrawer(+ex.dataset.exp);
      if (t.closest('[data-new-ds]')) return newDataset();
      if (t.closest('[data-new-exp]')) return newExperiment();
      const tr = t.closest('[data-tr]'); if (tr) return traceDrawer(+tr.dataset.tr);
      const trf = t.closest('[data-trf] button'); if (trf) { const f = trf.textContent; qa('tbody[data-trb] tr', root).forEach(r => { const st = q('.m-badge', r).textContent.trim(); r.style.display = f === 'All' || (f === 'Errors' ? st === 'error' : st === 'escalated') ? '' : 'none'; }); }
    });
    qa('[data-switch]:not([data-gw-toggle])', root).forEach(wireSwitch);
    qa('[data-gw-toggle]', root).forEach(gt => gt.addEventListener('click', e => { e.stopPropagation(); const m = GW_MODELS[+gt.dataset.gwToggle]; m[6] = !m[6]; gt.classList.toggle('on', m[6]); gt.closest('tr').classList.toggle('off', !m[6]); const gc = qa('.lib-cat .gc', root)[2]; if (gc) gc.textContent = GW_MODELS.filter(x => x[6]).length + ' enabled'; }));
  }
  const origShow = NS.showView;
  const patched = new Set();
  document.querySelectorAll('.strip-btn[data-view]').forEach(b => b.addEventListener('click', () => { const n = b.dataset.view; const v = q('#view-' + n); if (v && !patched.has(n) && v.children.length) { patched.add(n); wire(v, n); } }));
  NS.showView = function (n) { origShow(n); const v = q('#view-' + n); if (v && !patched.has(n) && v.children.length) { patched.add(n); wire(v, n); } };
  window.showView = NS.showView;
  Object.assign(window.NexusFeatures, { openDetail, newItem, rerender, DATASETS, EXPERIMENTS, PROVIDERS, GW_MODELS });
})();
