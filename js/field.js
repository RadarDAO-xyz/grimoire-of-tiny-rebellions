// grimoire of tiny rebellions — field interaction

const IMAGE_MAP = {
  'witchy-marble.png':       'witchy marble.png',
  'spool-of-thread.png':     'spool.png',
  'frog-key.png':            'frog key.png',
  'skeleton-key.png':        'skeleton key.png',
  'box-of-matches.png':      'matches.png',
  'googly-eye.png':          'eyes.png',
  'pocket-watch.png':        'pocket watch.png',
  'scissors.png':            'tiny scissors.png',
  'ring.png':                'vintage ring.png',
  'crystal.png':             'pretty stone.png',
  'death-stone.png':         'death stone.png',
  'tic-tacs.png':            'tic tac.png',
  'paint-brush.png':         'paint brush.png',
  'pencil.png':              'tiny pencil.png',
  'homemade-rope-charm.png': 'handmade rope.png',
  'bottle-dogs-tooth.png':   'bottle tooth.png',
  'lucky-moon.png':          'lucky moon.png',
  'rope-ball.png':           'rope ball.png',
};

const ENTRANCE_CLASS = {
  'rolls-in-from-edge':             'enter-roll',
  'drops-slight-bounce':            'enter-bounce',
  'drops-no-bounce':                'enter-heavy',
  'falls-rotates-once':             'enter-rotate',
  'tips-over-lands-flat':           'enter-tip',
  'drops-tiny-bounce':              'enter-bounce',
  'rocks-once-settles':             'enter-rock',
  'drops-fast-straight':            'enter-heavy',
  'drops-flips-once-lands-face-up': 'enter-rotate',
  'drops-pupil-rattles-after':      'enter-bounce',
  'falls-tips-forward-recovers':    'enter-tip',
  'tumbles-settles':                'enter-rock',
  'drops-swings-once-settles':      'enter-rotate',
  'drops-small-roll-settles':       'enter-roll-small',
  'drops-lands-straight':           'enter-heavy',
  'drops-spins-flat':               'enter-spin',
  'drops-rolls-settles':            'enter-roll-small',
  'drops-slight-glint-settles':     'enter-bounce',
  'drops-rattles-settles':          'enter-bounce',
  'drifts-down-slowly':             'enter-drift',
  'drops-small-roll':               'enter-roll-small',
  'drops-flat-lands':               'enter-heavy',
  'drops-slides-slightly':          'enter-bounce',
  'drops-rolls-slight':             'enter-roll-small',
  'drifts-settles-gently':          'enter-drift',
  'drops-rocks-once-settles':       'enter-rock',
};

// Physics profiles per entrance class.
// g = gravity px/frame², bounce = restitution, rotDamp = angular damping per frame,
// xDamp = lateral damping per frame, bXDamp = extra x damping on bounce impact.
// mode 'above' = drops from above; mode 'roll' = rolls in from horizontal edge.
const PHYSICS = {
  'enter-roll':       { g:0.40, bounce:0.18, rotDamp:0.989, xDamp:0.976, bXDamp:0.80, mode:'roll'  },
  'enter-bounce':     { g:0.62, bounce:0.50, rotDamp:0.87,  xDamp:0.997, bXDamp:0.70, mode:'above', dH:[105,155], rotV:[0.3, 0.95] },
  'enter-heavy':      { g:0.92, bounce:0.04, rotDamp:0.72,  xDamp:0.997, bXDamp:0.45, mode:'above', dH:[90, 135], rotV:[0.0, 0.28] },
  'enter-rotate':     { g:0.58, bounce:0.28, rotDamp:0.93,  xDamp:0.997, bXDamp:0.66, mode:'above', dH:[110,160], rotV:[1.4, 2.6]  },
  'enter-tip':        { g:0.64, bounce:0.11, rotDamp:0.86,  xDamp:0.997, bXDamp:0.55, mode:'above', dH:[80, 120], rotV:[0.8, 1.5]  },
  'enter-rock':       { g:0.55, bounce:0.17, rotDamp:0.968, xDamp:0.997, bXDamp:0.72, mode:'above', dH:[75, 115], rotV:[0.4, 1.0]  },
  'enter-drift':      { g:0.26, bounce:0.05, rotDamp:0.975, xDamp:0.998, bXDamp:0.90, mode:'above', dH:[60, 90],  rotV:[0.05,0.20] },
  'enter-roll-small': { g:0.54, bounce:0.20, rotDamp:0.962, xDamp:0.996, bXDamp:0.80, mode:'above', dH:[80, 120], rotV:[0.8, 2.2]  },
  'enter-spin':       { g:0.60, bounce:0.24, rotDamp:0.955, xDamp:0.997, bXDamp:0.62, mode:'above', dH:[100,150], rotV:[3.5, 5.5]  },
};

