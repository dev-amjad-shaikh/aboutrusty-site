/* ═══════════════════════════════════════════════════════════════
   AGENT BUILDER — view router · library screens · create wizard
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const toastHost = document.getElementById('toastHost');
  function elFrom(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function toast(msg, icon) {
    const t = elFrom('<div class="m-toast"><span class="t-ic"><i class="ti ' + (icon || 'ti-check') + '"></i></span><span></span></div>');
    t.querySelector('span:last-child').textContent = msg;
    toastHost.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 280); }, 2600);
  }

  /* ─────────────────────── view router ─────────────────────── */
  const rendered = {};
  function showView(name) {
    const id = 'view-' + name;
    const target = document.getElementById(id);
    if (!target) return;
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v === target));
    document.querySelectorAll('.strip-btn[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === name));
    if (!rendered[name] && LIBS[name]) { target.innerHTML = LIBS[name](); rendered[name] = true; wireLibrary(target, name); }
  }
  document.querySelectorAll('.strip-btn[data-view]').forEach(b => {
    b.addEventListener('click', () => showView(b.dataset.view));
  });

  /* ─────────────────────── library data ─────────────────────── */
  const SKILLS = [
    ['ti-route', 'var(--cat-plum-bg)', 'var(--cat-plum)', 'Triage & route ticket', 'Classify intent, set priority, assign to the right queue.', ['classify', 'search_kb', 'assign_queue'], 'Support', 4, '12.4k'],
    ['ti-message-2-bolt', 'var(--cat-teal-bg)', 'var(--cat-teal)', 'Draft customer reply', 'Compose a grounded, on-brand response with citations.', ['search_kb', 'draft_reply'], 'Support', 3, '9.1k'],
    ['ti-cash', 'var(--cat-orange-bg)', 'var(--cat-orange)', 'Resolve billing dispute', 'Verify charges, check policy, refund or escalate.', ['query_db', 'escalate'], 'Support', 2, '3.7k'],
    ['ti-user-search', 'var(--cat-amber-bg)', 'var(--cat-amber)', 'Research a lead', 'Enrich a contact and summarize buying signals.', ['web_search', 'http_request'], 'Sales', 2, '5.2k'],
    ['ti-mail-bolt', 'var(--cat-amber-bg)', 'var(--cat-amber)', 'Draft outreach email', 'Write a personalized first-touch email.', ['draft_reply', 'send_email'], 'Sales', 1, '6.8k'],
    ['ti-bug', 'var(--cat-rose-bg)', 'var(--cat-rose)', 'Reproduce a bug', 'Read the report, run the repro, attach logs.', ['run_python', 'http_request'], 'Engineering', 1, '1.3k'],
    ['ti-git-pull-request', 'var(--cat-blue-bg)', 'var(--cat-blue)', 'Open a fix PR', 'Draft a patch and open a pull request for review.', ['run_python', 'http_request'], 'Engineering', 1, '842'],
    ['ti-report-analytics', 'var(--cat-plum-bg)', 'var(--cat-plum)', 'Build a metrics report', 'Query the warehouse and assemble a summary.', ['query_db'], 'Data', 2, '2.6k']
  ];

  const TOOLS_LIB = [
    ['ti-search', 'var(--cat-blue-bg)', 'var(--cat-blue)', 'search_kb', 'Semantic search over the knowledge base.', 'Retrieval', 6, 'good', 'Healthy'],
    ['ti-world-search', 'var(--bg-muted)', 'var(--ink-600)', 'web_search', 'Public web search with cited results.', 'Retrieval', 3, 'good', 'Healthy'],
    ['ti-tag', 'var(--cat-teal-bg)', 'var(--cat-teal)', 'classify', 'Label input by intent and urgency.', 'Action', 4, 'good', 'Healthy'],
    ['ti-pencil', 'var(--cat-amber-bg)', 'var(--cat-amber)', 'draft_reply', 'Generate a customer-facing draft for review.', 'Action', 3, 'good', 'Healthy'],
    ['ti-arrow-up-right-circle', 'var(--cat-rose-bg)', 'var(--cat-rose)', 'escalate', 'Hand off to a human with full context.', 'Action', 3, 'good', 'Healthy'],
    ['ti-mail', 'var(--cat-orange-bg)', 'var(--cat-orange)', 'send_email', 'Send a transactional email.', 'Action', 2, 'warn', 'Rate-limited'],
    ['ti-terminal-2', 'var(--ink-200)', 'var(--ink-800)', 'run_python', 'Execute Python in a sandbox.', 'Code', 2, 'good', 'Healthy'],
    ['ti-database', 'var(--cat-blue-bg)', 'var(--cat-blue)', 'query_db', 'Run a read-only SQL query.', 'Data', 2, 'good', 'Healthy'],
    ['ti-api', 'var(--cat-plum-bg)', 'var(--cat-plum)', 'http_request', 'Call an external REST endpoint.', 'Code', 4, 'good', 'Healthy'],
    ['ti-arrows-split', 'var(--cat-teal-bg)', 'var(--cat-teal)', 'assign_queue', 'Move a ticket into a named queue.', 'Action', 1, 'good', 'Healthy']
  ];

  const CONNECTORS_LIB = {
    'Communication': [
      ['ti-brand-slack', '#4A154B', 'Slack', 'Post messages, read channels, notify on-call.', true, 2],
      ['ti-mail', '#D44638', 'Gmail', 'Read and send email on the user\u2019s behalf.', false, 0],
      ['ti-message', '#0B5CFF', 'Intercom', 'Read conversations and post replies.', false, 0],
      ['ti-brand-discord', '#5865F2', 'Discord', 'Send messages to servers and threads.', false, 0]
    ],
    'Dev & tickets': [
      ['ti-brand-github', '#24292F', 'GitHub', 'Open issues and pull requests, read code.', true, 1],
      ['ti-headset', '#03363D', 'Zendesk', 'Read tickets and write private notes.', true, 1],
      ['ti-layout-kanban', '#5E6AD2', 'Linear', 'File and update Linear issues.', false, 0],
      ['ti-ticket', '#0052CC', 'Jira', 'Create and transition issues.', false, 0]
    ],
    'Data & CRM': [
      ['ti-database', '#336791', 'Postgres', 'Run read-only queries against a database.', false, 0],
      ['ti-brand-notion', '#000000', 'Notion', 'Read and append to Notion pages.', false, 0],
      ['ti-cloud', '#0061FF', 'Salesforce', 'Read and update CRM records.', false, 0],
      ['ti-brand-stripe', '#635BFF', 'Stripe', 'Look up customers, charges and refunds.', false, 0]
    ]
  };

  const KNOWLEDGE_LIB = [
    ['ti-book-2', 'var(--cat-blue-bg)', 'var(--cat-blue)', 'Help Center', 'Web crawl', '1,240', 'Nightly', 'good', 'Synced'],
    ['ti-ticket', 'var(--cat-amber-bg)', 'var(--cat-amber)', 'Resolved tickets', 'Zendesk export', '18,402', '4h ago', 'good', 'Synced'],
    ['ti-file-text', 'var(--cat-teal-bg)', 'var(--cat-teal)', 'Policy docs', 'Google Drive', '86', '2d ago', 'good', 'Synced'],
    ['ti-brand-notion', 'var(--bg-muted)', 'var(--ink-700)', 'Eng runbooks', 'Notion', '312', 'Syncing\u2026', 'warn', 'Syncing'],
    ['ti-database', 'var(--cat-plum-bg)', 'var(--cat-plum)', 'Orders DB', 'Postgres', '\u2014', 'Live', 'good', 'Live']
  ];

  const PEOPLE = [['SD', 'var(--cat-teal)'], ['RA', 'var(--cat-plum)'], ['OS', 'var(--cat-amber)'], ['BR', 'var(--cat-rose)'], ['IR', 'var(--cat-orange)'], ['OC', 'var(--cat-blue)']];
  function usedStack(n) {
    if (!n) return '<span style="color:var(--ink-400)">Unused</span>';
    let s = '<span class="used-stack">';
    for (let i = 0; i < Math.min(n, 4); i++) s += '<span class="ua" style="background:' + PEOPLE[i % PEOPLE.length][1] + '">' + PEOPLE[i % PEOPLE.length][0] + '</span>';
    s += '</span><span>' + n + ' agent' + (n > 1 ? 's' : '') + '</span>';
    return s;
  }

  /* ─────────────────────── library renderers ─────────────────────── */
  function libTop(crumb) {
    return '<div class="lib-top"><div class="crumbs"><span>Project Nexus</span><i class="ti ti-chevron-right" style="color:var(--ink-300);font-size:15px"></i><b>' + crumb + '</b></div><div class="sp"></div>' +
      '<div class="lib-search" style="max-width:240px"><i class="ti ti-search"></i><input placeholder="Search\u2026" data-libsearch></div></div>';
  }
  function statCard(v, u, l) { return '<div class="lib-stat"><div class="ls-v">' + v + (u ? '<span class="u">' + u + '</span>' : '') + '</div><div class="ls-l">' + l + '</div></div>'; }

  const LIBS = {};

  LIBS.skills = function () {
    const cats = {}; SKILLS.forEach(s => { (cats[s[6]] = cats[s[6]] || []).push(s); });
    let body = '';
    for (const c in cats) {
      body += '<div class="lib-cat"><span>' + c + '</span><span class="ln"></span><span class="gc">' + cats[c].length + '</span></div><div class="lib-grid">';
      body += cats[c].map(s =>
        '<div class="lcard" data-detail="' + esc(s[3]) + '">' +
          '<div class="lcard-top"><div class="lcard-ic" style="background:' + s[1] + '; color:' + s[2] + '"><i class="ti ' + s[0] + '"></i></div>' +
            '<div><div class="lcard-title">' + esc(s[3]) + '</div></div></div>' +
          '<div class="lcard-desc">' + esc(s[4]) + '</div>' +
          '<div class="lcard-tags">' + s[5].map(t => '<span class="m-chip"><i class="ti ti-tool" style="font-size:12px"></i> ' + esc(t) + '</span>').join('') + '</div>' +
          '<div class="lcard-foot"><span class="mu"><i class="ti ti-player-play" style="font-size:13px"></i> ' + s[7] + ' runs</span><span class="sp"></span>' + usedStack(s[6 + 1]) + '</div>' +
        '</div>'
      ).join('') + '</div>';
    }
    return libTop('Skills') + '<div class="lib-page"><div class="lib-hero">' +
      '<div class="lh-ic" style="background:var(--cat-plum-bg); color:var(--cat-plum)"><i class="ti ti-puzzle"></i></div>' +
      '<div class="lh-main"><div class="lib-eyebrow">Library</div><h1 class="lib-title">Skills</h1>' +
      '<p class="lib-lead">Reusable procedures that bundle a method with the tools it needs. Compose once, attach to any agent.</p></div>' +
      '<div class="lh-act"><button class="m-btn primary" data-new="skill"><i class="ti ti-plus"></i> New skill</button></div></div>' +
      '<div class="lib-stats">' + statCard(SKILLS.length, '', 'Total skills') + statCard('6', '', 'Agents using skills') + statCard('41.9k', '', 'Runs this month') + statCard('4', '', 'Categories') + '</div>' +
      body + '</div>';
  };

  LIBS.tools = function () {
    const rows = TOOLS_LIB.map(t =>
      '<tr data-detail="' + esc(t[3]) + '"><td><div class="tl-row-name"><div class="tl-ic" style="background:' + t[1] + '; color:' + t[2] + '"><i class="ti ' + t[0] + '"></i></div><span class="mono">' + esc(t[3]) + '</span></div></td>' +
        '<td style="color:var(--ink-600)">' + esc(t[4]) + '</td>' +
        '<td><span class="item-tag">' + t[5] + '</span></td>' +
        '<td>' + usedStack(t[6]) + '</td>' +
        '<td><span class="m-badge ' + t[7] + ' sm"><span class="dot"></span> ' + t[8] + '</span></td></tr>'
    ).join('');
    return libTop('Tools') + '<div class="lib-page"><div class="lib-hero">' +
      '<div class="lh-ic" style="background:var(--accent-bg); color:var(--accent)"><i class="ti ti-tool"></i></div>' +
      '<div class="lh-main"><div class="lib-eyebrow">Library</div><h1 class="lib-title">Tools</h1>' +
      '<p class="lib-lead">Atomic functions agents call mid-run. Each is versioned, permissioned, and observable.</p></div>' +
      '<div class="lh-act"><button class="m-btn primary" data-new="tool"><i class="ti ti-plus"></i> New tool</button></div></div>' +
      '<div class="lib-stats">' + statCard(TOOLS_LIB.length, '', 'Registered tools') + statCard('5', '', 'Categories') + statCard('1', '', 'Rate-limited') + statCard('99.9', '%', 'Avg uptime') + '</div>' +
      '<div class="lib-table-wrap"><table class="m-table"><thead><tr><th>Tool</th><th>Description</th><th>Type</th><th>Used by</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  };

  LIBS.connectors = function () {
    let body = '';
    let total = 0, connected = 0;
    for (const c in CONNECTORS_LIB) {
      body += '<div class="lib-cat"><span>' + c + '</span><span class="ln"></span><span class="gc">' + CONNECTORS_LIB[c].length + '</span></div><div class="lib-grid">';
      body += CONNECTORS_LIB[c].map(k => {
        total++; if (k[4]) connected++;
        return '<div class="lcard" data-conn="' + esc(k[2]) + '">' +
          '<div class="lcard-top"><div class="lcard-ic logo" style="background:' + k[1] + '"><i class="ti ' + k[0] + '"></i></div>' +
            '<div style="flex:1"><div class="lcard-title">' + esc(k[2]) + '</div></div>' +
            (k[4] ? '<span class="m-badge good sm"><span class="dot"></span> Connected</span>' : '') + '</div>' +
          '<div class="lcard-desc">' + esc(k[3]) + '</div>' +
          (function () { const c = window.NF && window.NF.CONNECTORS && Object.values(window.NF.CONNECTORS).flat().find(x => x[2] === k[2]); const a = c && window.NF.AUTH[c[5] || 'oauth']; return a ? '<div class="lcard-tags"><span class="item-tag auth-tag"><i class="ti ' + a.icon + '"></i> ' + a.label + '</span><span class="item-tag">MCP</span></div>' : ''; })() +
          '<div class="lcard-foot">' + (k[4] ? '<span class="mu">' + usedStack(k[5]) + '</span><span class="sp"></span><button class="m-btn secondary sm" data-manage>Manage</button>' : '<span class="sp"></span><button class="m-btn primary sm" data-connect>Connect</button>') + '</div>' +
        '</div>';
      }).join('') + '</div>';
    }
    return libTop('Connectors') + '<div class="lib-page"><div class="lib-hero">' +
      '<div class="lh-ic" style="background:var(--cat-teal-bg); color:var(--cat-teal)"><i class="ti ti-plug-connected"></i></div>' +
      '<div class="lh-main"><div class="lib-eyebrow">Library</div><h1 class="lib-title">Connectors</h1>' +
      '<p class="lib-lead">External services reached over MCP. Authorize once, then grant any agent scoped access.</p></div>' +
      '<div class="lh-act"><button class="m-btn primary" data-new="connector"><i class="ti ti-plus"></i> Browse all</button></div></div>' +
      '<div class="lib-stats">' + statCard(connected, '', 'Connected') + statCard(total, '', 'Available') + statCard('3', '', 'In use') + statCard('1', '', 'Needs attention') + '</div>' +
      body + '</div>';
  };

  LIBS.knowledge = function () {
    const rows = KNOWLEDGE_LIB.map(k =>
      '<tr data-detail="' + esc(k[3]) + '"><td><div class="tl-row-name"><div class="tl-ic" style="background:' + k[1] + '; color:' + k[2] + '"><i class="ti ' + k[0] + '"></i></div><span style="font-weight:600">' + esc(k[3]) + '</span></div></td>' +
        '<td style="color:var(--ink-600)">' + esc(k[4]) + '</td>' +
        '<td class="num">' + k[5] + '</td>' +
        '<td style="font-family:var(--font-mono);font-size:var(--fs-xs);color:var(--ink-500)">' + k[6] + '</td>' +
        '<td><span class="m-badge ' + k[7] + ' sm"><span class="dot"></span> ' + k[8] + '</span></td></tr>'
    ).join('');
    return libTop('Knowledge') + '<div class="lib-page"><div class="lib-hero">' +
      '<div class="lh-ic" style="background:var(--cat-rose-bg); color:var(--cat-rose)"><i class="ti ti-books"></i></div>' +
      '<div class="lh-main"><div class="lib-eyebrow">Library</div><h1 class="lib-title">Knowledge</h1>' +
      '<p class="lib-lead">Sources your agents retrieve from. Connect a source and it is chunked, embedded, and kept fresh.</p></div>' +
      '<div class="lh-act"><button class="m-btn primary" data-new="knowledge"><i class="ti ti-plus"></i> Add source</button></div></div>' +
      '<div class="lib-stats">' + statCard('5', '', 'Sources') + statCard('20.0k', '', 'Documents') + statCard('1', '', 'Syncing') + statCard('1.8', 'GB', 'Indexed') + '</div>' +
      '<div class="lib-table-wrap"><table class="m-table"><thead><tr><th>Source</th><th>Type</th><th class="num">Docs</th><th>Last sync</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  };

  LIBS.analytics = function () {
    return libTop('Observability') + '<div class="lib-page"><div class="lib-hero">' +
      '<div class="lh-ic" style="background:var(--cat-blue-bg); color:var(--cat-blue)"><i class="ti ti-chart-dots-3"></i></div>' +
      '<div class="lh-main"><div class="lib-eyebrow">Monitor</div><h1 class="lib-title">Observability</h1>' +
      '<p class="lib-lead">Every run is traced. Watch latency, cost, tool errors and outcomes across all agents.</p></div></div>' +
      '<div class="lib-stats">' + statCard('48.2k', '', 'Runs (30d)') + statCard('1.9', 's', 'p50 latency') + statCard('$612', '', 'Spend (30d)') + statCard('2.1', '%', 'Escalation rate') + '</div>' +
      '<div class="m-card" style="margin-top:24px;padding:48px;text-align:center"><div class="empty-med" style="background:var(--cat-blue-bg);color:var(--cat-blue);width:54px;height:54px;border-radius:14px;display:grid;place-items:center;font-size:26px;margin:0 auto 16px"><i class="ti ti-timeline"></i></div>' +
      '<div style="font-family:var(--font-display);font-size:var(--fs-xl);font-weight:600;letter-spacing:-0.02em">Trace explorer</div>' +
      '<div style="font-size:var(--fs-sm);color:var(--ink-600);max-width:44ch;margin:8px auto 0;line-height:1.55">Open any run to inspect the full reasoning trace, tool calls, tokens and cost \u2014 the same trace view you see in the agent\u2019s Test panel.</div></div></div>';
  };

  function wireLibrary(root, name) {
    root.querySelectorAll('[data-new]').forEach(b => b.addEventListener('click', (e) => {
      e.stopPropagation();
      const k = b.dataset.new;
      if (k === 'connector') return window.NF && window.NF.flowConnectors ? window.NF.flowConnectors() : showView('connectors');
      if (window.NexusFeatures) return window.NexusFeatures.newItem(k);
      toast('Opening ' + k + ' composer\u2026', 'ti-plus');
    }));
    root.querySelectorAll('.lcard[data-detail], tr[data-detail]').forEach(c => c.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      if (window.NexusFeatures) return window.NexusFeatures.openDetail(c.dataset.detail, name);
      toast('Opening "' + c.dataset.detail + '"\u2026', 'ti-arrow-up-right');
    }));
    root.querySelectorAll('[data-connect]').forEach(b => b.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = b.closest('.lcard');
      const finish = () => {
        const foot = card.querySelector('.lcard-foot'), top = card.querySelector('.lcard-top');
        if (!top.querySelector('.m-badge')) top.appendChild(elFrom('<span class="m-badge good sm"><span class="dot"></span> Connected</span>'));
        foot.innerHTML = '<span class="mu">' + usedStack(0) + '</span><span class="sp"></span><button class="m-btn secondary sm" data-manage>Manage</button>';
        foot.querySelector('[data-manage]').addEventListener('click', (ev) => { ev.stopPropagation(); manageConn(card.dataset.conn); });
        for (const c in CONNECTORS_LIB) CONNECTORS_LIB[c].forEach(k => { if (k[2] === card.dataset.conn) k[4] = true; });
      };
      // same auth flow as the agent page: OAuth redirect, API key or connection string
      const cat = window.NF && window.NF.CONNECTORS && Object.values(window.NF.CONNECTORS).flat().find(k => k[2] === card.dataset.conn);
      if (cat && window.NF.configureConnector) return window.NF.configureConnector(cat, finish);
      finish(); toast(card.dataset.conn + ' connected', 'ti-plug-connected');
    }));
    root.querySelectorAll('[data-manage]').forEach(b => b.addEventListener('click', (e) => { e.stopPropagation(); manageConn(b.closest('.lcard').dataset.conn); }));
    const search = root.querySelector('[data-libsearch]');
    if (search) search.addEventListener('input', () => {
      const q = search.value.toLowerCase();
      root.querySelectorAll('.lcard, tbody tr').forEach(row => { row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none'; });
      root.querySelectorAll('.lib-cat').forEach(c => { let n = c.nextElementSibling; if (n && n.classList.contains('lib-grid')) c.style.display = [...n.children].some(x => x.style.display !== 'none') ? '' : 'none'; });
    });
  }

  function manageConn(name) { if (window.NexusFeatures) return window.NexusFeatures.manageConnector(name); toast('Opening ' + name + ' settings\u2026', 'ti-settings'); }

  /* ─────────────────────── Variables pane toggle ─────────────────────── */
  document.querySelectorAll('[data-instr]').forEach(btn => btn.addEventListener('click', () => {
    const pane = btn.dataset.instr;
    document.querySelectorAll('[data-instr-pane]').forEach(p => { p.hidden = p.dataset.instrPane !== pane; });
  }));
  const addVar = document.querySelector('[data-add-var]');
  if (addVar) addVar.addEventListener('click', () => { if (window.NexusFeatures) return window.NexusFeatures.addVariable(); toast('Type {{name}} in the prompt to create a variable', 'ti-variable'); });

  /* ═══════════════════════ CREATE WIZARD ═══════════════════════ */
  const TEMPLATES = {
    'Blank agent':       ['ti-square-plus', 'blue',  'New agent', 'A fresh agent. Describe what it should do.', 'You are a helpful assistant. Describe the task you handle and the steps you take.'],
    'Support agent':     ['ti-headset', 'teal',  'Support Triage', 'Routes inbound tickets, drafts replies, and escalates when unsure.', 'You are the first responder for inbound customer tickets.\n\nFor every ticket:\n1. Classify it and set a priority.\n2. Search the knowledge base before answering.\n3. Draft a warm, concise reply under 120 words.\n4. If confidence is low or the customer is angry, escalate to a human.'],
    'Data analyst':      ['ti-chart-pie', 'plum',  'Revenue Analyst', 'Queries the warehouse and answers questions with charts.', 'You are a data analyst. Translate questions into SQL, run read-only queries, and summarize findings with a clear chart and one-paragraph takeaway.'],
    'Outbound SDR':      ['ti-mail-fast', 'amber', 'Outbound SDR', 'Researches leads and drafts personalized outreach.', 'You are an SDR. Research the lead, identify a relevant hook, and draft a concise, personalized first-touch email. Never fabricate facts about the prospect.'],
    'Coding agent':      ['ti-code', 'rose',  'Bug Reproducer', 'Reads repos, reproduces bugs, and opens pull requests.', 'You are a coding agent. Reproduce the reported bug, identify the root cause, and propose a minimal fix as a pull request with a clear description.'],
    'Research assistant':['ti-search', 'blue',  'Research Assistant', 'Searches the web and synthesizes cited briefs.', 'You are a research assistant. Search reputable sources, cross-check claims, and produce a concise brief with inline citations.']
  };
  const TPL_ORDER = ['Blank agent', 'Support agent', 'Data analyst', 'Outbound SDR', 'Coding agent', 'Research assistant'];
  const COLORS = { blue: 'var(--cat-blue)', teal: 'var(--cat-teal)', plum: 'var(--cat-plum)', amber: 'var(--cat-amber)', rose: 'var(--cat-rose)', orange: 'var(--cat-orange)' };
  const COLOR_BG = { blue: 'var(--cat-blue-bg)', teal: 'var(--cat-teal-bg)', plum: 'var(--cat-plum-bg)', amber: 'var(--cat-amber-bg)', rose: 'var(--cat-rose-bg)', orange: 'var(--cat-orange-bg)' };
  const ICONS = ['ti-headset', 'ti-robot', 'ti-chart-pie', 'ti-mail-fast', 'ti-code', 'ti-search', 'ti-hierarchy-2', 'ti-bug', 'ti-brain', 'ti-bolt'];
  const WZ_TOOLS = [
    ['ti-search', 'var(--cat-blue-bg)', 'var(--cat-blue)', 'search_kb', 'Search your knowledge base.', true],
    ['ti-tag', 'var(--cat-teal-bg)', 'var(--cat-teal)', 'classify', 'Label input by intent.', true],
    ['ti-pencil', 'var(--cat-amber-bg)', 'var(--cat-amber)', 'draft_reply', 'Draft a reply for review.', true],
    ['ti-world-search', 'var(--bg-muted)', 'var(--ink-600)', 'web_search', 'Public web search.', false],
    ['ti-arrow-up-right-circle', 'var(--cat-rose-bg)', 'var(--cat-rose)', 'escalate', 'Hand off to a human.', false]
  ];
  const WZ_MODELS = [
    ['ti-sparkles', 'var(--accent)', 'Claude Sonnet 4.5', '200k ctx · balanced'],
    ['ti-sparkles', 'var(--accent)', 'Claude Opus 4.1', '200k ctx · frontier'],
    ['ti-circle-dashed', 'var(--cat-teal)', 'GPT-4o', '128k ctx · multimodal'],
    ['ti-circle', 'var(--cat-blue)', 'Gemini 2.5 Pro', '1M ctx · long context']
  ];

  const STEPS = ['Template', 'Identity', 'Goal', 'Instructions', 'Model & tools', 'Review'];
  let step = 0;
  const wz = { tpl: 'Support agent', name: 'Support Triage', handle: 'support-triage', desc: '', color: 'teal', icon: 'ti-headset', instr: '', model: 'Claude Sonnet 4.5', tools: new Set(['search_kb', 'classify', 'draft_reply']), goal: '', metric: 'Resolution without escalation', target: 70 };
  const GOAL_METRICS = ['Resolution without escalation', 'Answer groundedness', 'Escalation precision', 'CSAT', 'Task completion rate', 'Cost per run'];
  const TPL_GOALS = { 'Blank agent': '', 'Support agent': 'Resolve 70% of tier-1 tickets without a human, with every reply grounded in the help center.', 'Data analyst': 'Answer 80% of revenue questions correctly on the first try, with verifiable SQL.', 'Outbound SDR': 'Get 70% of drafted emails approved by reps without edits.', 'Coding agent': 'Reproduce 60% of reported bugs with logs attached within 5 minutes.', 'Research assistant': 'Deliver briefs where 95% of claims carry a checkable citation.' };
  const host = document.getElementById('wizard');

  function slug(s) { return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function applyTemplate(name) {
    const t = TEMPLATES[name]; wz.tpl = name; wz.icon = t[0]; wz.color = t[1]; wz.name = t[2]; wz.handle = slug(t[2]); wz.desc = t[3]; wz.instr = t[4]; wz.goal = TPL_GOALS[name] || '';
  }

  function openWizard() {
    step = 0; applyTemplate('Support agent');
    host.innerHTML = wizardShell();
    host.classList.add('show');
    bindWizard();
    renderStep();
  }
  window.openCreateWizard = openWizard;

  function wizardShell() {
    const steps = STEPS.map((s, i) =>
      '<div class="wz-step" data-step="' + i + '"><div class="sn">' + (i + 1) + '</div><div><div class="sl">' + s + '</div></div></div>'
    ).join('');
    return '<div class="wz">' +
      '<div class="wz-rail"><div class="wz-brand"><div class="bm"><i class="ti ti-robot" style="font-size:18px"></i></div><div><div class="bt">New agent</div><div class="bs">Project Nexus</div></div></div>' +
        '<div class="wz-steps">' + steps + '</div>' +
        '<div class="wz-rail-foot">Step <span data-curstep>1</span> of ' + STEPS.length + '</div></div>' +
      '<div class="wz-main"><div class="wz-scroll"><div class="wz-body" data-wzbody></div></div>' +
        '<div class="wz-foot"><button class="m-btn ghost" data-back><i class="ti ti-arrow-left"></i> Back</button><span class="sp"></span>' +
          '<span class="prog" data-prog></span><button class="m-btn primary" data-next>Continue <i class="ti ti-arrow-right"></i></button></div></div>' +
      '<div class="wz-close" data-wzclose><i class="ti ti-x"></i></div></div>';
  }

  function renderStep() {
    host.querySelectorAll('.wz-step').forEach((el, i) => { el.classList.toggle('active', i === step); el.classList.toggle('done', i < step); el.querySelector('.sn').innerHTML = i < step ? '<i class="ti ti-check"></i>' : (i + 1); });
    host.querySelector('[data-curstep]').textContent = step + 1;
    host.querySelector('[data-prog]').textContent = 'Step ' + (step + 1) + ' / ' + STEPS.length;
    host.querySelector('[data-back]').style.visibility = step === 0 ? 'hidden' : 'visible';
    const next = host.querySelector('[data-next]');
    next.innerHTML = step === STEPS.length - 1 ? '<i class="ti ti-rocket"></i> Create agent' : 'Continue <i class="ti ti-arrow-right"></i>';
    next.classList.toggle('accent', step === STEPS.length - 1);
    host.querySelector('[data-wzbody]').innerHTML = STEP_RENDER[step]();
    bindStep();
  }

  const STEP_RENDER = [
    // 0 — template
    () => '<div class="wz-eyebrow">Step 1 · Start</div><h2 class="wz-h">Pick a starting point</h2><p class="wz-sub">Templates pre-fill instructions, tools and a look. You can change everything later.</p>' +
      '<div class="tmpl-grid">' + TPL_ORDER.map(n => {
        const t = TEMPLATES[n];
        return '<div class="tmpl-card' + (n === wz.tpl ? ' sel' : '') + '" data-tpl="' + esc(n) + '">' +
          '<div class="tmpl-ic" style="background:' + COLOR_BG[t[1]] + '; color:' + COLORS[t[1]] + '"><i class="ti ' + t[0] + '"></i></div>' +
          '<div class="tmpl-name">' + esc(n) + '</div><div class="tmpl-desc">' + esc(t[3]) + '</div></div>';
      }).join('') + '</div>',
    // 1 — identity
    () => '<div class="wz-eyebrow">Step 2 · Identity</div><h2 class="wz-h">Name your agent</h2><p class="wz-sub">This is how it shows up across the workspace.</p>' +
      '<div style="display:flex;gap:20px;align-items:flex-start;margin-bottom:24px"><div class="wz-preview-tile" data-prev-tile style="background:' + COLOR_BG[wz.color] + '; color:' + COLORS[wz.color] + '"><i class="ti ' + wz.icon + '"></i></div>' +
        '<div style="flex:1"><div class="fld"><label class="fld-label">Name</label><input class="m-input" data-name value="' + esc(wz.name) + '"></div>' +
        '<div class="fld" style="margin-bottom:0"><label class="fld-label">Handle</label><div class="m-input-group"><span style="color:var(--ink-400)">@</span><input data-handle value="' + esc(wz.handle) + '"></div></div></div></div>' +
      '<div class="fld"><label class="fld-label">Description</label><textarea class="m-textarea" data-desc placeholder="One line on what this agent does">' + esc(wz.desc) + '</textarea></div>' +
      '<div class="fld"><label class="fld-label">Color</label><div class="swatch-row">' + Object.keys(COLORS).map(c => '<div class="swatch' + (c === wz.color ? ' sel' : '') + '" data-color="' + c + '" style="background:' + COLORS[c] + '"></div>').join('') + '</div></div>' +
      '<div class="fld"><label class="fld-label">Icon</label><div class="icon-row">' + ICONS.map(ic => '<div class="icon-pick' + (ic === wz.icon ? ' sel' : '') + '" data-icon="' + ic + '"><i class="ti ' + ic + '"></i></div>').join('') + '</div></div>',
    // 2 — goal
    () => '<div class="wz-eyebrow">Step 3 · Goal</div><h2 class="wz-h">What does success look like?</h2><p class="wz-sub">The goal is shown on the agent, tracked against production runs, and gates every publish.</p>' +
      '<div class="fld"><label class="fld-label">Objective</label><textarea class="m-textarea" data-goal placeholder="One sentence a teammate could verify">' + esc(wz.goal) + '</textarea></div>' +
      '<div class="frow two"><div class="fld"><label class="fld-label">Primary metric</label><select class="m-input" data-metric>' + GOAL_METRICS.map(m => '<option' + (m === wz.metric ? ' selected' : '') + '>' + m + '</option>').join('') + '</select></div><div class="fld"><label class="fld-label">Target</label><div class="m-input-group"><input data-target type="number" value="' + wz.target + '"><span style="color:var(--ink-400)">' + (wz.metric === 'CSAT' ? '/ 5' : wz.metric === 'Cost per run' ? '¢' : '%') + '</span></div></div></div>' +
      '<div class="m-alert info"><div class="a-ic"><i class="ti ti-info-circle"></i></div><div class="a-body"><div class="a-title">Measured two ways</div><div class="a-text">Live: scored on a sample of production runs. Offline: an experiment against a dataset on every publish.</div></div></div>',
    // 3 — instructions
    () => '<div class="wz-eyebrow">Step 4 · Instructions</div><h2 class="wz-h">How should it behave?</h2><p class="wz-sub">The system prompt. Use {{variables}} for anything that changes per run.</p>' +
      '<div class="instr-editor" contenteditable="true" spellcheck="false" data-instr style="min-height:220px">' + esc(wz.instr) + '</div>' +
      '<div class="instr-foot" style="margin-top:12px"><span class="tk"><i class="ti ti-square-rounded-letter-t" style="font-size:13px;vertical-align:-2px"></i> <span data-tok>~' + Math.max(20, Math.round(wz.instr.length / 4)) + '</span> tokens</span></div>',
    // 4 — model & tools
    () => '<div class="wz-eyebrow">Step 5 · Capabilities</div><h2 class="wz-h">Model &amp; starter tools</h2><p class="wz-sub">Choose the reasoning engine and the tools it can call. Add more anytime.</p>' +
      '<div class="fld"><label class="fld-label">Model</label>' + WZ_MODELS.map(m => '<div class="mdl-row' + (m[2] === wz.model ? ' sel' : '') + '" data-model="' + esc(m[2]) + '"><div class="mdl-logo" style="background:' + m[1] + '"><i class="ti ' + m[0] + '"></i></div><div class="mdl-body"><div class="mdl-name">' + esc(m[2]) + '</div><div class="mdl-meta">' + esc(m[3]) + '</div></div>' + (m[2] === wz.model ? '<i class="ti ti-check mdl-check"></i>' : '') + '</div>').join('') + '</div>' +
      '<div class="fld"><label class="fld-label">Tools <span class="opt">— ' + wz.tools.size + ' selected</span></label>' + wzToolList().map(t => '<div class="wz-tool"><div class="wt-ic" style="background:' + t[1] + '; color:' + t[2] + '"><i class="ti ' + t[0] + '"></i></div><div class="wt-b"><div class="wt-n">' + esc(t[3]) + '</div><div class="wt-d">' + esc(t[4]) + '</div></div><div class="m-switch' + (wz.tools.has(t[3]) ? ' on' : '') + '" data-tool="' + esc(t[3]) + '"></div></div>').join('') + '<div class="add-row" data-wz-more><i class="ti ti-plus"></i> Browse the tool catalog</div></div>',
    // 5 — review
    () => '<div class="wz-eyebrow">Step 6 · Review</div><h2 class="wz-h">Ready to create</h2><p class="wz-sub">Confirm the setup. You\u2019ll land in the builder to fine-tune.</p>' +
      '<div class="rev-grid">' +
        '<div class="rev-row"><div class="rev-k"><i class="ti ti-robot" style="font-size:15px"></i> Agent</div><div class="rev-v" style="display:flex;align-items:center;gap:11px"><div class="ag-tile-sm" style="width:30px;height:30px;background:' + COLOR_BG[wz.color] + '; color:' + COLORS[wz.color] + '"><i class="ti ' + wz.icon + '"></i></div><div><b>' + esc(wz.name) + '</b> <span class="mono" style="color:var(--ink-500)">@' + esc(wz.handle) + '</span><div style="color:var(--ink-600);font-weight:400">' + esc(wz.desc) + '</div></div></div></div>' +
        '<div class="rev-row"><div class="rev-k"><i class="ti ti-target-arrow" style="font-size:15px"></i> Goal</div><div class="rev-v">' + (wz.goal ? esc(wz.goal) + '<div style="color:var(--ink-600);font-size:var(--fs-xs);margin-top:4px">' + esc(wz.metric) + ' ≥ ' + wz.target + (wz.metric === 'CSAT' ? ' / 5' : wz.metric === 'Cost per run' ? '¢' : '%') + '</div>' : '<span style="color:var(--ink-400)">No goal set</span>') + '</div></div>' +
        '<div class="rev-row"><div class="rev-k"><i class="ti ti-cpu" style="font-size:15px"></i> Model</div><div class="rev-v">' + esc(wz.model) + '</div></div>' +
        '<div class="rev-row"><div class="rev-k"><i class="ti ti-tool" style="font-size:15px"></i> Tools</div><div class="rev-v">' + ([...wz.tools].map(t => '<span class="m-chip" style="margin:0 6px 6px 0"><span class="mono">' + esc(t) + '</span></span>').join('') || '<span style="color:var(--ink-400)">None yet</span>') + '</div></div>' +
        '<div class="rev-row"><div class="rev-k"><i class="ti ti-file-text" style="font-size:15px"></i> Instructions</div><div class="rev-v" style="color:var(--ink-600);font-size:var(--fs-xs);font-family:var(--font-mono);line-height:1.6;max-height:96px;overflow:hidden">' + esc(wz.instr).slice(0, 280) + (wz.instr.length > 280 ? '\u2026' : '') + '</div></div>' +
      '</div>'
  ];

  /* tools shown in the wizard = starter set + anything picked from the catalog */
  function wzToolList() {
    const all = [...WZ_TOOLS];
    if (window.NF) Object.values(window.NF.TOOL_CATALOG).flat().forEach(t => { if (wz.tools.has(t[3]) && !all.some(a => a[3] === t[3])) all.push(t); });
    return all;
  }
  function wzBrowseTools() {
    const groups = window.NF.TOOL_CATALOG; let html = '';
    for (const g in groups) html += '<div class="cat-label"><span>' + esc(g) + '</span><span class="ln"></span></div>' + groups[g].map(t => '<div class="pick-tool' + (wz.tools.has(t[3]) ? ' on' : '') + '" data-wzt="' + esc(t[3]) + '"><div class="pt-ic"><i class="ti ' + t[0] + '"></i></div><div style="flex:1;min-width:0"><div class="pt-name">' + esc(t[3]) + '</div><div class="wt-d" style="font-size:var(--fs-xs);color:var(--ink-600)">' + esc(t[4]) + '</div></div><div class="pt-check"><i class="ti ti-check"></i></div></div>').join('');
    const p = window.NF.shell('drawer', '<div class="m-drawer">' + '<div class="ov-head"><div class="oh-ic"><i class="ti ti-tool"></i></div><div class="oh-titles"><div class="ov-title">Tool catalog</div><div class="ov-sub">Pick any tools the agent should start with.</div></div><div class="ov-close" data-close><i class="ti ti-x"></i></div></div><div class="ov-body">' + html + '</div><div class="ov-foot"><div class="sp"></div><button class="m-btn primary" data-done>Done</button></div></div>');
    p.querySelectorAll('[data-wzt]').forEach(r => r.addEventListener('click', () => { r.classList.toggle('on'); const n = r.dataset.wzt; r.classList.contains('on') ? wz.tools.add(n) : wz.tools.delete(n); }));
    p.querySelector('[data-done]').addEventListener('click', () => { window.NF.close(); renderStep(); });
  }

  function bindStep() {
    const body = host.querySelector('[data-wzbody]');
    // goal
    const goalI = body.querySelector('[data-goal]'); if (goalI) goalI.addEventListener('input', () => wz.goal = goalI.value);
    const metI = body.querySelector('[data-metric]'); if (metI) metI.addEventListener('change', () => { wz.metric = metI.value; wz.target = wz.metric === 'CSAT' ? 4.5 : wz.metric === 'Cost per run' ? 40 : 70; renderStep(); });
    const tgtI = body.querySelector('[data-target]'); if (tgtI) tgtI.addEventListener('input', () => wz.target = tgtI.value);
    const more = body.querySelector('[data-wz-more]'); if (more) more.addEventListener('click', wzBrowseTools);
    // template
    body.querySelectorAll('[data-tpl]').forEach(c => c.addEventListener('click', () => { applyTemplate(c.dataset.tpl); body.querySelectorAll('[data-tpl]').forEach(x => x.classList.toggle('sel', x === c)); }));
    // identity
    const nameI = body.querySelector('[data-name]'), handleI = body.querySelector('[data-handle]'), prevTile = body.querySelector('[data-prev-tile]');
    if (nameI) nameI.addEventListener('input', () => { wz.name = nameI.value; wz.handle = slug(nameI.value); if (handleI) handleI.value = wz.handle; });
    if (handleI) handleI.addEventListener('input', () => wz.handle = slug(handleI.value));
    const descI = body.querySelector('[data-desc]'); if (descI) descI.addEventListener('input', () => wz.desc = descI.value);
    body.querySelectorAll('[data-color]').forEach(s => s.addEventListener('click', () => { wz.color = s.dataset.color; body.querySelectorAll('[data-color]').forEach(x => x.classList.toggle('sel', x === s)); if (prevTile) { prevTile.style.background = COLOR_BG[wz.color]; prevTile.style.color = COLORS[wz.color]; } }));
    body.querySelectorAll('[data-icon]').forEach(s => s.addEventListener('click', () => { wz.icon = s.dataset.icon; body.querySelectorAll('[data-icon]').forEach(x => x.classList.toggle('sel', x === s)); if (prevTile) prevTile.innerHTML = '<i class="ti ' + wz.icon + '"></i>'; }));
    // instructions
    const instrI = body.querySelector('[data-instr]'); const tok = body.querySelector('[data-tok]');
    if (instrI) instrI.addEventListener('input', () => { wz.instr = instrI.innerText; if (tok) tok.textContent = '~' + Math.max(20, Math.round(wz.instr.length / 4)); });
    // model & tools
    body.querySelectorAll('[data-model]').forEach(m => m.addEventListener('click', () => { wz.model = m.dataset.model; body.querySelectorAll('[data-model]').forEach(x => { x.classList.toggle('sel', x === m); const c = x.querySelector('.mdl-check'); if (c) c.remove(); }); m.insertAdjacentHTML('beforeend', '<i class="ti ti-check mdl-check"></i>'); }));
    body.querySelectorAll('[data-tool]').forEach(sw => sw.addEventListener('click', () => { sw.classList.toggle('on'); const n = sw.dataset.tool; sw.classList.contains('on') ? wz.tools.add(n) : wz.tools.delete(n); }));
  }

  function bindWizard() {
    host.querySelector('[data-wzclose]').addEventListener('click', closeWizard);
    host.querySelector('[data-back]').addEventListener('click', () => { if (step > 0) { step--; renderStep(); } });
    host.querySelector('[data-next]').addEventListener('click', () => {
      if (step < STEPS.length - 1) { step++; renderStep(); }
      else finishWizard();
    });
    host.querySelectorAll('.wz-step').forEach(s => s.addEventListener('click', () => { const i = +s.dataset.step; if (i <= step) { step = i; renderStep(); } }));
  }
  function closeWizard() { host.classList.remove('show'); host.innerHTML = ''; }

  function finishWizard() {
    if (window.NexusFeatures) {
      window.NexusFeatures.registerAgent({ handle: wz.handle, name: wz.name, desc: wz.desc, color: wz.color, icon: wz.icon, instr: wz.instr, model: wz.model, tools: [...wz.tools], goal: wz.goal ? { objective: wz.goal, metric: wz.metric, target: +wz.target } : null });
      closeWizard(); showView('agents'); toast('Agent "' + wz.name + '" created', 'ti-robot'); return;
    }
    // add to rail Drafts and select; update builder hero
    const list = document.querySelector('.rail-list');
    const draftsLabel = list ? list.querySelector('.rl-group-label') : null;
    if (draftsLabel) {
      const gc = draftsLabel.querySelector('.gc'); if (gc) gc.textContent = String((parseInt(gc.textContent, 10) || 0) + 1);
      const link = elFrom('<div class="ag-link"><div class="ag-tile-sm" style="background:' + COLOR_BG[wz.color] + '; color:' + COLORS[wz.color] + '"><i class="ti ' + wz.icon + '"></i></div><div class="nm">' + esc(wz.name) + '</div><span class="st" style="background:var(--warn)"></span></div>');
      draftsLabel.after(link);
      link.addEventListener('click', () => { document.querySelectorAll('.ag-link').forEach(x => x.classList.remove('active')); link.classList.add('active'); loadAgentIntoBuilder(); });
    }
    loadAgentIntoBuilder();
    closeWizard();
    showView('agents');
    toast('Agent "' + wz.name + '" created', 'ti-robot');
  }

  function loadAgentIntoBuilder() {
    const tile = document.querySelector('.hero-tile');
    if (tile) { tile.style.background = COLOR_BG[wz.color]; tile.style.color = COLORS[wz.color]; tile.querySelector('i').className = 'ti ' + wz.icon; }
    const name = document.querySelector('.hero-name'); if (name) name.textContent = wz.name;
    const handle = document.querySelector('.hero-handle'); if (handle) handle.innerHTML = '@<b>' + esc(wz.handle) + '</b> · ' + esc(wz.desc || 'New agent.');
    const crumbB = document.querySelector('.work-top .crumbs b'); if (crumbB) crumbB.textContent = wz.name;
    const badge = document.querySelector('.work-top .crumbs .m-badge'); if (badge) { badge.className = 'm-badge warn sm'; badge.innerHTML = '<span class="dot"></span> Draft'; }
    const editor = document.querySelector('[data-section="instructions"] .instr-editor');
    if (editor && wz.instr) editor.textContent = wz.instr;
  }

  window.NS = { showView, LIBS, usedStack, libTop, statCard, SKILLS, TOOLS_LIB, KNOWLEDGE_LIB, CONNECTORS_LIB, COLORS, COLOR_BG, ICONS, wireLibrary, rendered };

})();
