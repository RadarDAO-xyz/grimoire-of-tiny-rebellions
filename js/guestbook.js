// guestbook — loads and renders anonymous entries from supabase

async function fetchEntries() {
  const url = window.SUPABASE_URL;
  const key = window.SUPABASE_ANON_KEY;

  if (!url || url.startsWith('YOUR')) {
    return getDemoEntries();
  }

  const res = await fetch(
    `${url}/rest/v1/guestbook?order=created_at.desc&limit=200`,
    {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      },
    }
  );

  if (!res.ok) return getDemoEntries();
  return res.json();
}

function getDemoEntries() {
  return [
    { charm_id: 'marble', score_title: 'the long way round', note: "walked home through the park. a heron was standing completely still in the reeds. i stayed until it moved. it took eighteen minutes.", created_at: '2026-04-22T14:32:00Z' },
    { charm_id: 'stone', score_title: 'ten minutes', note: "sat in the garden and did nothing. kept wanting to get my phone. didn't. a cat came and sat near me. that was the whole thing.", created_at: '2026-04-21T09:14:00Z' },
    { charm_id: 'wishbone', score_title: 'say it out loud', note: "told my sister i've been stuck on this for six months. she said she knew. we talked for two hours. i think i'm unstuck now.", created_at: '2026-04-20T20:55:00Z' },
    { charm_id: 'seed-packet', score_title: 'before you\'re ready', note: "sent one paragraph of the thing i've been not writing. just to one person. they wrote back immediately.", created_at: '2026-04-19T16:40:00Z' },
    { charm_id: 'googly-eye', score_title: 'the slower thought', note: "wrote a thought i've been carrying for weeks by hand. it changed shape entirely in the middle. i don't know what it became.", created_at: '2026-04-18T11:22:00Z' },
  ];
}

function formatTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

function charmLabel(id) {
  const labels = {
    'witchy-marble':       'the witchy marble',
    'spool-of-thread':     'the spool of thread',
    'stone':               'the stone',
    'frog-key':            'the frog key',
    'skeleton-key':        'the skeleton key',
    'domino':              'the domino',
    'button':              'the button',
    'shell':               'the shell',
    'box-of-matches':      'the box of matches',
    'stamp':               'the stamp',
    'eraser':              'the eraser',
    'googly-eye':          'the googly eye',
    'small-plastic-dinosaur': 'the small plastic dinosaur',
    'd20':                 'the D20',
    'pocket-watch':        'the pocket watch',
    'acorn':               'the acorn',
    'scissors':            'the scissors',
    'coin':                'the coin',
    'horseshoe':           'the horseshoe',
    'ring':                'the ring',
    'crystal':             'the crystal',
    'death-stone':         'the death stone',
    'tic-tacs':            'the tic-tacs',
    'corsage':             'the corsage',
    'lemon':               'the lemon',
    'lego':                'the lego',
    'paint-brush':         'the paint brush',
    'pencil':              'the pencil',
    'homemade-rope-charm': 'the homemade rope charm',
    'lucky-moon':          'the lucky moon',
    'rope-ball':           'the rope ball',
    'bottle-dogs-tooth':   'the bottle with dog\'s tooth',
  };
  return labels[id] || id;
}

function makeEntryDraggable(el) {
  let pid = null, startX, startY, startCX, startCY;
  const rot = el.dataset.rot || '0';

  el.addEventListener('pointerdown', e => {
    if (pid !== null) return;
    e.stopPropagation();
    pid    = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    el.setPointerCapture(e.pointerId);

    const rect = el.getBoundingClientRect();
    startCX = rect.left + rect.width  / 2;
    startCY = rect.top  + rect.height / 2;

    if (el.parentNode !== document.body) document.body.appendChild(el);
    el.style.position  = 'fixed';
    el.style.left      = startCX + 'px';
    el.style.top       = startCY + 'px';
    el.style.transform = `translate(-50%, -50%) rotate(${rot}deg)`;
    el.style.transition = 'none';
    el.style.zIndex    = '50';
    el.style.cursor    = 'grabbing';
  });

  el.addEventListener('pointermove', e => {
    if (e.pointerId !== pid) return;
    el.style.left = (startCX + e.clientX - startX) + 'px';
    el.style.top  = (startCY + e.clientY - startY) + 'px';
  });

  const end = e => {
    if (e.pointerId !== pid) return;
    pid = null;
    el.releasePointerCapture(e.pointerId);
    el.style.cursor = 'grab';
  };
  el.addEventListener('pointerup',          end);
  el.addEventListener('pointercancel',      end);
  el.addEventListener('lostpointercapture', end);
}

function renderEntries(entries) {
  const container = document.getElementById('entries');
  if (!entries.length) {
    container.innerHTML = '<p class="loading-text">nothing here yet. you might be first.</p>';
    return;
  }

  const isMobile = window.innerWidth <= 600;

  if (isMobile) {
    container.style.height = 'auto';
    container.innerHTML = entries.map(e => {
      const rot = (Math.random() * 6 - 3).toFixed(2);
      return `
      <div class="entry entry-rect" data-rot="${rot}" style="transform:rotate(${rot}deg)">
        <div class="entry-score">${e.score_title} <span class="entry-charm">— via ${charmLabel(e.charm_id)}</span></div>
        <div class="entry-note">${escapeHtml(e.note)}</div>
        <div class="entry-time">${formatTime(e.created_at)}</div>
      </div>`;
    }).join('');
    return;
  }

  const ROW_H   = 320;
  const rows    = Math.ceil(entries.length / 2);
  container.style.height = (rows * ROW_H + 100) + 'px';

  container.innerHTML = entries.map((e, idx) => {
    const col      = idx % 2;
    const row      = Math.floor(idx / 2);
    const shape    = Math.random() > 0.45 ? 'entry-rect' : 'entry-sq';
    const sign     = col === 0 ? -1 : 1;
    const rot      = (sign * (2 + Math.random() * 8) + (Math.random() * 6 - 3)).toFixed(2);
    const leftBase = col === 0 ? 4 : 52;
    const left     = (leftBase + Math.random() * 12).toFixed(1) + 'vw';
    const top      = Math.round(row * ROW_H + 24 + Math.random() * 48);

    return `
    <div class="entry ${shape}" data-rot="${rot}" style="left:${left};top:${top}px;transform:rotate(${rot}deg);cursor:grab">
      <div class="entry-score">${e.score_title} <span class="entry-charm">— via ${charmLabel(e.charm_id)}</span></div>
      <div class="entry-note">${escapeHtml(e.note)}</div>
      <div class="entry-time">${formatTime(e.created_at)}</div>
    </div>`;
  }).join('');

  container.querySelectorAll('.entry').forEach(makeEntryDraggable);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function init() {
  const hasContributed = localStorage.getItem('grimoire_contributed');
  const gate = document.getElementById('gate');
  const book = document.getElementById('book');

  if (!hasContributed) {
    gate.style.display = 'block';
    book.style.display = 'none';
    return;
  }

  gate.style.display = 'none';
  book.style.display = 'block';

  document.getElementById('entries').innerHTML = '<p class="loading-text">gathering notes...</p>';

  try {
    const entries = await fetchEntries();
    renderEntries(entries);
  } catch (e) {
    document.getElementById('entries').innerHTML = '<p class="error-text">couldn\'t reach the guestbook. try again later.</p>';
  }
}

init();
