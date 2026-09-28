/* ═══ AGENT BUILDER — completed interactions: state, agent switching, readiness, menus, identity,
   variables, triggers, evaluation goal, connector manage, preview, notifications, settings, trace pane ═══ */
(function () {
  'use strict';
  const NF = window.NF, NS = window.NS;
  const { shell, head, close, toast, esc, elFrom, insertBeforeAddRow, bumpCount, expand, wireSwitch } = NF;
  const q = (s, r) => (r || document).querySelector(s);
  const qa = (s, r) => [...(r || document).querySelectorAll(s)];
  const COLORS = NS.COLORS, COLOR_BG = NS.COLOR_BG;

  /* ───────── agent registry ───────── */
  const AGENTS = {
    'support-triage': { name: 'Support Triage', color: 'teal', icon: 'ti-headset', status: 'draft', desc: 'Routes inbound tickets, drafts replies, and escalates when it isn\u2019t sure.', model: 'Claude Sonnet 4.5', runs: '12.4k', last: '2m ago', instr: null, goal: { objective: 'Resolve 70% of tier-1 tickets without a human, with every reply grounded in the help center.', metric: 'Resolution without escalation', target: 70, current: 64, trend: [51, 54, 55, 58, 57, 60, 62, 61, 63, 64] } },
    'revenue-analyst': { name: 'Revenue Analyst', color: 'plum', icon: 'ti-chart-pie', status: 'draft', desc: 'Queries the warehouse and answers revenue questions with charts.', model: 'Claude Opus 4.1', runs: '860', last: '1h ago', goal: { objective: 'Answer 80% of revenue questions correctly on the first try, with verifiable SQL.', metric: 'Answer correctness', target: 80, current: 77, trend: [60, 66, 70, 72, 71, 74, 76, 77] }, instr: 'You are a revenue analyst. Translate questions into read-only SQL against the warehouse, run them, and answer with one chart and a one-paragraph takeaway. Always state the date range and any filters you applied.' },
    'ontology-curator': { name: 'Ontology Curator', color: 'blue', icon: 'ti-hierarchy-2', status: 'published', desc: 'Keeps the knowledge graph consistent and proposes new entity types.', model: 'Claude Sonnet 4.5', runs: '4.1k', last: '8m ago', goal: { objective: 'Keep duplicate entity rate under 2% across the graph.', metric: 'Duplicate rate', target: 2, current: 1.4, trend: [4.1, 3.6, 3.0, 2.4, 2.1, 1.8, 1.5, 1.4], lowerIsBetter: true }, instr: 'You maintain the company ontology. Review proposed entities, merge duplicates, and flag conflicts for a human curator. Never delete a type without approval.' },
    'outbound-sdr': { name: 'Outbound SDR', color: 'amber', icon: 'ti-mail-fast', status: 'published', desc: 'Researches leads and drafts personalized first-touch outreach.', model: 'GPT-4o', runs: '9.7k', last: '3m ago', goal: { objective: 'Get 70% of drafted emails approved by reps without edits.', metric: 'Approval without edits', target: 70, current: 71, trend: [48, 55, 58, 63, 66, 68, 70, 71] }, instr: 'You are an SDR. Research the lead, find one relevant hook, and draft a concise, personalized first-touch email under 90 words. Never fabricate facts about the prospect.' },
    'bug-reproducer': { name: 'Bug Reproducer', color: 'rose', icon: 'ti-bug', status: 'published', desc: 'Reads bug reports, reproduces them in a sandbox, and attaches logs.', model: 'Claude Sonnet 4.5', runs: '1.3k', last: '22m ago', goal: { objective: 'Reproduce 60% of reported bugs with logs attached within 5 minutes.', metric: 'Reproduction rate', target: 60, current: 52, trend: [30, 38, 41, 45, 47, 50, 49, 52] }, instr: 'You are a coding agent. Reproduce the reported bug in the sandbox, capture logs, identify the root cause and propose a minimal fix as a pull request.' },
    'invoice-reconciler': { name: 'Invoice Reconciler', color: 'orange', icon: 'ti-file-invoice', status: 'published', desc: 'Matches invoices to payments and flags discrepancies for finance.', model: 'Gemini 2.5 Flash', runs: '18.9k', last: '1m ago', goal: { objective: 'Match 97% of invoices automatically with zero false “paid” marks.', metric: 'Auto-match rate', target: 97, current: 97.4, trend: [91, 93, 94, 95, 96, 96.5, 97, 97.4] }, instr: 'You reconcile invoices. Match each invoice to payments, explain any variance over $5, and never mark an invoice paid without a matching transaction ID.' }
  };
  let current = 'support-triage';
  const state = { evalGoal: null, deployed: false, notifUnread: 3 };
  const editor = q('[data-section="instructions"] .instr-editor');
  const thread = q('#thread');
  AGENTS['support-triage'].instr = editor.innerHTML;
  AGENTS['support-triage'].threadHTML = thread.innerHTML;

  function agent() { return AGENTS[current]; }

  function selectAgent(handle) {
    const a = AGENTS[handle]; if (!a) return;
    if (AGENTS[current]) { AGENTS[current].threadHTML = thread.innerHTML; AGENTS[current].runs_ = runs.slice(); persistThreads(); }
    current = handle;
    runs.length = 0; (a.runs_ || []).forEach(r => runs.push(r));
    qa('.ag-link').forEach(l => l.classList.toggle('active', l.dataset.agent === handle));
    const tile = q('.hero-tile'); tile.style.background = COLOR_BG[a.color]; tile.style.color = COLORS[a.color]; q('i', tile).className = 'ti ' + a.icon;
    q('.hero-name').textContent = a.name;
    q('.hero-handle').innerHTML = '@<b>' + esc(handle) + '</b> \u00b7 ' + esc(a.desc);
    q('.work-top .crumbs b').textContent = a.name;
    const badge = q('.work-top .crumbs .m-badge');
    badge.className = 'm-badge ' + (a.status === 'published' ? 'good' : 'warn') + ' sm'; badge.innerHTML = '<span class="dot"></span> ' + (a.status === 'published' ? 'Published' : 'Draft');
    if (handle === 'support-triage') editor.innerHTML = a.instr; else editor.textContent = a.instr;
    q('.model-pick[data-slot="primary"] .mn').textContent = a.model;
    q('.test-head [data-pane-meta="test"]').textContent = a.model.toLowerCase().replace(/\s+/g, '-') + ' \u00b7 ' + a.status;
    q('#composerInput').placeholder = 'Message ' + a.name + '\u2026';
    thread.innerHTML = a.threadHTML || '<div class="thread-empty"><i class="ti ti-flask"></i>Send a message or pick a preset to test <b>' + esc(a.name) + '</b>.</div>';
    state.deployed = a.status === 'published';
    renderRuns(); readiness();
    document.dispatchEvent(new CustomEvent('nexus:agent', { detail: { handle, agent: a } }));
  }
  function persistThreads() { try { const o = {}; for (const h in AGENTS) if (AGENTS[h].threadHTML) o[h] = AGENTS[h].threadHTML; localStorage.setItem('nexus-threads', JSON.stringify(o)); } catch (e) {} }
  try { const saved = JSON.parse(localStorage.getItem('nexus-threads') || '{}'); for (const h in saved) if (AGENTS[h]) AGENTS[h].threadHTML = saved[h]; if (saved['support-triage']) thread.innerHTML = saved['support-triage']; } catch (e) {}
  document.addEventListener('click', e => { const l = e.target.closest('.ag-link[data-agent]'); if (l) selectAgent(l.dataset.agent); });

  function registerAgent(w) {
    let h = w.handle || 'agent', n = 2; while (AGENTS[h]) h = (w.handle || 'agent') + '-' + n++; w.handle = h;
    AGENTS[w.handle] = { name: w.name, color: w.color, icon: w.icon, status: 'draft', desc: w.desc || 'New agent.', model: w.model, runs: '0', last: '\u2014', instr: w.instr, goal: w.goal ? Object.assign({ current: null, trend: [] }, w.goal) : null, tools: w.tools };
    const label = q('.rail-list .rl-group-label'); const gc = q('.gc', label); gc.textContent = String((+gc.textContent || 0) + 1);
    label.after(elFrom('<div class="ag-link" data-agent="' + esc(w.handle) + '"><div class="ag-tile-sm" style="background:' + COLOR_BG[w.color] + '; color:' + COLORS[w.color] + '"><i class="ti ' + w.icon + '"></i></div><div class="nm">' + esc(w.name) + '</div><span class="st" style="background:var(--warn)"></span></div>'));
    q('.sb-foot-meta').textContent = Object.keys(AGENTS).length + ' agents';
    selectAgent(w.handle);
    if (NS.rendered.home) { NS.rendered.home = false; }
  }

  /* ───────── readiness (derived from config DOM) ───────── */
  function checks() {
    const on = s => qa(s + ' [data-switch].on').length;
    return [
      ['Identity', 'add a name and description', !!q('.hero-name').textContent.trim() && !!agent().desc],
      ['Instructions', 'write instructions', editor.innerText.trim().length > 40],
      ['Tools', 'enable at least one tool', on('[data-section="tools"]') > 0],
      ['Skills', 'compose a skill', qa('[data-section="skills"] .skill').length > 0],
      ['Knowledge', 'connect a knowledge source', qa('[data-section="knowledge"] .item').length > 0],
      ['Connectors healthy', 'reauthorize ' + (qa('[data-section="connectors"] .item').find(i => q('.m-badge.warn', i)) ? q('.item-name', qa('[data-section="connectors"] .item').find(i => q('.m-badge.warn', i))).childNodes[0].textContent.trim() : 'connectors'), !qa('[data-section="connectors"] .m-badge.warn').length],
      ['Triggers', 'add a trigger', on('[data-section="triggers"]') > 0],
      ['Evaluation goal', 'add an evaluation goal', !!state.evalGoal],
      ['Deployment channel', 'publish to a channel', state.deployed]
    ];
  }
  function readiness() {
    const c = checks(), ok = c.filter(x => x[2]).length, miss = c.filter(x => !x[2]).map(x => x[1]);
    const r = q('#readiness'); if (!r) return;
    const t = 'Agent readiness \u2014 ' + ok + ' of ' + c.length + ' steps';
    const msg = miss.length ? (miss.length === 1 ? miss[0] : miss.slice(0, -1).join(', ') + ' and ' + miss[miss.length - 1]) : '';
    const s = miss.length ? msg[0].toUpperCase() + msg.slice(1) + ' to publish.' : 'Everything is in place. Publish when ready.';
    if (q('.rt', r).textContent !== t) q('.rt', r).textContent = t;
    if (q('.rs', r).textContent !== s) q('.rs', r).textContent = s;
    q('.bar', r).style.width = Math.round(ok / c.length * 100) + '%';
  }
  function readinessSheet() {
    const rows = checks().map(c => '<div class="chk"><div class="chk-mark ' + (c[2] ? 'ok' : 'miss') + '"><i class="ti ' + (c[2] ? 'ti-check' : 'ti-alert-triangle') + '"></i></div><div class="chk-body"><div class="chk-name">' + esc(c[0]) + '</div><div class="chk-desc">' + (c[2] ? 'Done' : esc(c[1][0].toUpperCase() + c[1].slice(1))) + '</div></div></div>').join('');
    shell('modal', '<div class="m-modal">' + head('ti-progress-check', '', '', 'Readiness checklist', 'What the agent needs before it can go live.') + '<div class="ov-body ready-list">' + rows + '</div><div class="ov-foot"><div class="sp"></div><button class="m-btn secondary" data-close>Close</button></div></div>');
  }
  function publishChecks() {
    const c = checks();
    const g = (n) => c.find(x => x[0] === n);
    const tools = qa('[data-section="tools"] [data-switch].on').length, guards = qa('[data-section="guardrails"] [data-switch].on').length, guardsAll = qa('[data-section="guardrails"] [data-switch]').length;
    return [
      [g('Instructions')[2] ? 'ok' : 'miss', 'Instructions defined', '~' + Math.round(editor.innerText.length / 4) + ' tokens \u00b7 ' + qa('[data-instr-pane="vars"] .vrow').length + ' variables'],
      [tools ? 'ok' : 'miss', 'Tools configured', tools + ' tools enabled'],
      [guards ? 'ok' : 'miss', 'Guardrails active', guards + ' of ' + guardsAll + ' enabled'],
      [g('Connectors healthy')[2] ? 'ok' : 'miss', 'Connectors healthy', g('Connectors healthy')[2] ? 'All tokens valid' : 'A connector needs reauthorization', g('Connectors healthy')[2] ? null : 'Fix'],
      [state.evalGoal ? 'ok' : 'miss', 'Evaluation goal', state.evalGoal ? state.evalGoal.metric + ' \u2265 ' + state.evalGoal.target : 'Recommended before production', state.evalGoal ? null : 'Add goal'],
      [state.deployed ? 'ok' : 'miss', 'Deployment channel', state.deployed ? 'Deployed' : 'Pick where runs are triggered', state.deployed ? null : 'Set below']
    ];
  }
  function onPublished(dep) {
    state.deployed = true; agent().status = 'published';
    const l = q('.ag-link[data-agent="' + current + '"] .st'); if (l) l.style.background = 'var(--good)';
    readiness();
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('.chk-act'); if (!a) return;
    const t = a.textContent.trim();
    if (t === 'Add goal') { close(); flowEval(); }
    if (t === 'Fix') { close(); expand('connectors'); const b = qa('[data-section="connectors"] .item-act .m-btn').find(x => /fix/i.test(x.textContent)); if (b) b.click(); }
  });

  /* observe config → readiness + save state */
  const save = q('#saveState'); let saveT;
  new MutationObserver(muts => {
    if (muts.every(m => m.target.closest && m.target.closest('#readiness'))) return;
    readiness();
    clearTimeout(saveT); save.classList.add('saving'); q('.txt', save).textContent = 'Saving\u2026';
    saveT = setTimeout(() => { save.classList.remove('saving'); q('.txt', save).textContent = 'Saved just now'; }, 700);
  }).observe(q('.config-inner'), { childList: true, subtree: true, attributes: true, attributeFilter: ['class'], characterData: true });
  q('.config').addEventListener('input', () => { clearTimeout(saveT); save.classList.add('saving'); q('.txt', save).textContent = 'Saving\u2026'; saveT = setTimeout(() => { save.classList.remove('saving'); q('.txt', save).textContent = 'Saved just now'; readiness(); }, 700); });

  /* ───────── popover menu ───────── */
  let pop;
  function closePop() { if (pop) { pop.remove(); pop = null; } }
  document.addEventListener('mousedown', e => { if (pop && !pop.contains(e.target)) closePop(); });
  function menu(anchor, items) {
    closePop();
    pop = elFrom('<div class="m-menu pop-menu">' + items.map(i => i === '-' ? '<div class="m-menu-sep"></div>' : '<div class="m-menu-item' + (i[2] ? ' danger' : '') + '" data-mi="' + esc(i[0]) + '"><i class="ti ' + i[1] + ' ic"></i>' + esc(i[0]) + '</div>').join('') + '</div>');
    document.body.appendChild(pop);
    const r = anchor.getBoundingClientRect(); pop.style.top = (r.bottom + 6) + 'px'; pop.style.left = Math.min(r.right - pop.offsetWidth, window.innerWidth - pop.offsetWidth - 12) + 'px';
    return new Promise(res => pop.addEventListener('click', e => { const mi = e.target.closest('[data-mi]'); if (mi) { closePop(); res(mi.dataset.mi); } }));
  }
  function overflowMenu(btn) {
    const row = btn.closest('.skill, .item'); const section = row.closest('[data-section]').dataset.section;
    menu(btn, [['Edit', 'ti-pencil'], ['Duplicate', 'ti-copy'], ['Open in library', 'ti-arrow-up-right'], '-', ['Remove', 'ti-trash', true]]).then(k => {
      const name = q('.item-name', row).textContent.trim();
      if (k === 'Remove') { row.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateX(8px)' }], { duration: 180 }).onfinish = () => { row.remove(); bumpCount(section, -1); }; toast('Removed "' + name + '"', 'ti-trash'); }
      if (k === 'Duplicate') { const c = row.cloneNode(true); q('.item-name', c).childNodes[0].textContent = name + ' (copy)'; qa('[data-switch]', c).forEach(wireSwitch); row.after(c); bumpCount(section, 1); toast('Duplicated', 'ti-copy'); }
      if (k === 'Edit') editRow(row);
      if (k === 'Open in library') { NS.showView(section); setTimeout(() => window.NexusFeatures.openDetail(name, section), 60); }
    });
  }
  function editRow(row) {
    const nameEl = q('.item-name', row), descEl = q('.item-desc', row);
    const p = shell('modal', '<div class="m-modal">' + head('ti-pencil', '', '', 'Edit', 'Changes apply to this agent only.') + '<div class="ov-body"><div class="fld"><label class="fld-label">Name</label><input class="m-input" data-n value="' + esc(nameEl.childNodes[0].textContent.trim()) + '"></div><div class="fld"><label class="fld-label">Description</label><textarea class="m-textarea" data-d>' + esc(descEl ? descEl.textContent : '') + '</textarea></div></div><div class="ov-foot"><div class="sp"></div><button class="m-btn ghost" data-close>Cancel</button><button class="m-btn primary" data-save>Save</button></div></div>');
    q('[data-save]', p).addEventListener('click', () => { nameEl.childNodes[0].textContent = q('[data-n]', p).value; if (descEl) descEl.textContent = q('[data-d]', p).value; close(); toast('Saved'); });
  }

  /* ───────── identity editor ───────── */
  function flowIdentity() {
    const a = agent(); let color = a.color, icon = a.icon;
    const p = shell('modal', '<div class="m-modal lg">' + head('ti-id-badge', '', '', 'Agent identity', 'Name, handle, description and how it looks across the workspace.') +
      '<div class="ov-body"><div style="display:flex;gap:18px;align-items:flex-start"><div class="wz-preview-tile" data-pt style="background:' + COLOR_BG[color] + ';color:' + COLORS[color] + '"><i class="ti ' + icon + '"></i></div><div style="flex:1">' +
      '<div class="fld"><label class="fld-label">Name</label><input class="m-input" data-n value="' + esc(a.name) + '"></div>' +
      '<div class="fld"><label class="fld-label">Handle</label><div class="m-input-group"><span style="color:var(--ink-400)">@</span><input data-h value="' + esc(current) + '"></div></div></div></div>' +
      '<div class="fld"><label class="fld-label">Description</label><textarea class="m-textarea" data-d>' + esc(a.desc) + '</textarea></div>' +
      '<div class="fld"><label class="fld-label">Color</label><div class="swatch-row">' + Object.keys(COLORS).map(c => '<div class="swatch' + (c === color ? ' sel' : '') + '" data-c="' + c + '" style="background:' + COLORS[c] + '"></div>').join('') + '</div></div>' +
      '<div class="fld"><label class="fld-label">Icon</label><div class="icon-row">' + NS.ICONS.map(i => '<div class="icon-pick' + (i === icon ? ' sel' : '') + '" data-i="' + i + '"><i class="ti ' + i + '"></i></div>').join('') + '</div></div></div>' +
      '<div class="ov-foot"><div class="sp"></div><button class="m-btn ghost" data-close>Cancel</button><button class="m-btn primary" data-save><i class="ti ti-check"></i> Save</button></div></div>');
    const pt = q('[data-pt]', p);
    qa('[data-c]', p).forEach(s => s.addEventListener('click', () => { color = s.dataset.c; qa('[data-c]', p).forEach(x => x.classList.toggle('sel', x === s)); pt.style.background = COLOR_BG[color]; pt.style.color = COLORS[color]; }));
    qa('[data-i]', p).forEach(s => s.addEventListener('click', () => { icon = s.dataset.i; qa('[data-i]', p).forEach(x => x.classList.toggle('sel', x === s)); pt.innerHTML = '<i class="ti ' + icon + '"></i>'; }));
    q('[data-save]', p).addEventListener('click', () => {
      a.name = q('[data-n]', p).value.trim() || a.name; a.desc = q('[data-d]', p).value.trim(); a.color = color; a.icon = icon;
      const l = q('.ag-link[data-agent="' + current + '"]'); if (l) { q('.nm', l).textContent = a.name; const t = q('.ag-tile-sm', l); t.style.background = COLOR_BG[color]; t.style.color = COLORS[color]; q('i', t).className = 'ti ' + icon; }
      selectAgent(current); close(); toast('Identity updated', 'ti-id-badge');
    });
  }
  q('.hero-name').addEventListener('input', () => { agent().name = q('.hero-name').textContent.trim(); const l = q('.ag-link[data-agent="' + current + '"] .nm'); if (l) l.textContent = agent().name; q('.work-top .crumbs b').textContent = agent().name; });

  /* ───────── variables ───────── */
  function addVariable() {
    const p = shell('modal', '<div class="m-modal">' + head('ti-variable', '', '', 'Add variable', 'Filled in fresh on every run.') +
      '<div class="ov-body"><div class="fld"><label class="fld-label">Name</label><div class="m-input-group"><span style="color:var(--ink-400);font-family:var(--font-mono)">{{</span><input data-n placeholder="customer_tier"><span style="color:var(--ink-400);font-family:var(--font-mono)">}}</span></div></div>' +
      '<div class="fld"><label class="fld-label">Description</label><input class="m-input" data-d placeholder="What this value represents"></div>' +
      '<div class="fld"><label class="fld-label">Source</label><div class="opt-list">' + [['ti-settings', 'Agent setting', 'A fixed value set in this builder'], ['ti-bolt', 'Trigger payload', 'Read from the event that started the run'], ['ti-key', 'Secret', 'Pulled from the workspace vault at run time']].map((s, i) => '<div class="trig-opt' + (i === 1 ? ' sel' : '') + '" data-src="' + s[1] + '"><div class="to-ic"><i class="ti ' + s[0] + '"></i></div><div><div class="to-name">' + s[1] + '</div><div class="to-desc">' + s[2] + '</div></div></div>').join('') + '</div></div>' +
      '<div class="fld"><label class="fld-label">Test value</label><input class="m-input" data-t placeholder="Used only in the Test panel"></div></div>' +
      '<div class="ov-foot"><div class="sp"></div><button class="m-btn ghost" data-close>Cancel</button><button class="m-btn primary" data-save>Add variable</button></div></div>');
    let src = 'Trigger payload';
    qa('[data-src]', p).forEach(o => o.addEventListener('click', () => { src = o.dataset.src; qa('[data-src]', p).forEach(x => x.classList.toggle('sel', x === o)); }));
    q('[data-save]', p).addEventListener('click', () => {
      const n = q('[data-n]', p).value.trim().replace(/[^a-z0-9_]/gi, '_').toLowerCase(); if (!n) return;
      const icon = { 'Agent setting': 'ti-settings', 'Trigger payload': 'ti-bolt', 'Secret': 'ti-key' }[src];
      q('[data-add-var]').before(elFrom('<div class="vrow"><div class="vk"><span class="vtok">{{' + esc(n) + '}}</span></div><div class="vmeta"><div class="vdesc">' + esc(q('[data-d]', p).value || 'No description') + '</div><div class="vsrc"><i class="ti ' + icon + '" style="font-size:12px"></i> Source: ' + src + '</div></div><div class="vtest"><div class="vlbl">TEST VALUE</div><input class="m-input" value="' + esc(q('[data-t]', p).value) + '"></div></div>'));
      q('.var-chips').appendChild(elFrom('<span class="m-chip"><i class="ti ti-variable" style="font-size:13px; color:var(--accent)"></i> ' + esc(n) + '</span>'));
      const cnt = qa('.instr-foot .tk')[2]; if (cnt) cnt.textContent = qa('[data-instr-pane="vars"] .vrow').length + ' variables';
      close(); toast('{{' + n + '}} added \u2014 use it in the prompt', 'ti-variable');
    });
  }

  /* ───────── triggers (2-step) ───────── */
  const TRIG = [
    ['ti-inbox', 'Inbound ticket', 'Run when a ticket lands in a chosen view.', () => '<div class="fld"><label class="fld-label">Connector</label><select class="m-input" data-f1><option>Zendesk</option><option>Intercom</option></select></div><div class="fld"><label class="fld-label">View</label><input class="m-input" data-f2 value="Tier 1"></div>', v => ['New ' + v[0] + ' ticket', 'Fires whenever a ticket lands in the \u201c' + v[1] + '\u201d view.']],
    ['ti-webhook', 'Webhook', 'Run on a POST to a generated URL.', () => '<div class="fld"><label class="fld-label">Endpoint</label><div class="copy-row"><span>https://api.nexus.ai/hooks/' + current + '/' + Math.random().toString(36).slice(2, 10) + '</span><i class="ti ti-copy" data-copy></i></div></div><div class="fld"><label class="fld-label">Signing secret</label><div class="copy-row"><span>whsec_\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022</span><i class="ti ti-eye" data-copy></i></div></div><div class="fld"><label class="fld-label">Name</label><input class="m-input" data-f1 value="Custom webhook"></div>', v => [v[0], 'Inbound webhook \u00b7 HMAC-signed \u00b7 POST']],
    ['ti-clock-hour-4', 'Schedule', 'Run on a cron schedule.', () => '<div class="fld"><label class="fld-label">Frequency</label><div class="cron-row">' + ['Every hour', 'Daily 9:00', 'Weekdays 8:00', 'Every 15 min'].map((c, i) => '<span class="preset' + (i === 1 ? ' on' : '') + '" data-cron="' + c + '">' + c + '</span>').join('') + '</div><input class="m-input" data-f1 value="0 9 * * *" style="font-family:var(--font-mono)"></div><div class="fld"><label class="fld-label">Timezone</label><select class="m-input" data-f2><option>America/Los_Angeles</option><option>UTC</option><option>Europe/London</option></select></div>', v => ['Schedule \u00b7 ' + v[0], 'Cron ' + v[0] + ' \u00b7 ' + v[1]]],
    ['ti-mail-opened', 'Inbound email', 'Run when an address receives a message.', () => '<div class="fld"><label class="fld-label">Address</label><div class="copy-row"><span>' + current + '@agents.nexus.ai</span><i class="ti ti-copy" data-copy></i></div></div><div class="fld"><label class="fld-label">Name</label><input class="m-input" data-f1 value="Inbound email"></div>', v => [v[0], 'Runs on each message to ' + current + '@agents.nexus.ai']],
    ['ti-hand-click', 'Manual / API', 'Run on demand from the API or dashboard.', () => '<div class="fld"><label class="fld-label">Invoke</label><div class="pv-code">curl -X POST https://api.nexus.ai/v1/agents/' + current + '/runs \\\n  -H "Authorization: Bearer $NEXUS_KEY" \\\n  -d \'{"input": "\u2026"}\'</div></div>', () => ['Manual / API', 'On-demand runs from the dashboard or REST API.']]
  ];
  function flowTrigger() {
    const list = TRIG.map((t, i) => '<div class="trig-opt" data-t="' + i + '"><div class="to-ic"><i class="ti ' + t[0] + '"></i></div><div><div class="to-name">' + t[1] + '</div><div class="to-desc">' + t[2] + '</div></div><i class="ti ti-chevron-right to-go"></i></div>').join('');
    const p = shell('modal', '<div class="m-modal lg">' + head('ti-bolt', '', '', 'Add a trigger', 'Choose what starts a run of this agent.') + '<div class="ov-body">' + list + '</div></div>');
    qa('[data-t]', p).forEach(o => o.addEventListener('click', () => {
      const t = TRIG[+o.dataset.t];
      const p2 = shell('modal', '<div class="m-modal lg">' + head(t[0], '', '', t[1], t[2]) + '<div class="ov-body">' + t[3]() + '</div><div class="ov-foot"><button class="m-btn ghost" data-back><i class="ti ti-arrow-left"></i> Back</button><div class="sp"></div><button class="m-btn primary" data-save><i class="ti ti-check"></i> Add trigger</button></div></div>');
      q('[data-back]', p2).addEventListener('click', flowTrigger);
      qa('[data-copy]', p2).forEach(c => c.addEventListener('click', () => toast('Copied')));
      qa('[data-cron]', p2).forEach(c => c.addEventListener('click', () => { qa('[data-cron]', p2).forEach(x => x.classList.toggle('on', x === c)); q('[data-f1]', p2).value = { 'Every hour': '0 * * * *', 'Daily 9:00': '0 9 * * *', 'Weekdays 8:00': '0 8 * * 1-5', 'Every 15 min': '*/15 * * * *' }[c.dataset.cron]; }));
      q('[data-save]', p2).addEventListener('click', () => {
        const v = [q('[data-f1]', p2), q('[data-f2]', p2)].map(x => x ? x.value : '');
        const [n, d] = t[4](v);
        const row = elFrom('<div class="item"><div class="item-ic"><i class="ti ' + t[0] + '"></i></div><div class="item-body"><div class="item-name">' + esc(n) + '</div><div class="item-desc">' + esc(d) + '</div></div><div class="item-act"><div class="m-switch on" data-switch></div><button class="m-btn icon ghost sm"><i class="ti ti-dots"></i></button></div></div>');
        wireSwitch(q('[data-switch]', row)); insertBeforeAddRow('triggers', row); bumpCount('triggers', 1); expand('triggers');
        close(); toast('"' + n + '" trigger added', 'ti-bolt');
      });
    }));
  }

  /* ───────── evaluation goal ───────── */
  const METRICS = [['Resolution without escalation', '%', 70, 'Share of runs that close the ticket with no human hand-off'], ['Answer groundedness', '%', 90, 'Replies cite a retrieved source for every factual claim'], ['Escalation precision', '%', 85, 'Escalations a human agreed were necessary'], ['CSAT', '/5', 4.5, 'Customer rating on the drafted reply']];
  function flowEval() {
    let mi = 0;
    const p = shell('modal', '<div class="m-modal lg">' + head('ti-target-arrow', '', '', 'Set an evaluation goal', 'Runs against a dataset on every publish; blocks production if it fails.') +
      '<div class="ov-body"><div class="fld"><label class="fld-label">Metric</label><div class="opt-list">' + METRICS.map((m, i) => '<div class="trig-opt' + (i === 0 ? ' sel' : '') + '" data-m="' + i + '"><div><div class="to-name">' + m[0] + '</div><div class="to-desc">' + m[3] + '</div></div><span class="item-tag" style="margin-left:auto">target ' + m[2] + m[1] + '</span></div>').join('') + '</div></div>' +
      '<div class="frow two"><div class="fld"><label class="fld-label">Target</label><input class="m-input" data-t value="70" type="number"></div><div class="fld"><label class="fld-label">Dataset</label><select class="m-input" data-ds><option>Golden tickets \u00b7 240 cases</option><option>Angry customers \u00b7 96 cases</option><option>Last 7 days sample \u00b7 500 cases</option></select></div></div>' +
      '<div class="fld"><label class="fld-label">Run</label><div class="m-seg"><button class="on">On every publish</button><button>Nightly</button><button>Manual</button></div></div></div>' +
      '<div class="ov-foot"><div class="sp"></div><button class="m-btn ghost" data-close>Cancel</button><button class="m-btn primary" data-save><i class="ti ti-check"></i> Save goal</button></div></div>');
    qa('[data-m]', p).forEach(o => o.addEventListener('click', () => { mi = +o.dataset.m; qa('[data-m]', p).forEach(x => x.classList.toggle('sel', x === o)); q('[data-t]', p).value = METRICS[mi][2]; }));
    q('[data-save]', p).addEventListener('click', () => {
      const m = METRICS[mi]; state.evalGoal = { metric: m[0], target: q('[data-t]', p).value + m[1], dataset: q('[data-ds]', p).value };
      const row = elFrom('<div class="item"><div class="item-ic"><i class="ti ti-target-arrow"></i></div><div class="item-body"><div class="item-name">' + esc(m[0]) + ' <span class="m-badge sm">Goal \u2265 ' + esc(state.evalGoal.target) + '</span></div><div class="item-desc">' + esc(state.evalGoal.dataset) + ' \u00b7 runs on every publish</div></div><div class="item-act"><button class="m-btn secondary sm" data-run-eval><i class="ti ti-player-play"></i> Run now</button><button class="m-btn icon ghost sm"><i class="ti ti-dots"></i></button></div></div>');
      insertBeforeAddRow('evaluation', row); bumpCount('evaluation', 1); expand('evaluation');
      q('[data-run-eval]', row).addEventListener('click', ev => { ev.stopPropagation(); runEval(row, m, state.evalGoal); });
      close(); toast('Evaluation goal saved', 'ti-target-arrow'); readiness();
    });
  }
  function runEval(row, m, goal) {
    const b = q('[data-run-eval]', row); b.disabled = true; b.innerHTML = '<span class="m-spin" style="width:13px;height:13px;border-width:2px"></span> Running\u2026';
    const old = row.nextElementSibling && row.nextElementSibling.classList.contains('eval-result') ? row.nextElementSibling : null; if (old) old.remove();
    setTimeout(() => {
      const target = parseFloat(goal.target), val = m[1] === '/5' ? (target + 0.1).toFixed(1) : String(Math.min(99, target + 3));
      row.after(elFrom('<div class="eval-result"><div class="big">' + val + '<small>' + m[1] + '</small></div><div style="flex:1"><div style="font-size:var(--fs-sm);font-weight:600">Pass \u00b7 ' + esc(goal.dataset.split(' \u00b7 ')[0]) + '</div><div style="font-size:var(--fs-xs);color:var(--ink-600)">Target \u2265 ' + esc(goal.target) + ' \u00b7 ' + goal.dataset.split(' \u00b7 ')[1] + ' \u00b7 just now</div></div><span class="m-badge good sm"><span class="dot"></span> Passing</span><button class="m-btn ghost sm" data-open-exp>Open experiment</button></div>'));
      q('[data-open-exp]', row.nextElementSibling).addEventListener('click', () => NS.showView('evals'));
      b.disabled = false; b.innerHTML = '<i class="ti ti-player-play"></i> Run again'; toast('Evaluation passed', 'ti-target-arrow');
    }, 1800);
  }

  /* ───────── connector manage ───────── */
  const SCOPES = { Slack: [['chat:write', 'Post messages to channels'], ['channels:read', 'List public channels'], ['users:read', 'Resolve on-call user']], GitHub: [['issues:write', 'Open and comment on issues'], ['contents:read', 'Read repository files'], ['pull_requests:write', 'Open pull requests']], Zendesk: [['tickets:read', 'Read ticket threads'], ['tickets:write', 'Add private notes'], ['users:read', 'Look up requester profile']] };
  function manageConnector(name, row) {
    const sc = SCOPES[name] || [['read', 'Read data on your behalf'], ['write', 'Take actions you approve']];
    const p = shell('drawer', '<div class="m-drawer">' + head('ti-plug-connected', '', '', name, 'Connected via MCP \u00b7 workspace: nexus') +
      '<div class="ov-body"><div class="kv"><span class="k">Status</span><span class="v"><span class="m-badge good sm"><span class="dot"></span> Connected</span></span><span class="k">Authorized by</span><span class="v">admin \u00b7 Mar 28</span><span class="k">Server</span><span class="v mono">mcp://connectors.nexus.ai/' + esc(name.toLowerCase()) + '</span><span class="k">Used by</span><span class="v">' + NS.usedStack(2) + '</span></div>' +
      '<div class="cat-label"><span>Scopes</span><span class="ln"></span></div>' + sc.map(s => '<div class="scope-row"><div class="sb"><div class="mono">' + s[0] + '</div><div class="sd">' + s[1] + '</div></div><div class="m-switch on" data-switch></div></div>').join('') +
      '<div class="cat-label" style="margin-top:22px"><span>Health</span><span class="ln"></span></div><div class="kv"><span class="k">Last call</span><span class="v">14s ago \u00b7 200 OK</span><span class="k">Error rate (24h)</span><span class="v">0.2%</span><span class="k">Token expires</span><span class="v">in 41 days</span></div><button class="m-btn secondary sm" data-test><i class="ti ti-activity"></i> Test connection</button>' +
      '<div class="danger-zone"><div class="dz"><b>Disconnect ' + esc(name) + '</b><span>Agents using it will fail on their next call.</span></div><button class="m-btn danger sm" data-disc>Disconnect</button></div></div>' +
      '<div class="ov-foot"><div class="sp"></div><button class="m-btn secondary" data-close>Done</button></div></div>');
    qa('[data-switch]', p).forEach(wireSwitch);
    q('[data-test]', p).addEventListener('click', e => { const b = e.currentTarget; b.innerHTML = '<span class="m-spin" style="width:13px;height:13px;border-width:2px"></span> Testing\u2026'; setTimeout(() => { b.innerHTML = '<i class="ti ti-circle-check" style="color:var(--good)"></i> Healthy \u00b7 182ms'; }, 900); });
    q('[data-disc]', p).addEventListener('click', () => { if (row) { row.remove(); bumpCount('connectors', -1); } close(); toast(name + ' disconnected', 'ti-plug-connected-x'); });
  }

  /* ───────── preview (end-user widget) ───────── */
  function preview() {
    const a = agent();
    const p = shell('modal', '<div class="m-modal xl">' + head('ti-eye', '', '', 'Preview \u2014 ' + a.name, 'Exactly what an end user sees. Runs against the current draft.') +
      '<div class="ov-body"><div class="pv-wrap"><div class="pv-widget"><div class="pv-head"><div class="ag-tile-sm" style="background:' + COLOR_BG[a.color] + ';color:' + COLORS[a.color] + '"><i class="ti ' + a.icon + '"></i></div><div><div class="n">' + esc(a.name) + '</div><div class="s"><span class="dot" style="width:6px;height:6px;border-radius:50%;background:var(--good);display:inline-block"></span> Online</div></div></div>' +
      '<div class="pv-thread" data-pvt><div class="msg agent"><div class="bub">Hi! I\u2019m ' + esc(a.name) + '. ' + esc(a.desc.split('.')[0]) + '. How can I help?</div></div></div>' +
      '<div class="pv-foot"><div class="composer"><textarea rows="1" placeholder="Type a message\u2026" data-pvi></textarea><button class="composer-send" data-pvs><i class="ti ti-arrow-up"></i></button></div></div></div>' +
      '<div class="pv-side"><div class="fld"><label class="fld-label">Share link</label><div class="copy-row"><span>nexus.ai/p/' + esc(current) + '?v=draft</span><i class="ti ti-copy" data-copy></i></div></div>' +
      '<div class="fld"><label class="fld-label">Embed</label><div class="pv-code">&lt;script src="https://cdn.nexus.ai/widget.js"\n  data-agent="' + esc(current) + '"\n  data-theme="auto"&gt;&lt;/script&gt;</div></div>' +
      '<div class="fld"><label class="fld-label">Channels</label>' + [['ti-world', 'Web widget', true], ['ti-brand-slack', 'Slack app', true], ['ti-api', 'REST API', true], ['ti-message', 'Intercom messenger', false]].map(c => '<div class="scope-row"><i class="ti ' + c[0] + '" style="color:var(--ink-600)"></i><div class="sb"><div style="font-size:var(--fs-sm);font-weight:500">' + c[1] + '</div></div><div class="m-switch' + (c[2] ? ' on' : '') + '" data-switch></div></div>').join('') + '</div></div></div></div>' +
      '<div class="ov-foot"><button class="m-btn ghost" data-ext><i class="ti ti-external-link"></i> Open in new tab</button><div class="sp"></div><button class="m-btn secondary" data-close>Close</button></div></div>');
    qa('[data-switch]', p).forEach(wireSwitch);
    qa('[data-copy]', p).forEach(c => c.addEventListener('click', () => toast('Copied')));
    q('[data-ext]', p).addEventListener('click', () => toast('Opens the hosted preview in a new tab', 'ti-external-link'));
    const t = q('[data-pvt]', p), i = q('[data-pvi]', p);
    const send = () => { const v = i.value.trim(); if (!v) return; i.value = ''; t.appendChild(elFrom('<div class="msg user"><div class="bub">' + esc(v) + '</div></div>')); const th = elFrom('<div class="msg agent"><div class="thinking"><span></span><span></span><span></span></div></div>'); t.appendChild(th); t.scrollTop = 1e6; setTimeout(() => { th.innerHTML = '<div class="bub">Thanks \u2014 I\u2019ve looked into that. ' + (/refund|charge|invoice/i.test(v) ? 'I can see the charge and have flagged it to billing; you\u2019ll hear back within one business day.' : 'Here\u2019s what I found in our help center, and I\u2019m happy to go deeper if that doesn\u2019t cover it.') + '</div>'; t.scrollTop = 1e6; }, 1100); };
    q('[data-pvs]', p).addEventListener('click', send); i.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
  }

  /* ───────── notifications ───────── */
  const NOTIFS = [
    ['warn', 'ti-plug-connected-x', 'Zendesk token expired', 'Support Triage can\u2019t read tickets until it\u2019s reauthorized.', '12m ago', () => { NS.showView('agents'); selectAgent('support-triage'); expand('connectors'); }],
    ['bad', 'ti-alert-triangle', 'Run failed \u00b7 Bug Reproducer', 'run_python timed out after 30s on issue #4471.', '41m ago', () => NS.showView('analytics')],
    ['good', 'ti-rocket', 'Outbound SDR v12 published', 'Deployed to production by m.chen.', '2h ago', () => { NS.showView('agents'); selectAgent('outbound-sdr'); }],
    ['', 'ti-target-arrow', 'Nightly eval passed', 'Invoice Reconciler \u00b7 groundedness 94% (target 90%).', 'Yesterday', () => NS.showView('evals')],
    ['', 'ti-user-plus', 'Priya joined the workspace', 'Invited by admin as Editor.', '2 days ago', () => flowSettings('Members')]
  ];
  function flowNotifications() {
    const p = shell('drawer', '<div class="m-drawer">' + head('ti-bell', '', '', 'Notifications', state.notifUnread + ' unread') + '<div class="ov-body">' + NOTIFS.map((n, i) => '<div class="notif ' + n[0] + (i < state.notifUnread ? ' unread' : '') + '" data-n="' + i + '"><div class="ni"><i class="ti ' + n[1] + '"></i></div><div class="nb"><div class="nt">' + esc(n[2]) + '</div><div class="nd">' + esc(n[3]) + '</div><div class="nm">' + n[4] + '</div></div></div>').join('') + '</div><div class="ov-foot"><button class="m-btn ghost sm" data-all>Mark all read</button><div class="sp"></div><button class="m-btn secondary" data-close>Done</button></div></div>');
    qa('[data-n]', p).forEach(n => n.addEventListener('click', () => { close(); NOTIFS[+n.dataset.n][5](); }));
    q('[data-all]', p).addEventListener('click', () => { state.notifUnread = 0; qa('.notif', p).forEach(x => x.classList.remove('unread')); const d = q('.strip-dot'); if (d) d.remove(); toast('All caught up'); });
  }

  /* ───────── settings ───────── */
  const SET_TABS = {
    Workspace: () => '<div class="set-row"><div class="sk"><div class="n">Workspace name</div><div class="d">Shown in the sidebar and share links</div></div><input class="m-input" value="Project Nexus"></div><div class="set-row"><div class="sk"><div class="n">Default model</div><div class="d">Pre-selected for new agents</div></div><select class="m-input"><option>Claude Sonnet 4.5</option><option>Claude Opus 4.1</option><option>GPT-4o</option></select></div><div class="set-row"><div class="sk"><div class="n">Data region</div><div class="d">Where runs and memory are stored</div></div><select class="m-input"><option>US-West</option><option>EU-Central</option></select></div><div class="set-row"><div class="sk"><div class="n">Require approval for production publishes</div><div class="d">A second admin must approve</div></div><div class="m-switch on" data-switch></div></div><div class="set-row"><div class="sk"><div class="n">Trace retention</div><div class="d">How long full traces are kept</div></div><select class="m-input"><option>30 days</option><option>90 days</option><option>1 year</option></select></div>',
    'API keys': () => [['nx_live_\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022 4f2a', 'Production', 'admin \u00b7 Mar 12'], ['nx_test_\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022 91cc', 'Staging', 'm.chen \u00b7 Apr 2'], ['nx_live_\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022 0b7e', 'CI pipeline', 'admin \u00b7 Apr 9']].map(k => '<div class="key-row"><i class="ti ti-key" style="color:var(--ink-500)"></i><div style="flex:1"><div style="font-size:var(--fs-sm);font-weight:600">' + k[1] + '</div><div class="mono">' + k[0] + ' \u00b7 ' + k[2] + '</div></div><button class="m-btn ghost sm" data-revoke>Revoke</button></div>').join('') + '<button class="m-btn secondary sm" style="margin-top:14px" data-newkey><i class="ti ti-plus"></i> Create key</button>',
    Members: () => [['AD', 'admin', 'Owner', 'var(--cat-teal)'], ['MC', 'm.chen', 'Admin', 'var(--cat-plum)'], ['PR', 'priya', 'Editor', 'var(--cat-amber)'], ['JL', 'j.lee', 'Viewer', 'var(--cat-blue)']].map(m => '<div class="member"><div class="av" style="background:' + m[3] + '">' + m[0] + '</div><div class="mn">' + m[1] + '<small>' + m[1] + '@nexus.ai</small></div><select class="m-input" style="width:120px;padding:6px 10px"><option' + (m[2] === 'Owner' ? ' selected' : '') + '>Owner</option><option' + (m[2] === 'Admin' ? ' selected' : '') + '>Admin</option><option' + (m[2] === 'Editor' ? ' selected' : '') + '>Editor</option><option' + (m[2] === 'Viewer' ? ' selected' : '') + '>Viewer</option></select></div>').join('') + '<button class="m-btn secondary sm" style="margin-top:14px" data-invite><i class="ti ti-user-plus"></i> Invite member</button>',
    Billing: () => '<div class="lib-stats" style="grid-template-columns:1fr 1fr 1fr;margin-bottom:16px">' + NS.statCard('$612', '', 'Spend this month') + NS.statCard('$1,500', '', 'Monthly budget') + NS.statCard('41', '%', 'Used') + '</div><div class="m-progress accent" style="margin-bottom:18px"><span style="width:41%"></span></div><div class="set-row"><div class="sk"><div class="n">Hard budget cap</div><div class="d">Pause all agents when the budget is reached</div></div><div class="m-switch" data-switch></div></div><div class="set-row"><div class="sk"><div class="n">Alert at</div><div class="d">Email owners when spend crosses</div></div><select class="m-input"><option>80%</option><option>90%</option><option>100%</option></select></div>'
  };
  function flowSettings(tab) {
    tab = tab || 'Workspace';
    const p = shell('modal', '<div class="m-modal lg">' + head('ti-settings', '', '', 'Workspace settings', 'Project Nexus \u00b7 4 members') + '<div class="ov-body"><div class="m-seg set-tabs">' + Object.keys(SET_TABS).map(t => '<button' + (t === tab ? ' class="on"' : '') + ' data-tab="' + t + '">' + t + '</button>').join('') + '</div><div data-pane></div></div><div class="ov-foot"><div class="sp"></div><button class="m-btn ghost" data-close>Cancel</button><button class="m-btn primary" data-save>Save changes</button></div></div>');
    const render = t => { q('[data-pane]', p).innerHTML = SET_TABS[t](); qa('[data-switch]', p).forEach(wireSwitch); qa('[data-revoke]', p).forEach(b => b.addEventListener('click', () => { b.closest('.key-row').remove(); toast('Key revoked', 'ti-key'); })); const nk = q('[data-newkey]', p); if (nk) nk.addEventListener('click', () => { nk.before(elFrom('<div class="key-row"><i class="ti ti-key" style="color:var(--accent)"></i><div style="flex:1"><div style="font-size:var(--fs-sm);font-weight:600">New key</div><div class="mono">nx_live_' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10) + ' \u00b7 copy it now \u2014 shown once</div></div><button class="m-btn ghost sm" data-revoke>Revoke</button></div>')); toast('Key created', 'ti-key'); }); const inv = q('[data-invite]', p); if (inv) inv.addEventListener('click', () => toast('Invite link copied', 'ti-user-plus')); };
    qa('[data-tab]', p).forEach(b => b.addEventListener('click', () => render(b.dataset.tab)));
    q('[data-save]', p).addEventListener('click', () => { close(); toast('Settings saved'); });
    render(tab);
  }

  /* ───────── rail search ───────── */
  function railSearch() {
    const box = q('.rail-search'); box.hidden = !box.hidden; if (!box.hidden) q('input', box).focus();
    else { q('input', box).value = ''; filterRail(''); }
  }
  function filterRail(v) {
    v = v.toLowerCase(); qa('.rail-list .ag-link').forEach(l => l.style.display = q('.nm', l).textContent.toLowerCase().includes(v) ? '' : 'none');
    qa('.rl-group-label').forEach(g => { let n = g.nextElementSibling, any = false; while (n && !n.classList.contains('rl-group-label')) { if (n.style.display !== 'none') any = true; n = n.nextElementSibling; } g.style.display = any ? '' : 'none'; });
  }
  q('[data-rail-filter]').addEventListener('input', e => filterRail(e.target.value));

  /* ───────── trace pane (session runs) ───────── */
  const runs = [{ ts: 'just now', prompt: 'My invoice charged me twice this month and I\u2019m pretty annoyed. Can you fix it?', status: 'escalated', ms: 1420, tok: 1812, cost: 0.011, trace: (q('.msg.agent .trace', thread) || { outerHTML: '' }).outerHTML }];
  function renderRuns() {
    const pane = q('#tracePane');
    pane.innerHTML = runs.length ? runs.map((r, i) => '<div class="run-row" data-r="' + i + '"><div class="run-head"><span class="run-st" style="background:var(--' + (r.status === 'ok' ? 'good' : r.status === 'escalated' ? 'warn' : 'bad') + ')"></span><div class="run-prompt">' + esc(r.prompt) + '</div><div class="run-meta"><span>' + r.ms + 'ms</span><span>' + r.ts + '</span></div></div><div class="run-body">' + r.trace + '<div class="run-kv"><div>Status<b>' + r.status + '</b></div><div>Latency<b>' + (r.ms / 1000).toFixed(2) + 's</b></div><div>Tokens<b>' + r.tok.toLocaleString() + '</b></div><div>Cost<b>$' + r.cost.toFixed(3) + '</b></div></div></div></div>').reverse().join('') : '<div class="thread-empty"><i class="ti ti-timeline"></i>No runs yet. Every test message shows up here with its full trace.</div>';
    qa('.run-head', pane).forEach(h => h.addEventListener('click', () => h.parentElement.classList.toggle('open')));
  }
  new MutationObserver(muts => muts.forEach(m => m.addedNodes.forEach(n => {
    if (!(n.nodeType === 1 && n.classList.contains('msg') && n.classList.contains('agent') && q('.bub', n))) return;
    const msgs = qa('.msg', thread); const idx = msgs.indexOf(n); let tr = null, prompt = '';
    for (let i = idx - 1; i >= 0; i--) { if (!tr && q('.trace', msgs[i])) tr = q('.trace', msgs[i]).outerHTML; if (msgs[i].classList.contains('user')) { prompt = q('.bub', msgs[i]).textContent; break; } }
    if (!prompt) return;
    const esc_ = /escalat/i.test(tr || ''); runs.push({ ts: 'just now', prompt, status: esc_ ? 'escalated' : 'ok', ms: 900 + Math.round(Math.random() * 900), tok: 1200 + Math.round(Math.random() * 900), cost: 0.006 + Math.random() * 0.008, trace: tr || '' }); renderRuns();
    AGENTS[current].threadHTML = thread.innerHTML; persistThreads();
  }))).observe(thread, { childList: true });
  
  renderRuns();

  /* ───────── routing for new data-flow targets ───────── */
  document.addEventListener('click', e => {
    const f = e.target.closest('[data-flow]'); if (!f) return;
    const k = f.dataset.flow;
    if (k === 'notifications') flowNotifications();
    else if (k === 'settings') flowSettings();
    else if (k === 'rail-search') railSearch();
    else if (k === 'identity') flowIdentity();
    else if (k === 'readiness') readinessSheet();
  });

  readiness();
  window.NexusFeatures = { AGENTS, agent, current: () => current, state, selectAgent, registerAgent, publishChecks, onPublished, overflowMenu, manageConnector, preview, flowTrigger, flowEval, addVariable, flowSettings, menu, readiness };
})();