const NO_IMAGE = new Set(['stamp', 'small-plastic-dinosaur']);

// ── Physics engine ──────────────────────────────────────────────────────────
// One instance per charm. ox/oy = pixel offset from the charm's final CSS position.
// When settled, the offset is zeroed and the .landed class is added.

class CharmPhysics {
  constructor(el, cls, delay) {
    this.el        = el;
    this.delaySec  = delay;
    this.p         = PHYSICS[cls] || PHYSICS['enter-bounce'];
    this.active    = false;
    this.settled   = false;
    this.frame     = 0;
    this.bounceCount = 0;

    const p    = this.p;
    const sign = Math.random() > 0.5 ? 1 : -1;

    if (p.mode === 'roll') {
      const xPct    = parseFloat(el.style.getPropertyValue('--x'));
      const fromLeft = xPct <= 50;
      if (fromLeft) {
        const finalXpx = xPct / 100 * window.innerWidth;
        this.ox = -(finalXpx + 220);
        this.vx = 4.5 + Math.random() * 4;
      } else {
        const distToRight = (1 - xPct / 100) * window.innerWidth;
        this.ox = distToRight + 220;
        this.vx = -(4.5 + Math.random() * 4);
      }
      this.oy  = 0;
      this.vy  = 0;
      this.rot = 0;
      this.rotVel = this.vx * 1.75;
      this.bounceCount = 1; // starts at floor
    } else {
      const dH     = p.dH;
      const rotV   = p.rotV;
      this.oy      = -(dH[0] + Math.random() * (dH[1] - dH[0]));
      this.vy      = 0;
      this.ox      = (1 + Math.random() * 10) * sign;
      this.vx      = (0.1 + Math.random() * 1.0) * sign;
      this.rot     = sign * (5 + Math.random() * 16);
      this.rotVel  = sign * (rotV[0] + Math.random() * (rotV[1] - rotV[0]));
    }

    el.style.opacity    = '0';
    el.style.transition = 'none';
    el.style.transform  = `translate(calc(-50% + ${this.ox.toFixed(1)}px), calc(-50% + ${this.oy.toFixed(1)}px)) rotate(${this.rot.toFixed(1)}deg)`;
  }

  // Returns true if the charm settled on this frame.
  tick(elapsedMs) {
    if (this.settled) return false;
    if (elapsedMs < this.delaySec * 1000) return false;

    if (!this.active) {
      this.active = true;
      this.el.style.opacity = '1';
    }

    this.frame++;
    const p = this.p;

    if (this.frame > 400) { this._settle(); return true; }

    this.vy    += p.g;
    this.oy    += this.vy;
    this.ox    += this.vx;
    this.vx    *= p.xDamp;

    if (p.mode === 'roll') {
      this.rotVel = this.vx * 1.75;
    } else {
      this.rotVel *= p.rotDamp;
    }
    this.rot += this.rotVel;

    if (this.oy >= 0) {
      this.oy = 0;
      this.bounceCount++;
      const absVy = Math.abs(this.vy);
      if (absVy > 0.5) {
        this.vy  = -absVy * p.bounce;
        this.vx *= p.bXDamp;
      } else {
        this.vy = 0;
      }
    }

    const atFloor = this.oy >= -0.5;
    const stopped = Math.abs(this.vy)     < 0.35
                 && Math.abs(this.vx)     < 0.12
                 && Math.abs(this.rotVel) < 0.45;

    if (atFloor && stopped && this.bounceCount > 0) {
      this._settle();
      return true;
    }

    this.el.style.transform = `translate(calc(-50% + ${this.ox.toFixed(1)}px), calc(-50% + ${this.oy.toFixed(1)}px)) rotate(${this.rot.toFixed(1)}deg)`;
    return false;
  }

