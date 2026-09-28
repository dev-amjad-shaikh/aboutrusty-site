/* ═══════════════════════════════════════════════════════════════
   Agent Builder — interactions
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Theme toggle ─────────────────────────────────────── */
  const tt = document.getElementById('themeToggle');
  if (tt) {
    tt.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-theme-btn]');
      if (!btn) return;
      const mode = btn.dataset.themeBtn;
      document.documentElement.setAttribute('data-theme', mode);
      tt.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === btn));
      try { localStorage.setItem('nexus-theme', mode); } catch (e) {}
    });
    try {
      const saved = localStorage.getItem('nexus-theme');
      if (saved) { const b = tt.querySelector('[data-theme-btn="' + saved + '"]'); if (b) b.click(); }
    } catch (e) {}
  }

  /* ── Collapsible config blocks ────────────────────────── */
  document.querySelectorAll('[data-block] .block-head').forEach(head => {
    head.addEventListener('click', (e) => {
      // don't collapse when clicking an action button inside the head
      if (e.target.closest('.head-act button, .m-btn')) return;
      head.closest('[data-block]').classList.toggle('collapsed');
    });
  });

  /* ── Switches ─────────────────────────────────────────── */
  document.querySelectorAll('[data-switch]').forEach(sw => {
    sw.addEventListener('click', (e) => {
      e.stopPropagation();
      sw.classList.toggle('on');
      const memCard = sw.closest('.mem-card');
      if (memCard) memCard.classList.toggle('on', sw.classList.contains('on'));
    });
  });

  /* ── Segmented controls (instructions tabs + test view) ── */
  document.querySelectorAll('.m-seg').forEach(seg => {
    seg.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === btn));
    });
  });

  /* ── Slider value readouts ────────────────────────────── */
  document.querySelectorAll('.param').forEach(p => {
    const slider = p.querySelector('.m-slider');
    const out = p.querySelector('.pv');
    if (!slider || !out) return;
    const max = Number(slider.max);
    const render = () => {
      const v = Number(slider.value);
      out.textContent = max === 100 ? (v / 100).toFixed(1) : String(v);
    };
    slider.addEventListener('input', render);
    render();
  });

  /* ── Agent list selection ─────────────────────────────── */
  document.querySelectorAll('.ag-link').forEach(l => {
    l.addEventListener('click', () => {
      document.querySelectorAll('.ag-link').forEach(x => x.classList.remove('active'));
      l.classList.add('active');
    });
  });

  /* ── Test panel: composer + scripted run ──────────────── */
  const thread = document.getElementById('thread');
  const input = document.getElementById('composerInput');
  const sendBtn = document.getElementById('sendBtn');

  function scrollThread() { if (thread) thread.scrollTop = thread.scrollHeight; }

  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function addUser(text) {
    const m = el('<div class="msg user"><div class="who">You</div><div class="bub"></div></div>');
    m.querySelector('.bub').textContent = text;
    thread.appendChild(m);
    scrollThread();
  }

  function agentName() { const n = document.querySelector('.hero-name'); return n ? n.textContent.trim() : 'Agent'; }

  function addThinking() {
    const m = el('<div class="msg agent" data-temp><div class="who">' + agentName() + '</div><div class="thinking"><span></span><span></span><span></span></div></div>');
    thread.appendChild(m);
    scrollThread();
    return m;
  }

  // pick a plausible trace + reply for the prompt
  function planFor(text) {
    const t = text.toLowerCase();
    if (t.includes('order') || t.includes('where')) {
      return {
        trace: [
          ['var(--cat-teal-bg)', 'var(--cat-teal)', 'ti-tag', 'classify()', 'intent: how-to · priority: normal', true, null],
          ['var(--cat-teal-bg)', 'var(--cat-teal)', 'ti-brand-slack', 'connector: Zendesk.lookup()', 'order #4471 · status: in transit', false, '180ms'],
          ['var(--cat-blue-bg)', 'var(--cat-blue)', 'ti-search', 'search_kb("track an order")', '2 articles found', false, '210ms']
        ],
        reply: "Your order #4471 shipped Tuesday and is in transit — tracking shows it out for delivery today. You can follow it live from the link in your confirmation email. Want me to resend that email?"
      };
    }
    if (t.includes('csv') || t.includes('export')) {
      return {
        trace: [
          ['var(--cat-teal-bg)', 'var(--cat-teal)', 'ti-tag', 'classify()', 'intent: how-to · priority: low', true, null],
          ['var(--cat-blue-bg)', 'var(--cat-blue)', 'ti-search', 'search_kb("export data CSV")', 'top: "Exporting your data"', false, '190ms']
        ],
        reply: "You can export anytime from Settings → Data → Export, then choose CSV. The file lands in your email within a few minutes. Large accounts can take up to an hour — want me to start one for you now?"
      };
    }
    if (t.includes('refund') || t.includes('broken') || t.includes('angry') || t.includes('annoyed')) {
      return {
        trace: [
          ['var(--cat-teal-bg)', 'var(--cat-teal)', 'ti-tag', 'classify()', 'intent: bug · priority: high · sentiment: negative', true, null],
          ['var(--cat-blue-bg)', 'var(--cat-blue)', 'ti-search', 'search_kb("app crash refund policy")', '4 articles found', false, '230ms'],
          ['var(--cat-rose-bg)', 'var(--cat-rose)', 'ti-arrow-up-right-circle', 'escalate(reason: "angry + refund")', 'routed to human · billing queue', true, null]
        ],
        reply: "I'm really sorry the app let you down. I've logged the issue for our engineers and escalated your refund request to a teammate who can process it right away — you'll hear back within one business day. Is there anything I can do to tide you over in the meantime?"
      };
    }
    return {
      trace: [
        ['var(--cat-teal-bg)', 'var(--cat-teal)', 'ti-tag', 'classify()', 'intent: general · priority: normal', true, null],
        ['var(--cat-blue-bg)', 'var(--cat-blue)', 'ti-search', 'search_kb(query)', 'searching help center…', false, '200ms']
      ],
      reply: "Thanks for reaching out — I've checked our help center and I'm on it. Could you share a little more detail so I can point you to the exact fix?"
    };
  }

  function buildTrace(steps) {
    const wrap = el('<div class="trace"></div>');
    steps.forEach(s => {
      const [bg, fg, icon, name, detail, check, time] = s;
      const right = check
        ? '<i class="ti ti-circle-check-filled trace-check"></i>'
        : '<span class="trace-time">' + (time || '') + '</span>';
      const step = el(
        '<div class="trace-step">' +
          '<div class="trace-ic" style="background:' + bg + '; color:' + fg + '"><i class="ti ' + icon + '"></i></div>' +
          '<div class="trace-main"><div class="trace-name"></div><div class="trace-detail"></div></div>' +
          right +
        '</div>'
      );
      step.querySelector('.trace-name').textContent = name;
      step.querySelector('.trace-detail').textContent = detail;
      wrap.appendChild(step);
    });
    return wrap;
  }

  let running = false;
  function run(text) {
    if (running || !text.trim()) return;
    const empty = thread.querySelector('.thread-empty'); if (empty) empty.remove();
    running = true;
    addUser(text.trim());
    const thinkingEl = addThinking();
    const plan = planFor(text);

    setTimeout(() => {
      // swap thinking for trace
      thinkingEl.querySelector('.thinking').replaceWith(buildTrace(plan.trace));
      thinkingEl.removeAttribute('data-temp');
      scrollThread();

      setTimeout(() => {
        const reply = el('<div class="msg agent"><div class="who">' + agentName() + '</div><div class="bub"></div></div>');
        reply.querySelector('.bub').textContent = plan.reply;
        thread.appendChild(reply);
        scrollThread();
        running = false;
      }, 900);
    }, 1100);
  }

  if (sendBtn && input) {
    const submit = () => { const v = input.value; input.value = ''; autoGrow(); run(v); };
    sendBtn.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
    });
    const autoGrow = () => { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 90) + 'px'; };
    input.addEventListener('input', autoGrow);
  }

  document.querySelectorAll('[data-pane="test"] .preset, .test-presets .preset[data-preset]').forEach(p => {
    if (p.closest('[data-pane="build"]')) return;
    p.addEventListener('click', () => run(p.dataset.preset || p.textContent));
  });
  window.NexusTest = { run };

})();
