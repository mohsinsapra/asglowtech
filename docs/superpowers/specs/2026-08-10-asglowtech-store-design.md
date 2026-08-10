# AS GlowTech — Single-Page COD Store

**Date:** 2026-08-10
**Owner:** Abdullah Sleem — +92 319 6982388
**Domain:** asglowtech.store
**Host:** GitHub Pages (`mohsinsapra/asglowtech`, branch `main`, root)

## Purpose

Sell LED bulbs online to customers in Pakistan. The customer browses a catalog,
adds bulbs to a cart, and places a cash-on-delivery order. The order reaches
Abdullah two ways: a pre-filled WhatsApp message and an email.

Success means a customer on a phone can go from landing on the page to a
submitted order in under a minute, and Abdullah receives every order even if the
email service is unavailable.

## Constraints

- GitHub Pages is static hosting. There is no server, no database, no build step.
- Cash on delivery is the only payment method. No payment gateway, no card data.
- The primary audience is on mobile, on Pakistani mobile data. Page weight matters.

## Architecture

One HTML page plus three asset files. No framework, no bundler, no dependencies.

```
index.html            markup and content
assets/css/style.css  design system + layout
assets/js/app.js      catalog data, cart, checkout, order dispatch
assets/img/*.webp     generated product photography
assets/logo.svg       AS monogram bulb mark
CNAME                 asglowtech.store
```

Four independent units inside `app.js`, each with one job:

| Unit | Does | Depends on |
| --- | --- | --- |
| `CATALOG` | Declares products, prices, delivery rules | nothing |
| `cart` | Add/remove/update lines, compute totals, persist | `CATALOG` |
| `ui` | Render grid, drawer, badge, modal; wire events | `cart` |
| `order` | Validate form, build order object, dispatch | `cart` |

`order` knows nothing about the DOM beyond the form it is handed. `cart` knows
nothing about rendering. Prices can change without touching any other unit.

## Data

All merchandising lives in a single commented array at the top of `app.js`:

```js
const CATALOG = [
  { id, name, watts, lumens, temp, price, img, badge }
]
const DELIVERY = { fee, freeOver }
```

Six variants: 9W, 12W, 18W in warm white (3000K) and daylight (6500K).
Prices are placeholders in the Rs 420–950 range; free delivery over Rs 2,000.
These are the only numbers that need editing to go live with real pricing.

Cart state persists to `localStorage` under `asg_cart_v1` as
`[{ id, qty }]` — ids only, never prices. Prices are always re-read from
`CATALOG` on load, so a price change can never be stale in someone's cart.

## Order dispatch

On valid submit:

1. Build order ID `ASG-YYMMDD-NNN` (date + random 3 digits).
2. Build a plain-text order summary: lines, quantities, subtotal, delivery,
   total, customer name, phone, city, address, notes.
3. POST the summary to Web3Forms. **Fire and forget** — not awaited, failure is
   swallowed and logged only.
4. Open `https://wa.me/923196982388?text=<encoded summary>` in a new tab.
5. Clear the cart, show a confirmation panel with the order ID and a tap-to-call
   link.

Step 3 must never be able to block or cancel step 4. The email is a convenience
copy; WhatsApp is the actual order channel. If the Web3Forms access key is unset
(placeholder value), step 3 is skipped entirely without error.

## Error handling

| Case | Behavior |
| --- | --- |
| Empty cart at checkout | Checkout button disabled; drawer shows empty state |
| Invalid/missing form field | Inline message under the field, focus moves to it, submit blocked |
| Phone not a valid PK mobile | Inline message; accepts `03XXXXXXXXX`, `+923XXXXXXXXX`, `00923…`, with spaces or dashes |
| Web3Forms fails or key unset | Silent; WhatsApp still opens |
| Popup blocker stops WhatsApp | Confirmation panel shows a manual "Open WhatsApp" link |
| `localStorage` unavailable | Cart works in memory for the session |

## Accessibility

Cart drawer and checkout modal trap focus, close on Escape, and restore focus to
their trigger. Cart count is an `aria-live` region. All interactive elements are
keyboard reachable with visible focus rings. `prefers-reduced-motion` disables
the glow pulse and slide transitions. Contrast meets AA against the dark canvas.

## Visual design

The product is light, so the page is a dark room the bulbs illuminate. Near-black
canvas, warm amber glow radiating from each product, crisp white type, gold
accent. Large editorial headlines and generous whitespace. Glow intensifies on
hover. The look must not read as a stock e-commerce template.

Sections: sticky header with cart badge → hero → trust strip → product grid →
energy-savings comparison → how COD works + FAQ → footer with tap-to-call.

Logo: an "AS" monogram whose letterforms form the filament inside a bulb
silhouette. Pure SVG, legible at favicon size, works on dark and light.

## Verification

Driven in a real browser before hand-off:

- Add to cart, adjust quantity, remove line — badge and totals stay correct
- Refresh mid-cart — contents survive
- Delivery fee waives above the free threshold
- Submit with a bad phone number — blocked with an inline message
- Submit a valid order — decode the generated WhatsApp URL and confirm every
  line, the total, and the address match the cart and form
- Layout at 390px, 768px, and 1440px
- Keyboard-only pass through drawer and modal

## Deployment

Public repo `asglowtech` under `mohsinsapra`. Pages served from `main` at root.
`CNAME` contains `asglowtech.store`. DNS records handed to the user for their
registrar: four A records to GitHub's apex IPs, plus a `www` CNAME to
`mohsinsapra.github.io`. The site is live on the `github.io` URL immediately and
on the custom domain once DNS propagates.

## Out of scope

Order history, accounts, stock tracking, admin panel, analytics, multi-currency,
returns flow. None of these are needed to take a COD order and none can be built
without a server.

## Open items for the owner

1. Real product names and prices (one-line edit in `CATALOG`).
2. Web3Forms access key from web3forms.com using Abdullah's email — pasted into
   the labeled slot in `app.js`. WhatsApp works without it.
3. DNS records set at the registrar for asglowtech.store.
