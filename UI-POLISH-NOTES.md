THRIFTY BITE — UI POLISH NOTES

Updated pages:
- frontend/offers.html: default randomized sample offers, weekly picks, monthly specials and festive concepts (including Diwali and Christmas), with category filters and copy-code interaction. Codes are explicitly labelled as demo concepts and are not promised as active checkout discounts.
- frontend/about.html: portfolio-style story page with lightweight CSS 3D plate/orbit animation and responsive feature cards.
- frontend/my-orders.html: burgundy/gold order history and tracking cards, responsive progress display styling; order status still comes from the existing backend API.
- frontend/premium.html: focused Golden Member / gold membership concept page, with no claim that a paid subscription is active.
- frontend/home.html: sidebar membership description refreshed.

Validation performed:
- `node --check` passed for all JavaScript files in backend.
- Inline JavaScript extracted from frontend HTML passed `node --check`.
- Full browser/MongoDB/email/payment end-to-end testing was not performed.
