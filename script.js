(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var NS = 'http://www.w3.org/2000/svg';
  var M = '−';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav ---------- */
  var nav = $('#nav'), burger = $('#burger'), menu = $('#menu');
  function onScroll() { nav.classList.toggle('solid', window.scrollY > 30); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  burger.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    nav.classList.toggle('open', open);
  });
  $$('#menu a').forEach(function (a) { a.addEventListener('click', function () { menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); }); });
  $('#yr').textContent = new Date().getFullYear();

  /* ---------- reveal + count-up ---------- */
  function countUp(el) {
    var end = +el.dataset.count, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / 900);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        var c = $('[data-count]', e.target);
        if (c) countUp(c);
        io.unobserve(e.target);
      });
    }, { threshold: 0.15 });
    $$('.rv').forEach(function (el) { io.observe(el); });
  } else {
    $$('.rv').forEach(function (el) { el.classList.add('in'); });
    $$('[data-count]').forEach(function (el) { el.textContent = el.dataset.count; });
  }

  /* ---------- videos ---------- */
  var hero = $('#heroVideo'), jv = $('#journeyVideo'), jt = $('#journeyToggle');
  if (reduce) hero.pause();
  function watchPlay(video, allowAuto) {
    if (!('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && allowAuto && !video.dataset.off) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
        else video.pause();
      });
    }, { threshold: 0.35 }).observe(video);
  }
  watchPlay(hero, !reduce);
  watchPlay(jv, !reduce);

  var stepEls = $$('#howSteps li');
  var starts = stepEls.map(function (li) { return +li.dataset.t; });
  function setStep(i) { stepEls.forEach(function (li, k) { li.classList.toggle('on', k === i); }); }
  jv.addEventListener('timeupdate', function () {
    var t = jv.currentTime, idx = 0;
    starts.forEach(function (s, k) { if (t >= s - 0.05) idx = k; });
    setStep(idx);
  });
  stepEls.forEach(function (li, i) {
    $('button', li).addEventListener('click', function () {
      jv.currentTime = starts[i] + 0.05; setStep(i);
      var p = jv.play(); if (p && p.catch) p.catch(function () {});
    });
  });
  jv.addEventListener('play', function () { jt.textContent = '❚❚'; });
  jv.addEventListener('pause', function () { jt.textContent = '▶'; });
  jt.addEventListener('click', function () {
    if (jv.paused) { var p = jv.play(); if (p && p.catch) p.catch(function () {}); } else jv.pause();
  });

  /* ---------- real photos (optional) ---------- */
  // Drop truck-1.jpg ... truck-6.jpg (jpg, jpeg, webp or png) into assets/real/ and this gallery appears.
  (function () {
    var figs = $$('#fleetGrid figure'), exts = ['jpg', 'jpeg', 'webp', 'png'];
    function load(i, k) {
      if (k >= exts.length) return;
      var im = new Image();
      im.onload = function () {
        im.alt = 'Refrigerated truck on the road'; im.loading = 'lazy';
        figs[i].appendChild(im); figs[i].hidden = false;
        $('#fleet').hidden = false;
        $$('#fleet .rv').forEach(function (el) { el.classList.add('in'); });
      };
      im.onerror = function () { load(i, k + 1); };
      im.src = 'assets/real/truck-' + (i + 1) + '.' + exts[k];
    }
    figs.forEach(function (_, i) { load(i, 0); });
  })();

  /* ---------- real hero photo (optional) ---------- */
  // Priority: real video (assets/real/hero-truck.mp4) > real photo (assets/real/hero-truck.jpg) > animated clip.
  (function () {
    var photo = $('#heroPhoto'), exts = ['jpg', 'jpeg', 'webp', 'png'], src = null, metaSeen = false, real = false;
    function decide() {
      if (!src || !metaSeen || real) return;
      hero.dataset.off = '1'; hero.pause(); hero.style.display = 'none';
      photo.style.backgroundImage = 'url("' + src + '")'; photo.hidden = false;
    }
    function find(k) {
      if (k >= exts.length) return;
      var im = new Image();
      im.onload = function () { src = im.src; decide(); };
      im.onerror = function () { find(k + 1); };
      im.src = 'assets/real/hero-truck.' + exts[k];
    }
    hero.addEventListener('loadedmetadata', function () { real = /hero-truck/.test(hero.currentSrc); metaSeen = true; decide(); });
    setTimeout(function () { metaSeen = true; decide(); }, 2500);
    find(0);
  })();

  /* ---------- telemetry flow highlight ---------- */
  (function () {
    var nodes = $$('#tflow .tn'), n = 0;
    if (!nodes.length || reduce) return;
    setInterval(function () { nodes.forEach(function (el, k) { el.classList.toggle('lit', k === n); }); n = (n + 1) % nodes.length; }, 900);
  })();

  /* ---------- FTL vs PTL ---------- */
  var modes = {
    ftl: {
      t: 'Phase 1 \u00b7 Full truckload',
      d: 'One booking uses one dedicated reefer. Pricing stays simple: distance, vehicle class and temperature band.',
      l: ['Quote, pay and dispatch in a single booking', 'On-call, dedicated, monthly or annual hiring', 'Several pickup and drop points, labelled A1, A2, B1\u2026', 'Live tracking and temperature proof on every trip'],
      e: 'Example: a dairy books a 4-tonne chilled truck from Bangalore to Chennai.',
      b: [{ c: '#0fa3b1', x: 28, w: 394, t: 'One customer \u00b7 whole truck' }, null, null, null]
    },
    ptl: {
      t: 'Phase 2 \u00b7 Part truckload',
      d: 'Customers book a shipment, not a vehicle. Compatible consignments from several senders share a refrigerated truck on scheduled routes, with hub-and-spoke handling where viable.',
      l: ['Priced by chargeable weight or volume, lane and service level', 'Open to small shippers, from about 5 kg to 50 kg', 'Grouped by lane, departure window, temperature band and compatibility rules', 'Barcode or QR scans at every hub; seal numbers and carton counts recorded', 'Independent tracking and proof of delivery for each shipment'],
      e: 'Example: a small bakery sends 20 kg from Bangalore to Hyderabad, sharing compartment space with compatible cargo.',
      b: [{ c: '#e8789a', x: 28, w: 108, t: 'Bakery 20 kg' }, { c: '#4da3e6', x: 140, w: 98, t: 'Dairy' }, { c: '#f0a43c', x: 242, w: 90, t: 'Sweets' }, { c: '#3fc3a0', x: 336, w: 86, t: 'Cakes' }]
    }
  };
  var blocks = $('#blocks'), bRects = [], bTexts = [];
  for (var bi = 0; bi < 4; bi++) {
    var r = document.createElementNS(NS, 'rect');
    r.setAttribute('y', 42); r.setAttribute('height', 150); r.setAttribute('rx', 8); r.setAttribute('x', 28); r.setAttribute('width', 0);
    var tx = document.createElementNS(NS, 'text');
    tx.setAttribute('y', 122); tx.setAttribute('text-anchor', 'middle');
    blocks.appendChild(r); blocks.appendChild(tx); bRects.push(r); bTexts.push(tx);
  }
  function showMode(k) {
    var m = modes[k];
    $('#modeTitle').textContent = m.t; $('#modeDesc').textContent = m.d; $('#modeEg').textContent = m.e;
    $('#modeList').innerHTML = m.l.map(function (x) { return '<li>' + x + '</li>'; }).join('');
    m.b.forEach(function (b, i) {
      if (b) {
        bRects[i].setAttribute('x', b.x); bRects[i].setAttribute('width', b.w); bRects[i].setAttribute('fill', b.c); bRects[i].style.opacity = 1;
        bTexts[i].setAttribute('x', b.x + b.w / 2); bTexts[i].textContent = b.t; bTexts[i].style.opacity = 1;
      } else {
        bRects[i].setAttribute('width', 0); bRects[i].style.opacity = 0; bTexts[i].style.opacity = 0;
      }
    });
    $$('[data-mode]').forEach(function (b) { b.classList.toggle('on', b.dataset.mode === k); });
  }
  $$('[data-mode]').forEach(function (b) { b.addEventListener('click', function () { showMode(b.dataset.mode); }); });
  showMode('ftl');

  /* ---------- truck zones ---------- */
  var Z = {
    frozen: { n: 'Frozen', r: M + '18 \u00b0C', c: '#a9d4ff', ic: 'i-ice', d: 'Ice cream and frozen food. Meat and seafood are not combined with ice cream, dairy or bakery unless sealed packaging and a separate compartment are validated.' },
    chilled: { n: 'Chilled', r: '2 to 8 \u00b0C', c: '#9ee8d6', ic: 'i-milk', d: 'Dairy and cakes. Vegetarian and Jain foods stay strictly apart from non-veg, and pharma never shares a compartment with commercial foods.' },
    ambient: { n: 'Ambient', r: '15 to 25 \u00b0C', c: '#fbd596', ic: 'i-cake', d: 'Dry bakery supplies. Enables hybrid loads: a food chain can send dry goods and frozen inventory in a single run.' }
  };
  var layouts = { 1: ['frozen'], 2: ['frozen', 'ambient'], 3: ['frozen', 'chilled', 'ambient'] };
  var tsvg = $('#truckSvg'), curLayout = 1, curZone = 0;
  function drawTruck() {
    var zs = layouts[curLayout], x0 = 32, tw = 476, zw = tw / zs.length, h = '';
    h += '<ellipse cx="350" cy="242" rx="320" ry="9" fill="#06121f" opacity=".12"/>';
    h += '<rect x="20" y="30" width="500" height="180" rx="16" fill="#f4fbff" stroke="#0b2f4d" stroke-width="5"/>';
    zs.forEach(function (k, i) {
      var z = Z[k], x = x0 + i * zw;
      h += '<g class="zone ' + (i === curZone ? 'on' : '') + '" data-i="' + i + '"><rect class="zr" x="' + (x + 2) + '" y="42" width="' + (zw - 4) + '" height="156" rx="10" fill="' + z.c + '"/>' +
        '<svg x="' + (x + zw / 2 - 24) + '" y="68" width="48" height="48"><use href="#' + z.ic + '"/></svg>' +
        '<text x="' + (x + zw / 2) + '" y="144" text-anchor="middle" font-family="Sora,Inter,sans-serif" font-weight="800" font-size="19" fill="#0b2f4d">' + z.n + '</text>' +
        '<text x="' + (x + zw / 2) + '" y="168" text-anchor="middle" font-family="Inter,sans-serif" font-weight="600" font-size="15" fill="#12304d">' + z.r + '</text></g>';
      if (i > 0) h += '<rect x="' + (x - 3) + '" y="36" width="6" height="168" fill="#0b2f4d"/>';
    });
    h += '<path d="M530 210V84h74q22 0 32 24l32 58v44z" fill="#12507a"/><path d="M546 98h54q13 0 19 15l20 40h-93z" fill="#bfeaf3"/>';
    h += '<g fill="#0b0e13"><circle cx="110" cy="214" r="24"/><circle cx="176" cy="214" r="24"/><circle cx="600" cy="214" r="24"/></g><g fill="#9db0bd"><circle cx="110" cy="214" r="12"/><circle cx="176" cy="214" r="12"/><circle cx="600" cy="214" r="12"/></g>';
    tsvg.innerHTML = h;
    var z = Z[zs[curZone]];
    $('#zoneInfo').innerHTML = '<b>' + z.n + ' compartment · ' + z.r + '</b><br>' + z.d + '<br><small>Each compartment has its own capacity, temperature range and linked sensor. Bulkheads are movable between trips.</small>';
  }
  tsvg.addEventListener('click', function (e) {
    var g = e.target.closest('.zone'); if (!g) return;
    curZone = +g.getAttribute('data-i'); drawTruck();
  });
  $$('#layoutSeg button').forEach(function (b) {
    b.addEventListener('click', function () {
      curLayout = +b.dataset.l; curZone = 0;
      $$('#layoutSeg button').forEach(function (x) { x.classList.toggle('on', x === b); });
      drawTruck();
    });
  });
  drawTruck();

  /* ---------- compatibility ---------- */
  var cargo = {
    pharma: { n: 'Pharma / medicines', band: 'chilled', nonveg: false, odour: false, sens: true },
    icecream: { n: 'Ice cream', band: 'frozen', nonveg: false, odour: false, sens: true },
    dairy: { n: 'Dairy', band: 'chilled', nonveg: false, odour: false, sens: true },
    cake: { n: 'Cakes', band: 'chilled', nonveg: false, odour: false, sens: true },
    veg: { n: 'Frozen vegetarian / Jain food', band: 'frozen', nonveg: false, odour: false, sens: false },
    meat: { n: 'Meat / poultry', band: 'frozen', nonveg: true, odour: true, sens: false },
    seafood: { n: 'Seafood', band: 'frozen', nonveg: true, odour: true, sens: false },
    dry: { n: 'Dry bakery supplies', band: 'ambient', nonveg: false, odour: false, sens: true }
  };
  var cA = $('#cA'), cB = $('#cB');
  Object.keys(cargo).forEach(function (k) {
    var o = '<option value="' + k + '">' + cargo[k].n + '</option>';
    cA.insertAdjacentHTML('beforeend', o); cB.insertAdjacentHTML('beforeend', o);
  });
  cA.value = 'seafood'; cB.value = 'icecream';
  var ALLERGEN = '<small>Allergens are flagged per consignment. Conflicting allergen loads aren\u2019t combined without an approved policy.</small>';
  function verdict() {
    var ka = cA.value, kb = cB.value, a = cargo[ka], b = cargo[kb], out = $('#verdict'), why = [];
    if (ka === kb) { out.className = 'verdict v-ok'; out.innerHTML = '<b>\u2705 Compatible</b>Same cargo category.<br>' + ALLERGEN; return; }
    if (ka === 'pharma' || kb === 'pharma') { out.className = 'verdict v-no'; out.innerHTML = '<b>\u26D4 Not allowed to share</b>Pharma needs a dedicated compartment or vehicle. It is never shared with commercial foods or odour-producing goods.'; return; }
    if (a.nonveg !== b.nonveg) why.push('Vegetarian and Jain foods are kept strictly separate from non-veg: separate compartments, or separate vehicles for strict dietary or religious needs.');
    if ((a.odour && b.sens) || (b.odour && a.sens)) why.push('Meat and seafood are strong-odour cargo. They are not combined with dairy, bakery or ice cream unless sealed packaging and a separate compartment are validated.');
    if (a.band !== b.band) why.push('Different temperature bands (' + a.band + ' and ' + b.band + '): combined only where the vehicle has validated compartments for each band.');
    if (!why.length) { out.className = 'verdict v-ok'; out.innerHTML = '<b>\u2705 Compatible</b>Same temperature band, no odour or dietary conflict. They can share a compartment.<br>' + ALLERGEN; }
    else { out.className = 'verdict v-warn'; out.innerHTML = '<b>\u26A0\uFE0F Only in separate, validated compartments</b><ul>' + why.map(function (w) { return '<li>' + w + '</li>'; }).join('') + '</ul>' + ALLERGEN; }
  }
  cA.addEventListener('change', verdict); cB.addEventListener('change', verdict); verdict();

  /* ---------- apps ---------- */
  var routeSvg = '<svg viewBox="0 0 260 96" preserveAspectRatio="none"><path d="M20 80 C80 70 90 30 140 40 S220 22 244 16" fill="none" stroke="#0fa3b1" stroke-width="3" stroke-dasharray="5 4"/><circle cx="20" cy="80" r="6" fill="#2b7bd6"/><circle cx="244" cy="16" r="6" fill="#1f9d63"/><circle cx="140" cy="40" r="8" fill="#0b2f4d"/></svg>';
  var apps = {
    customer: {
      t: 'Customer app', d: 'For shippers: book, pay, track and prove delivery from a phone.',
      l: ['OTP login with a verified mobile number, optional business profile', 'Several pickups and drops per booking, with A1, A2, B1 stop labels', 'Cargo form with dietary flags, allergens and prohibited-goods checks', 'Chilled, frozen, ambient or a custom range, validated against the vehicle', 'Itemised quote, with waiting charges and taxes shown separately', 'Live map, ETA, a continuous temperature graph and breach alerts', 'Proof of delivery with handover temperature, invoices, ratings, support and repeat booking'],
      h: '<div class="phone"><div class="scr"><h4>Your quote</h4><div class="mmap">' + routeSvg + '</div>' +
        '<div class="mstop"><i>A1</i><div><b>Whitefield, Bengaluru</b><br><small>Pickup · 6:00 PM</small></div></div>' +
        '<div class="mstop"><i class="g">A2</i><div><b>Central Kitchen, Chennai</b><br><small>Drop · by 6:00 AM</small></div></div>' +
        '<div class="mrow"><span>Reefer truck · 4 T</span><b>₹13,150</b></div><div class="mrow"><span>Frozen surcharge</span><b>₹1,970</b></div><div class="mrow"><span>Tolls (est.)</span><b>₹620</b></div><div class="mrow"><span>Total</span><b>₹16,340</b></div>' +
        '<button class="mbtn">Confirm &amp; pay</button></div></div>'
    },
    driver: {
      t: 'Driver / Owner app', d: 'For owner-drivers, fleet owners and aggregators: get verified, take jobs, run trips.',
      l: ['Driver and owner permissions kept separate, or combined for owner-drivers', 'KYC and hygiene documents with review status and expiry reminders', 'Vehicle and compartment profile, availability calendar and corridors', 'Job offers to accept or decline, with navigation', 'Pre-trip checks, pre-cooling and milestones from pickup to delivery', 'Temperature log or telemetry, alerts, photos and a handover record', 'Background GPS only during active trips, with clear consent', 'Earnings, commission, payout status and downloadable statements'],
      h: '<div class="phone"><div class="scr"><h4>Trip in progress</h4><div class="mtemp">' + M + '18.1 <small>°C</small></div><span class="mchip cg">Door closed</span><span class="mchip cg">Reefer running</span><span class="mchip cb">GPS in sync</span>' +
        '<div class="mmap" style="margin-top:8px">' + routeSvg + '</div>' +
        '<div class="mstop" style="background:#f1faf5"><i class="g">A1</i><div><b>Loaded 6:42 PM</b><br><small>' + M + '18.0 °C</small></div></div>' +
        '<div class="mstop" style="border-color:#0fa3b1"><i>A2</i><div><b>Chennai Central Kitchen</b><br><small>214 km to go</small></div></div>' +
        '<button class="mbtn">Reached destination</button></div></div>'
    },
    admin: {
      t: 'Admin web portal', d: 'For operations and finance: verify partners, allocate trips, watch alerts, set prices and rules.',
      l: ['Dashboard: bookings, revenue, active trips, fleet availability, excursions', 'Verification queues for customers, drivers, fleets, aggregators, vehicles and hygiene certificates', 'Manual allocation, reassignment and escalation', 'Pricing, contract rate cards, and serviceability by city, PIN code, corridor and hub', 'Segregation rules, editable without a software release', 'Live map with stale-GPS and no-signal indicators, plus temperature excursion review', 'Payments, refunds, settlements, support SLAs and reports'],
      h: '<div class="browser"><div class="bb"><i></i><i></i><i></i></div><div class="bd"><div class="sd"><div class="on">Dashboard</div><div>Verification</div><div>Allocation</div><div>Live trips</div><div>Pricing</div><div>Rules</div><div>Payments</div></div>' +
        '<div class="mn"><div class="kp"><div><small>Bookings</small><b>142</b></div><div><small>Active trips</small><b>37</b></div><div><small>Open alerts</small><b style="color:#d64545">3</b></div></div>' +
        '<table class="tb"><tr><th>Booking</th><th>Lane</th><th>Type</th><th>Status</th></tr><tr><td>CR-240318</td><td>BLR→MAA</td><td>FTL</td><td><span class="mchip cb">In transit</span></td></tr><tr><td>CR-240319</td><td>BLR→HYD</td><td>PTL</td><td><span class="mchip cw">Consolidating</span></td></tr><tr><td>CR-240320</td><td>BLR local</td><td>FTL</td><td><span class="mchip cr">Unassigned</span></td></tr><tr><td>CR-240316</td><td>MAA→BLR</td><td>FTL</td><td><span class="mchip cg">Delivered</span></td></tr></table></div></div></div>'
    }
  };
  function showApp(k) {
    var a = apps[k];
    $('#appMock').innerHTML = a.h; $('#appTitle').textContent = a.t; $('#appDesc').textContent = a.d;
    $('#appList').innerHTML = a.l.map(function (x) { return '<li>' + x + '</li>'; }).join('');
    $$('#appTabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.app === k); });
  }
  $$('#appTabs button').forEach(function (b) { b.addEventListener('click', function () { showApp(b.dataset.app); }); });
  showApp('customer');

  /* ---------- pipeline ---------- */
  var pipe = [
    ['Submitted', 'Vendor or aggregator submits profile, vehicles and documents.'],
    ['Document review', 'Registration, permit, insurance, fitness and driver licence are checked.'],
    ['Hygiene check', 'Inspection date, sanitisation history, pest-control certificate and reefer calibration are verified.'],
    ['Admin approval', 'An approver signs off. Every status change is audit-logged with the reviewer’s identity.'],
    ['Activated', 'Now dispatchable. If a hygiene certificate lapses, cold-chain jobs are blocked automatically.']
  ];
  var pSel = 0, pAuto = true, pEl = $('#pipe');
  function drawPipe() {
    pEl.innerHTML = pipe.map(function (p, i) { return '<button data-i="' + i + '" class="' + (i < pSel ? 'd' : i === pSel ? 'on' : '') + '">' + (i < pSel ? '✓ ' : (i + 1) + '. ') + p[0] + '</button>'; }).join('');
    $('#pipeNote').textContent = pipe[pSel][1];
  }
  pEl.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; pAuto = false; pSel = +b.dataset.i; drawPipe(); });
  setInterval(function () { if (pAuto && !reduce) { pSel = (pSel + 1) % pipe.length; drawPipe(); } }, 2600);
  drawPipe();

  /* ---------- live temperature demo ---------- */
  var cv = $('#mChart'), cx = cv.getContext('2d');
  var SET = -18, LIM = -15, N = 70, temp = SET, door = false, fail = false, breach = false, pts = [];
  for (var i = 0; i < N; i++) pts.push(SET);
  var logEl = $('#log');
  function log(msg, cls) {
    var m = $('.muted', logEl); if (m) m.remove();
    var li = document.createElement('li'); li.className = cls || '';
    li.textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' · ' + msg;
    logEl.insertBefore(li, logEl.firstChild);
  }
  function draw() {
    var w = cv.width, h = cv.height, pl = 46, pb = 20, pt = 10, maxT = Math.max(-8, Math.max.apply(null, pts) + 2), minT = -22;
    var Y = function (v) { return pt + (maxT - v) / (maxT - minT) * (h - pt - pb); };
    cx.clearRect(0, 0, w, h); cx.font = '12px Inter,system-ui'; cx.lineWidth = 1;
    for (var v = Math.ceil(minT / 4) * 4; v <= maxT; v += 4) {
      cx.strokeStyle = 'rgba(255,255,255,.08)'; cx.beginPath(); cx.moveTo(pl, Y(v)); cx.lineTo(w, Y(v)); cx.stroke();
      cx.fillStyle = '#8fb0c4'; cx.fillText(v + '°', 8, Y(v) + 4);
    }
    function dash(val, col, lab) {
      cx.save(); cx.setLineDash([6, 5]); cx.strokeStyle = col; cx.lineWidth = 1.5; cx.beginPath(); cx.moveTo(pl, Y(val)); cx.lineTo(w, Y(val)); cx.stroke(); cx.restore();
      cx.fillStyle = col; cx.fillText(lab, w - 70, Y(val) - 5);
    }
    dash(SET, '#33d1e0', 'setpoint'); dash(LIM, '#ff6b6b', 'limit');
    cx.strokeStyle = breach ? '#ff6b6b' : '#5aa9ff'; cx.lineWidth = 2.6; cx.beginPath();
    pts.forEach(function (v, i) { var x = pl + i / (N - 1) * (w - pl); if (i === 0) cx.moveTo(x, Y(v)); else cx.lineTo(x, Y(v)); });
    cx.stroke();
  }
  function state() {
    $('#sDoor').textContent = door ? 'OPEN' : 'Closed'; $('#sDoor').className = door ? 'bad' : 'ok';
    $('#sCool').textContent = fail ? 'FAILED' : 'Running'; $('#sCool').className = fail ? 'bad' : 'ok';
    $('#sStat').textContent = breach ? 'Out of range' : 'In range'; $('#sStat').className = breach ? 'bad' : 'ok';
    $('#bDoor').textContent = door ? 'Close door' : 'Open door';
  }
  function tick() {
    var n = (Math.random() - 0.5) * 0.16;
    if (fail) temp += 0.32 + n; else if (door) temp += 0.24 + n; else temp += (SET - temp) * 0.22 + n;
    temp = Math.min(temp, 6); pts.push(temp); pts.shift();
    $('#mT').textContent = (temp < 0 ? M : '') + Math.abs(temp).toFixed(1);
    if (temp > LIM && !breach) { breach = true; log('CRITICAL: temperature out of range (' + temp.toFixed(1).replace('-', M) + ' °C). Ops, driver and customer notified.', 'crit'); }
    else if (temp <= SET + 1 && breach) { breach = false; log('Resolved: back in range. Excursion kept in the audit trail.', 'info'); }
    state(); draw();
  }
  setInterval(tick, 800);
  $('#bDoor').addEventListener('click', function () { door = !door; log(door ? 'Door opened in transit. Logged with time and stop.' : 'Door closed. Handover temperature: ' + temp.toFixed(1).replace('-', M) + ' °C.', door ? '' : 'info'); state(); });
  $('#bFail').addEventListener('click', function () { if (fail) return; fail = true; log('Reefer cooling unit reported OFF by the telematics device.', 'crit'); state(); });
  $('#bReset').addEventListener('click', function () {
    door = false; fail = false; breach = false; temp = SET; for (var k = 0; k < N; k++) pts[k] = SET;
    logEl.innerHTML = '<li class="muted">Press “Open door” or “Cooling failure”.</li>'; state(); draw();
  });
  state(); draw();

  /* ---------- join form ---------- */
  var form = $('#joinForm'), msg = $('#fMsg');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var nm = $('#fName'), ct = $('#fContact'), ok = true;
    [nm, ct].forEach(function (el) { el.classList.remove('err'); });
    if (!nm.value.trim()) { nm.classList.add('err'); ok = false; }
    var c = ct.value.trim(), digits = c.replace(/\D/g, '');
    if (!(/^\S+@\S+\.\S+$/.test(c) || digits.length >= 8)) { ct.classList.add('err'); ok = false; }
    if (!ok) { msg.className = 'fmsg err'; msg.textContent = 'Please add your name and a valid phone number or email.'; return; }
    var role = ($('input[name=role]:checked', form) || {}).value || 'Shipper';
    msg.className = 'fmsg';
    msg.textContent = 'Thanks, ' + nm.value.trim().split(' ')[0] + '! You’re on the list as a ' + role.toLowerCase() + '. (Demo form: connect it to your CRM or backend to receive sign-ups.)';
    form.reset();
  });
})();
