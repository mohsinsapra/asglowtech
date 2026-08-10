# AS GlowTech

The online shop for **asglowtech.store** — LED bulbs sold by Abdullah Sleem,
cash on delivery, anywhere in Pakistan.

One static page. No framework, no build step, no server. GitHub Pages serves the
files exactly as they are in this repo.

```
index.html            the whole page
assets/css/style.css  design system and layout
assets/js/app.js      catalog, cart, checkout
assets/img/           product photography
assets/logo.svg       the AS bulb mark
CNAME                 asglowtech.store
```

## Changing prices or products

Everything the shop sells lives in one block at the top of
[`assets/js/app.js`](assets/js/app.js):

```js
const CATALOG = [
  { id:'asg-12w-warm', watts:12, name:'12W LED Bulb', temp:'warm',
    tempLabel:'Warm white 3000K', lumens:1055, price:200, replaces:75,
    img:'assets/img/bulb-warm.webp' },
  ...
];

const SPECS    = { fitting:'E27', life:'3–4 years', warranty:'1 year' };
const DELIVERY = { fee:200, freeOver:1500 };
```

Change `price` to change what a bulb costs. `SPECS` sets the lifespan and
warranty shown on every bulb. `DELIVERY.fee` and `DELIVERY.freeOver` set the
delivery charge and the free-delivery threshold. Commit and push — the site
updates in about a minute.

The running-cost comparison in `index.html` (the "What twelve watts saves you"
section) has its figures written out in the markup, so if wattages or the
assumed tariff change, update them there too.

Keep each `id` stable. If you rename an id, anyone with that bulb already in
their cart simply loses that line; nothing breaks.

To swap in real photographs, drop them in `assets/img/` and point `img` at the
new filename. Square images on a dark or black background work best — the page
blends the background away.

## Where orders go

Placing an order does two things, in this order:

1. **WhatsApp** — opens a ready-written message to +92 319 6982388 with the
   bulbs, the total, and the delivery address. This is the real order channel.
2. **Email** — sends the same text to Abdullah's inbox, if a key is configured.

The email is deliberately fire-and-forget. If it fails, or if no key is set,
**WhatsApp still opens**. An order can never be lost to the email service being
down.

### Turning on the email copy

1. Go to [web3forms.com](https://web3forms.com) and enter Abdullah's email
   address. They send an access key back — no account needed.
2. Open `assets/js/app.js` and replace the placeholder:

   ```js
   const WEB3FORMS_KEY = 'PASTE-YOUR-WEB3FORMS-ACCESS-KEY-HERE';
   ```

3. Commit and push.

Until that is done the shop works fine on WhatsApp alone.

## Analytics

Google Analytics (`G-KNWDLZC3M9`) is in the `<head>` of `index.html`.

A completed order also sends a `purchase` event carrying the order reference,
the total, and which bulbs were bought — so GA's reports show what actually
sells, not just page views. The customer's name, phone and address are never
sent to Google. That code is `trackOrder()` in `assets/js/app.js`; delete the
call in `placeOrder()` to turn it off.

## Pointing the domain at the site

`asglowtech.store` uses Loopia's nameservers (`ns1.loopia.se`, `ns2.loopia.se`).
**Leave the nameservers alone** — they are correct. The change goes in Loopia's
DNS record editor, not the nameserver page.

Log in at loopia.se → Mina domäner → asglowtech.store → Hantera DNS, delete the
existing A records (they currently point at `194.9.94.85` and `194.9.94.86`),
and set:

| Type  | Host | Value                 |
| ----- | ---- | --------------------- |
| A     | @    | 185.199.108.153       |
| A     | @    | 185.199.109.153       |
| A     | @    | 185.199.110.153       |
| A     | @    | 185.199.111.153       |
| CNAME | www  | mohsinsapra.github.io |

Then set the custom domain in the repository's Settings → Pages → Custom domain
to `asglowtech.store`, and tick **Enforce HTTPS** once the certificate is issued.

Until that is done the shop is live at
<https://mohsin.se/asglowtech/>.

## Running it locally

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Opening `index.html` straight from the
filesystem also works.