  _settle() {
    this.settled            = true;
    this.el.style.opacity   = '1';
    this.el.style.transform = 'translate(-50%, -50%)';
    this.el.style.transition = '';
    this.el.classList.add('landed');
  }
}

// ── Drag helper ─────────────────────────────────────────────────────────────
// Makes el draggable. onTap fires only if the pointer didn't meaningfully move.

function makeDraggable(el, onTap) {
  let pid = null, startX, startY, startLeft, startTop, moved = false;

  el.addEventListener('pointerdown', e => {
    if (pid !== null) return;
    e.stopPropagation();
    pid    = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    moved  = false;
    el.setPointerCapture(e.pointerId);

    const rect  = el.getBoundingClientRect();
    // Use center-based placement so a rotated card doesn't jump on first grab.
    // getBoundingClientRect gives the axis-aligned bounding box; its center equals
    // the element's true center regardless of rotation. We back-calculate the
    // pre-rotation top-left from that center and the element's natural dimensions.
    const centerX = rect.left + rect.width  / 2;
    const centerY = rect.top  + rect.height / 2;
    startLeft = centerX - el.offsetWidth  / 2;
    startTop  = centerY - el.offsetHeight / 2;
    // Move to body so the card escapes #score-panel's stacking context (z-index 10)
    // and its own z-index 100 competes at the root level, above the note prompt (z-index 20).
    if (el.parentNode !== document.body) document.body.appendChild(el);
    el.style.position   = 'fixed';
    el.style.left       = startLeft + 'px';
    el.style.top        = startTop  + 'px';
    el.style.right      = '';
    el.style.bottom     = '';
    el.style.transition = 'none';
    el.style.zIndex     = '100';
    el.style.cursor     = 'grabbing';
  });

  el.addEventListener('pointermove', e => {
    if (e.pointerId !== pid) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!moved && dx * dx + dy * dy > 16) moved = true;
    if (moved) {
      el.style.left = (startLeft + dx) + 'px';
      el.style.top  = (startTop  + dy) + 'px';
    }
  });

  const endDrag = e => {
    if (e.pointerId !== pid) return;
    const wasMoved = moved;
    pid = null;
    moved = false;
    el.releasePointerCapture(e.pointerId);
    el.style.cursor = 'grab';
    if (e.type === 'pointerup') {
      if (wasMoved) {
        const r = (Math.random() * 10 - 5).toFixed(1);
        el.style.setProperty('--rot', r + 'deg');
        el.style.transform = `rotate(${r}deg)`;
      } else if (onTap) {
        onTap();
      }
    }
  };
  el.addEventListener('pointerup',          endDrag);
  el.addEventListener('pointercancel',      endDrag);
  el.addEventListener('lostpointercapture', endDrag);
}

// Makes the selected charm draggable. Attached once in buildField; state guards
// prevent activation until the charm has actually been chosen.
function makeCharmDraggable(el) {
  let pid = null, startX, startY, startCX, startCY;

  el.addEventListener('pointerdown', e => {
    if (el.dataset.charm !== selectedCharm) return;
    if (state !== 'selected' && state !== 'taken') return;
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
    el.style.position   = 'fixed';
    el.style.left       = startCX + 'px';
    el.style.top        = startCY + 'px';
    el.style.right      = '';
    el.style.bottom     = '';
    el.style.transform  = 'translate(-50%, -50%)';
    el.style.transition = 'none';
    el.style.zIndex     = '200';
    el.style.cursor     = 'grabbing';
  });

  el.addEventListener('pointermove', e => {
    if (e.pointerId !== pid) return;
    el.style.left = (startCX + e.clientX - startX) + 'px';
    el.style.top  = (startCY + e.clientY - startY) + 'px';
  });

  const endCharmDrag = e => {
    if (e.pointerId !== pid) return;
    pid = null;
    el.releasePointerCapture(e.pointerId);
    el.style.cursor = 'grab';
  };
  el.addEventListener('pointerup',          endCharmDrag);
  el.addEventListener('pointercancel',      endCharmDrag);
  el.addEventListener('lostpointercapture', endCharmDrag);
}

