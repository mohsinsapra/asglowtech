/* ===========================================================================
   AS GlowTech — catalog, cart, and cash-on-delivery checkout.
   No dependencies. No build step. Runs straight off GitHub Pages.
   =========================================================================== */

/* ─────────────────────────────────────────────────────────────────────────
   1. EDIT THIS BLOCK TO CHANGE WHAT THE SHOP SELLS
      Prices are in Pakistani rupees. `img` files live in assets/img/.
   ───────────────────────────────────────────────────────────────────────── */

const CATALOG = [
  { id:'asg-12w-warm', watts:12, name:'12W LED Bulb', temp:'warm', tempLabel:'Warm white 3000K',
    lumens:1055, price:200, replaces:75,  img:'assets/img/bulb-warm.webp' },

  { id:'asg-12w-day',  watts:12, name:'12W LED Bulb', temp:'day',  tempLabel:'Daylight 6500K',
    lumens:1055, price:200, replaces:75,  img:'assets/img/bulb-day.webp' },

  { id:'asg-18w-warm', watts:18, name:'18W LED Bulb', temp:'warm', tempLabel:'Warm white 3000K',
    lumens:1600, price:400, replaces:100, img:'assets/img/bulb-warm-hi.webp' },

  { id:'asg-18w-day',  watts:18, name:'18W LED Bulb', temp:'day',  tempLabel:'Daylight 6500K',
    lumens:1600, price:400, replaces:100, img:'assets/img/bulb-day-hi.webp' }
];

/* Shown on every bulb. Change here and it changes everywhere on the page. */
const SPECS = { fitting:'E27', life:'3–4 years', warranty:'1 year' };

const DELIVERY = { fee:200, freeOver:1500 };

const WHATSAPP_NUMBER = '923196982388';   // +92 319 6982388, digits only
const SHOP_NAME       = 'AS GlowTech';

/* Optional email copy of each order.
   Get a free key at web3forms.com using Abdullah's email address, then paste it
   below. Orders still reach WhatsApp if this is left as-is. */
const WEB3FORMS_KEY = 'PASTE-YOUR-WEB3FORMS-ACCESS-KEY-HERE';

/* ───────────────────────────────────────────────────────────────────────── */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const byId    = id => CATALOG.find(p => p.id === id);
const money   = n  => 'Rs ' + n.toLocaleString('en-PK');
const glowFor = p  => (p.temp === 'day' ? 'var(--daylight)' : 'var(--filament)');

/* ── cart ───────────────────────────────────────────────────────────────── */

const STORE_KEY = 'asg_cart_v1';

const cart = {
  items: [],                                    // [{ id, qty }] — ids only

  load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
      // drop anything no longer in the catalog so a stale cart can't break
      this.items = raw.filter(i => byId(i.id)).map(i => ({
        id: i.id,
        qty: Math.min(99, Math.max(1, parseInt(i.qty, 10) || 1))
      }));
    } catch { this.items = []; }
  },

  save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(this.items)); } catch {}
  },

  add(id, n = 1) {
    const line = this.items.find(i => i.id === id);
    if (line) line.qty = Math.min(99, line.qty + n);
    else this.items.push({ id, qty: n });
    this.save();
  },

  setQty(id, qty) {
    if (qty <= 0) return this.remove(id);
    const line = this.items.find(i => i.id === id);
    if (line) { line.qty = Math.min(99, qty); this.save(); }
  },

  remove(id) {
    this.items = this.items.filter(i => i.id !== id);
    this.save();
  },

  clear() { this.items = []; this.save(); },

  count() { return this.items.reduce((n, i) => n + i.qty, 0); },

  /* prices are always re-read from CATALOG, never from storage */
  lines() {
    return this.items.map(i => {
      const p = byId(i.id);
      return { ...p, qty: i.qty, total: p.price * i.qty };
    });
  },

  subtotal() { return this.lines().reduce((n, l) => n + l.total, 0); },

  shipping() {
    const sub = this.subtotal();
    return sub === 0 || sub >= DELIVERY.freeOver ? 0 : DELIVERY.fee;
  },

  grand() { return this.subtotal() + this.shipping(); }
};

/* ── rendering ──────────────────────────────────────────────────────────── */

