/* =========================================================
   RANDOMIZER — Cyber Arcade
   Vanilla JS app with animated card / dice / coin / uno /
   surprise mode, history log, sound toggle, and matrix bg.
   ========================================================= */

(() => {
  'use strict';

  // ---------- Helpers ----------
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const rand = (n) => Math.floor(Math.random() * n);
  const pick = (arr) => arr[rand(arr.length)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------- Sound ----------
  const sound = {
    enabled: false,
    ctx: null,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    },
    toggle() {
      this.enabled = !this.enabled;
      if (this.enabled) this.ensure();
      const btn = $('#sound-toggle');
      const lbl = $('#sound-state');
      btn.setAttribute('aria-pressed', String(this.enabled));
      lbl.textContent = this.enabled ? 'ON' : 'OFF';
      if (this.enabled) this.beep(880, 0.07, 'sine', 0.05);
    },
    beep(freq = 660, dur = 0.1, type = 'square', gain = 0.06) {
      if (!this.enabled || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(gain, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
      osc.connect(g).connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + dur);
    },
    sweep(f0, f1, dur = 0.4, type = 'sawtooth', gain = 0.05) {
      if (!this.enabled || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f0, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(f1, this.ctx.currentTime + dur);
      g.gain.setValueAtTime(gain, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
      osc.connect(g).connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + dur);
    },
    shuffle() {
      if (!this.enabled || !this.ctx) return;
      for (let i = 0; i < 6; i++) {
        setTimeout(() => this.beep(220 + rand(400), 0.05, 'square', 0.04), i * 90);
      }
    },
    roll() {
      if (!this.enabled || !this.ctx) return;
      for (let i = 0; i < 8; i++) {
        setTimeout(() => this.beep(440 + rand(600), 0.04, 'triangle', 0.04), i * 110);
      }
    },
    reveal() { this.sweep(220, 1320, 0.35, 'sawtooth', 0.06); },
  };

  // ---------- Tabs ----------
  function showSection(name) {
    $$('.panel').forEach((p) => p.classList.toggle('active', p.id === `section-${name}`));
    $$('.tab').forEach((t) => {
      const on = t.dataset.section === name;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', String(on));
    });
  }
  $$('.tab').forEach((t) => t.addEventListener('click', () => {
    sound.beep(420, 0.05, 'square', 0.04);
    showSection(t.dataset.section);
  }));

  // ---------- History ----------
  const history = {
    list: [],
    add(tag, value) {
      const time = new Date();
      this.list.unshift({ tag, value, time });
      if (this.list.length > 50) this.list.length = 50;
      this.render();
    },
    clear() {
      this.list = [];
      this.render();
    },
    render() {
      const ul = $('#history-list');
      ul.innerHTML = '';
      this.list.forEach(({ tag, value, time }) => {
        const li = document.createElement('li');
        const t = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        li.innerHTML = `
          <span class="hl-time">${t}</span>
          <span class="hl-tag">${tag}</span>
          <span class="hl-val">${value}</span>
        `;
        ul.appendChild(li);
      });
      $('#history-empty').style.display = this.list.length ? 'none' : '';
    },
  };
  $('#history-clear').addEventListener('click', () => {
    sound.beep(220, 0.06, 'square', 0.04);
    history.clear();
  });

  // ---------- Reset ----------
  $('#reset-btn').addEventListener('click', () => {
    sound.sweep(880, 220, 0.3, 'sawtooth', 0.06);
    history.clear();
    // reset cards
    const pc = $('#playing-card');
    pc.classList.remove('flipped', 'shuffling');
    $('#cards-readout .rr-value').textContent = '— —';
    // reset uno
    const uc = $('#uno-card');
    uc.classList.remove('flipped', 'shuffling');
    $('.uc-front').classList.remove('wild');
    $('#uno-readout .rr-value').textContent = '—';
    // reset dice
    const die = $('#die');
    die.classList.remove('rolling');
    die.style.transform = '';
    $('#dice-readout .rr-value').textContent = '—';
    // reset coin
    const coin = $('#coin');
    coin.classList.remove('flipping', 'show-tails');
    coin.style.transform = '';
    $('#coin-readout .rr-value').textContent = '—';
    // reset random
    $('#random-feature').textContent = '—';
    $('#random-result').textContent = '—';
    $('#random-glyph').textContent = '?';
  });

  // ---------- Sound toggle ----------
  $('#sound-toggle').addEventListener('click', () => sound.toggle());

  // ---------- Result helpers ----------
  function flashReadout(readoutEl, text) {
    const v = readoutEl.querySelector('.rr-value');
    v.textContent = text;
    v.classList.remove('flash');
    void v.offsetWidth; // reflow
    v.classList.add('flash');
  }

  // ============================================================
  //                 CARD RANDOMIZER (52-deck)
  // ============================================================
  const SUITS = [
    { sym: '♠', name: 'Spades',   color: 'black' },
    { sym: '♥', name: 'Hearts',   color: 'red'   },
    { sym: '♦', name: 'Diamonds', color: 'red'   },
    { sym: '♣', name: 'Clubs',    color: 'black' },
  ];
  const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  let cardBusy = false;
  async function drawCard() {
    if (cardBusy) return;
    cardBusy = true;
    const pc = $('#playing-card');

    // Show back, then shuffle
    pc.classList.remove('flipped');
    await sleep(80);
    pc.classList.add('shuffling');
    sound.shuffle();
    await sleep(1700);
    pc.classList.remove('shuffling');

    // Pick + populate front
    const suit = pick(SUITS);
    const rank = pick(RANKS);
    const colorClass = suit.color === 'red' ? 'suit-red' : 'suit-black';
    pc.querySelectorAll('.pc-rank').forEach((el) => el.textContent = rank);
    pc.querySelectorAll('.pc-suit').forEach((el) => { el.textContent = suit.sym; el.className = 'pc-suit ' + colorClass; });
    const big = pc.querySelector('.pc-suit-large');
    big.textContent = suit.sym;
    big.className = 'pc-suit-large ' + colorClass;
    pc.querySelectorAll('.pc-rank').forEach((el) => el.classList.add(...colorClass.split(' ')));

    // Flip
    sound.reveal();
    pc.classList.add('flipped');
    await sleep(700);

    const label = `${rank}${suit.sym} ${suit.name}`;
    flashReadout($('#cards-readout'), label);
    history.add('CARD', label);
    cardBusy = false;
    return label;
  }

  // ============================================================
  //                 DICE RANDOMIZER (d6 / d8 / d16)
  // ============================================================
  // selector
  $$('.seg-btn').forEach((seg) => seg.addEventListener('click', () => {
    $$('.seg-btn').forEach((s) => s.classList.remove('active'));
    seg.classList.add('active');
    const die = $('#die');
    die.dataset.shape = `d${seg.dataset.die}`;
    die.style.transform = '';
    sound.beep(620, 0.05, 'square', 0.04);
  }));

  // For d6, end-rotations to land each face up
  const D6_END = {
    1: 'rotateX(0deg) rotateY(0deg)',
    2: 'rotateX(0deg) rotateY(180deg)',
    3: 'rotateX(0deg) rotateY(-90deg)',
    4: 'rotateX(0deg) rotateY(90deg)',
    5: 'rotateX(-90deg) rotateY(0deg)',
    6: 'rotateX(90deg) rotateY(0deg)',
  };

  let diceBusy = false;
  async function rollDice() {
    if (diceBusy) return;
    diceBusy = true;
    const die = $('#die');
    const shape = die.dataset.shape; // d6 / d8 / d16
    const sides = Number(shape.slice(1));
    const result = 1 + rand(sides);

    // animate rolling
    die.style.transition = 'none';
    die.classList.remove('rolling');
    void die.offsetWidth;
    die.style.transform = '';
    sound.roll();

    // For d8 & d16, just animate the single visible face's number rapidly cycling
    let cycleInterval;
    if (shape !== 'd6') {
      const face = die.querySelector('.f1 span');
      cycleInterval = setInterval(() => {
        face.textContent = String(1 + rand(sides));
      }, 70);
    }

    die.classList.add('rolling');
    await sleep(1400);
    die.classList.remove('rolling');

    if (cycleInterval) {
      clearInterval(cycleInterval);
      die.querySelector('.f1 span').textContent = String(result);
    } else {
      // d6 — settle to show correct face
      die.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
      die.style.transform = D6_END[result];
    }

    sound.reveal();
    flashReadout($('#dice-readout'), `${shape.toUpperCase()} → ${result}`);
    history.add(shape.toUpperCase(), String(result));
    await sleep(400);
    diceBusy = false;
    return result;
  }

  // ============================================================
  //                 COIN FLIP
  // ============================================================
  let coinBusy = false;
  async function flipCoin() {
    if (coinBusy) return;
    coinBusy = true;
    const coin = $('#coin');
    coin.classList.remove('show-tails');
    coin.style.transform = '';
    coin.classList.remove('flipping');
    void coin.offsetWidth;

    const heads = Math.random() < 0.5;

    sound.sweep(180, 880, 0.35, 'sine', 0.06);
    coin.classList.add('flipping');
    await sleep(1600);
    coin.classList.remove('flipping');
    coin.style.transition = 'transform 0.4s ease';
    coin.style.transform = heads ? 'rotateY(0deg)' : 'rotateY(180deg)';
    sound.beep(heads ? 880 : 440, 0.18, 'sine', 0.06);

    const label = heads ? 'HEADS' : 'TAILS';
    flashReadout($('#coin-readout'), label);
    history.add('COIN', label);
    await sleep(300);
    coinBusy = false;
    return label;
  }

  // ============================================================
  //                 UNO RANDOMIZER
  // ============================================================
  // 108-card UNO deck composition:
  //  For each color (red/yellow/green/blue):
  //    one "0", two each of 1..9, two each of Skip/Reverse/Draw Two => 25 cards × 4 = 100
  //  Plus 4 Wild + 4 Wild Draw Four = 8 wild cards. Total: 108.
  const UNO_COLORS = [
    { key: 'red',    css: '#ff3860', name: 'RED' },
    { key: 'yellow', css: '#ffe600', name: 'YELLOW' },
    { key: 'green',  css: '#39ff14', name: 'GREEN' },
    { key: 'blue',   css: '#4d7bff', name: 'BLUE' },
  ];
  const UNO_ACTIONS = [
    { sym: '⊘',  name: 'SKIP' },
    { sym: '↺',  name: 'REVERSE' },
    { sym: '+2', name: 'DRAW 2' },
  ];

  function buildUnoDeck() {
    const deck = [];
    UNO_COLORS.forEach((c) => {
      deck.push({ kind: 'number', color: c, value: '0' });
      for (let n = 1; n <= 9; n++) {
        deck.push({ kind: 'number', color: c, value: String(n) });
        deck.push({ kind: 'number', color: c, value: String(n) });
      }
      UNO_ACTIONS.forEach((a) => {
        deck.push({ kind: 'action', color: c, action: a });
        deck.push({ kind: 'action', color: c, action: a });
      });
    });
    for (let i = 0; i < 4; i++) {
      deck.push({ kind: 'wild', value: 'WILD',  sym: '★' });
      deck.push({ kind: 'wild', value: 'WILD+4', sym: '+4' });
    }
    return deck;
  }
  const UNO_DECK = buildUnoDeck();

  let unoBusy = false;
  async function pickUno() {
    if (unoBusy) return;
    unoBusy = true;
    const uc = $('#uno-card');
    uc.classList.remove('flipped');
    await sleep(80);
    uc.classList.add('shuffling');
    sound.shuffle();
    await sleep(1700);
    uc.classList.remove('shuffling');

    const card = pick(UNO_DECK);
    const front = $('.uc-front');
    front.classList.remove('wild');

    let label;
    let symText;
    let cornerText;
    let colorCss = '#222';
    let isSmallSymbol = false;

    if (card.kind === 'wild') {
      front.classList.add('wild');
      symText = card.sym;
      cornerText = card.sym;
      label = card.value;
      isSmallSymbol = card.value === 'WILD+4';
    } else if (card.kind === 'action') {
      colorCss = card.color.css;
      symText = card.action.sym;
      cornerText = card.action.sym;
      label = `${card.color.name} ${card.action.name}`;
      isSmallSymbol = card.action.name === 'DRAW 2';
    } else {
      colorCss = card.color.css;
      symText = card.value;
      cornerText = card.value;
      label = `${card.color.name} ${card.value}`;
    }

    front.style.setProperty('--uno-color', colorCss);
    const symEl = front.querySelector('.uc-symbol');
    symEl.textContent = symText;
    symEl.classList.toggle('small', isSmallSymbol);
    symEl.style.color = card.kind === 'wild' ? '#0a0a14' : colorCss;
    front.querySelectorAll('.uc-corner').forEach((el) => {
      el.textContent = cornerText;
      el.style.color = '#fff';
    });

    sound.reveal();
    uc.classList.add('flipped');
    await sleep(700);

    flashReadout($('#uno-readout'), label);
    history.add('UNO', label);
    unoBusy = false;
    return label;
  }

  // ============================================================
  //                 SURPRISE MODE
  // ============================================================
  const FEATURES = [
    { name: 'CARDS', section: 'cards', glyph: '♠', run: drawCard },
    { name: 'DICE',  section: 'dice',  glyph: '⚄', run: rollDice },
    { name: 'COIN',  section: 'coin',  glyph: '◉', run: flipCoin },
    { name: 'UNO',   section: 'uno',   glyph: '▦', run: pickUno },
  ];

  let surpriseBusy = false;
  async function surprise() {
    if (surpriseBusy) return;
    surpriseBusy = true;

    const glyph = $('#random-glyph');
    const featEl = $('#random-feature');
    const resEl = $('#random-result');

    featEl.textContent = '...';
    resEl.textContent = '...';
    glyph.classList.add('cycling');

    // Cycle through features visually
    sound.shuffle();
    const cycleSyms = ['♠', '⚄', '◉', '▦'];
    let i = 0;
    const interval = setInterval(() => {
      glyph.textContent = cycleSyms[i++ % cycleSyms.length];
    }, 90);
    await sleep(1100);
    clearInterval(interval);
    glyph.classList.remove('cycling');

    const feat = pick(FEATURES);
    glyph.textContent = feat.glyph;
    featEl.textContent = feat.name;
    sound.reveal();

    // Trigger underlying feature
    const result = await feat.run();
    resEl.textContent = String(result);

    history.add('RND', `${feat.name} → ${result}`);
    surpriseBusy = false;
  }

  // ---------- Action wiring ----------
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    sound.ensure();
    const a = btn.dataset.action;
    if (a === 'draw-card')  drawCard();
    else if (a === 'roll-dice') rollDice();
    else if (a === 'flip-coin') flipCoin();
    else if (a === 'pick-uno')  pickUno();
    else if (a === 'surprise')  surprise();
  });

  // ============================================================
  //                 BACKGROUND: MATRIX / NEON GRID
  // ============================================================
  const canvas = $('#bg-canvas');
  const ctx2d = canvas.getContext('2d');
  let W = 0, H = 0, columns = 0, drops = [];
  const FONT_SIZE = 16;
  const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓ0123456789ABCDEFG'.split('');

  function resizeBg() {
    W = canvas.width = window.innerWidth * (window.devicePixelRatio || 1);
    H = canvas.height = window.innerHeight * (window.devicePixelRatio || 1);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    columns = Math.floor(W / (FONT_SIZE * (window.devicePixelRatio || 1)));
    drops = new Array(columns).fill(0).map(() => Math.random() * -50);
  }
  window.addEventListener('resize', resizeBg);
  resizeBg();

  function drawBg() {
    // semi-transparent dark fade
    ctx2d.fillStyle = 'rgba(6, 1, 15, 0.16)';
    ctx2d.fillRect(0, 0, W, H);

    // neon grid lines
    const dpr = window.devicePixelRatio || 1;
    const step = 60 * dpr;
    ctx2d.strokeStyle = 'rgba(162, 89, 255, 0.05)';
    ctx2d.lineWidth = 1;
    for (let x = 0; x < W; x += step) {
      ctx2d.beginPath();
      ctx2d.moveTo(x, 0); ctx2d.lineTo(x, H); ctx2d.stroke();
    }
    for (let y = 0; y < H; y += step) {
      ctx2d.beginPath();
      ctx2d.moveTo(0, y); ctx2d.lineTo(W, y); ctx2d.stroke();
    }

    // matrix rain
    const fs = FONT_SIZE * dpr;
    ctx2d.font = `${fs}px Share Tech Mono, monospace`;
    for (let i = 0; i < drops.length; i++) {
      const ch = CHARS[rand(CHARS.length)];
      const x = i * fs;
      const y = drops[i] * fs;
      // leading glow
      ctx2d.fillStyle = 'rgba(0, 245, 255, 0.85)';
      ctx2d.fillText(ch, x, y);
      ctx2d.fillStyle = 'rgba(57, 255, 20, 0.45)';
      ctx2d.fillText(ch, x, y - fs);

      if (y > H && Math.random() > 0.975) drops[i] = 0;
      drops[i] += 1;
    }
  }
  let lastFrame = 0;
  function loop(ts) {
    if (ts - lastFrame > 60) { drawBg(); lastFrame = ts; }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ============================================================
  //                 CLOCK
  // ============================================================
  function tickClock() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    $('#clock').textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  tickClock();
  setInterval(tickClock, 1000);

  // initial render
  history.render();
})();