// Makes the note prompt draggable by its handle bar.
// On first drag, converts from bottom-strip to a floating card.

function makeNoteDraggable(el) {
  const handle = el.querySelector('.note-drag-handle');
  if (!handle) return;

  let pid = null, startX, startY, startLeft, startTop;

  handle.addEventListener('pointerdown', e => {
    if (pid !== null) return;
    e.stopPropagation();
    pid    = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    handle.setPointerCapture(e.pointerId);

    const rect = el.getBoundingClientRect();
    startLeft  = rect.left;
    startTop   = rect.top;

    // Convert from bottom-strip to floating card
    el.style.position   = 'fixed';
    el.style.left       = startLeft + 'px';
    el.style.top        = startTop  + 'px';
    el.style.right      = '';
    el.style.bottom     = '';
    el.style.width      = rect.width + 'px';
    el.style.background = 'linear-gradient(to top, rgba(18,38,62,0.92) 0%, rgba(18,38,62,0.82) 100%)';
    el.style.borderRadius = '8px 8px 0 0';

    handle.style.cursor = 'grabbing';
  });

  handle.addEventListener('pointermove', e => {
    if (e.pointerId !== pid) return;
    el.style.left = (startLeft + e.clientX - startX) + 'px';
    el.style.top  = (startTop  + e.clientY - startY) + 'px';
  });

  handle.addEventListener('pointerup', e => {
    if (e.pointerId !== pid) return;
    pid = null;
    handle.releasePointerCapture(e.pointerId);
    handle.style.cursor = 'grab';
  });
}

// ── Positions ────────────────────────────────────────────────────────────────

function resolveImage(slug) {
  const filename = IMAGE_MAP[slug] || slug;
  return 'assets/charms/' + encodeURIComponent(filename);
}

function generatePositions(n) {
  const isMobile  = window.innerWidth <= 600;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const positions = [];
  let attempts    = 0;

  const xMin   = isMobile ? 14 : 9;
  const xRange = isMobile ? 72 : 82;
  const yMin   = isMobile ? 18 : 12;
  const yRange = isMobile ? 68 : 76;
  const hdrX   = isMobile ? 38 : 30;
  const hdrY   = isMobile ? 14 : 18;

  while (positions.length < n && attempts < 4000) {
    attempts++;
    const x  = xMin + Math.random() * xRange;
    const y  = yMin + Math.random() * yRange;
    if (x < hdrX && y < hdrY) continue;
    const ok = positions.every(p => {
      if (isMobile) {
        // pixel-based distance so 80px images can't visually overlap
        const dxPx = (p.x - x) / 100 * vw;
        const dyPx = (p.y - y) / 100 * vh;
        return Math.sqrt(dxPx * dxPx + dyPx * dyPx) > 90;
      }
      const dx = p.x - x, dy = p.y - y;
      return Math.sqrt(dx * dx + dy * dy) > 14;
    });
    if (ok) positions.push({ x, y });
  }
  return positions;
}

// Even spread across 0.05–0.76s with small jitter, then shuffled so screen
// position has no correlation with arrival order.
function generateDelays(n) {
  const delays = Array.from({ length: n }, (_, i) => {
    const base = 0.05 + (i / Math.max(n - 1, 1)) * 0.71;
    return Math.max(0.02, +(base + (Math.random() * 0.10 - 0.05)).toFixed(3));
  });
  return delays.sort(() => Math.random() - 0.5);
}