function renderGrid() {
  $('#grid').innerHTML = CATALOG.map(p => `
    <article class="card reveal" style="--glow:${glowFor(p)}">
      <span class="card__lamp" aria-hidden="true"></span>
      <div class="card__shot">
        <span class="tag">${p.temp === 'day' ? 'Daylight' : 'Warm white'}</span>
        <img src="${p.img}" alt="${p.watts}W AS GlowTech LED bulb, ${p.tempLabel}"
             width="900" height="900" loading="lazy" decoding="async">
      </div>
      <div class="card__body">
        <h3 class="card__name">${p.name}</h3>
        <p class="card__swap">Replaces an old ${p.replaces}W bulb</p>
        <p class="card__specs">
          <span>${p.lumens} lm</span><span>${p.tempLabel}</span><span>${SPECS.fitting}</span><span>${SPECS.life}</span>
        </p>
        <div class="card__buy">
          <span class="card__price">${money(p.price)}</span>
          <button class="card__add" type="button" data-add="${p.id}">Add to cart</button>
        </div>
      </div>
    </article>`).join('');
}

function renderCart() {
  const lines = cart.lines();
  const body  = $('#cartBody');
  const foot  = $('#cartFoot');

  if (!lines.length) {
    body.innerHTML = `
      <div class="empty">
        <strong>Your cart is empty</strong>
        <p>Pick a wattage and a colour of light.</p>
      </div>`;
    foot.hidden = true;
  } else {
    body.innerHTML = lines.map(l => `
      <div class="line">
        <div class="line__shot"><img src="${l.img}" alt="" width="64" height="64"></div>
        <div>
          <p class="line__name">${l.name}</p>
          <p class="line__meta">${l.tempLabel} · ${money(l.price)} each</p>
          <div class="line__row">
            <span class="qty">
              <button type="button" data-dec="${l.id}" aria-label="One fewer ${l.watts}W ${l.tempLabel}">−</button>
              <span>${l.qty}</span>
              <button type="button" data-inc="${l.id}" aria-label="One more ${l.watts}W ${l.tempLabel}">+</button>
            </span>
            <span class="line__price">${money(l.total)}</span>
          </div>
        </div>
      </div>`).join('');
    foot.hidden = false;

    const ship = cart.shipping();
    $('#tSub').textContent   = money(cart.subtotal());
    $('#tShip').textContent  = ship === 0 ? 'Free' : money(ship);
    $('#tGrand').textContent = money(cart.grand());
    $('#shipNote').textContent = ship === 0
      ? 'Delivery is on us. You pay cash when the bulbs arrive.'
      : `Add ${money(DELIVERY.freeOver - cart.subtotal())} more for free delivery.`;
  }

  const n     = cart.count();
  const badge = $('#cartCount');
  badge.textContent = n;
  badge.hidden = n === 0;
}

function renderReview() {
  const lines = cart.lines();
  $('#review').innerHTML =
    lines.map(l => `<p class="review__l"><span>${l.qty} × ${l.watts}W ${l.temp === 'day' ? 'Daylight' : 'Warm'}</span><span>${money(l.total)}</span></p>`).join('') +
    `<p class="review__l"><span>Delivery</span><span>${cart.shipping() === 0 ? 'Free' : money(cart.shipping())}</span></p>` +
    `<p class="review__t"><span>Pay on delivery</span><span>${money(cart.grand())}</span></p>`;
}

/* ── overlays: drawer + modal, each trapping focus ──────────────────────── */

const FOCUSABLE = 'a[href],button:not([disabled]),input,textarea,select,summary,[tabindex]:not([tabindex="-1"])';
let lastFocus = null;

