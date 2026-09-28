/* ═══════════════════════════════════════════════════════════════
   AGENT BUILDER — flow overlays engine
   Modals, drawers, catalogs, and all the previously-dead buttons.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ───────────────────────── infra ───────────────────────── */
  const overlay = document.getElementById('overlay');
  const toastHost = document.getElementById('toastHost');

  function elFrom(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function close() {
    overlay.classList.remove('show');
    overlay.className = 'm-overlay';
    overlay.innerHTML = '';
  }

  function shell(kind, inner) {
    overlay.className = 'm-overlay show' + (kind === 'drawer' ? ' drawer' : '');
    overlay.innerHTML = '';
    const panel = elFrom(inner);
    overlay.appendChild(panel);
    return panel;
  }

  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.classList.contains('show')) close(); });

  function head(ic, bg, fg, title, sub) {
    return (
      '<div class="ov-head">' +
        '<div class="oh-ic" style="background:' + bg + '; color:' + fg + '"><i class="ti ' + ic + '"></i></div>' +
        '<div class="oh-titles"><div class="ov-title">' + esc(title) + '</div>' +
          (sub ? '<div class="ov-sub">' + esc(sub) + '</div>' : '') + '</div>' +
        '<div class="ov-close" data-close><i class="ti ti-x"></i></div>' +
      '</div>'
    );
  }

  function toast(msg, icon) {
    const t = elFrom('<div class="m-toast"><span class="t-ic"><i class="ti ' + (icon || 'ti-check') + '"></i></span><span></span></div>');
    t.querySelector('span:last-child').textContent = msg;
    toastHost.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 280); }, 2600);
  }

  // delegate close + generic [data-act] inside overlay
  overlay.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });

  function block(section) { return document.querySelector('[data-section="' + section + '"]'); }
  function bodyOf(section) { const b = block(section); return b ? b.querySelector('.block-body') : null; }
  function bumpCount(section, delta) {
    const b = block(section); if (!b) return;
    const cnt = b.querySelector('.block-title .cnt'); if (!cnt) return;
    cnt.textContent = String(Math.max(0, (parseInt(cnt.textContent, 10) || 0) + delta));
  }
  function expand(section) { const b = block(section); if (b) b.classList.remove('collapsed'); }

  /* ───────────────────────── catalogs ───────────────────────── */
  const TEMPLATES = [
    ['ti-square-plus', 'var(--bg-muted)', 'var(--ink-700)', 'Blank agent', 'Start from nothing and wire it up yourself.'],
    ['ti-headset', 'var(--cat-teal-bg)', 'var(--cat-teal)', 'Support agent', 'Triage tickets, draft replies, escalate when unsure.'],
    ['ti-chart-pie', 'var(--cat-plum-bg)', 'var(--cat-plum)', 'Data analyst', 'Query warehouses and answer questions with charts.'],
    ['ti-mail-fast', 'var(--cat-amber-bg)', 'var(--cat-amber)', 'Outbound SDR', 'Research leads and draft personalized outreach.'],
    ['ti-code', 'var(--cat-rose-bg)', 'var(--cat-rose)', 'Coding agent', 'Read repos, reproduce bugs, open pull requests.'],
    ['ti-search', 'var(--cat-blue-bg)', 'var(--cat-blue)', 'Research assistant', 'Search the web and synthesize cited briefs.']
  ];

  const TOOL_CATALOG = {
    'Retrieval': [
      ['ti-search', 'var(--cat-blue-bg)', 'var(--cat-blue)', 'search_kb', 'Semantic search over your knowledge base.', true],
      ['ti-world-search', 'var(--bg-muted)', 'var(--ink-600)', 'web_search', 'Public web search with cited results.', false],
      ['ti-file-search', 'var(--cat-blue-bg)', 'var(--cat-blue)', 'read_document', 'Extract text from PDFs, docs and sheets.', false],
      ['ti-vector', 'var(--cat-plum-bg)', 'var(--cat-plum)', 'vector_lookup', 'Nearest-neighbor lookup in a vector index.', false]
    ],
    'Actions': [
      ['ti-tag', 'var(--cat-teal-bg)', 'var(--cat-teal)', 'classify', 'Label input by intent and urgency.', true],
      ['ti-pencil', 'var(--cat-amber-bg)', 'var(--cat-amber)', 'draft_reply', 'Generate a customer-facing draft for review.', true],
      ['ti-arrow-up-right-circle', 'var(--cat-rose-bg)', 'var(--cat-rose)', 'escalate', 'Hand off to a human with full context.', true],
      ['ti-mail', 'var(--cat-orange-bg)', 'var(--cat-orange)', 'send_email', 'Send a transactional email.', false],
      ['ti-calendar-plus', 'var(--cat-teal-bg)', 'var(--cat-teal)', 'create_event', 'Book a calendar event.', false]
    ],
    'Code & data': [
      ['ti-terminal-2', 'var(--ink-200)', 'var(--ink-800)', 'run_python', 'Execute Python in a sandbox.', false],
      ['ti-database', 'var(--cat-blue-bg)', 'var(--cat-blue)', 'query_db', 'Run a read-only SQL query.', false],
      ['ti-api', 'var(--cat-plum-bg)', 'var(--cat-plum)', 'http_request', 'Call an external REST endpoint.', false]
    ]
  };

  const CONNECTORS = {
    'Communication': [
      ['ti-brand-slack', '#4A154B', 'Slack', 'Post messages, read channels, notify on-call.', true, 'oauth'],
      ['ti-mail', '#D44638', 'Gmail', 'Read and send email on the user\u2019s behalf.', false, 'oauth'],
      ['ti-brand-discord', '#5865F2', 'Discord', 'Send messages to servers and threads.', false, 'token'],
      ['ti-message', '#0B5CFF', 'Intercom', 'Read conversations and post replies.', false, 'oauth']
    ],
    'Dev & tickets': [
      ['ti-brand-github', '#24292F', 'GitHub', 'Open issues and pull requests, read code.', true, 'oauth'],
      ['ti-ticket', '#0052CC', 'Jira', 'Create and transition issues.', false, 'token'],
      ['ti-layout-kanban', '#5E6AD2', 'Linear', 'File and update Linear issues.', false, 'token'],
      ['ti-headset', '#03363D', 'Zendesk', 'Read tickets and write private notes.', true, 'oauth']
    ],
    'Data & CRM': [
      ['ti-database', '#336791', 'Postgres', 'Run read-only queries against a database.', false, 'conn'],
      ['ti-brand-notion', '#000000', 'Notion', 'Read and append to Notion pages.', false, 'oauth'],
      ['ti-cloud', '#0061FF', 'Salesforce', 'Read and update CRM records.', false, 'oauth'],
      ['ti-brand-stripe', '#635BFF', 'Stripe', 'Look up customers, charges and refunds.', false, 'token']
    ]
  };

  const MODELS = {
    'Anthropic': [
      ['ti-sparkles', 'var(--accent)', 'Claude Opus 4.1', '200k ctx · frontier', '$15 / 1M'],
      ['ti-sparkles', 'var(--accent)', 'Claude Sonnet 4.5', '200k ctx · balanced', '$3 / 1M'],
      ['ti-sparkles', 'var(--accent)', 'Claude Haiku 4', '200k ctx · fastest', '$0.80 / 1M']
    ],
    'OpenAI': [
      ['ti-circle-dashed', 'var(--cat-teal)', 'GPT-4o', '128k ctx · multimodal', '$5 / 1M'],
      ['ti-circle-dashed', 'var(--cat-teal)', 'GPT-4o mini', '128k ctx · cost saver', '$0.60 / 1M'],
      ['ti-circle-dashed', 'var(--cat-teal)', 'o3', '200k ctx · reasoning', '$10 / 1M']
    ],
    'Google': [
      ['ti-circle', 'var(--cat-blue)', 'Gemini 2.5 Pro', '1M ctx · long context', '$3.50 / 1M'],
      ['ti-circle', 'var(--cat-blue)', 'Gemini 2.5 Flash', '1M ctx · fast', '$0.30 / 1M']
    ]
  };

  const KNOWLEDGE_SOURCES = [
    ['ti-upload', 'var(--cat-blue-bg)', 'var(--cat-blue)', 'Upload files', 'PDF, DOCX, TXT, Markdown, CSV — up to 200 MB.'],
    ['ti-world-www', 'var(--cat-teal-bg)', 'var(--cat-teal)', 'Website / URL', 'Crawl a site or sitemap and keep it fresh.'],
    ['ti-brand-notion', 'var(--ink-200)', 'var(--ink-800)', 'Notion', 'Sync selected Notion databases and pages.'],
    ['ti-brand-google-drive', 'var(--cat-amber-bg)', 'var(--cat-amber)', 'Google Drive', 'Index docs and sheets from shared folders.'],
    ['ti-database', 'var(--cat-plum-bg)', 'var(--cat-plum)', 'Postgres / SQL', 'Expose tables as a retrievable source.'],
    ['ti-api', 'var(--cat-rose-bg)', 'var(--cat-rose)', 'Custom API', 'Pull records from any REST endpoint.']
  ];

  const TRIGGERS = [
    ['ti-inbox', 'var(--cat-teal-bg)', 'var(--cat-teal)', 'Inbound ticket', 'Run when a ticket lands in a chosen view.'],
    ['ti-webhook', 'var(--cat-plum-bg)', 'var(--cat-plum)', 'Webhook', 'Run on a POST to a generated URL.'],
    ['ti-clock-hour-4', 'var(--cat-amber-bg)', 'var(--cat-amber)', 'Schedule', 'Run on a cron schedule (e.g. every hour).'],
    ['ti-mail-opened', 'var(--cat-orange-bg)', 'var(--cat-orange)', 'Inbound email', 'Run when an address receives a message.'],
    ['ti-hand-click', 'var(--cat-blue-bg)', 'var(--cat-blue)', 'Manual / API', 'Run on demand from the API or dashboard.']
  ];

  /* renderers for catalog rows */
  function catalogRow(it, kind) {
    // it: [icon, bg, fg, name, desc, added]  (tools)
    const [icon, bg, fg, name, desc, added] = it;
    const row = elFrom(
      '<div class="item">' +
        '<div class="item-ic" style="background:' + bg + '; color:' + fg + '"><i class="ti ' + icon + '"></i></div>' +
        '<div class="item-body"><div class="item-name"><span class="mono">' + esc(name) + '</span></div>' +
          '<div class="item-desc">' + esc(desc) + '</div></div>' +
        '<button class="cat-add' + (added ? ' added' : '') + '"><i class="ti ' + (added ? 'ti-check' : 'ti-plus') + '"></i></button>' +
      '</div>'
    );
    const btn = row.querySelector('.cat-add');
    btn.addEventListener('click', () => {
      btn.classList.add('added');
      btn.innerHTML = '<i class="ti ti-check"></i>';
      addToolToList(it);
      toast(name + ' added to tools');
    });
    return row;
  }

  const AUTH = {
    oauth: { label: 'OAuth 2.0', icon: 'ti-shield-lock', hint: 'Sign in with the provider. Tokens rotate automatically.' },
    token: { label: 'API key',   icon: 'ti-key',         hint: 'Paste a key or personal access token. Stored encrypted.' },
    conn:  { label: 'Connection string', icon: 'ti-plug', hint: 'Host, credentials and database. Read-only role recommended.' },
    none:  { label: 'No auth',   icon: 'ti-lock-open',   hint: 'Public endpoint. Nothing is stored.' }
  };

  function connectorRow(it) {
    const [icon, brand, name, desc, connected, auth] = it;
    const a = AUTH[auth || 'oauth'];
    const row = elFrom(
      '<div class="item">' +
        '<div class="item-ic logo" style="background:' + brand + '; color:#fff"><i class="ti ' + icon + '"></i></div>' +
        '<div class="item-body"><div class="item-name">' + esc(name) + '</div>' +
          '<div class="item-desc">' + esc(desc) + '</div>' +
          '<div class="item-meta"><span class="item-tag auth-tag"><i class="ti ' + a.icon + '"></i> ' + a.label + '</span><span class="item-tag">MCP</span></div></div>' +
        (connected
          ? '<span class="m-badge good sm"><span class="dot"></span> Connected</span>'
          : '<button class="m-btn secondary sm">Connect</button>') +
      '</div>'
    );
    const btn = row.querySelector('button.m-btn');
    if (btn) btn.addEventListener('click', () => configureConnector(it));
    return row;
  }

  function configureConnector(it, onDone) {
    const auth = it[5] || 'oauth';
    pendingDone = onDone || null;
    if (auth === 'oauth') return oauthConnect(it);
    return credentialConnect(it);
  }
  let pendingDone = null;
  function connectorDone(it) {
    const cb = pendingDone; pendingDone = null;
    if (cb) return cb(it);
    addConnectorToList(it);
  }

  /* ───────────────────────── flows ───────────────────────── */

  function flowNewAgent() {
    if (window.openCreateWizard) return window.openCreateWizard();
    const cards = TEMPLATES.map((t, i) =>
      '<div class="tmpl-card' + (i === 1 ? ' sel' : '') + '" data-tmpl="' + i + '">' +
        '<div class="tmpl-ic" style="background:' + t[1] + '; color:' + t[2] + '"><i class="ti ' + t[0] + '"></i></div>' +
        '<div class="tmpl-name">' + esc(t[3]) + '</div>' +
        '<div class="tmpl-desc">' + esc(t[4]) + '</div>' +
      '</div>'
    ).join('');
    const p = shell('modal',
      '<div class="m-modal lg">' +
        head('ti-robot', 'var(--cat-teal-bg)', 'var(--cat-teal)', 'Create a new agent', 'Start from a template or a blank canvas.') +
        '<div class="ov-body"><div class="tmpl-grid">' + cards + '</div></div>' +
        '<div class="ov-foot"><div class="sp"></div><button class="m-btn ghost" data-close>Cancel</button>' +
          '<button class="m-btn primary" data-create><i class="ti ti-arrow-right"></i> Create agent</button></div>' +
      '</div>'
    );
    let sel = 1;
    p.querySelectorAll('[data-tmpl]').forEach(c => c.addEventListener('click', () => {
      p.querySelectorAll('[data-tmpl]').forEach(x => x.classList.remove('sel'));
      c.classList.add('sel'); sel = +c.dataset.tmpl;
    }));
    p.querySelector('[data-create]').addEventListener('click', () => { close(); toast('Created "' + TEMPLATES[sel][3] + '" — draft ready', 'ti-robot'); });
  }

  function drawerCatalog(opts) {
    // opts: {icon,bg,fg,title,sub,groups,render,footLabel,onFoot}
    let groupsHtml = '';
    for (const g in opts.groups) {
      groupsHtml += '<div class="cat-label"><span>' + esc(g) + '</span><span class="ln"></span></div><div data-grp="' + esc(g) + '"></div>';
    }
    const p = shell('drawer',
      '<div class="m-drawer">' +
        head(opts.icon, opts.bg, opts.fg, opts.title, opts.sub) +
        '<div style="padding:16px 22px 0">' +
          '<div class="ov-search"><i class="ti ti-search"></i><input placeholder="' + esc(opts.searchPh || 'Search\u2026') + '" data-search></div>' +
        '</div>' +
        '<div class="ov-body" style="padding-top:2px">' + groupsHtml + '</div>' +
        (opts.footLabel ? '<div class="ov-foot"><div class="sp"></div><button class="m-btn secondary" data-close>Done</button></div>' : '') +
      '</div>'
    );
    for (const g in opts.groups) {
      const cont = p.querySelector('[data-grp="' + CSS.escape(g) + '"]');
      opts.groups[g].forEach(it => cont.appendChild(opts.render(it)));
    }
    const search = p.querySelector('[data-search]');
    if (search) search.addEventListener('input', () => {
      const q = search.value.toLowerCase();
      p.querySelectorAll('.ov-body .item').forEach(row => {
        const txt = row.textContent.toLowerCase();
        row.style.display = txt.includes(q) ? '' : 'none';
      });
    });
    return p;
  }

  /* Connected sources that expose operations. MCP servers list tools via tools/list;
     REST connectors expose OpenAPI operations. Each op: [name, desc, risk, area] */
  const DISCOVERABLE = [
    { name: 'Zendesk', icon: 'ti-headset', brand: '#03363D', kind: 'MCP', status: 'Connected', ops: [
      ['list_tickets', 'List tickets in a view with filters.', 'read', 'Tickets'],
      ['get_ticket', 'Fetch one ticket with comments and requester.', 'read', 'Tickets'],
      ['search_tickets', 'Full-text search across tickets.', 'read', 'Tickets'],
      ['add_private_note', 'Append an internal note to a ticket.', 'write', 'Tickets'],
      ['update_ticket_status', 'Move a ticket to open, pending or solved.', 'write', 'Tickets'],
      ['assign_ticket', 'Assign to an agent or group.', 'write', 'Tickets'],
      ['delete_ticket', 'Permanently delete a ticket.', 'destructive', 'Tickets'],
      ['search_help_center', 'Search published help-center articles.', 'read', 'Knowledge'],
      ['get_article', 'Fetch a help-center article body.', 'read', 'Knowledge'],
      ['get_user', 'Look up an end user or agent.', 'read', 'Users'],
      ['suspend_user', 'Suspend an end user account.', 'destructive', 'Users']
    ]},
    { name: 'Slack', icon: 'ti-brand-slack', brand: '#4A154B', kind: 'MCP', status: 'Connected', ops: [
      ['list_channels', 'List public channels the app can see.', 'read', 'Channels'],
      ['read_channel_history', 'Read recent messages in a channel.', 'read', 'Channels'],
      ['post_message', 'Post a message to a channel or thread.', 'write', 'Messages'],
      ['add_reaction', 'React to a message.', 'write', 'Messages'],
      ['lookup_user', 'Find a user by email or handle.', 'read', 'Users'],
      ['archive_channel', 'Archive a channel.', 'destructive', 'Channels']
    ]},
    { name: 'GitHub', icon: 'ti-brand-github', brand: '#24292F', kind: 'MCP', status: 'Connected', ops: [
      ['search_code', 'Search code across repositories.', 'read', 'Code'],
      ['get_file', 'Read a file at a ref.', 'read', 'Code'],
      ['list_issues', 'List issues with labels and state.', 'read', 'Issues'],
      ['create_issue', 'Open a new issue.', 'write', 'Issues'],
      ['comment_on_issue', 'Add a comment to an issue or PR.', 'write', 'Issues'],
      ['create_pull_request', 'Open a pull request from a branch.', 'write', 'Pull requests'],
      ['merge_pull_request', 'Merge a pull request.', 'destructive', 'Pull requests'],
      ['delete_branch', 'Delete a branch.', 'destructive', 'Code']
    ]},
    { name: 'Internal billing API', icon: 'ti-api', brand: 'var(--ink-900)', kind: 'REST', status: 'Connected', ops: [
      ['get_invoice', 'GET /invoices/{id}', 'read', 'Invoices'],
      ['list_invoices', 'GET /invoices', 'read', 'Invoices'],
      ['issue_credit', 'POST /credits', 'write', 'Credits'],
      ['void_invoice', 'DELETE /invoices/{id}', 'destructive', 'Invoices']
    ]}
  ];
  const RISK = { read: ['Read', 'var(--good-dot)'], write: ['Write', 'var(--warn-dot)'], destructive: ['Destructive', 'var(--bad-dot)'] };

  function flowToolCatalog(startTab) {
    let groupsHtml = '';
    for (const g in TOOL_CATALOG) groupsHtml += '<div class="cat-label"><span>' + esc(g) + '</span><span class="ln"></span></div><div data-grp="' + esc(g) + '"></div>';
    const srcHtml = DISCOVERABLE.map((s, i) =>
      '<div class="src-opt' + (i === 0 ? ' sel' : '') + '" data-src="' + i + '">' +
        '<div class="item-ic logo" style="background:' + s.brand + ';color:#fff"><i class="ti ' + s.icon + '"></i></div>' +
        '<div class="item-body"><div class="item-name">' + esc(s.name) + '</div><div class="item-desc"><span class="mono-meta">' + s.ops.length + ' operations</span> \u00b7 ' + s.kind + '</div></div>' +
        '<span class="m-badge good sm"><span class="dot"></span> ' + s.status + '</span>' +
      '</div>').join('');
    const p = shell('drawer',
      '<div class="m-drawer">' +
        head('ti-tool', 'var(--bg-muted)', 'var(--ink-700)', 'Add tools', 'Pick from the catalog, or discover operations exposed by a connected service.') +
        '<div style="padding:14px 22px 0"><div class="m-seg conn-tabs" style="display:flex"><button class="on" data-ctab="lib" style="flex:1"><i class="ti ti-library"></i> Catalog</button><button data-ctab="disc" style="flex:1"><i class="ti ti-radar-2"></i> From connectors</button></div></div>' +
        '<div class="ov-body" data-pane="lib" style="padding-top:14px">' +
          '<div class="ov-search"><i class="ti ti-search"></i><input placeholder="Search tools\u2026" data-search></div>' + groupsHtml +
        '</div>' +
        '<div class="ov-body" data-pane="disc" hidden style="padding-top:14px">' +
          '<div class="f-mini-label">Source</div><div class="m-hint" style="margin:-4px 0 8px">Tools inherit the connector\u2019s auth, scopes and rate limits \u2014 nothing re-authenticates.</div>' +
          '<div class="src-list">' + srcHtml + '</div>' +
          '<div class="disc-state" data-disc-state></div>' +
        '</div>' +
        '<div class="ov-foot"><span class="caption" data-foot-note></span><div class="sp"></div>' +
          '<button class="m-btn secondary" data-close>Done</button>' +
          '<button class="m-btn primary" data-addsel hidden><i class="ti ti-plus"></i> Add <b data-selcount>0</b> tools</button></div>' +
      '</div>'
    );
    for (const g in TOOL_CATALOG) { const cont = p.querySelector('[data-grp="' + CSS.escape(g) + '"]'); TOOL_CATALOG[g].forEach(it => cont.appendChild(catalogRow(it, 'tool'))); }
    const search = p.querySelector('[data-search]');
    search.addEventListener('input', () => { const q = search.value.toLowerCase(); p.querySelectorAll('[data-pane="lib"] .item').forEach(r => { r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none'; }); });

    const tabs = p.querySelectorAll('[data-ctab]');
    function showTab(id) {
      tabs.forEach(b => b.classList.toggle('on', b.dataset.ctab === id));
      p.querySelectorAll('[data-pane]').forEach(pn => pn.hidden = pn.dataset.pane !== id);
      p.querySelector('[data-addsel]').hidden = id !== 'disc';
      p.querySelector('[data-close]').textContent = id === 'disc' ? 'Cancel' : 'Done';
    }
    tabs.forEach(b => b.addEventListener('click', () => showTab(b.dataset.ctab)));

    // discovery
    let src = DISCOVERABLE[0], selected = new Set(), intent = '';
    const state = p.querySelector('[data-disc-state]');
    const existing = () => new Set([...document.querySelectorAll('[data-section="tools"] .item-name .mono')].map(m => m.textContent.trim()));
    function updateCount() { p.querySelector('[data-selcount]').textContent = selected.size; p.querySelector('[data-addsel]').disabled = selected.size === 0; }
    function discover() {
      selected = new Set(); updateCount();
      state.innerHTML =
        '<div class="disc-log">' +
          '<div class="dl-row on"><span class="m-spin" style="width:12px;height:12px;border-width:1.5px"></span> Connecting to ' + esc(src.name) + '\u2026</div>' +
        '</div>';
      const log = state.querySelector('.disc-log');
      const steps = src.kind === 'MCP'
        ? ['Handshake \u00b7 protocol 2025-06', 'tools/list \u2192 ' + src.ops.length + ' tools with JSON schemas', 'Classifying read / write / destructive']
        : ['Fetched OpenAPI 3.1 spec', 'Parsed ' + src.ops.length + ' operations across ' + new Set(src.ops.map(o => o[3])).size + ' paths', 'Classifying by HTTP method'];
      let i = 0;
      const tick = () => {
        log.querySelector('.dl-row.on').innerHTML = '<i class="ti ti-check" style="color:var(--good-dot)"></i> ' + (i === 0 ? 'Connected to ' + esc(src.name) : steps[i - 1]);
        log.querySelector('.dl-row.on').classList.remove('on');
        if (i < steps.length) { log.insertAdjacentHTML('beforeend', '<div class="dl-row on"><span class="m-spin" style="width:12px;height:12px;border-width:1.5px"></span> ' + steps[i] + '</div>'); i++; setTimeout(tick, 380); }
        else renderOps();
      };
      setTimeout(tick, 420);
    }
    function renderOps() {
      const ex = existing();
      const reads = src.ops.filter(o => o[2] === 'read' && !ex.has(o[0]));
      reads.forEach(o => selected.add(o[0]));
      const areas = [...new Set(src.ops.map(o => o[3]))];
      state.innerHTML =
        '<div class="disc-sum"><i class="ti ti-check" style="color:var(--good-dot)"></i> Discovered <b>' + src.ops.length + '</b> operations from ' + esc(src.name) + '. Safe reads are pre-selected; writes and destructive actions are off until you opt in.</div>' +
        '<div class="f-mini-label" style="margin-top:14px">Scope by intent <span class="caption" style="font-weight:400">optional</span></div>' +
        '<div class="ov-search" style="margin-bottom:8px"><i class="ti ti-target-arrow"></i><input placeholder="e.g. triage tickets and reply from the help center" data-intent></div>' +
        '<div class="area-chips">' + areas.map(a => '<button class="auth-opt" data-area="' + esc(a) + '">' + esc(a) + '</button>').join('') + '</div>' +
        '<div class="ops-head"><span class="f-mini-label" style="margin:0">Operations <span class="caption" style="font-weight:400" data-opcount></span></span><span class="sp"></span><button class="m-btn ghost sm" data-bulk="reads">Reads only</button><button class="m-btn ghost sm" data-bulk="all">All</button><button class="m-btn ghost sm" data-bulk="none">None</button></div>' +
        '<div class="ops-list">' + src.ops.map(o => {
          const have = ex.has(o[0]); const r = RISK[o[2]];
          return '<label class="op-row' + (have ? ' have' : '') + '" data-op="' + esc(o[0]) + '" data-area="' + esc(o[3]) + '">' +
            '<input type="checkbox"' + (selected.has(o[0]) ? ' checked' : '') + (have ? ' disabled' : '') + '><span class="m-box"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 6l3 3 5-6"/></svg></span>' +
            '<div class="op-body"><div class="op-name">' + esc(o[0]) + (have ? ' <span class="item-tag">already added</span>' : '') + '</div><div class="op-desc">' + esc(o[1]) + '</div></div>' +
            '<span class="op-risk" style="color:' + r[1] + '"><span class="dot" style="background:' + r[1] + '"></span>' + r[0] + '</span>' +
          '</label>'; }).join('') + '</div>';
      const rows = [...state.querySelectorAll('.op-row')];
      const cnt = state.querySelector('[data-opcount]');
      const refreshCount = () => { const vis = rows.filter(r => r.style.display !== 'none').length; cnt.textContent = vis === rows.length ? src.ops.length : vis + ' of ' + src.ops.length; };
      refreshCount();
      rows.forEach(r => r.querySelector('input').addEventListener('change', e => { e.target.checked ? selected.add(r.dataset.op) : selected.delete(r.dataset.op); updateCount(); }));
      const applyFilter = () => {
        const q = (state.querySelector('[data-intent]').value || '').toLowerCase().split(/\W+/).filter(w => w.length > 3);
        const areaOn = [...state.querySelectorAll('[data-area].on')].map(b => b.dataset.area);
        rows.forEach(r => {
          const inArea = !areaOn.length || areaOn.includes(r.dataset.area);
          const txt = r.textContent.toLowerCase();
          const inIntent = !q.length || q.some(w => txt.includes(w) || txt.includes(w.replace(/s$/, '')));
          r.style.display = inArea && inIntent ? '' : 'none';
        });
        refreshCount();
      };
      state.querySelector('[data-intent]').addEventListener('input', applyFilter);
      state.querySelectorAll('.area-chips [data-area]').forEach(b => b.addEventListener('click', () => { b.classList.toggle('on'); applyFilter(); }));
      state.querySelectorAll('[data-bulk]').forEach(b => b.addEventListener('click', () => {
        rows.forEach(r => { if (r.style.display === 'none' || r.classList.contains('have')) return;
          const op = src.ops.find(o => o[0] === r.dataset.op); const on = b.dataset.bulk === 'all' || (b.dataset.bulk === 'reads' && op[2] === 'read');
          r.querySelector('input').checked = on; on ? selected.add(op[0]) : selected.delete(op[0]); });
        updateCount();
      }));
      updateCount();
    }
    p.querySelectorAll('[data-src]').forEach(o => o.addEventListener('click', () => {
      p.querySelectorAll('[data-src]').forEach(x => x.classList.remove('sel')); o.classList.add('sel'); src = DISCOVERABLE[+o.dataset.src]; discover();
    }));
    p.querySelector('[data-addsel]').addEventListener('click', () => {
      const ops = src.ops.filter(o => selected.has(o[0]));
      ops.forEach(o => addToolToList([o[2] === 'read' ? 'ti-eye' : o[2] === 'write' ? 'ti-pencil' : 'ti-alert-triangle', 'var(--bg-muted)', 'var(--ink-700)', o[0], o[1], false, src.name, o[2]]));
      close(); toast(ops.length + ' tools added from ' + src.name, 'ti-plug-connected');
    });
    discover();
    if (startTab) showTab(startTab);
  }

  const PROTOCOLS = [
    ['mcp',     'ti-server-2',  'MCP server',  'Remote MCP endpoint (SSE or streamable HTTP). Tools are discovered automatically.'],
    ['rest',    'ti-api',       'REST / OpenAPI', 'Import an OpenAPI spec. Each operation becomes a tool.'],
    ['db',      'ti-database',  'Database',    'Postgres, MySQL, Snowflake or BigQuery. Tables become read tools.'],
    ['webhook', 'ti-webhook',   'Webhook',     'Outbound POST to a URL you own. Fire-and-forget or await a reply.']
  ];
  const PROTOCOL_AUTH = { mcp: ['oauth','token','none'], rest: ['oauth','token','none'], db: ['conn'], webhook: ['token','none'] };

  function flowConnectors(startTab) {
    let groupsHtml = '';
    for (const g in CONNECTORS) groupsHtml += '<div class="cat-label"><span>' + esc(g) + '</span><span class="ln"></span></div><div data-grp="' + esc(g) + '"></div>';
    const protoHtml = PROTOCOLS.map(([id, ic, nm, ds], i) =>
      '<div class="proto-opt' + (i === 0 ? ' sel' : '') + '" data-proto="' + id + '">' +
        '<div class="item-ic pt-ic"><i class="ti ' + ic + '"></i></div>' +
        '<div class="item-body"><div class="item-name">' + esc(nm) + '</div><div class="item-desc">' + esc(ds) + '</div></div>' +
        '<i class="ti ti-circle-check proto-check"></i>' +
      '</div>').join('');
    const p = shell('drawer',
      '<div class="m-drawer">' +
        head('ti-plug-connected', 'var(--bg-muted)', 'var(--ink-700)', 'Add connector', 'Pick a service from the library, or wire up anything that speaks a standard protocol.') +
        '<div style="padding:14px 22px 0"><div class="m-seg conn-tabs" style="display:flex"><button class="on" data-ctab="lib" style="flex:1"><i class="ti ti-library"></i> Library</button><button data-ctab="custom" style="flex:1"><i class="ti ti-code"></i> Custom protocol</button></div></div>' +
        '<div class="ov-body" data-pane="lib" style="padding-top:14px">' +
          '<div class="ov-search"><i class="ti ti-search"></i><input placeholder="Search 40+ connectors\u2026" data-search></div>' +
          groupsHtml +
        '</div>' +
        '<div class="ov-body" data-pane="custom" hidden style="padding-top:14px">' +
          '<div class="f-mini-label">Protocol</div>' +
          '<div class="proto-list">' + protoHtml + '</div>' +
          '<div class="frow" style="margin-top:18px">' +
            '<div class="m-field"><label class="m-label">Name</label><input class="m-input" placeholder="e.g. Internal billing API" data-cname></div>' +
            '<div class="m-field" data-f="mcp rest webhook"><label class="m-label" data-url-label>Endpoint URL</label><input class="m-input" placeholder="https://mcp.example.com/sse" data-curl style="font-family:var(--font-mono);font-size:12px"></div>' +
            '<div class="m-field" data-f="db"><label class="m-label">Engine</label><select class="m-select"><option>Postgres</option><option>MySQL</option><option>Snowflake</option><option>BigQuery</option></select></div>' +
            '<div class="m-field"><label class="m-label">Authentication</label><div class="auth-opts" data-auth-opts></div><div class="m-hint" data-auth-hint></div></div>' +
            '<div data-auth-fields></div>' +
          '</div>' +
        '</div>' +
        '<div class="ov-foot"><span class="caption" data-foot-note>Connected services are shared across all agents in this workspace.</span><div class="sp"></div>' +
          '<button class="m-btn secondary" data-close>Done</button>' +
          '<button class="m-btn primary" data-test hidden><i class="ti ti-plug-connected"></i> Test &amp; save</button></div>' +
      '</div>'
    );
    for (const g in CONNECTORS) { const cont = p.querySelector('[data-grp="' + CSS.escape(g) + '"]'); CONNECTORS[g].forEach(it => cont.appendChild(connectorRow(it))); }
    const search = p.querySelector('[data-search]');
    search.addEventListener('input', () => { const q = search.value.toLowerCase(); p.querySelectorAll('[data-pane="lib"] .item').forEach(r => { r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none'; }); });

    // tabs
    const tabs = p.querySelectorAll('[data-ctab]');
    function showTab(id) {
      tabs.forEach(b => b.classList.toggle('on', b.dataset.ctab === id));
      p.querySelectorAll('[data-pane]').forEach(pn => pn.hidden = pn.dataset.pane !== id);
      p.querySelector('[data-test]').hidden = id !== 'custom';
      p.querySelector('[data-close]').textContent = id === 'custom' ? 'Cancel' : 'Done';
      p.querySelector('[data-foot-note]').textContent = id === 'custom' ? 'Credentials are encrypted at rest and never shown again.' : 'Connected services are shared across all agents in this workspace.';
    }
    tabs.forEach(b => b.addEventListener('click', () => showTab(b.dataset.ctab)));

    // protocol + auth
    let proto = 'mcp', auth = 'oauth';
    const authOpts = p.querySelector('[data-auth-opts]'), authHint = p.querySelector('[data-auth-hint]'), authFields = p.querySelector('[data-auth-fields]');
    function renderAuth() {
      const allowed = PROTOCOL_AUTH[proto];
      if (!allowed.includes(auth)) auth = allowed[0];
      authOpts.innerHTML = allowed.map(a => '<button class="auth-opt' + (a === auth ? ' on' : '') + '" data-a="' + a + '"><i class="ti ' + AUTH[a].icon + '"></i> ' + AUTH[a].label + '</button>').join('');
      authOpts.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => { auth = b.dataset.a; renderAuth(); }));
      authHint.textContent = AUTH[auth].hint;
      authFields.innerHTML = authFieldsHtml(auth, proto);
      p.querySelectorAll('[data-f]').forEach(f => f.hidden = !f.dataset.f.split(' ').includes(proto));
      const url = p.querySelector('[data-curl]'), ul = p.querySelector('[data-url-label]');
      if (proto === 'rest') { ul.textContent = 'OpenAPI spec URL'; url.placeholder = 'https://api.example.com/openapi.json'; }
      else if (proto === 'webhook') { ul.textContent = 'Target URL'; url.placeholder = 'https://hooks.example.com/agent'; }
      else { ul.textContent = 'Endpoint URL'; url.placeholder = 'https://mcp.example.com/sse'; }
    }
    p.querySelectorAll('[data-proto]').forEach(o => o.addEventListener('click', () => {
      p.querySelectorAll('[data-proto]').forEach(x => x.classList.remove('sel')); o.classList.add('sel'); proto = o.dataset.proto; renderAuth();
    }));
    renderAuth();

    p.querySelector('[data-test]').addEventListener('click', () => {
      const nm = p.querySelector('[data-cname]').value.trim() || PROTOCOLS.find(x => x[0] === proto)[2];
      const ic = PROTOCOLS.find(x => x[0] === proto)[1];
      const btn = p.querySelector('[data-test]');
      btn.innerHTML = '<span class="m-spin" style="width:14px;height:14px;border-width:2px;border-top-color:var(--on-brand);border-color:rgba(255,255,255,.3)"></span> Testing\u2026'; btn.disabled = true;
      setTimeout(() => {
        addConnectorToList([ic, 'var(--ink-900)', nm, PROTOCOLS.find(x => x[0] === proto)[3], false, auth, true]);
        close(); toast(nm + ' connected \u00b7 ' + AUTH[auth].label, 'ti-plug-connected');
      }, 900);
    });
    if (startTab) showTab(startTab);
  }

  function authFieldsHtml(auth, proto) {
    const mono = ' style="font-family:var(--font-mono);font-size:12px"';
    if (auth === 'oauth') return (
      '<div class="frow two">' +
        '<div class="m-field"><label class="m-label">Client ID</label><input class="m-input" placeholder="client_\u2026"' + mono + '></div>' +
        '<div class="m-field"><label class="m-label">Client secret</label><input class="m-input" type="password" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"' + mono + '></div>' +
      '</div>' +
      '<div class="m-field" style="margin-top:12px"><label class="m-label">Scopes <span class="opt">optional</span></label><input class="m-input" placeholder="read write offline_access"' + mono + '></div>' +
      '<div class="m-field" style="margin-top:12px"><label class="m-label">Redirect URI</label><div class="copy-row"><code>https://nexus.app/oauth/callback</code><button class="m-btn ghost sm icon" title="Copy"><i class="ti ti-copy"></i></button></div></div>'
    );
    if (auth === 'token') return (
      '<div class="frow two">' +
        '<div class="m-field"><label class="m-label">Header</label><input class="m-input" value="Authorization"' + mono + '></div>' +
        '<div class="m-field"><label class="m-label">Prefix <span class="opt">optional</span></label><input class="m-input" value="Bearer"' + mono + '></div>' +
      '</div>' +
      '<div class="m-field" style="margin-top:12px"><label class="m-label">Key / token</label><input class="m-input" type="password" placeholder="Paste secret"' + mono + '></div>'
    );
    if (auth === 'conn') return (
      '<div class="frow two">' +
        '<div class="m-field"><label class="m-label">Host</label><input class="m-input" placeholder="db.internal:5432"' + mono + '></div>' +
        '<div class="m-field"><label class="m-label">Database</label><input class="m-input" placeholder="analytics"' + mono + '></div>' +
        '<div class="m-field"><label class="m-label">User</label><input class="m-input" placeholder="agent_ro"' + mono + '></div>' +
        '<div class="m-field"><label class="m-label">Password</label><input class="m-input" type="password" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"' + mono + '></div>' +
      '</div>' +
      '<label class="m-check" style="margin-top:12px;font-size:12px"><input type="checkbox" checked><span class="m-box"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 6l3 3 5-6"/></svg></span> Require SSL</label>'
    );
    return '<div class="m-alert" style="padding:10px 12px"><i class="ti ti-info-circle" style="color:var(--ink-500);font-size:16px"></i><div class="a-body"><div class="a-text">This endpoint will be called without credentials. Use only for public or network-restricted services.</div></div></div>';
  }

  /* Library connector that authenticates with a key or connection string */
  function credentialConnect(it) {
    const [icon, brand, name, desc, , auth] = it;
    const a = AUTH[auth];
    const p = shell('modal',
      '<div class="m-modal">' +
        head(icon, brand, '#fff', 'Connect ' + esc(name), desc) +
        '<div class="ov-body">' +
          '<div class="auth-method"><i class="ti ' + a.icon + '"></i><div><b>' + a.label + '</b><span>' + esc(a.hint) + '</span></div></div>' +
          '<div class="frow" style="margin-top:16px">' + authFieldsHtml(auth) + '</div>' +
        '</div>' +
        '<div class="ov-foot"><div class="sp"></div><button class="m-btn ghost" data-close>Cancel</button>' +
          '<button class="m-btn primary" data-auth><i class="ti ti-plug-connected"></i> Test &amp; connect</button></div>' +
      '</div>'
    );
    p.querySelector('.ov-head .oh-ic').classList.add('logo');
    p.querySelector('[data-auth]').addEventListener('click', () => { connectorDone(it); close(); toast(name + ' connected \u00b7 ' + a.label, 'ti-plug-connected'); });
  }

  function oauthConnect(it) {
    const [icon, brand, name, desc] = it;
    const p = shell('modal',
      '<div class="m-modal">' +
        '<div class="ov-body" style="padding-top:24px">' +
          '<div class="oauth">' +
            '<div class="oauth-flow">' +
              '<div class="oauth-node" style="background:var(--brand); color:var(--on-brand); border-color:transparent"><i class="ti ti-robot"></i></div>' +
              '<i class="ti ti-arrows-right-left" style="color:var(--ink-400); font-size:18px"></i>' +
              '<div class="oauth-node" style="background:' + brand + '; color:#fff; border-color:transparent"><i class="ti ' + icon + '"></i></div>' +
            '</div>' +
            '<div class="ov-title">Connect ' + esc(name) + '</div>' +
            '<div class="ov-sub" style="margin:6px auto 0; max-width:34ch">' + esc(desc) + '</div>' +
            '<div class="auth-method" style="margin:14px auto 0;max-width:340px;text-align:left"><i class="ti ti-shield-lock"></i><div><b>OAuth 2.0</b><span>You\u2019ll be redirected to ' + esc(name) + ' to grant access. No credentials are stored here.</span></div></div>' +
            '<div class="oauth-scopes">' +
              '<div class="scope"><i class="ti ti-circle-check"></i> Read data on your behalf</div>' +
              '<div class="scope"><i class="ti ti-circle-check"></i> Take actions you approve</div>' +
              '<div class="scope"><i class="ti ti-circle-check"></i> Revoke access anytime</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="ov-foot"><div class="sp"></div><button class="m-btn ghost" data-close>Cancel</button>' +
          '<button class="m-btn primary" data-auth><i class="ti ' + icon + '"></i> Authorize ' + esc(name) + '</button></div>' +
      '</div>'
    );
    p.querySelector('[data-auth]').addEventListener('click', () => {
      connectorDone(it); close(); toast(name + ' connected', 'ti-plug-connected');
    });
  }

  function flowModelPicker(slot, anchorCard) {
    let groupsHtml = '';
    for (const prov in MODELS) {
      groupsHtml += '<div class="cat-label"><span>' + prov + '</span><span class="ln"></span></div>';
      MODELS[prov].forEach(m => {
        const cur = anchorCard && anchorCard.querySelector('.mn') && anchorCard.querySelector('.mn').textContent.trim() === m[2];
        groupsHtml +=
          '<div class="mdl-row' + (cur ? ' sel' : '') + '" data-pick=\'' + JSON.stringify(m).replace(/'/g, '&#39;') + '\'>' +
            '<div class="mdl-logo" style="background:' + m[1] + '"><i class="ti ' + m[0] + '"></i></div>' +
            '<div class="mdl-body"><div class="mdl-name">' + esc(m[2]) + '</div><div class="mdl-meta">' + esc(m[3]) + '</div></div>' +
            '<div class="mdl-cost">' + esc(m[4]) + '</div>' +
            (cur ? '<i class="ti ti-check mdl-check"></i>' : '') +
          '</div>';
      });
    }
    const p = shell('modal',
      '<div class="m-modal">' +
        head('ti-cpu', 'var(--brand-soft)', 'var(--ink-800)', slot === 'fallback' ? 'Fallback model' : 'Choose a model', 'Used when the primary is rate-limited or down.'.slice(0, slot === 'fallback' ? 999 : 0) || 'The reasoning engine for this agent.') +
        '<div class="ov-body" style="padding-top:8px">' + groupsHtml + '</div>' +
      '</div>'
    );
    p.querySelectorAll('[data-pick]').forEach(r => r.addEventListener('click', () => {
      const m = JSON.parse(r.getAttribute('data-pick').replace(/&#39;/g, "'"));
      if (anchorCard) {
        anchorCard.querySelector('.model-logo').style.background = m[1];
        anchorCard.querySelector('.model-logo').innerHTML = '<i class="ti ' + m[0] + '"></i>';
        anchorCard.querySelector('.mn').textContent = m[2];
        anchorCard.querySelector('.mp').textContent = m[3].replace(' · ', ' · ').toLowerCase();
      }
      close(); toast(m[2] + (slot === 'fallback' ? ' set as fallback' : ' selected'), 'ti-cpu');
    }));
  }

  function flowComposeSkill() {
    const enabledTools = [...document.querySelectorAll('[data-section="tools"] .item')]
      .filter(i => { const s = i.querySelector('[data-switch]'); return !s || s.classList.contains('on'); })
      .map(i => {
        const ic = i.querySelector('.item-ic');
        return [ic.querySelector('i').className, ic.style.background, ic.style.color, i.querySelector('.item-name').textContent.trim()];
      });
    const picks = enabledTools.map((t, i) =>
      '<div class="pick-tool" data-pt="' + i + '">' +
        '<div class="pt-ic" style="background:' + t[1] + '; color:' + t[2] + '"><i class="' + t[0] + '"></i></div>' +
        '<div class="pt-name">' + esc(t[3]) + '</div>' +
        '<div class="pt-check"><i class="ti ti-check"></i></div>' +
      '</div>'
    ).join('');
    const p = shell('modal',
      '<div class="m-modal lg">' +
        head('ti-puzzle', 'var(--cat-plum-bg)', 'var(--cat-plum)', 'Compose a skill', 'Bundle a procedure with the tools it relies on.') +
        '<div class="ov-body">' +
          '<div class="fld"><label class="fld-label">Skill name</label><input class="m-input" data-name placeholder="e.g. Resolve billing dispute"></div>' +
          '<div class="fld"><label class="fld-label">What it does</label><input class="m-input" data-desc placeholder="One line the agent reads as the goal"></div>' +
          '<div class="fld"><label class="fld-label">Procedure <span class="opt">— optional</span></label><textarea class="m-textarea" placeholder="1. Verify the charge\u2026"></textarea></div>' +
          '<div class="fld"><label class="fld-label">Tools this skill uses</label>' + (picks || '<div class="ov-sub">Enable some tools first.</div>') + '</div>' +
        '</div>' +
        '<div class="ov-foot"><div class="sp"></div><button class="m-btn ghost" data-close>Cancel</button>' +
          '<button class="m-btn primary" data-save><i class="ti ti-check"></i> Add skill</button></div>' +
      '</div>'
    );
    p.querySelectorAll('[data-pt]').forEach(pt => pt.addEventListener('click', () => pt.classList.toggle('on')));
    p.querySelector('[data-save]').addEventListener('click', () => {
      const name = (p.querySelector('[data-name]').value || 'Untitled skill').trim();
      const desc = (p.querySelector('[data-desc]').value || 'Custom composed skill.').trim();
      const chosen = [...p.querySelectorAll('.pick-tool.on')].map(pt => enabledTools[+pt.dataset.pt][3]);
      addSkillToList(name, desc, chosen);
      close(); toast('Skill "' + name + '" composed', 'ti-puzzle');
    });
  }

  function flowKnowledge() {
    const rows = KNOWLEDGE_SOURCES.map(s =>
      '<div class="trig-opt" data-src="' + esc(s[3]) + '">' +
        '<div class="to-ic" style="background:' + s[1] + '; color:' + s[2] + '"><i class="ti ' + s[0] + '"></i></div>' +
        '<div><div class="to-name">' + esc(s[3]) + '</div><div class="to-desc">' + esc(s[4]) + '</div></div>' +
        '<i class="ti ti-chevron-right to-go"></i>' +
      '</div>'
    ).join('');
    const p = shell('drawer',
      '<div class="m-drawer">' +
        head('ti-books', 'var(--cat-rose-bg)', 'var(--cat-rose)', 'Add knowledge', 'Connect a source for the agent to retrieve from.') +
        '<div class="ov-body">' + rows + '</div>' +
      '</div>'
    );
    p.querySelectorAll('[data-src]').forEach(r => r.addEventListener('click', () => {
      addKnowledgeToList(r.dataset.src); close(); toast(r.dataset.src + ' connected — indexing\u2026', 'ti-books');
    }));
  }

  function flowTrigger() {
    const rows = TRIGGERS.map(t =>
      '<div class="trig-opt" data-trig="' + esc(t[3]) + '">' +
        '<div class="to-ic" style="background:' + t[1] + '; color:' + t[2] + '"><i class="ti ' + t[0] + '"></i></div>' +
        '<div><div class="to-name">' + esc(t[3]) + '</div><div class="to-desc">' + esc(t[4]) + '</div></div>' +
        '<i class="ti ti-chevron-right to-go"></i>' +
      '</div>'
    ).join('');
    const p = shell('modal',
      '<div class="m-modal lg">' +
        head('ti-bolt', 'var(--cat-amber-bg)', 'var(--cat-amber)', 'Add a trigger', 'Choose what starts a run of this agent.') +
        '<div class="ov-body">' + rows + '</div>' +
      '</div>'
    );
    p.querySelectorAll('[data-trig]').forEach(r => r.addEventListener('click', () => {
      close(); toast('"' + r.dataset.trig + '" trigger added', 'ti-bolt');
    }));
  }

  function flowVersions() {
    const versions = [
      ['v7', 'Tightened escalation threshold to 0.7', 'admin', '2 seconds ago', true],
      ['v6', 'Added Zendesk connector + draft_reply tool', 'admin', '1 hour ago', false],
      ['v5', 'Reworded system prompt for tone', 'm.chen', 'Yesterday', false],
      ['v4', 'Enabled long-term memory (per-customer)', 'admin', '2 days ago', false],
      ['v3', 'Added "Triage & route" skill', 'm.chen', '4 days ago', false],
      ['v1', 'Created from Support template', 'admin', 'Mar 28', false]
    ];
    const rows = versions.map((v, i) =>
      '<div class="ver-row">' +
        '<div class="ver-rail"><div class="ver-dot' + (v[4] ? ' cur' : '') + '"></div>' + (i < versions.length - 1 ? '<div class="ver-line"></div>' : '') + '</div>' +
        '<div class="ver-body"><div class="ver-top"><span class="ver-tag">' + v[0] + '</span>' +
          (v[4] ? '<span class="m-badge accent sm">Current</span>' : '<span class="ver-restore">Restore</span>') + '</div>' +
          '<div class="ver-msg">' + esc(v[1]) + '</div>' +
          '<div class="ver-meta"><i class="ti ti-user" style="font-size:12px"></i> ' + esc(v[2]) + ' <span>·</span> ' + esc(v[3]) + '</div>' +
        '</div>' +
      '</div>'
    ).join('');
    const p = shell('drawer',
      '<div class="m-drawer">' +
        head('ti-history', 'var(--brand-soft)', 'var(--ink-800)', 'Version history', 'Every publish and autosave is restorable.') +
        '<div class="ov-body">' + rows + '</div>' +
      '</div>'
    );
    p.querySelectorAll('.ver-restore').forEach(r => r.addEventListener('click', () => { close(); toast('Restored to that version', 'ti-history'); }));
  }

  function flowPublish() {
    const checks = (window.NexusFeatures && window.NexusFeatures.publishChecks()) || [
      ['ok', 'Instructions defined', '412 tokens · 2 variables'],
      ['ok', 'Tools configured', '5 tools enabled'],
      ['ok', 'Guardrails active', '4 of 4 enabled'],
      ['miss', 'Evaluation goal', 'Recommended before production', 'Add goal'],
      ['miss', 'Deployment channel', 'Pick where runs are triggered', 'Set below']
    ];
    const checkHtml = checks.map(c =>
      '<div class="chk">' +
        '<div class="chk-mark ' + c[0] + '"><i class="ti ' + (c[0] === 'ok' ? 'ti-check' : 'ti-alert-triangle') + '"></i></div>' +
        '<div class="chk-body"><div class="chk-name">' + esc(c[1]) + '</div><div class="chk-desc">' + esc(c[2]) + '</div></div>' +
        (c[3] ? '<span class="chk-act">' + esc(c[3]) + '</span>' : '') +
      '</div>'
    ).join('');
    const p = shell('modal',
      '<div class="m-modal lg">' +
        head('ti-rocket', 'var(--accent-bg)', 'var(--accent)', 'Publish Support Triage', 'Review the pre-flight checklist, then choose a target.') +
        '<div class="ov-body" data-stage="review">' +
          checkHtml +
          '<div class="fld" style="margin-top:18px"><label class="fld-label">Deployment target</label>' +
            '<div class="deploy-opt sel" data-dep="prod"><div class="do-ic" style="background:var(--good-bg); color:var(--good)"><i class="ti ti-world"></i></div>' +
              '<div style="flex:1"><div class="chk-name">Production</div><div class="chk-desc">Live customer traffic · all guardrails enforced</div></div><div class="m-box radio" style="border-color:var(--accent)"></div></div>' +
            '<div class="deploy-opt" data-dep="staging"><div class="do-ic" style="background:var(--warn-bg); color:var(--warn)"><i class="ti ti-test-pipe"></i></div>' +
              '<div style="flex:1"><div class="chk-name">Staging</div><div class="chk-desc">Internal testing · sampled traffic</div></div><div class="m-box radio"></div></div>' +
          '</div>' +
        '</div>' +
        '<div class="ov-foot"><div class="sp"></div><button class="m-btn ghost" data-close>Cancel</button>' +
          '<button class="m-btn primary" data-publish><i class="ti ti-rocket"></i> Publish to production</button></div>' +
      '</div>'
    );
    let dep = 'prod';
    p.querySelectorAll('[data-dep]').forEach(o => o.addEventListener('click', () => {
      p.querySelectorAll('[data-dep]').forEach(x => { x.classList.remove('sel'); const b = x.querySelector('.m-box'); b.style.background = ''; b.style.borderColor = ''; });
      o.classList.add('sel'); const b = o.querySelector('.m-box'); b.style.background = 'var(--accent)'; b.style.borderColor = 'var(--accent)';
      dep = o.dataset.dep;
      p.querySelector('[data-publish]').innerHTML = '<i class="ti ti-rocket"></i> Publish to ' + (dep === 'prod' ? 'production' : 'staging');
    }));
    p.querySelector('[data-publish]').addEventListener('click', () => {
      const stage = p.querySelector('[data-stage]');
      stage.innerHTML = '<div class="pub-done"><div class="burst"><i class="ti ti-check"></i></div>' +
        '<div class="pd-t">Published to ' + (dep === 'prod' ? 'production' : 'staging') + '</div>' +
        '<div class="pd-c">Support Triage is live as <b>v8</b>. Incoming triggers will route to this version.</div>' +
        '<div class="pub-url"><i class="ti ti-link" style="color:var(--ink-500)"></i> api.nexus.ai/agents/support-triage<span class="cp" data-copy><i class="ti ti-copy"></i></span></div></div>';
      p.querySelector('.ov-foot').innerHTML = '<div class="sp"></div><button class="m-btn primary" data-close>Done</button>';
      // reflect published state in the top bar
      const badge = document.querySelector('.work-top .crumbs .m-badge');
      if (badge) { badge.className = 'm-badge good sm'; badge.innerHTML = '<span class="dot"></span> Published'; }
      if (window.NexusFeatures) window.NexusFeatures.onPublished(dep);
      const cp = p.querySelector('[data-copy]');
      if (cp) cp.addEventListener('click', () => toast('Endpoint copied'));
    });
  }

  function flowPreview() { if (window.NexusFeatures) return window.NexusFeatures.preview(); toast('Opening full-screen preview\u2026', 'ti-eye'); }

  function flowImprove() {
    const editor = document.querySelector('.instr-editor');
    const block = document.querySelector('[data-section="instructions"] .block-body');
    if (!block) return;
    document.querySelector('[data-section="instructions"]').classList.remove('collapsed');
    if (block.querySelector('.ai-suggest')) return;
    editor.classList.add('improving');
    const loading = elFrom('<div class="ai-suggest"><span class="m-spin" style="width:18px;height:18px;border-width:2px"></span><div class="as-body"><div class="as-title">Improving instructions\u2026</div><div class="as-text">Analyzing tone, structure and edge cases.</div></div></div>');
    block.appendChild(loading);
    setTimeout(() => {
      loading.remove(); editor.classList.remove('improving');
      const sug = elFrom(
        '<div class="ai-suggest"><i class="ti ti-wand as-ic"></i><div class="as-body">' +
          '<div class="as-title">Suggested addition</div>' +
          '<div class="as-text">Add an explicit fallback: \u201CIf the knowledge base returns nothing relevant, say so plainly and offer to escalate rather than guessing.\u201D This reduces hallucinated policy.</div>' +
          '<div class="as-act"><button class="m-btn accent sm" data-apply><i class="ti ti-check"></i> Apply</button>' +
            '<button class="m-btn ghost sm" data-dismiss>Dismiss</button></div>' +
        '</div></div>'
      );
      block.appendChild(sug);
      sug.querySelector('[data-apply]').addEventListener('click', () => {
        editor.appendChild(document.createTextNode('\n\nIf the knowledge base returns nothing relevant, say so plainly and offer to escalate rather than guessing.'));
        sug.remove(); toast('Instructions updated', 'ti-wand');
      });
      sug.querySelector('[data-dismiss]').addEventListener('click', () => sug.remove());
    }, 1500);
  }

  /* ───────── mutators: add real rows to the config lists ───────── */
  function insertBeforeAddRow(section, node) {
    const body = bodyOf(section); if (!body) return;
    const addRow = body.querySelector('.add-row');
    if (addRow) body.insertBefore(node, addRow); else body.appendChild(node);
    node.animate ? node.animate([{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'cubic-bezier(0.16,1,0.3,1)' }) : null;
  }

  function addToolToList(it) {
    const [icon, bg, fg, name, desc, , source, risk] = it;
    if ([...document.querySelectorAll('[data-section="tools"] .item-name .mono')].some(m => m.textContent.trim() === name)) return;
    const meta = source ? '<div class="item-meta"><span class="item-tag"><i class="ti ti-plug-connected" style="font-size:11px;vertical-align:-1px"></i> ' + esc(source) + '</span>' + (risk === 'write' ? '<span class="item-tag">write</span>' : risk === 'destructive' ? '<span class="item-tag" style="color:var(--bad);border-color:var(--bad-line)">destructive</span>' : '<span class="item-tag">read</span>') + '</div>' : '';
    const row = elFrom(
      '<div class="item">' +
        '<div class="item-ic" style="background:' + bg + '; color:' + fg + '"><i class="ti ' + icon + '"></i></div>' +
        '<div class="item-body"><div class="item-name"><span class="mono">' + esc(name) + '</span></div>' +
          '<div class="item-desc">' + esc(desc) + '</div>' + meta + '</div>' +
        '<div class="item-act"><div class="m-switch on" data-switch></div></div>' +
      '</div>'
    );
    wireSwitch(row.querySelector('[data-switch]'));
    insertBeforeAddRow('tools', row); bumpCount('tools', 1); expand('tools');
  }

  function addConnectorToList(it) {
    const [icon, brand, name, desc, , auth, custom] = it;
    const a = AUTH[auth || 'oauth'];
    const row = elFrom(
      '<div class="item">' +
        '<div class="item-ic' + (custom ? '' : ' logo') + '" style="background:' + brand + '; color:#fff"><i class="ti ' + icon + '"></i></div>' +
        '<div class="item-body"><div class="item-name">' + esc(name) + ' <span class="m-badge good sm"><span class="dot"></span> Connected</span></div>' +
          '<div class="item-desc">' + esc(desc) + '</div>' +
          '<div class="item-meta"><span class="item-tag auth-tag"><i class="ti ' + a.icon + '"></i> ' + a.label + '</span><span class="item-tag">' + (custom ? 'Custom' : 'MCP') + '</span></div></div>' +
        '<div class="item-act"><button class="m-btn ghost sm">Manage</button><div class="m-switch on"></div></div>' +
      '</div>'
    );
    wireSwitch(row.querySelector('.m-switch'));
    insertBeforeAddRow('connectors', row); bumpCount('connectors', 1); expand('connectors');
  }

  function addSkillToList(name, desc, tools) {
    const chips = tools.map(t => '<span class="m-chip"><i class="ti ti-tool" style="font-size:12px"></i> ' + esc(t) + '</span>').join('');
    const skill = elFrom(
      '<div class="skill">' +
        '<div class="skill-top">' +
          '<div class="item-ic" style="background:var(--cat-plum-bg); color:var(--cat-plum)"><i class="ti ti-puzzle"></i></div>' +
          '<div class="item-body"><div class="item-name">' + esc(name) + '</div><div class="item-desc">' + esc(desc) + '</div></div>' +
          '<div class="item-act"><span class="m-badge good sm"><span class="dot"></span> Active</span><button class="m-btn icon ghost sm"><i class="ti ti-dots"></i></button></div>' +
        '</div>' +
        (chips ? '<div class="skill-tools"><span class="lbl">Uses</span>' + chips + '</div>' : '') +
      '</div>'
    );
    insertBeforeAddRow('skills', skill); bumpCount('skills', 1); expand('skills');
  }

  function addKnowledgeToList(name) {
    const row = elFrom(
      '<div class="item">' +
        '<div class="item-ic" style="background:var(--cat-teal-bg); color:var(--cat-teal)"><i class="ti ti-database-import"></i></div>' +
        '<div class="item-body"><div class="item-name">' + esc(name) + '</div><div class="item-desc">Indexing\u2026 this can take a few minutes</div></div>' +
        '<div class="item-act"><span class="m-badge warn sm"><span class="dot"></span> Syncing</span></div>' +
      '</div>'
    );
    insertBeforeAddRow('knowledge', row); bumpCount('knowledge', 1); expand('knowledge');
  }

  /* keep new switches interactive (mirrors builder.js handler) */
  function wireSwitch(sw) {
    if (!sw) return;
    sw.addEventListener('click', (e) => { e.stopPropagation(); sw.classList.toggle('on'); });
  }

  /* ───────────────────────── routing ───────────────────────── */
  const SECTION_FLOWS = { tools: flowToolCatalog, connectors: flowConnectors, skills: () => (window.NexusSkills ? window.NexusSkills.compose() : flowComposeSkill()), knowledge: flowKnowledge, triggers: () => window.NexusFeatures ? window.NexusFeatures.flowTrigger() : flowTrigger(), evaluation: () => window.NexusFeatures && window.NexusFeatures.flowEval() };

  document.addEventListener('click', (e) => {
    const flowBtn = e.target.closest('[data-flow]');
    if (flowBtn) {
      const f = flowBtn.dataset.flow;
      if (f === 'new-agent') return flowNewAgent();
      if (f === 'publish') return flowPublish();
      if (f === 'versions') return flowVersions();
      if (f === 'preview') return flowPreview();
      if (f === 'improve') return flowImprove();
      if (f === 'model') {
        const card = flowBtn.closest('.model-pick') || flowBtn;
        return flowModelPicker(flowBtn.dataset.slot || 'primary', card);
      }
      return;
    }
    // section-level add affordances (head "Add"/"Connect" buttons + dashed add-rows)
    const addRow = e.target.closest('.add-row');
    const headBtn = e.target.closest('.block-head .head-act .m-btn');
    const sectionEl = (addRow || headBtn) ? (addRow || headBtn).closest('[data-section]') : null;
    if (sectionEl) {
      const fn = SECTION_FLOWS[sectionEl.dataset.section];
      if (fn) { e.stopPropagation(); fn(); return; }
    }

    // connector Manage / Fix buttons (static rows)
    const connBtn = e.target.closest('[data-section="connectors"] .item-act .m-btn');
    if (connBtn) {
      e.stopPropagation();
      const row = connBtn.closest('.item');
      const name = (row.querySelector('.item-name').childNodes[0].textContent || 'Connector').trim();
      const badge = row.querySelector('.item-name .m-badge');
      if (/fix|reauth/i.test(connBtn.textContent)) {
        if (badge) { badge.className = 'm-badge good sm'; badge.innerHTML = '<span class="dot"></span> Connected'; }
        connBtn.className = 'm-btn secondary sm'; connBtn.textContent = 'Manage';
        const tag = row.querySelector('.item-meta'); if (tag) tag.remove();
        toast(name + ' re-authorized', 'ti-plug-connected');
      } else {
        if (window.NexusFeatures) return window.NexusFeatures.manageConnector(name, row);
        toast('Opening ' + name + ' settings\u2026', 'ti-settings');
      }
      return;
    }

    // "…" overflow menus on skills/tools
    const dots = e.target.closest('.item-act .m-btn.icon, .skill-top .m-btn.icon');
    if (dots && dots.querySelector('.ti-dots')) {
      e.stopPropagation();
      if (window.NexusFeatures) return window.NexusFeatures.overflowMenu(dots);
      toast('Edit · Duplicate · Remove', 'ti-dots');
      return;
    }
  });

  window.NF = { configureConnector, flowConnectors, flowToolCatalog, AUTH, CONNECTORS, shell, head, close, toast, esc, elFrom, insertBeforeAddRow, bumpCount, expand, wireSwitch, addToolToList, addSkillToList, addKnowledgeToList, addConnectorToList, flowComposeSkill, flowKnowledge, flowConnectors, flowToolCatalog, oauthConnect, flowModelPicker, MODELS, TOOL_CATALOG, CONNECTORS };

})();