// Cards in top 55% of viewport, clear of charm and each other.
function generateCardPositions(n, charmPct) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const CARD_W  = Math.min(300, Math.max(220, vw * 0.26));
  const CARD_H  = 165;
  const CHARM_R = 160;
  const CARD_R  = 175;

  const charmPx = charmPct.x / 100 * vw;
  const charmPy = charmPct.y / 100 * vh;

  const topMin  = Math.max(vh * 0.11, 96);   // always clears the site header
  const topMax  = vh * 0.62 - CARD_H;        // wider vertical band = more room to place
  const leftMin = vw * 0.05;
  const leftMax = vw * 0.95 - CARD_W;

  // Pre-generate rotations with guaranteed spread: spans negative through positive
  // so cards visually tilt in different directions, not all the same way.
  const rots = Array.from({ length: n }, (_, k) => {
    const base = -13 + (k / Math.max(n - 1, 1)) * 26;
    return +(base + (Math.random() * 6 - 3)).toFixed(1);
  }).sort(() => Math.random() - 0.5);

  const positions = [];
  let attempts = 0;

  while (positions.length < n && attempts < 3000) {
    attempts++;
    const left = leftMin + Math.random() * (leftMax - leftMin);
    const top  = topMin  + Math.random() * Math.max(topMax - topMin, 10);
    const cx   = left + CARD_W / 2;
    const cy   = top  + CARD_H / 2;

    if (Math.sqrt((cx - charmPx) ** 2 + (cy - charmPy) ** 2) < CHARM_R) continue;
    if (positions.some(p => Math.sqrt((p.cx - cx) ** 2 + (p.cy - cy) ** 2) < CARD_R)) continue;

    positions.push({
      top:  (top  / vh * 100).toFixed(1) + '%',
      left: (left / vw * 100).toFixed(1) + '%',
      rot:  rots[positions.length] + 'deg',
      cx, cy,
    });
  }

  return positions;
}

// ── State ────────────────────────────────────────────────────────────────────

let charmData     = [];
let drawnCharms   = [];
let state         = 'casting';
let selectedCharm = null;
let takenScore    = null;
let physicsObjects = [];
let physicsRAF     = null;

// ── Data ─────────────────────────────────────────────────────────────────────

async function loadCharms() {
  const res   = await fetch('./data/charms.json');
  const json  = await res.json();
  charmData   = json.charms;
  const pool      = json.charms.filter(c => !NO_IMAGE.has(c.id));
  const drawCount = window.innerWidth <= 600 ? 10 : (json.draw || 13);
  drawnCharms = pool.slice().sort(() => Math.random() - 0.5).slice(0, drawCount);
}

function getCharmData(id) {
  return charmData.find(c => c.id === id);
}

// ── Field ────────────────────────────────────────────────────────────────────

function buildField() {
  const field     = document.getElementById('field');
  const positions = generatePositions(drawnCharms.length);
  const delays    = generateDelays(drawnCharms.length);
  physicsObjects  = [];

  drawnCharms.forEach((charm, i) => {
    const pos = positions[i] || { x: 50, y: 50 };
    const cls = ENTRANCE_CLASS[charm.entrance] || 'enter-bounce';

    const div = document.createElement('div');
    div.className    = 'charm';
    div.id           = `charm-${charm.id}`;
    div.dataset.charm = charm.id;
    div.style.setProperty('--x', pos.x.toFixed(1) + '%');
    div.style.setProperty('--y', pos.y.toFixed(1) + '%');

    const img      = document.createElement('img');
    img.src        = resolveImage(charm.image);
    img.alt        = charm.name;
    img.draggable  = false;
    div.appendChild(img);

    div.addEventListener('click', () => onCharmClick(charm.id));
    makeCharmDraggable(div);
    field.appendChild(div);

    physicsObjects.push(new CharmPhysics(div, cls, delays[i]));
  });
}

function startPhysicsLoop() {
  if (physicsRAF) cancelAnimationFrame(physicsRAF);
  let startTs   = null;
  let remaining = physicsObjects.length;

  function loop(ts) {
    if (!startTs) startTs = ts;
    const elapsed = ts - startTs;

    for (const obj of physicsObjects) {
      if (!obj.settled && obj.tick(elapsed)) remaining--;
    }

    if (remaining > 0) {
      physicsRAF = requestAnimationFrame(loop);
    } else {
      physicsRAF = null;
      onFieldSettled();
    }
  }

  physicsRAF = requestAnimationFrame(loop);
}

// ── Interaction ───────────────────────────────────────────────────────────────