function trap(e, panel) {
  if (e.key !== 'Tab') return;
  const items = $$(FOCUSABLE, panel).filter(el => el.offsetParent !== null);
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

function openPanel(panel, firstFocus) {
  lastFocus = document.activeElement;
  $('#scrim').hidden = false;
  panel.hidden = false;
  document.body.classList.add('is-locked');
  requestAnimationFrame(() => {
    $('#scrim').classList.add('is-on');
    panel.classList.add('is-on');
    (firstFocus || $$(FOCUSABLE, panel)[0])?.focus();
  });
}

function closePanel(panel) {
  panel.classList.remove('is-on');
  $('#scrim').classList.remove('is-on');
  document.body.classList.remove('is-locked');
  setTimeout(() => {
    panel.hidden = true;
    if (!$('#drawer').classList.contains('is-on') && !$('#modal').classList.contains('is-on')) {
      $('#scrim').hidden = true;
    }
  }, 340);
  lastFocus?.focus();
}

const openCart  = () => { renderCart(); openPanel($('#drawer'), $('#cartClose')); };
const closeCart = () => closePanel($('#drawer'));

function openCheckout() {
  if (!cart.count()) return;
  $('#orderForm').hidden = false;
  $('#done').hidden = true;
  $('#modalTitle').textContent = 'Where should we deliver?';
  renderReview();
  openPanel($('#modal'), $('#fName'));
}
const closeCheckout = () => closePanel($('#modal'));

/* ── validation ─────────────────────────────────────────────────────────── */

/* Accepts 03XXXXXXXXX, +923XXXXXXXXX, 00923…, 923…, with spaces or dashes.
   Returns a normalised 03XXXXXXXXX string, or null. */
function normalisePhone(raw) {
  let d = String(raw).replace(/[^\d+]/g, '').replace(/^\+/, '');
  if (d.startsWith('0092')) d = d.slice(4);
  else if (d.startsWith('92')) d = d.slice(2);
  else if (d.startsWith('0'))  d = d.slice(1);
  return /^3\d{9}$/.test(d) ? '0' + d : null;
}

const CHECKS = [
  { input:'#fName',  err:'#eName',
    test: v => v.trim().length >= 3,
    msg: 'Please enter the name the rider should ask for.' },
  { input:'#fPhone', err:'#ePhone',
    test: v => normalisePhone(v) !== null,
    msg: 'Enter a Pakistani mobile number, like 0300 1234567.' },
  { input:'#fCity',  err:'#eCity',
    test: v => v.trim().length >= 2,
    msg: 'Which city are we delivering to?' },
  { input:'#fAddr',  err:'#eAddr',
    test: v => v.trim().length >= 10,
    msg: 'Add the house or shop number and the street, so the rider can find you.' }
];

function validate() {
  let firstBad = null;

  CHECKS.forEach(c => {
    const input = $(c.input), err = $(c.err);
    const ok = c.test(input.value);
    input.closest('.field').classList.toggle('is-bad', !ok);
    err.textContent = ok ? '' : c.msg;
    err.hidden = ok;
    if (!ok && !firstBad) firstBad = input;
  });

  if (firstBad) { firstBad.focus(); return null; }

  return {
    name:  $('#fName').value.trim(),
    phone: normalisePhone($('#fPhone').value),
    city:  $('#fCity').value.trim(),
    addr:  $('#fAddr').value.trim(),
    note:  $('#fNote').value.trim()
  };
}

/* ── the order ──────────────────────────────────────────────────────────── */

function orderId() {
  const d = new Date();
  const stamp = String(d.getFullYear()).slice(2)
              + String(d.getMonth() + 1).padStart(2, '0')
              + String(d.getDate()).padStart(2, '0');
  return `ASG-${stamp}-${Math.floor(100 + Math.random() * 900)}`;
}

function orderText(id, who) {
  const ship = cart.shipping();
  const rows = cart.lines()
    .map(l => `• ${l.qty} × ${l.watts}W ${l.tempLabel} — ${money(l.total)}`)
    .join('\n');

  return [
    `NEW ORDER — ${SHOP_NAME}`,
    `Ref ${id}`,
    '',
    rows,
    '',
    `Subtotal: ${money(cart.subtotal())}`,
    `Delivery: ${ship === 0 ? 'Free' : money(ship)}`,
    `TOTAL TO COLLECT: ${money(cart.grand())} (cash on delivery)`,
    '',
    `Name: ${who.name}`,
    `Phone: ${who.phone}`,
    `City: ${who.city}`,
    `Address: ${who.addr}`,
    who.note ? `Note: ${who.note}` : null
  ].filter(l => l !== null).join('\n');
}

/* Fire-and-forget email copy. Never blocks or cancels the WhatsApp handoff. */
function emailOrder(id, who, text) {
  if (!WEB3FORMS_KEY || WEB3FORMS_KEY.includes('PASTE')) return;
  fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      access_key: WEB3FORMS_KEY,
      subject: `New order ${id} — ${money(cart.grand())} COD`,
      from_name: SHOP_NAME,
      name: who.name,
      phone: who.phone,
      city: who.city,
      address: who.addr,
      message: text
    })
  }).catch(err => console.warn('Order email did not send:', err));
}

function waLink(text) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

/* Reports a completed order to Google Analytics, so the shop can see which
   bulbs actually sell. Silently does nothing if the tag is blocked or absent.
   Customer name, phone and address are never sent. */
function trackOrder(id, total) {
  if (typeof gtag !== 'function') return;
  gtag('event', 'purchase', {
    transaction_id: id,
    value: total,
    currency: 'PKR',
    items: cart.lines().map(l => ({
      item_id: l.id,
      item_name: `${l.watts}W ${l.tempLabel}`,
      price: l.price,
      quantity: l.qty
    }))
  });
}

