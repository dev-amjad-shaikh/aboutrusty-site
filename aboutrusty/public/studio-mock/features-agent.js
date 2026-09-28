/* ═══ AGENT BUILDER — goal & performance · self-identified improvements · memory viewer + curator · improve-by-chat ═══ */
(function () {
  'use strict';
  const NF = window.NF, NS = window.NS, X = window.NexusFeatures;
  const { shell, head, close, toast, esc, elFrom, wireSwitch, bumpCount, expand } = NF;
  const q = (s, r) => (r || document).querySelector(s);
  const qa = (s, r) => [...(r || document).querySelectorAll(s)];
  const editor = q('[data-section="instructions"] .instr-editor');
  const unit = m => /CSAT/.test(m) ? ' / 5' : /cost/i.test(m) ? '\u00a2' : '%';

  /* ═══ GOAL CARD ═══ */
  function renderGoal() {
    const a = X.agent(), card = q('#goalCard'); if (!card) return;
    const g = a.goal;
    if (!g) { card.className = 'goal-card empty'; card.innerHTML = '<div><div class="ge"><i class="ti ti-target-arrow"></i> Goal</div><div class="go" style="color:var(--ink-600);font-weight:500">No goal yet. A goal is tracked live against production runs and gates every publish.</div><div style="margin-top:12px"><button class="m-btn secondary sm" data-edit-goal><i class="ti ti-plus"></i> Set a goal</button></div></div>'; return; }
    const cur = g.current, has = cur !== null && cur !== undefined;
    const pct = has ? Math.min(100, Math.round((g.lowerIsBetter ? (g.target / Math.max(cur, 0.01)) : (cur / g.target)) * 100)) : 0;
    const on = has && (g.lowerIsBetter ? cur <= g.target : cur >= g.target);
    const trend = g.trend && g.trend.length ? '<div class="spark">' + g.trend.map(v => '<div style="height:' + Math.round(v / Math.max(...g.trend) * 100) + '%"></div>').join('') + '</div>' : '';
    card.className = 'goal-card';
    card.innerHTML = '<div><div class="ge"><i class="ti ti-target-arrow"></i> Goal <span class="m-badge ' + (has ? (on ? 'good' : 'warn') : '') + ' sm">' + (has ? (on ? 'On track' : 'Below target') : 'No data yet') + '</span><button class="m-btn ghost sm" data-edit-goal><i class="ti ti-pencil"></i> Edit</button></div>' +
      '<div class="go">' + esc(g.objective) + '</div>' +
      '<div class="gm"><span>' + esc(g.metric) + '</span><div class="m-progress accent' + (on ? '' : ' warn') + '"><span style="width:' + pct + '%"></span></div><span>' + (has ? pct + '% of target' : 'Waiting for runs') + '</span><a href="#" data-goal-evals style="color:var(--accent);font-weight:600;text-decoration:none;margin-left:auto">Experiments <i class="ti ti-arrow-right" style="font-size:11px"></i></a></div></div>' +
      '<div class="gv"><div class="big">' + (has ? cur : '\u2014') + '<small>' + unit(g.metric) + '</small></div><div class="tg">target ' + (g.lowerIsBetter ? '\u2264' : '\u2265') + ' ' + g.target + unit(g.metric) + ' \u00b7 7-day sample</div>' + trend + '</div>';
  }
  function editGoal() {
    const a = X.agent(), g = a.goal || { objective: '', metric: 'Resolution without escalation', target: 70 };
    const METRICS = ['Resolution without escalation', 'Answer groundedness', 'Escalation precision', 'CSAT', 'Task completion rate', 'Approval without edits', 'Cost per run'];
    const p = shell('modal', '<div class="m-modal lg">' + head('ti-target-arrow', '', '', a.goal ? 'Edit goal' : 'Set a goal', 'One sentence a teammate could verify, plus the number that proves it.') +
      '<div class="ov-body"><div class="fld"><label class="fld-label">Objective</label><textarea class="m-textarea" data-o>' + esc(g.objective) + '</textarea></div><div class="frow two"><div class="fld"><label class="fld-label">Primary metric</label><select class="m-input" data-m>' + METRICS.concat(METRICS.includes(g.metric) ? [] : [g.metric]).map(m => '<option' + (m === g.metric ? ' selected' : '') + '>' + m + '</option>').join('') + '</select></div><div class="fld"><label class="fld-label">Target</label><input class="m-input" type="number" data-t value="' + g.target + '"></div></div>' +
      '<div class="fld"><label class="fld-label">Measured on</label><div class="opt-list">' + [['ti-activity', 'Live production sample', '10% of runs scored by an LLM judge, rolling 7 days', true], ['ti-test-pipe', 'Experiment on publish', 'Golden tickets \u00b7 240 cases', true], ['ti-user-check', 'Human review queue', 'Reviewers label 20 runs a day', false]].map(o => '<div class="scope-row"><i class="ti ' + o[0] + '" style="color:var(--ink-600)"></i><div class="sb"><div style="font-size:var(--fs-sm);font-weight:600">' + o[1] + '</div><div class="sd">' + o[2] + '</div></div><div class="m-switch' + (o[3] ? ' on' : '') + '" data-switch></div></div>').join('') + '</div></div></div>' +
      '<div class="ov-foot"><div class="sp"></div><button class="m-btn ghost" data-close>Cancel</button><button class="m-btn primary" data-save><i class="ti ti-check"></i> Save goal</button></div></div>');
    qa('[data-switch]', p).forEach(wireSwitch);
    q('[data-save]', p).addEventListener('click', () => { a.goal = Object.assign({ current: null, trend: [] }, a.goal || {}, { objective: q('[data-o]', p).value.trim() || 'Untitled goal', metric: q('[data-m]', p).value, target: +q('[data-t]', p).value }); renderGoal(); X.readiness(); close(); toast('Goal saved', 'ti-target-arrow'); });
  }
  document.addEventListener('click', e => { if (e.target.closest('[data-edit-goal]')) editGoal(); const ev = e.target.closest('[data-goal-evals]'); if (ev) { e.preventDefault(); NS.showView('evals'); } });

  /* ═══ SELF-IDENTIFIED IMPROVEMENTS ═══ */
  const SEED = {
    'support-triage': [
      { kind: 'instructions', icon: 'ti-file-text', title: 'Add a fallback when the knowledge base returns nothing', desc: 'In 38 runs this week the agent guessed at policy after an empty search. Adding an explicit fallback reduced hallucinated policy to zero in a 96-case experiment.', ev: ['38 runs affected', 'exp-0916 \u00b7 +9% groundedness'], diff: [['add', 'If the knowledge base returns nothing relevant, say so plainly and offer to escalate rather than guessing.']], apply: () => { editor.appendChild(document.createTextNode('\n\nIf the knowledge base returns nothing relevant, say so plainly and offer to escalate rather than guessing.')); } },
      { kind: 'tools', icon: 'ti-tool', title: 'Enable web_search for how-to tickets', desc: '14% of how-to tickets reference third-party products the help center doesn\u2019t cover. Public search would have grounded 61 replies.', ev: ['61 runs affected', 'est. +4% resolution'], apply: () => { const r = qa('[data-section="tools"] .item').find(i => q('.mono', i).textContent === 'web_search'); if (r) { q('[data-switch]', r).classList.add('on'); expand('tools'); } } },
      { kind: 'connectors', icon: 'ti-plug-connected', title: 'Reauthorize Zendesk', desc: 'The token expired 12 minutes ago. 9 runs failed to read the ticket thread and fell back to the webhook payload.', ev: ['9 failed runs', 'blocking publish'], apply: () => { expand('connectors'); const b = qa('[data-section="connectors"] .item-act .m-btn').find(x => /fix/i.test(x.textContent)); if (b) b.click(); } },
      { kind: 'instructions', icon: 'ti-adjustments', title: 'Raise escalation threshold from 0.7 to 0.75', desc: 'Runs with confidence between 0.70 and 0.75 were rated unhelpful by customers 3\u00d7 more often than the average.', ev: ['CSAT 3.1 vs 4.4 avg', '212 runs'], diff: [['del', 'If confidence is below 0.7, or the customer is angry, escalate'], ['add', 'If confidence is below 0.75, or the customer is angry, escalate']], apply: () => { editor.innerHTML = editor.innerHTML.replace('below 0.7,', 'below 0.75,'); } },
      { kind: 'connectors', icon: 'ti-brand-stripe', title: 'Add the Stripe connector for refund lookups', desc: 'Billing tickets escalate 2.4\u00d7 more than others because the agent can\u2019t see charges. Stripe read access would let it confirm duplicates before escalating.', ev: ['billing = 41% of escalations'], apply: () => { NF.addConnectorToList(['ti-brand-stripe', '#635BFF', 'Stripe', 'Look up customers, charges and refunds.', true]); } }
    ]
  };
  const GENERIC = a => [
    { kind: 'instructions', icon: 'ti-file-text', title: 'State assumptions before answering', desc: 'In 22% of sampled runs the reply relied on an unstated assumption. Asking the agent to surface it first improved judged accuracy in similar agents.', ev: ['sampled 200 runs'], diff: [['add', 'Before answering, state any assumption you had to make in one line.']], apply: () => { editor.appendChild(document.createTextNode('\n\nBefore answering, state any assumption you had to make in one line.')); } },
    { kind: 'model', icon: 'ti-cpu', title: 'Route simple runs to a cheaper model', desc: '58% of runs used under 800 tokens and no tools. Sending those through the Cost-saver route would cut spend ~31% with no measured quality loss.', ev: ['est. \u2212$' + (Math.round(Math.random() * 60) + 20) + '/mo'], apply: () => { q('.model-pick[data-slot="fallback"] .mn').textContent = 'Claude Haiku 4'; } },
    { kind: 'memory', icon: 'ti-brain', title: 'Promote 3 recurring facts to long-term memory', desc: 'The curator found facts re-learned in more than 5 sessions each. Promoting them avoids repeated lookups.', ev: ['3 facts \u00b7 17 sessions'], apply: () => {} }
  ];
  const IMPS = {};
  function imps() { const h = X.current(); if (!IMPS[h]) IMPS[h] = (SEED[h] || GENERIC(X.agent())).map(i => Object.assign({ state: 'open' }, i)); return IMPS[h]; }
  function renderImps() {
    const body = q('[data-imp-body]'), list = imps(); if (!body) return;
    const open = list.filter(i => i.state === 'open');
    q('#improvements .cnt').textContent = open.length;
    body.innerHTML = list.length ? list.map((i, n) => '<div class="imp' + (i.state !== 'open' ? ' done' : '') + '" data-imp="' + n + '"><div class="item-ic"><i class="ti ' + i.icon + '"></i></div><div class="ib"><div class="it">' + esc(i.title) + ' <span class="item-tag">' + i.kind + '</span>' + (i.state === 'applied' ? '<span class="m-badge good sm"><span class="dot"></span> Applied</span>' : i.state === 'dismissed' ? '<span class="m-badge sm">Dismissed</span>' : '') + '</div><div class="id">' + esc(i.desc) + '</div>' + (i.diff && i.state === 'open' ? '<div class="diff">' + i.diff.map(d => '<div class="' + d[0] + '">' + (d[0] === 'add' ? '+ ' : '\u2212 ') + esc(d[1]) + '</div>').join('') + '</div>' : '') + '<div class="iev">' + i.ev.map(e => '<span><i class="ti ti-chart-dots" style="font-size:11px"></i> ' + esc(e) + '</span>').join('') + '</div></div>' + (i.state === 'open' ? '<div class="ia"><button class="m-btn ghost sm" data-dismiss>Dismiss</button><button class="m-btn primary sm" data-approve><i class="ti ti-check"></i> Approve</button></div>' : '') + '</div>').join('') : '<div class="imp-empty">Nothing to suggest right now \u2014 the agent re-scans after every 100 runs.</div>';
  }
  q('#improvements').addEventListener('click', e => {
    const row = e.target.closest('[data-imp]'); const i = row ? imps()[+row.dataset.imp] : null;
    if (e.target.closest('[data-approve]') && i) { e.stopPropagation(); i.state = 'applied'; try { i.apply(); } catch (err) {} renderImps(); toast('Applied \u2014 ' + i.title, 'ti-sparkles'); }
    else if (e.target.closest('[data-dismiss]') && i) { e.stopPropagation(); i.state = 'dismissed'; renderImps(); }
    else if (e.target.closest('[data-rescan]')) { e.stopPropagation(); const b = e.target.closest('[data-rescan]'); b.innerHTML = '<span class="m-spin" style="width:12px;height:12px;border-width:2px"></span> Scanning 412 runs\u2026'; setTimeout(() => { b.innerHTML = '<i class="ti ti-refresh"></i> Re-scan runs'; imps().unshift({ state: 'open', kind: 'instructions', icon: 'ti-message-2', title: 'Shorten replies on how-to tickets', desc: 'Replies over 100 words on how-to tickets scored 0.6 lower on CSAT. The 120-word cap is rarely the binding limit; 80 words performs best.', ev: ['new \u00b7 just scanned', '188 runs'], diff: [['del', 'Keep it under 120 words.'], ['add', 'Keep it under 80 words for how-to tickets, 120 otherwise.']], apply: () => { editor.innerHTML = editor.innerHTML.replace('Keep it under 120 words.', 'Keep it under 80 words for how-to tickets, 120 otherwise.'); } }); renderImps(); toast('1 new suggestion', 'ti-sparkles'); }, 1600); }
  });

  /* ═══ MEMORY VIEWER + CURATOR ═══ */
  const MEM = [
    ['ti-user', 'Customer acme-co prefers replies in British English and dislikes emoji.', 'long-term', 'acme-co', '12d', 0.94, true],
    ['ti-receipt', 'acme-co was double-charged on invoice INV-2291 (Sep 3); refund approved by billing.', 'long-term', 'acme-co', '2h', 0.99, false],
    ['ti-bulb', 'Tickets mentioning \u201cexport\u201d + \u201cblank file\u201d are usually the Safari download bug (KB-1182).', 'long-term', 'global', '5d', 0.88, true],
    ['ti-user', 'Contact jane@northwind.io is the billing admin, not the requester.', 'long-term', 'northwind', '1d', 0.81, false],
    ['ti-history-toggle', 'Current thread: customer annoyed, billing intent, escalated for refund > $50.', 'short-term', 'session', '3m', 1, false],
    ['ti-history-toggle', 'Customer asked to be emailed a confirmation.', 'short-term', 'session', '2m', 1, false]
  ];
  const CUR_LOG = [['38m ago', 'Merged 3 duplicate entries about acme-co\u2019s language preference into one (confidence 0.94).'], ['38m ago', 'Pruned 12 short-term entries older than the 20-turn window.'], ['38m ago', 'Promoted \u201cexport + blank file \u2192 KB-1182\u201d to long-term after 6 recurrences.'], ['4h ago', 'Flagged 1 entry as possible PII (phone number) \u2014 redacted before storage.'], ['4h ago', 'Down-ranked 2 entries contradicted by newer tickets.'], ['Yesterday', 'Compacted 214 long-term entries \u2192 198 (\u22127.5%).']];
  function memoryDrawer(tab) {
    tab = tab || 'Entries';
    const a = X.agent();
    const panes = {
      Entries: () => '<div class="ov-search" style="margin-bottom:12px"><i class="ti ti-search"></i><input placeholder="Search memory\u2026" data-ms></div><div class="cron-row">' + ['All', 'Long-term', 'Short-term', 'Pinned'].map((f, i) => '<span class="preset' + (i === 0 ? ' on' : '') + '" data-mf="' + f + '">' + f + '</span>').join('') + '</div><div data-ml>' + MEM.map((m, i) => '<div class="mem-entry' + (m[6] ? ' pinned' : '') + '" data-me="' + i + '" data-kind="' + m[2] + '"><div class="me-ic"><i class="ti ' + m[0] + '"></i></div><div class="mb"><div class="mt">' + esc(m[1]) + '</div><div class="mm"><span class="item-tag">' + m[2] + '</span><span>ns: ' + m[3] + '</span><span>' + m[4] + ' ago</span><span>conf ' + m[5] + '</span></div></div><div class="ma"><button class="m-btn icon ghost sm" data-pin title="Pin"><i class="ti ' + (m[6] ? 'ti-pinned-filled' : 'ti-pin') + '"></i></button><button class="m-btn icon ghost sm" data-forget title="Forget"><i class="ti ti-trash"></i></button></div></div>').join('') + '</div>',
      Curator: () => '<div class="kv"><span class="k">Status</span><span class="v"><span class="m-badge good sm"><span class="dot"></span> Running</span></span><span class="k">Schedule</span><span class="v">Every 4h and after 50 new entries</span><span class="k">Last pass</span><span class="v">38m ago \u00b7 214 \u2192 198 entries</span><span class="k">Model</span><span class="v">Claude Haiku 4 (Cost-saver route)</span></div>' +
        '<div class="cat-label"><span>Policies</span><span class="ln"></span></div>' + [['Merge near-duplicates', 'Cosine similarity > 0.92', true], ['Prune stale short-term', 'Beyond the conversation window', true], ['Promote recurring facts', 'Seen in \u2265 5 sessions', true], ['Redact PII before storing', 'Cards, phones, secrets', true], ['Auto-forget contradicted facts', 'Newer ticket disagrees', false]].map(p => '<div class="set-row"><div class="sk"><div class="n">' + p[0] + '</div><div class="d">' + p[1] + '</div></div><div class="m-switch' + (p[2] ? ' on' : '') + '" data-switch></div></div>').join('') +
        '<div class="cat-label" style="margin-top:20px"><span>Recent activity</span><span class="ln"></span></div>' + CUR_LOG.map(l => '<div class="cur-log"><span class="t">' + l[0] + '</span><span>' + esc(l[1]) + '</span></div>').join('') + '<button class="m-btn secondary sm" style="margin-top:14px" data-run-cur><i class="ti ti-player-play"></i> Run a pass now</button>'
    };
    const p = shell('drawer', '<div class="m-drawer" style="width:min(600px,100%)">' + head('ti-brain', '', '', a.name + ' \u00b7 memory', MEM.filter(m => m[2] === 'long-term').length + ' long-term \u00b7 ' + MEM.filter(m => m[2] === 'short-term').length + ' short-term \u00b7 198 total') + '<div style="padding:14px 22px 0"><div class="m-seg">' + Object.keys(panes).map(t => '<button' + (t === tab ? ' class="on"' : '') + ' data-tab="' + t + '">' + t + '</button>').join('') + '</div></div><div class="ov-body" data-pane></div><div class="ov-foot"><button class="m-btn ghost sm" data-exp><i class="ti ti-download"></i> Export</button><button class="m-btn ghost sm" data-clear style="color:var(--bad)"><i class="ti ti-trash"></i> Clear short-term</button><div class="sp"></div><button class="m-btn secondary" data-close>Done</button></div></div>');
    const render = t => {
      q('[data-pane]', p).innerHTML = panes[t](); qa('[data-switch]', p).forEach(wireSwitch);
      qa('[data-me]', p).forEach(r => { q('[data-pin]', r).addEventListener('click', () => { MEM[+r.dataset.me][6] = !MEM[+r.dataset.me][6]; render(t); }); q('[data-forget]', r).addEventListener('click', () => { MEM.splice(+r.dataset.me, 1); render(t); toast('Forgotten', 'ti-trash'); }); });
      qa('[data-mf]', p).forEach(f => f.addEventListener('click', () => { qa('[data-mf]', p).forEach(x => x.classList.toggle('on', x === f)); const k = f.dataset.mf; qa('[data-me]', p).forEach(r => { const m = MEM[+r.dataset.me]; r.style.display = k === 'All' || (k === 'Pinned' ? m[6] : m[2] === k.toLowerCase()) ? '' : 'none'; }); }));
      const s = q('[data-ms]', p); if (s) s.addEventListener('input', () => qa('[data-me]', p).forEach(r => r.style.display = r.textContent.toLowerCase().includes(s.value.toLowerCase()) ? '' : 'none'));
      const rc = q('[data-run-cur]', p); if (rc) rc.addEventListener('click', () => { rc.innerHTML = '<span class="m-spin" style="width:12px;height:12px;border-width:2px"></span> Curating\u2026'; setTimeout(() => { CUR_LOG.unshift(['just now', 'Merged 1 duplicate, pruned 2 stale short-term entries (' + MEM.length + ' \u2192 ' + (MEM.length - 1) + ').']); MEM.splice(MEM.findIndex(m => m[2] === 'short-term'), 1); render('Curator'); toast('Curator pass complete', 'ti-broom'); }, 1500); });
    };
    qa('[data-tab]', p).forEach(b => b.addEventListener('click', () => render(b.dataset.tab)));
    q('[data-exp]', p).addEventListener('click', () => toast('memory.jsonl exported', 'ti-download'));
    q('[data-clear]', p).addEventListener('click', () => { for (let i = MEM.length - 1; i >= 0; i--) if (MEM[i][2] === 'short-term') MEM.splice(i, 1); render('Entries'); toast('Short-term memory cleared'); });
    render(tab);
  }
  document.addEventListener('click', e => { if (e.target.closest('[data-view-memory]')) { e.stopPropagation(); memoryDrawer('Entries'); } if (e.target.closest('[data-curator-log]')) { e.stopPropagation(); memoryDrawer('Curator'); } });

  /* ═══ IMPROVE BY CHAT ═══ */
  const pane = q('#improvePane');
  const CHATS = {};
  function chatFor(h) { if (!CHATS[h]) { const a = X.AGENTS[h]; const g = a.goal; CHATS[h] = [['agent', 'I\u2019ve reviewed the last 412 runs of ' + a.name + '. ' + (g ? (g.current !== null ? 'We\u2019re at ' + g.current + unit(g.metric) + ' against a target of ' + g.target + unit(g.metric) + ' on \u201c' + g.metric + '\u201d. ' : '') : '') + 'Tell me what you want to change \u2014 tone, scope, when to escalate, which tools to use \u2014 and I\u2019ll propose an edit you can apply.']]; } return CHATS[h]; }
  function propose(text) {
    const t = text.toLowerCase(); const a = X.agent();
    if (/short|concise|brief|long/.test(t)) return { title: 'Tighten the length limit', desc: 'Change the reply cap from 120 words to 80 and ask for one action per reply.', kind: 'instructions', apply: () => { editor.innerHTML = editor.innerHTML.replace('Keep it under 120 words.', 'Keep it under 80 words and lead with the single most useful action.'); }, say: 'Shorter replies scored higher on how-to tickets in exp-0916. Here\u2019s the edit:' };
    if (/escalat|human|hand ?off/.test(t)) return { title: 'Escalate earlier on billing', desc: 'Escalate any billing ticket over $50 immediately instead of drafting first.', kind: 'instructions', apply: () => { editor.appendChild(document.createTextNode('\n\nFor billing tickets involving more than $50, escalate immediately with the invoice IDs instead of drafting a reply.')); }, say: 'Billing is 41% of escalations and those drafts are rarely sent. Proposed rule:' };
    if (/tone|friendly|formal|warm|polite/.test(t)) return { title: 'Adjust tone guidance', desc: 'Make the tone rule explicit: plain, warm, no exclamation marks, apologize once at most.', kind: 'instructions', apply: () => { editor.innerHTML = editor.innerHTML.replace('warm, concise tone', 'plain, warm tone \u2014 apologize once at most, no exclamation marks'); }, say: 'Got it. I\u2019ll make the tone rule concrete so it\u2019s testable:' };
    if (/web|search|internet/.test(t)) return { title: 'Enable web_search', desc: 'Turn on public web search, limited to how-to intents.', kind: 'tools', apply: () => { const r = qa('[data-section="tools"] .item').find(i => q('.mono', i).textContent === 'web_search'); if (r) q('[data-switch]', r).classList.add('on'); editor.appendChild(document.createTextNode('\n\nUse web_search only for how-to questions about third-party products.')); }, say: 'I can enable the tool and scope it in the instructions so it isn\u2019t used for policy questions:' };
    if (/memory|remember|forget/.test(t)) return { title: 'Remember customer channel preference', desc: 'Add a long-term memory rule: store each customer\u2019s preferred contact channel.', kind: 'memory', apply: () => {}, say: 'That\u2019s a memory rule. I\u2019ll add it to the long-term store policy:' };
    if (/stripe|refund|charge|invoice|billing/.test(t)) return { title: 'Add Stripe connector', desc: 'Read-only access to customers, charges and refunds so the agent can confirm duplicates before escalating.', kind: 'connectors', apply: () => NF.addConnectorToList(['ti-brand-stripe', '#635BFF', 'Stripe', 'Look up customers, charges and refunds.', true]), say: 'The agent can\u2019t see charges today, which is why billing escalates so often. Proposal:' };
    if (/cheap|cost|fast|model|haiku|opus/.test(t)) return { title: 'Switch fallback to Claude Haiku 4', desc: 'Cheaper fallback for rate-limit overflow; primary stays on ' + a.model + '.', kind: 'model', apply: () => { q('.model-pick[data-slot="fallback"] .mn').textContent = 'Claude Haiku 4'; q('.model-pick[data-slot="fallback"] .mp').textContent = 'anthropic \u00b7 fastest'; }, say: 'Overflow traffic is ~6% of runs and mostly simple. Proposal:' };
    return { title: 'Add to instructions', desc: '\u201c' + text.trim() + '\u201d', kind: 'instructions', apply: () => editor.appendChild(document.createTextNode('\n\n' + text.trim())), say: 'I can add that as an explicit rule. Want me to apply it?' };
  }
  function renderChat() {
    const h = X.current(), msgs = chatFor(h), a = X.AGENTS[h];
    pane.innerHTML = '<div class="thread" data-ct>' + msgs.map((m, mi) => m[0] === 'user' ? '<div class="msg user"><div class="who">You</div><div class="bub">' + esc(m[1]) + '</div></div>' : '<div class="msg agent"><div class="who">' + esc(a.name) + ' \u00b7 improve</div><div class="bub">' + esc(m[1]) + (m[2] ? '<div class="prop" data-pi="' + mi + '"><div class="pt"><i class="ti ti-sparkles"></i> ' + esc(m[2].title) + ' <span class="item-tag">' + m[2].kind + '</span></div><div class="pd">' + esc(m[2].desc) + '</div><div class="pa">' + (m[2].applied ? '<span class="m-badge good sm"><span class="dot"></span> Applied</span>' : m[2].queued ? '<span class="m-badge sm">Saved to suggestions</span>' : '<button class="m-btn primary sm" data-apply><i class="ti ti-check"></i> Apply</button><button class="m-btn ghost sm" data-queue>Save to suggestions</button>') + '</div></div>' : '') + '</div></div>').join('') + '</div>' +
      '<div class="imp-hint">' + ['Make replies shorter', 'Escalate billing sooner', 'Enable web search', 'Use a cheaper fallback'].map(s => '<span class="preset" data-hint="' + s + '">' + s + '</span>').join('') + '</div>' +
      '<div class="composer"><textarea rows="1" placeholder="Tell ' + esc(a.name) + ' how to improve\u2026" data-ci></textarea><button class="composer-send" data-cs><i class="ti ti-arrow-up"></i></button></div>';
    const th = q('[data-ct]', pane); th.scrollTop = 1e6;
    qa('[data-apply]', pane).forEach(b => b.addEventListener('click', () => { const pr = msgs[+b.closest('.prop').dataset.pi][2]; try { pr.apply(); } catch (e) {} pr.applied = true; imps().unshift({ state: 'applied', kind: pr.kind, icon: 'ti-message-2', title: pr.title, desc: pr.desc + ' (from Improve chat)', ev: ['applied via chat'] }); renderImps(); renderChat(); toast('Applied \u2014 ' + pr.title, 'ti-sparkles'); }));
    qa('[data-queue]', pane).forEach(b => b.addEventListener('click', () => { const pr = msgs[+b.closest('.prop').dataset.pi][2]; pr.queued = true; imps().unshift({ state: 'open', kind: pr.kind, icon: 'ti-message-2', title: pr.title, desc: pr.desc, ev: ['from Improve chat'], apply: pr.apply }); renderImps(); renderChat(); toast('Saved to suggested improvements', 'ti-sparkles'); }));
    const send = v => { v = (v || '').trim(); if (!v) return; msgs.push(['user', v]); renderChat(); const th2 = q('[data-ct]', pane); const tk = elFrom('<div class="msg agent"><div class="who">' + esc(a.name) + ' \u00b7 improve</div><div class="thinking"><span></span><span></span><span></span></div></div>'); th2.appendChild(tk); th2.scrollTop = 1e6; setTimeout(() => { const pr = propose(v); msgs.push(['agent', pr.say, pr]); renderChat(); }, 1000); };
    q('[data-cs]', pane).addEventListener('click', () => send(q('[data-ci]', pane).value));
    q('[data-ci]', pane).addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e.target.value); } });
    qa('[data-hint]', pane).forEach(hn => hn.addEventListener('click', () => send(hn.dataset.hint)));
  }

  /* ═══ per-agent refresh ═══ */
  function refresh() { renderGoal(); renderImps(); if (pane && !pane.hidden) renderChat(); }
  document.addEventListener('nexus:agent', refresh);
  refresh();
  Object.assign(window.NexusFeatures, { renderGoal, editGoal, memoryDrawer, imps, renderImps, propose });
})();