function onCharmClick(id) {
  if (state !== 'idle') return;
  state         = 'selected';
  selectedCharm = id;

  document.querySelector('.notice-text')?.classList.add('hidden');
  document.getElementById('field').classList.add('settled');

  document.querySelectorAll('.charm').forEach(el => {
    if (el.dataset.charm === id) {
      el.classList.add('selected');
      // Move to body immediately so z-index:200 competes at the root level —
      // keeps the charm above the note prompt regardless of whether it's dragged.
      const rect = el.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      document.body.appendChild(el);
      el.style.position   = 'fixed';
      el.style.left       = cx + 'px';
      el.style.top        = cy + 'px';
      el.style.transform  = 'translate(-50%, -50%)';
      el.style.zIndex     = '200';
      el.style.pointerEvents = 'all';
      el.style.cursor     = 'grab';
    } else {
      el.classList.add('receded');
    }
  });

  showDragHint('drag to move');

  const data = getCharmData(id);
  if (data) {
    const tl = document.getElementById('through-line');
    tl.textContent = data.throughline;
    requestAnimationFrame(() => tl.classList.add('visible'));
    setTimeout(() => showScores(data), 600);
  }
}

function showScores(data) {
  const panel   = document.getElementById('score-panel');
  const cluster = document.getElementById('scores-cluster');
  cluster.innerHTML = '';

  const charmEl  = document.getElementById(`charm-${selectedCharm}`);
  const charmPct = charmEl ? {
    x: parseFloat(charmEl.style.getPropertyValue('--x')),
    y: parseFloat(charmEl.style.getPropertyValue('--y')),
  } : { x: 50, y: 50 };

  const isMobile  = window.innerWidth <= 600;
  const scores    = data.scores.slice(0, Math.min(4, data.scores.length));
  const positions = generateCardPositions(scores.length, charmPct);

  scores.forEach((score, i) => {
    const card = document.createElement('div');
    card.className = 'score-card';

    if (isMobile) {
      const rot = (Math.random() * 8 - 4).toFixed(1) + 'deg';
      card.style.setProperty('--rot', rot);
    } else {
      const pos      = positions[i];
      const safeLeft = (15 + i * 20).toFixed(1) + '%';
      card.style.top  = pos ? pos.top  : '40%';
      card.style.left = pos ? pos.left : safeLeft;
      card.style.setProperty('--rot', pos ? pos.rot : ((i % 2 === 0 ? -7 : 7) + 'deg'));
    }

    const bodyHtml    = score.body.map(line => `<p>${line}</p>`).join('');
    const closingHtml = score.closing ? `<p class="score-closing">${score.closing}</p>` : '';
    card.innerHTML = `
      <div class="score-title">${score.title}</div>
      <div class="score-body-text">${bodyHtml}${closingHtml}</div>
      <span class="score-take-hint">tap to take this with you</span>
    `;

    if (isMobile) {
      card.addEventListener('click', () => onScoreTaken(score, card, scores));
    } else {
      makeDraggable(card, () => onScoreTaken(score, card, scores));
    }
    cluster.appendChild(card);
  });

  panel.classList.remove('hidden');

  if (!isMobile) showDragHint('drag to move · tap to take');
}

function onScoreTaken(score, chosenCard, allScores) {
  if (state !== 'selected') return;
  state      = 'taken';
  takenScore = score;

  document.querySelectorAll('.score-card').forEach(el => {
    if (el !== chosenCard) {
      el.style.pointerEvents = 'none';
      el.classList.add('fading');
    }
  });

  hideDragHint();

  document.getElementById('through-line').classList.remove('visible');
  setTimeout(() => showNotePrompt(score), 550);
}

function showNotePrompt(score) {
  const prompt     = document.getElementById('note-prompt');
  const took       = document.getElementById('note-took');
  const promptText = document.getElementById('note-prompt-text');

  took.textContent       = `you took "${score.title}" with you.`;
  promptText.textContent = 'leave something here to cast again — what happened, or what do you think will?';
  prompt.classList.remove('hidden');

  if (window.innerWidth > 600) {
    makeNoteDraggable(prompt);
    showDragHint('drag to move');
  }

  document.getElementById('note-submit').addEventListener('click', submitNote, { once: true });
}

// ── Note ─────────────────────────────────────────────────────────────────────