function placeOrder(e) {
  e.preventDefault();
  const who = validate();
  if (!who || !cart.count()) return;

  const id   = orderId();
  const text = orderText(id, who);
  const link = waLink(text);

  trackOrder(id, cart.grand());       // must run before the cart is cleared
  emailOrder(id, who, text);          // deliberately not awaited
  const tab = window.open(link, '_blank', 'noopener');

  cart.clear();
  renderCart();

  $('#doneId').textContent = id;
  $('#doneWa').href = link;
  $('#orderForm').hidden = true;
  $('#done').hidden = false;
  $('#modalTitle').textContent = 'Order confirmation';
  $('#live').textContent = `Order ${id} sent.`;
  $('#modal').querySelector('.modal__card').scrollTop = 0;

  // if a popup blocker ate the tab, the button in the panel is the way through
  if (!tab) $('#doneWa').focus();
}

/* ── scroll behaviour: the rail, the header, the reveals ────────────────── */

function initScroll() {
  const rail = $('.rail');
  const head = $('.head');
  let ticking = false;

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const span = document.documentElement.scrollHeight - window.innerHeight;
      const pct  = span > 0 ? Math.min(100, (window.scrollY / span) * 100) : 0;
      rail.style.setProperty('--lit', pct.toFixed(2) + '%');
      head.classList.toggle('is-stuck', window.scrollY > 12);
      ticking = false;
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  $$('.reveal').forEach(el => io.observe(el));
}

/* ── wiring ─────────────────────────────────────────────────────────────── */

function init() {
  cart.load();
  renderGrid();
  renderCart();

  $('#year').textContent = new Date().getFullYear();

  const hello = `Hello ${SHOP_NAME}, I'd like to ask about your LED bulbs.`;
  $('#heroWa').href = waLink(hello);
  $('#footWa').href = waLink(hello);

  // add to cart (delegated, so it survives a re-render)
  $('#grid').addEventListener('click', e => {
    const btn = e.target.closest('[data-add]');
    if (!btn) return;
    cart.add(btn.dataset.add);
    renderCart();

    btn.textContent = 'Added';
    btn.classList.add('is-added');
    setTimeout(() => { btn.textContent = 'Add to cart'; btn.classList.remove('is-added'); }, 1100);

    const badge = $('#cartCount');
    badge.classList.remove('is-bump');
    void badge.offsetWidth;                    // restart the animation
    badge.classList.add('is-bump');

    $('#live').textContent = `${byId(btn.dataset.add).watts}W bulb added. Cart has ${cart.count()}.`;
  });

  // quantity controls inside the drawer
  $('#cartBody').addEventListener('click', e => {
    const inc = e.target.closest('[data-inc]');
    const dec = e.target.closest('[data-dec]');
    if (!inc && !dec) return;
    const id = (inc || dec).dataset.inc || (inc || dec).dataset.dec;
    const line = cart.items.find(i => i.id === id);
    cart.setQty(id, (line ? line.qty : 0) + (inc ? 1 : -1));
    renderCart();
  });

  $('#cartOpen').addEventListener('click', openCart);
  $('#cartClose').addEventListener('click', closeCart);
  $('#toCheckout').addEventListener('click', () => { closeCart(); setTimeout(openCheckout, 200); });
  $('#modalClose').addEventListener('click', closeCheckout);
  $('#doneClose').addEventListener('click', closeCheckout);
  $('#orderForm').addEventListener('submit', placeOrder);

  $('#scrim').addEventListener('click', () => {
    if ($('#modal').classList.contains('is-on')) closeCheckout();
    else if ($('#drawer').classList.contains('is-on')) closeCart();
  });

  document.addEventListener('keydown', e => {
    const modal  = $('#modal'), drawer = $('#drawer');
    const onTop  = modal.classList.contains('is-on') ? modal
                 : drawer.classList.contains('is-on') ? drawer : null;
    if (!onTop) return;
    if (e.key === 'Escape') { onTop === modal ? closeCheckout() : closeCart(); return; }
    trap(e, onTop);
  });

  // clear a field's error as soon as it is put right
  CHECKS.forEach(c => {
    $(c.input).addEventListener('input', () => {
      const input = $(c.input);
      if (input.closest('.field').classList.contains('is-bad') && c.test(input.value)) {
        input.closest('.field').classList.remove('is-bad');
        $(c.err).hidden = true;
      }
    });
  });

  initScroll();
}

document.addEventListener('DOMContentLoaded', init);
