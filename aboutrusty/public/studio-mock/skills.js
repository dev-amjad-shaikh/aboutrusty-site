/* ═══════════════════════════════════════════════════════════════
   NEXUS — Rich skills
   A skill is a SKILL.md: a slug, a "use when" description the router
   reads, and a markdown body the agent follows. Tools referenced in
   backticks are detected and cross-checked against what is connected.
   One editor — opened from the Skills library and from the agent page.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  const NF = window.NF, NS = window.NS;
  const { shell, close, toast, esc } = NF;
  const q = (s, r) => (r || document).querySelector(s), qa = (s, r) => [...(r || document).querySelectorAll(s)];
  const BT = '`';

  /* ── SKILL.md bodies for existing library skills ──────── */
  const BODIES = {
    'Triage & route ticket': [
      '# Triage & Route Ticket', '',
      'You are a support triage specialist. For every inbound ticket you decide **what it is about**, **how urgent it is**, and **which queue owns it** — then you hand it off with enough context that the next agent or human never has to re-read the thread.', '',
      '## Tools you use', '',
      '**Understand:**',
      '- `classify` — intent (billing / bug / how-to / feedback) and urgency',
      '- `search_kb` — similar resolved tickets and relevant articles', '',
      '**Act:**',
      '- `assign_queue` — move the ticket to the owning queue',
      '- `escalate` — hand to a human when confidence is below 0.6', '',
      '## Workflow', '',
      '### Step 1: Read the whole thread',
      'Read every message, not just the latest. Note the customer tier from {{customer.tier}} — enterprise accounts skip the *how-to* queue and go straight to their CSM.', '',
      '### Step 2: Classify',
      'Call `classify` with the full thread text. If intent confidence is below **0.6**, do not guess — call `escalate` with your two best candidate intents.', '',
      '### Step 3: Check for precedent',
      'Call `search_kb` with the ticket subject. If a resolved ticket matches with score above 0.85, attach it as a private note before routing.', '',
      '### Step 4: Route',
      'Map intent to queue:',
      '- billing → `billing-l1`',
      '- bug → `eng-triage` (set priority *high* if the customer mentions data loss or outage)',
      '- how-to → `support-l1`',
      '- feedback → `product-inbox`', '',
      '## Rules',
      '- Never change the customer-facing status. Routing is internal.',
      '- One ticket, one queue. Do not split.',
      '- If the customer is angry, say so in the handoff note in one plain sentence.', '',
      '## Output',
      'Return `{ intent, priority, queue, confidence, precedent_ticket_id? }`.'
    ].join('\n'),
    'Draft customer reply': [
      '# Draft Customer Reply', '',
      'You write the first draft of a support reply. It is **grounded** (every claim traces to an article), **short** (under 120 words), and **on-brand** (warm, direct, no exclamation marks). A human reviews before sending.', '',
      '## Tools you use',
      '- `search_kb` — retrieve the top 3 help-center articles for the ticket',
      '- `draft_reply` — stage the draft on the ticket for review', '',
      '## Workflow', '',
      '### Step 1: Retrieve',
      'Call `search_kb` with the ticket subject and the customer\'s last message. Keep results with score above 0.7. If none qualify, stop and return `needs_human` — never answer from memory.', '',
      '### Step 2: Draft',
      'Write the reply:',
      '1. Acknowledge the specific problem in one sentence.',
      '2. Give the fix as numbered steps if there are more than two.',
      '3. Cite at least one article inline as `[1]`.',
      '4. Close with what happens next, not with a question.', '',
      '### Step 3: Stage',
      'Call `draft_reply` with `tone: "warm"` and the citations array.', '',
      '## Rules',
      '- Do not promise refunds, credits or timelines.',
      '- Match the customer\'s language.',
      '- Never mention internal tools or queue names.'
    ].join('\n')
  };
  const DEFAULT_BODY = (name) => ['# ' + name, '', 'You are … Describe the role in one paragraph: what this skill produces and for whom.', '', '## Tools you use', '- `tool_name` — what it is for', '', '## Workflow', '', '### Step 1: …', 'What to do first. Reference tools in backticks so they are linked.', '', '### Step 2: …', '', '## Rules', '- What the agent must never do', '', '## Output', 'What the agent returns when the skill finishes.'].join('\n');
  const USE_WHEN = {
    'Triage & route ticket': 'Use when a new ticket arrives with no owner, when the user says "route this", "who should handle this", "what queue", or when a ticket has bounced between queues more than once.',
    'Draft customer reply': 'Use when the user asks to "draft a reply", "answer this ticket", "respond to the customer", or when a triaged ticket has a matching help-center article and needs a first response.'
  };
  const slug = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  /* ── tiny markdown renderer ───────────────────────────── */
  function inline(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, (m, c) => '<code class="md-code">' + c + '</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      .replace(/~~([^~]+)~~/g, '<s>$1</s>')
      .replace(/\{\{([^}]+)\}\}/g, '<span class="var">{{$1}}</span>');
  }
  function md(src) {
    const lines = src.split('\n'); let out = '', list = null, code = false, buf = [];
    const flush = () => { if (list) { out += '</' + list + '>'; list = null; } };
    for (const raw of lines) {
      if (raw.trim().startsWith('```')) { if (code) { out += '<pre class="md-pre">' + esc(buf.join('\n')) + '</pre>'; buf = []; code = false; } else { flush(); code = true; } continue; }
      if (code) { buf.push(raw); continue; }
      const l = raw.trimEnd(); let m;
      if (!l.trim()) { flush(); continue; }
      if ((m = l.match(/^(#{1,4})\s+(.*)/))) { flush(); const n = m[1].length; out += '<h' + n + ' class="md-h' + n + '">' + inline(m[2]) + '</h' + n + '>'; continue; }
      if ((m = l.match(/^\s*[-*]\s+(.*)/))) { if (list !== 'ul') { flush(); out += '<ul class="md-ul">'; list = 'ul'; } out += '<li>' + inline(m[1]) + '</li>'; continue; }
      if ((m = l.match(/^\s*\d+[.)]\s+(.*)/))) { if (list !== 'ol') { flush(); out += '<ol class="md-ol">'; list = 'ol'; } out += '<li>' + inline(m[1]) + '</li>'; continue; }
      if ((m = l.match(/^>\s?(.*)/))) { flush(); out += '<blockquote class="md-quote">' + inline(m[1]) + '</blockquote>'; continue; }
      flush(); out += '<p class="md-p">' + inline(l) + '</p>';
    }
    flush(); if (code) out += '<pre class="md-pre">' + esc(buf.join('\n')) + '</pre>';
    return out;
  }
  const toolsIn = (src) => [...new Set([...src.matchAll(/`([a-z][a-z0-9_]{2,})`/g)].map(m => m[1]))];

  function toolStatus(name) {
    if (qa('[data-section="tools"] .item-name .mono').some(m => m.textContent.trim() === name)) return ['good', 'On agent'];
    if ((NS.TOOLS_LIB || []).some(t => t[3] === name)) return ['info', 'In library'];
    return /^(list|get|search|add|update|assign|delete|post|read|lookup|create|comment|merge|archive|suspend|issue|void)_/.test(name) ? ['warn', 'Discoverable'] : ['bad', 'Unknown'];
  }

  /* ── the editor ───────────────────────────────────────── */
  function editor(opts) {
    let mode = 'preview', body = opts.body, name = opts.name, desc = opts.desc;
    const p = shell('drawer',
      '<div class="m-drawer sk-drawer">' +
        '<div class="sk-top">' +
          '<button class="ov-close" data-close title="Close"><i class="ti ti-chevrons-right"></i></button>' +
          '<div class="sk-top-title"><span class="sk-kicker">' + (opts.isNew ? 'New skill' : 'Skill') + '</span><span class="sk-slug" data-slug>' + esc(slug(name)) + '</span></div>' +
          '<div class="sp"></div>' +
          (opts.isNew ? '' : '<button class="m-btn ghost sm icon" title="Duplicate" data-dup><i class="ti ti-copy"></i></button><button class="m-btn ghost sm icon" title="Delete" data-del><i class="ti ti-trash"></i></button>') +
          '<span class="save-state" data-dirty hidden><span class="d" style="background:var(--warn-dot)"></span> Unsaved</span>' +
          (opts.onAttach ? '<button class="m-btn secondary sm" data-attach><i class="ti ti-plus"></i> Attach to agent</button>' : '') +
          '<button class="m-btn primary sm" data-save><i class="ti ti-check"></i> ' + (opts.isNew ? 'Create skill' : 'Save changes') + '</button>' +
        '</div>' +
        '<div class="sk-bar">' +
          '<div class="sk-fmt" data-fmt>' +
            '<button title="Bold" data-wrap="**"><i class="ti ti-bold"></i></button><button title="Italic" data-wrap="*"><i class="ti ti-italic"></i></button><button title="Strikethrough" data-wrap="~~"><i class="ti ti-strikethrough"></i></button>' +
            '<span class="sep"></span><button title="Heading" data-line="## "><i class="ti ti-h-2"></i></button><button title="Sub-heading" data-line="### "><i class="ti ti-h-3"></i></button>' +
            '<span class="sep"></span><button title="Bullet list" data-line="- "><i class="ti ti-list"></i></button><button title="Numbered list" data-line="1. "><i class="ti ti-list-numbers"></i></button>' +
            '<span class="sep"></span><button title="Inline tool" data-wrap="' + BT + '"><i class="ti ti-code"></i></button><button title="Code block" data-block="1"><i class="ti ti-source-code"></i></button>' +
          '</div>' +
          '<div class="sp"></div>' +
          '<div class="m-seg sk-mode"><button class="on" data-mode="preview"><i class="ti ti-eye"></i> Preview</button><button data-mode="source"><i class="ti ti-code"></i> Source</button></div>' +
        '</div>' +
        '<div class="ov-body sk-body">' +
          '<div class="m-field"><label class="m-label">Name</label><input class="m-input mono" data-name value="' + esc(slug(name)) + '" placeholder="account-briefing"></div>' +
          '<div class="m-field" style="margin-top:12px"><label class="m-label">Description <span class="opt">— the router reads this to decide when to invoke the skill</span></label><textarea class="m-textarea" data-desc rows="3" placeholder="Use when the user says &quot;…&quot;, asks for …, or when …">' + esc(desc) + '</textarea></div>' +
          '<div class="sk-tools" data-tools></div>' +
          '<div class="sk-doc" data-doc></div>' +
        '</div>' +
      '</div>'
    );
    const doc = q('[data-doc]', p), tools = q('[data-tools]', p), dirty = q('[data-dirty]', p);
    const markDirty = () => { dirty.hidden = false; };
    function renderTools() {
      const list = toolsIn(body);
      if (!list.length) { tools.innerHTML = ''; return; }
      tools.innerHTML = '<div class="f-mini-label" style="margin-bottom:6px">Tools referenced <span class="caption" style="font-weight:400">' + list.length + ' · detected from backticks</span></div><div class="sk-tool-chips">' +
        list.map(t => { const [k, l] = toolStatus(t); return '<span class="sk-tool" data-k="' + k + '" title="' + l + '"><span class="dot"></span><span class="mono">' + esc(t) + '</span><span class="st">' + l + '</span></span>'; }).join('') + '</div>';
    }
    function autosize(t) { const fit = () => { t.style.height = 'auto'; t.style.height = Math.max(320, t.scrollHeight + 4) + 'px'; }; t.addEventListener('input', fit); fit(); }
    function render() {
      q('[data-fmt]', p).style.visibility = mode === 'source' ? 'visible' : 'hidden';
      if (mode === 'preview') doc.innerHTML = '<div class="md">' + md(body) + '</div>';
      else doc.innerHTML = '<textarea class="sk-src" data-src spellcheck="false">' + esc(body) + '</textarea>';
      const src = q('[data-src]', p);
      if (src) { src.addEventListener('input', () => { body = src.value; markDirty(); renderTools(); }); autosize(src); }
      renderTools();
    }
    qa('[data-mode]', p).forEach(b => b.addEventListener('click', () => { qa('[data-mode]', p).forEach(x => x.classList.toggle('on', x === b)); mode = b.dataset.mode; render(); }));
    doc.addEventListener('dblclick', () => { if (mode === 'preview') q('[data-mode="source"]', p).click(); });
    q('[data-fmt]', p).addEventListener('click', (e) => {
      const b = e.target.closest('button'); const src = q('[data-src]', p); if (!b || !src) return;
      const s = src.selectionStart, en = src.selectionEnd, v = src.value;
      if (b.dataset.wrap) { const w = b.dataset.wrap; src.value = v.slice(0, s) + w + v.slice(s, en) + w + v.slice(en); src.setSelectionRange(s + w.length, en + w.length); }
      else if (b.dataset.line) { const ls = v.lastIndexOf('\n', s - 1) + 1; src.value = v.slice(0, ls) + b.dataset.line + v.slice(ls); src.setSelectionRange(s + b.dataset.line.length, en + b.dataset.line.length); }
      else if (b.dataset.block) { const f = '\n' + BT + BT + BT + '\n'; src.value = v.slice(0, s) + f + v.slice(s, en) + f + v.slice(en); }
      src.focus(); src.dispatchEvent(new Event('input'));
    });
    q('[data-name]', p).addEventListener('input', (e) => { name = e.target.value; q('[data-slug]', p).textContent = slug(name) || '—'; markDirty(); });
    q('[data-desc]', p).addEventListener('input', (e) => { desc = e.target.value; markDirty(); });
    q('[data-save]', p).addEventListener('click', () => { opts.onSave(slug(name) || 'untitled-skill', desc.trim(), body, toolsIn(body)); close(); });
    const at = q('[data-attach]', p); if (at) at.addEventListener('click', () => { opts.onAttach(slug(name), desc.trim(), body, toolsIn(body)); close(); });
    const dup = q('[data-dup]', p); if (dup) dup.addEventListener('click', () => toast('Duplicated as ' + slug(name) + '-copy', 'ti-copy'));
    const del = q('[data-del]', p); if (del) del.addEventListener('click', () => { if (opts.onDelete) opts.onDelete(); close(); });
    render();
    return p;
  }

  /* ── entry points ─────────────────────────────────────── */
  const rerender = () => { if (window.NexusFeatures && window.NexusFeatures.rerender) window.NexusFeatures.rerender('skills'); };
  const onAgent = (title) => qa('[data-section="skills"] .skill-top .item-name').some(n => n.textContent.trim() === title);

  function open(s) {
    const body = s.body || BODIES[s[3]] || DEFAULT_BODY(s[3]);
    const desc = s.useWhen || USE_WHEN[s[3]] || ('Use when the user asks to ' + s[4].charAt(0).toLowerCase() + s[4].slice(1));
    editor({
      name: s[3], desc, body, isNew: false,
      onSave: (n, d, b, tools) => { s.body = b; s.useWhen = d; s[5] = tools.slice(0, 6); rerender(); toast('Skill saved as v5', 'ti-puzzle'); },
      onAttach: onAgent(s[3]) ? null : (n, d, b, tools) => { s.body = b; NF.addSkillToList(s[3], d, tools); if (window.showView) window.showView('agents'); toast('Attached ' + s[3], 'ti-puzzle'); },
      onDelete: () => { const i = NS.SKILLS.indexOf(s); if (i > -1) NS.SKILLS.splice(i, 1); rerender(); toast(s[3] + ' deleted', 'ti-trash'); }
    });
  }
  function compose() {
    const inAgents = q('#view-agents') && q('#view-agents').classList.contains('active');
    editor({
      name: 'new-skill', desc: '', body: DEFAULT_BODY('New Skill'), isNew: true,
      onSave: (n, d, b, tools) => {
        const title = n.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase());
        const rec = ['ti-puzzle', 'var(--bg-muted)', 'var(--ink-700)', title, d || 'No description yet.', tools.slice(0, 6), 'Custom', inAgents ? 1 : 0, '0'];
        rec.body = b; rec.useWhen = d; NS.SKILLS.push(rec);
        if (inAgents) NF.addSkillToList(title, d || 'Custom skill', tools);
        rerender(); toast('Skill "' + n + '" created', 'ti-puzzle');
      }
    });
  }

  /* skill rows on the agent page open the same editor */
  document.addEventListener('click', (e) => {
    const top = e.target.closest('[data-section="skills"] .skill-top');
    if (!top || e.target.closest('button, .m-switch, .m-badge')) return;
    const nm = q('.item-name', top).textContent.trim();
    let s = NS.SKILLS.find(x => x[3] === nm);
    if (!s) { s = ['ti-puzzle', '', '', nm, q('.item-desc', top).textContent.trim(), qa('.m-chip', top.parentElement).map(c => c.textContent.trim()), 'Custom', 1, '0']; NS.SKILLS.push(s); }
    open(s);
  });

  window.NexusSkills = { open, compose, md, toolsIn };
})();
