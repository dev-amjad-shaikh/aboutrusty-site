/* ═══════════════════════════════════════════════════════════════
   NEXUS — Side panel modes: Build · Test · Observe
   Build  — co-pilot that proposes reviewable changes to this agent
   Test   — playground (existing thread/composer, unchanged)
   Observe— traces + runtime logs for the current agent
   ═══════════════════════════════════════════════════════════════ */
(function () {
  const q = (s, r) => (r || document).querySelector(s), qa = (s, r) => [...(r || document).querySelectorAll(s)];
  const NF = window.NF;
  const toast = (m, i) => NF && NF.toast ? NF.toast(m, i) : null;
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const aside = q('.test[data-mode]'); if (!aside) return;

  /* ── mode switching ───────────────────────────────────── */
  function setMode(m) {
    aside.dataset.mode = m;
    qa('[data-pmode]', aside).forEach(b => b.classList.toggle('on', b.dataset.pmode === m));
    qa('[data-pane]', aside).forEach(p => p.hidden = p.dataset.pane !== m);
    qa('[data-pane-meta]', aside).forEach(p => p.hidden = p.dataset.paneMeta !== m);
    if (m === 'observe') { q('.pm-dot', aside).classList.remove('live'); renderTraces(); renderLogs(); }
    if (m === 'build') renderProposals();
    try { localStorage.setItem('nexus.panelMode', m); } catch (e) {}
  }
  qa('[data-pmode]', aside).forEach(b => b.addEventListener('click', () => setMode(b.dataset.pmode)));
  q('[data-pane-reset]', aside).addEventListener('click', () => {
    const m = aside.dataset.mode;
    if (m === 'build') { q('[data-proposals]', aside).innerHTML = ''; renderProposals(); toast('Build thread reset', 'ti-refresh'); }
    else if (m === 'observe') { LOGS.length = 0; TRACES.length = 0; renderTraces(); renderLogs(); toast('Observe cleared', 'ti-refresh'); }
    else { const t = q('[data-pane="test"] .thread', aside); qa('.msg, .trace, .thinking', t).forEach(n => n.remove()); toast('New test session', 'ti-refresh'); }
  });

  /* ── BUILD: proposals ─────────────────────────────────── */
  // Reuses the "Suggested improvements" cards on the page as the proposal source.
  const KIND_ICON = { instructions: 'ti-file-text', tools: 'ti-tool', skills: 'ti-puzzle', guardrails: 'ti-shield-check', model: 'ti-cpu', memory: 'ti-brain' };
  function pageImprovements() {
    const X = window.NexusFeatures; if (!X || !X.imps) return [];
    return X.imps().filter(i => i.state === 'open').map(i => ({ imp: i, title: i.title, desc: i.desc, section: i.kind, gain: (i.ev && i.ev[0]) || '',
      diff: i.diff ? i.diff.map(d => '<div class="dl ' + d[0] + '">' + (d[0] === 'del' ? '- ' : '+ ') + esc(d[1]) + '</div>').join('') : '' }));
  }
  const CUSTOM = [];
  function renderProposals() {
    const box = q('[data-proposals]', aside); if (!box) return;
    const items = [...pageImprovements().map(p => ({ ...p, src: 'scan' })), ...CUSTOM];
    box.innerHTML = items.length ? items.map((p, i) =>
      '<div class="proposal" data-i="' + i + '">' +
        '<div class="pp-head"><div class="pp-ic"><i class="ti ' + (KIND_ICON[p.section] || 'ti-file-text') + '"></i></div>' +
          '<div class="pp-body"><div class="pp-t">' + esc(p.title.trim()) + '</div><div class="pp-d">' + esc(p.desc.trim()) + '</div></div>' +
          (p.gain ? '<span class="m-badge good sm"><span class="dot"></span> ' + esc(p.gain.trim()) + '</span>' : '') + '</div>' +
        (p.diff ? '<div class="pp-diff">' + p.diff + '</div>' : '') +
        '<div class="pp-foot"><span class="item-tag"><i class="ti ' + (p.src === 'scan' ? 'ti-radar-2' : 'ti-sparkles') + '"></i> ' + (p.src === 'scan' ? 'From run analysis' : 'From your request') + '</span><span class="item-tag">' + esc(p.section) + '</span><span class="sp"></span>' +
          '<button class="m-btn ghost sm" data-pp="dismiss">Dismiss</button><button class="m-btn primary sm" data-pp="apply"><i class="ti ti-check"></i> Apply</button></div>' +
      '</div>').join('') :
      '<div class="pane-empty"><i class="ti ti-circle-check"></i> Nothing pending. Ask for a change below.</div>';
    qa('.proposal', box).forEach(card => {
      const p = items[+card.dataset.i];
      q('[data-pp="apply"]', card).addEventListener('click', () => applyProposal(p, card));
      q('[data-pp="dismiss"]', card).addEventListener('click', () => { card.remove(); if (p.imp) { p.imp.state = 'dismissed'; window.NexusFeatures.renderImps(); } else CUSTOM.splice(CUSTOM.indexOf(p), 1); });
    });
    const meta = q('[data-pane-meta="build"]', aside); if (meta) meta.textContent = 'v4 · ' + items.length + ' pending';
  }
  function applyProposal(p, card) {
    card.classList.add('applied');
    q('.pp-foot', card).innerHTML = '<span class="item-tag" style="color:var(--good);border-color:var(--good-line)"><i class="ti ti-check"></i> Applied to ' + esc(p.section) + '</span><span class="sp"></span><button class="m-btn ghost sm" data-pp="undo">Undo</button>';
    if (p.imp) { p.imp.state = 'applied'; try { p.imp.apply && p.imp.apply(); } catch (e) {} window.NexusFeatures.renderImps(); }
    else if (p.apply) try { p.apply(); } catch (e) {}
    const sec = q('[data-section="' + p.section + '"]'); if (sec) { sec.classList.add('flash'); setTimeout(() => sec.classList.remove('flash'), 1200); const c = q('.config'); if (c) c.scrollTo({ top: sec.offsetTop - 80, behavior: 'smooth' }); }
    log('info', 'config', 'Applied proposal: ' + p.title.trim());
    q('[data-pp="undo"]', card).addEventListener('click', () => { card.remove(); toast('Change reverted', 'ti-arrow-back-up'); });
    const meta = q('[data-pane-meta="build"]', aside); meta.textContent = 'v5 · ' + (qa('.proposal:not(.applied)', aside).length) + ' pending';
  }

  // co-pilot request → proposal
  const RECIPES = {
    tone: { title: 'Tighten reply length', desc: 'Cap customer-facing replies at 90 words and remove the closing pleasantry.', section: 'instructions',
      diff: '<div class="dl del">- Keep replies under 120 words.</div><div class="dl add">+ Keep replies under 90 words. Lead with the fix; no sign-off line.</div>' },
    guard: { title: 'Block refund promises', desc: 'Add a guardrail that stops the agent from committing to refunds, credits or timelines.', section: 'guardrails',
      diff: '<div class="dl add">+ Guardrail · Output · "Never promise refunds, credits or delivery dates. Escalate instead."</div>' },
    improve: null
  };
  function copilotSay(text) {
    const t = q('[data-pane="build"] .thread', aside);
    const m = document.createElement('div'); m.className = 'msg agent'; m.innerHTML = '<div class="who">Co-pilot</div><div class="bub">' + text + '</div>';
    t.insertBefore(m, q('[data-proposals]', aside)); t.scrollTop = t.scrollHeight;
  }
  function userSay(text) {
    const t = q('[data-pane="build"] .thread', aside);
    const m = document.createElement('div'); m.className = 'msg user'; m.innerHTML = '<div class="bub">' + esc(text) + '</div>';
    t.insertBefore(m, q('[data-proposals]', aside)); t.scrollTop = t.scrollHeight;
  }
  function handleBuild(text, recipeKey) {
    userSay(text);
    const think = document.createElement('div'); think.className = 'thinking'; think.innerHTML = '<span></span><span></span><span></span>';
    const t = q('[data-pane="build"] .thread', aside); t.insertBefore(think, q('[data-proposals]', aside));
    setTimeout(() => {
      think.remove();
      if (recipeKey === 'improve') { copilotSay('Applying every open run-analysis suggestion.'); qa('.proposal:not(.applied) [data-pp="apply"]', aside).forEach(b => b.click()); return; }
      const r = RECIPES[recipeKey] || inferRecipe(text);
      copilotSay('Here\u2019s a proposal. Review the diff and apply it to <b>' + esc(r.section) + '</b> when ready.');
      CUSTOM.push({ ...r, src: 'ask' }); renderProposals();
      t.scrollTo({ top: t.scrollHeight, behavior: 'smooth' });
    }, 900);
  }
  function inferRecipe(text) {
    const X = window.NexusFeatures;
    if (X && X.propose) { const pr = X.propose(text); return { title: pr.title, desc: pr.desc, section: pr.kind, apply: pr.apply, diff: '<div class="dl add">+ ' + esc(pr.desc) + '</div>' }; }
    const s = text.toLowerCase();
    if (/guard|never|block|refund|policy/.test(s)) return RECIPES.guard;
    if (/short|concise|tone|word/.test(s)) return RECIPES.tone;
    if (/tool|connect|slack|github|zendesk/.test(s)) return { title: 'Add tool access', desc: 'Enable the requested tool and reference it in Step 2 of the instructions.', section: 'tools', diff: '<div class="dl add">+ tool · <code>' + esc((s.match(/[a-z_]{5,}/) || ['lookup_order'])[0]) + '</code> enabled (read)</div>' };
    return { title: 'Update instructions', desc: text, section: 'instructions', diff: '<div class="dl add">+ ' + esc(text) + '</div>' };
  }
  const bi = q('[data-build-input]', aside);
  q('[data-build-send]', aside).addEventListener('click', () => { const v = bi.value.trim(); if (!v) return; bi.value = ''; handleBuild(v); });
  bi.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); q('[data-build-send]', aside).click(); } });
  qa('[data-build]', aside).forEach(b => b.addEventListener('click', () => handleBuild(b.textContent.trim(), b.dataset.build)));

  /* ── OBSERVE: traces + logs ───────────────────────────── */
  const TRACES = [
    { id: 'run_8f3a', when: '2s ago', status: 'ok', latency: 2140, tokens: 1830, cost: 0.0041, input: 'My invoice shows two charges for March', steps: [
      ['classify', 'intent=billing · conf 0.93', 210], ['search_kb', '3 hits · top 0.88', 640], ['lookup_invoice', 'INV-30412 · 2 line items', 380], ['draft_reply', '84 words · 1 citation', 910]] },
    { id: 'run_8f39', when: '4m ago', status: 'warn', latency: 4310, tokens: 2960, cost: 0.0072, input: 'Cancel my account right now', steps: [
      ['classify', 'intent=churn · conf 0.58', 240], ['search_kb', '0 hits above 0.7', 700], ['search_kb', 'retry · 2 hits', 690], ['escalate', 'queue=retention · reason=low confidence', 120]] },
    { id: 'run_8f31', when: '19m ago', status: 'bad', latency: 9020, tokens: 410, cost: 0.0009, input: 'Where is order 55821?', steps: [
      ['classify', 'intent=shipping · conf 0.91', 220], ['lookup_order', 'timeout after 8000ms', 8000]] },
    { id: 'run_8f2c', when: '31m ago', status: 'ok', latency: 1720, tokens: 1210, cost: 0.0027, input: 'How do I export my data?', steps: [
      ['classify', 'intent=how-to · conf 0.97', 190], ['search_kb', '1 hit · 0.94', 560], ['draft_reply', '61 words · 1 citation', 970]] }
  ];
  const LOGS = [
    ['12:04:18.221', 'info', 'router', 'skill=draft-customer-reply selected (score 0.91)'],
    ['12:04:18.430', 'info', 'tool', 'classify → 210ms'],
    ['12:04:19.070', 'info', 'tool', 'search_kb top_k=5 → 3 hits'],
    ['12:04:19.450', 'info', 'tool', 'lookup_invoice INV-30412 → 380ms'],
    ['12:04:20.360', 'info', 'model', 'claude-sonnet · 1,830 tok · $0.0041'],
    ['12:00:02.114', 'warn', 'tool', 'search_kb returned 0 hits above 0.7 — retrying with broadened query'],
    ['12:00:02.809', 'warn', 'router', 'confidence 0.58 < 0.6 → escalate(retention)'],
    ['11:45:31.002', 'error', 'tool', 'lookup_order timeout after 8000ms (connector: Shopify)'],
    ['11:45:31.004', 'error', 'run', 'run_8f31 failed · surfaced fallback message to user'],
    ['11:45:30.990', 'info', 'guardrail', 'PII redaction applied to input (1 order id)']
  ];
  const STAT = { ok: ['good', 'Success'], warn: ['warn', 'Escalated'], bad: ['bad', 'Failed'] };
  function renderTraces() {
    const box = q('[data-obs-pane="traces"]', aside); if (!box) return;
    box.innerHTML = TRACES.length ? '<div class="obs-kpis">' +
      kpi('Runs', TRACES.length) + kpi('p50 latency', Math.round(TRACES.map(t => t.latency).sort((a, b) => a - b)[Math.floor(TRACES.length / 2)] / 100) / 10 + 's') +
      kpi('Errors', TRACES.filter(t => t.status === 'bad').length, TRACES.some(t => t.status === 'bad') ? 'bad' : '') + kpi('Cost', '$' + TRACES.reduce((a, t) => a + t.cost, 0).toFixed(4)) + '</div>' +
      TRACES.map((t, i) => {
        const st = STAT[t.status];
        return '<div class="run" data-run="' + i + '">' +
          '<div class="run-head"><span class="dot" style="background:var(--' + st[0] + '-dot)"></span><span class="mono">' + t.id + '</span><span class="run-in">' + esc(t.input) + '</span><span class="mono dim">' + t.when + '</span><i class="ti ti-chevron-down chev"></i></div>' +
          '<div class="run-body" hidden>' +
            '<div class="run-meta"><span class="m-badge ' + st[0] + ' sm"><span class="dot"></span> ' + st[1] + '</span><span class="mono">' + (t.latency / 1000).toFixed(2) + 's</span><span class="mono">' + t.tokens.toLocaleString() + ' tok</span><span class="mono">$' + t.cost.toFixed(4) + '</span></div>' +
            '<div class="steps">' + t.steps.map(([n, d, ms]) => '<div class="step' + (ms >= 8000 ? ' bad' : '') + '"><div class="step-bar" style="width:' + Math.max(4, Math.round(ms / t.latency * 100)) + '%"></div><span class="mono step-n">' + n + '</span><span class="step-d">' + esc(d) + '</span><span class="mono dim">' + ms + 'ms</span></div>').join('') + '</div>' +
            '<div class="run-act"><button class="m-btn ghost sm" data-replay><i class="ti ti-player-play"></i> Replay in Test</button><button class="m-btn ghost sm" data-fix><i class="ti ti-sparkles"></i> Fix in Build</button></div>' +
          '</div></div>';
      }).join('') : '<div class="pane-empty"><i class="ti ti-activity"></i> No runs yet. Send a message in Test.</div>';
    qa('.run', box).forEach(r => {
      const t = TRACES[+r.dataset.run];
      q('.run-head', r).addEventListener('click', () => { const b = q('.run-body', r); b.hidden = !b.hidden; r.classList.toggle('open', !b.hidden); });
      q('[data-replay]', r).addEventListener('click', () => { setMode('test'); const c = q('[data-pane="test"] .composer textarea', aside); if (c) { c.value = t.input; c.focus(); } });
      q('[data-fix]', r).addEventListener('click', () => { setMode('build'); handleBuild('Fix the failure in ' + t.id + ': ' + t.steps[t.steps.length - 1][1]); });
    });
  }
  const kpi = (l, v, k) => '<div class="obs-kpi' + (k ? ' ' + k : '') + '"><span class="k">' + l + '</span><span class="v mono">' + v + '</span></div>';
  function renderLogs() {
    const box = q('[data-obs-pane="logs"]', aside); if (!box) return;
    box.innerHTML = '<div class="log-filter">' + ['all', 'info', 'warn', 'error'].map((l, i) => '<button class="auth-opt' + (i === 0 ? ' on' : '') + '" data-lvl="' + l + '">' + l + '</button>').join('') + '</div>' +
      '<div class="log-list">' + LOGS.map(([ts, lvl, src, msg]) => '<div class="log ' + lvl + '"><span class="mono ts">' + ts + '</span><span class="lvl">' + lvl + '</span><span class="mono src">' + src + '</span><span class="msg-t">' + esc(msg) + '</span></div>').join('') + '</div>';
    qa('[data-lvl]', box).forEach(b => b.addEventListener('click', () => { qa('[data-lvl]', box).forEach(x => x.classList.toggle('on', x === b)); qa('.log', box).forEach(l => l.style.display = b.dataset.lvl === 'all' || l.classList.contains(b.dataset.lvl) ? '' : 'none'); }));
  }
  qa('[data-obs]', aside).forEach(b => b.addEventListener('click', () => { qa('[data-obs]', aside).forEach(x => x.classList.toggle('on', x === b)); qa('[data-obs-pane]', aside).forEach(p => p.hidden = p.dataset.obsPane !== b.dataset.obs); }));
  function log(lvl, src, msg) {
    const d = new Date(); const ts = [d.getHours(), d.getMinutes(), d.getSeconds()].map(n => String(n).padStart(2, '0')).join(':') + '.' + String(d.getMilliseconds()).padStart(3, '0');
    LOGS.unshift([ts, lvl, src, msg]); if (aside.dataset.mode !== 'observe') q('.pm-dot', aside).classList.add('live');
  }
  // Test-pane activity feeds Observe
  const testThread = q('[data-pane="test"] .thread', aside);
  if (testThread) new MutationObserver(muts => {
    muts.forEach(m => m.addedNodes.forEach(n => {
      if (!(n instanceof HTMLElement)) return;
      if (n.classList.contains('msg') && n.classList.contains('user')) {
        const id = 'run_' + Math.random().toString(16).slice(2, 6);
        TRACES.unshift({ id, when: 'just now', status: 'ok', latency: 1900, tokens: 1400, cost: 0.0031, input: n.textContent.trim(), steps: [['classify', 'intent=how-to · conf 0.9', 200], ['search_kb', '2 hits', 600], ['draft_reply', '70 words', 1100]] });
        log('info', 'run', id + ' started (playground)'); const m = q('[data-pane-meta="test"]', aside); if (m) m.textContent = id;
      }
      if (n.classList.contains('trace')) log('info', 'tool', (n.textContent || '').trim().slice(0, 80));
    }));
  }).observe(testThread, { childList: true });

  document.addEventListener('nexus:agent', () => { CUSTOM.length = 0; if (aside.dataset.mode === 'build') renderProposals(); });
  window.NexusPanel = { setMode, log };
  let saved = null; try { saved = localStorage.getItem('nexus.panelMode'); } catch (e) {}
  setMode(saved && ['build', 'test', 'observe'].includes(saved) ? saved : 'test');
})();