async function submitNote() {
  const input = document.getElementById('note-input');
  const note  = input.value.trim();
  if (!note) { input.focus(); return; }

  const btn = document.getElementById('note-submit');
  btn.textContent = '...';
  btn.disabled    = true;

  try {
    await saveToGuestbook({ charm_id: selectedCharm, score_title: takenScore.title, note });
  } catch (e) {
    // silent — still proceed
  }

  localStorage.setItem('grimoire_contributed', '1');
  finishCast();
}

function finishCast() {
  document.getElementById('note-prompt').classList.add('hidden');
  document.getElementById('score-panel').classList.add('hidden');

  if (localStorage.getItem('grimoire_contributed')) {
    const nav = document.getElementById('site-nav');
    nav.classList.remove('hidden');
    requestAnimationFrame(() => nav.classList.add('visible'));
  }

  document.getElementById('recast-btn').classList.add('visible');
  state = 'noted';
}

// ── Reset ─────────────────────────────────────────────────────────────────────

function resetField() {
  if (physicsRAF) { cancelAnimationFrame(physicsRAF); physicsRAF = null; }
  physicsObjects = [];

  state         = 'idle';
  selectedCharm = null;
  takenScore    = null;

  document.getElementById('field').classList.remove('settled');

  document.querySelectorAll('.charm').forEach(el => {
    if (el.parentNode === document.body) {
      document.getElementById('field').appendChild(el);
    }
    el.classList.remove('selected', 'receded');
    el.classList.add('landed');
    el.style.position     = '';
    el.style.left         = '';
    el.style.top          = '';
    el.style.transform    = '';
    el.style.zIndex       = '';
    el.style.cursor       = '';
    el.style.pointerEvents = '';
    el.style.transition   = '';
  });

  document.getElementById('through-line').classList.remove('visible');
  document.getElementById('score-panel').classList.add('hidden');

  // Remove any score cards dragged out of the panel into body
  document.querySelectorAll('body > .score-card').forEach(el => el.remove());

  // Reset note prompt (clear any drag-applied inline styles)
  const np = document.getElementById('note-prompt');
  np.classList.add('hidden');
  np.removeAttribute('style');

  document.getElementById('recast-btn').classList.remove('visible');
  document.getElementById('note-input').value = '';
  const btn = document.getElementById('note-submit');
  btn.textContent = 'leave this here';
  btn.disabled    = false;

  const hint = document.getElementById('drag-hint');
  hint.classList.remove('visible');
  hint.classList.add('hidden');

  const notice = document.querySelector('.notice-text');
  if (notice) notice.classList.remove('hidden');
}

// ── Guestbook ────────────────────────────────────────────────────────────────

async function saveToGuestbook(entry) {
  const url = window.SUPABASE_URL;
  const key = window.SUPABASE_ANON_KEY;
  if (!url || url.startsWith('YOUR')) return;

  await fetch(`${url}/rest/v1/guestbook`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(entry),
  });
}

// ── Drag hint ────────────────────────────────────────────────────────────────

function showDragHint(text) {
  const hint = document.getElementById('drag-hint');
  hint.textContent = text;
  hint.classList.remove('hidden');
  requestAnimationFrame(() => hint.classList.add('visible'));
}

function hideDragHint() {
  const hint = document.getElementById('drag-hint');
  hint.classList.remove('visible');
  setTimeout(() => hint.classList.add('hidden'), 700);
}

// ── Field settled callback ───────────────────────────────────────────────────

function onFieldSettled() {
  state = 'idle';
  const notice = document.querySelector('.notice-text');
  if (notice) notice.classList.remove('hidden');
}

// ── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  await loadCharms();
  buildField();

  document.getElementById('recast-btn').addEventListener('click', resetField);

  document.getElementById('cast-trigger').addEventListener('click', () => {
    document.getElementById('cast-trigger').classList.add('hidden');
    document.getElementById('field').classList.add('cast-triggered');
    startPhysicsLoop();
  }, { once: true });

  if (localStorage.getItem('grimoire_contributed')) {
    const nav = document.getElementById('site-nav');
    nav.classList.remove('hidden');
    nav.classList.add('visible');
  }
}

init();
