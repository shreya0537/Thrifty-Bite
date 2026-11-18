# Smart Food Delivery and Custom Chef Ordering System with Group Bill Splitting

Formerly a single-restaurant ordering app ("Thrifty Bite"). This document tracks the
updated project scope (customer / restaurant / master chef roles, custom chef orders,
friends, group orders, bill splitting, admin) and what has actually been built.

Scope source: `Food_Delivery_App_II.pdf`.

## 0. Beyond the PDF: customer account features

Not part of the PDF's 10 modules, but built to make `profile.html`'s "Account
Services" grid fully real (it previously linked to pages that didn't exist):

- **Edit Profile** — `profile.html` now has a real modal (name/mobile/address) wired
  to a new `PUT /api/profile`. Also fixed a display bug where the phone number never
  showed because the frontend read `user.phone` while the backend field is `mobile`.
- **Account Settings** (`settings.html`) — change password, via a new
  `PUT /api/profile/password`.
- **Favourites** (`favourites.html`) — save/remove menu items via a heart toggle on
  every dish card in `menu.html`; `models/favourite.js` + `routes/favouriteRoutes.js`.
- **Royal Rewards** (`rewards.html`) — 1 point per ₹10 spent, auto-awarded when a
  restaurant marks a normal order `COMPLETED` or a custom order payment succeeds;
  `models/rewardTransaction.js` + `routes/rewardRoutes.js` +
  `utils/awardRewardPoints.js`.
- **Payment Methods** (`payment.html`) — saved UPI IDs / card labels for convenience.
  Consistent with the rest of the project's mock-payment approach: only a label and a
  card's last 4 digits are ever stored, never a full card number (`400` if a client
  tries to submit anything else); `models/paymentMethod.js` +
  `routes/paymentMethodRoutes.js`.
- `profile.html`'s "My Orders" card was pointed at the real `my-orders.html` (it
  previously linked to a nonexistent `orders.html`).
- **Profile picture upload** — a camera-icon button on the avatar in `profile.html`
  opens a file picker (JPG/PNG/WEBP, 2MB limit enforced both client- and server-side);
  uploads go through `multer` (new dependency) to `POST /api/profile/avatar`
  (`multipart/form-data`), stored on disk at `backend/uploads/avatars/` and served
  statically at `/uploads/avatars/...`. Replacing or removing (`DELETE
  /api/profile/avatar`) a photo deletes the old file from disk so uploads don't
  accumulate. `models/user.js` gained an `avatar` field (path string). This resolves
  part of the "no real file upload" gap noted below — menu items and custom-order
  reference images still use plain URL strings, only the avatar has real upload.

## 0a. Also fixed along the way: voice ordering, and more broken images/links

- **`voice.html`** was completely non-functional: it POSTed to a `/api/orders/voice`
  endpoint that never existed, checked `localStorage.getItem("token")` instead of the
  real key `"thriftyBiteToken"` (so it would tell an already-logged-in user to log in
  again), and its "cart"/confirm redirect pointed at `"order now.html"` (a file with a
  space in the name that never existed). Rebuilt it around a new
  `POST /api/menu/voice-match` (`utils/voiceOrderMatcher.js`) that parses quantities
  ("2", "three", "a") and phrases out of the spoken transcript and matches them against
  the real live menu by name/tag overlap; matched items are shown with an editable
  quantity and an "Add to Cart" button that feeds the same `localStorage` cart used by
  `menu.html`/`checkout.html`. Also fixed a dead `blog-single.html` nav link → `blog.html`.
- `home.html`'s "Voice Ordering" feature card linked to `voice-order.html` (doesn't
  exist; the real file is `voice.html`) with a broken image.
- `home.html`'s hero section image used a hard-coded absolute path from the original
  developer's machine (`C:\Users\LIVYA DHARSHINI\...`) — same bug pattern as the logo,
  fixed to the real local `dashbrd.jpeg.png` that was already sitting in `frontend/`.
- The Smart Cart / Meal Budget feature cards had the same broken-image problem — fixed
  with generated SVGs in the same style as the menu-category icons and the new voice
  icon (`frontend/images/smart-cart.svg`, `budget-meal.svg`).
- `help.html` has one more instance of the same hard-coded-path bug (line ~1586,
  `image2.jpeg`) — left alone since that file doesn't exist anywhere in the project and
  it's a different page than what's been asked about so far.

## 0b. Critical fix: inline `onclick` handlers silently failing app-wide

**Symptom**: "Place Order" did nothing on `checkout.html`. Reproduced in a real
headless Chrome (Playwright, driven against the actual dev server, not just code
review — `foodish-api.com`-style guessing wasn't good enough here) and caught the
real error: `Uncaught ReferenceError: placeOrder is not defined`.

**Root cause**: every dashboard-style page follows the pattern
`const user = requireAuth([...]); if(user){ function placeOrder(){...} ... }` —
declaring functions *inside* the `if` block, then referencing them from inline
`onclick="placeOrder(...)"` HTML attributes. Inline event-handler attributes resolve
function names in the **global** scope. Function declarations inside a block are not
reliably promoted to global scope across browsers/cases (the legacy "Annex B" fallback
that sometimes does this isn't something to depend on) — so the lookup failed and the
click did nothing, with the real error visible only in the browser console, never on
screen. This was never caught earlier because every prior verification pass was
`curl`/API-level (correct endpoints, correct data shapes) — none of it exercises
actual inline-`onclick` dispatch the way a real click in a real DOM does.

**Scope**: scripted a scan (function declared inside indentation vs. referenced by an
`onclick`/`onchange`/`onsubmit` attribute, including ones built dynamically via JS
string concatenation with escaped quotes) across every frontend page. Found **28
affected functions across 10 files**:

`admin-dashboard.html` (toggleActive) · `checkout.html` (selectAddress, placeOrder) ·
`chef-dashboard.html` (acceptRequest, rejectRequest, showProposalForm, sendProposal,
advanceOrder) · `custom-order-detail.html` (confirmAndPay, rejectProposal) ·
`favourites.html` (addFavouriteToCart, removeFavourite) · `friends.html`
(searchUsers, sendRequest, respondRequest) · `group-order-detail.html` (updateStatus,
recordBillSplit, settlePayment) · `group-order.html` (submitNormalGroupOrder,
submitCustomGroupOrder, setQty) · `payment.html` (setDefault, removeMethod) ·
`restaurant-dashboard.html` (deleteCategory, editMenuItem, toggleMenuAvailability,
deleteMenuItem, updateOrderStatus).

**Fix**: every affected declaration changed from `function name(...)` to
`window.name = function name(...)`, an explicit global assignment that doesn't depend
on block-scoping edge cases. Applied by script for precision across all 28 call sites
(hand-editing 28 near-identical one-line changes invites transcription errors), then
verified: syntax-checked all 10 files, and re-ran the exact Playwright reproduction —
confirmed `placeOrder` no longer throws, then drove the *entire* checkout flow for
real (typed a new address into the form, saved it, clicked Place Order) and confirmed
via `GET /api/order/my` that a real order landed with `status: "PLACED"`. Also
spot-verified `friends.html`'s `searchUsers` (a different file, different fix
instance) the same way — real click, real search results, zero console errors.

**Process note for future sessions**: this required a real browser, not just `curl`.
The built-in browser tool can't reach `localhost` servers started by Claude's own
shell. `chromium-cli` wasn't installed. Playwright's own bundled-Chromium download
timed out against its CDN. What worked: `npm install playwright-core` (no browser
download) and launching it against the machine's already-installed
`C:/Program Files/Google/Chrome/Application/chrome.exe` via `executablePath`. Worth
turning into a proper project skill (`/run-skill-generator`) if UI testing like this
comes up again, so the next session doesn't have to rediscover the same path.

## 0c. Meal Budget page

The third home-page feature card (`home.html`) had no real page behind it —
`meal-budget.html` didn't exist. Built it:

- **`frontend/meal-budget.html`** — enter a ₹ budget and optionally filter veg/non-veg.
  Client-side only (reuses `GET /api/menu/all`, same pattern as `menu.html` — no new
  backend route needed): shows every dish at or under budget (top 24 by rating), plus
  up to 3 **suggested meal combos** (main + drink + dessert, each within budget, no
  dish repeated across combos), with an "Add Combo to Cart" button that adds all of a
  combo's items to the same `localStorage` cart the rest of the app uses.
- **Real bug caught before shipping**: the first version of the combo-builder picked
  the highest-*rated* main course first with no price discipline — which is almost
  always an expensive "Royal/Signature" dish, so it ate the entire budget and left
  nothing for a drink or dessert. Every "combo" came back as a single item, defeating
  the point of the feature. Caught this with a real browser test
  (`₹300 budget → Combo 1: just "Royal Cheese Pizza ₹269"`, twice more), not by reading
  the code — fixed by capping the main course at 65% of budget and the drink at 25%,
  leaving real room for a full combo. Re-verified the same way:
  `₹300 → Masala Dosa + Filter Coffee + Gulab Jamun = ₹247`, three different combos,
  no repeated dishes.
- Verified both "Add Combo to Cart" (3 items landed) and individual "Add to Cart" (1
  item landed) against the real `localStorage` cart, and confirmed only the harmless
  favicon 404 in the console — no scoping bugs (see §0b): this page has no
  `if(user){...}` gate, so every function is declared at the true top level and is
  safe to reference from inline `onclick` without the `window.name =` workaround.

## 1. User roles

| Role | Signup | Notes |
|---|---|---|
| Customer | Self-registration | Default role when `role` is omitted at signup |
| Restaurant | Self-registration (`role: RESTAURANT`) | Requires `name` (restaurant name) + `ownerName` |
| Master Chef | Self-registration (`role: MASTER_CHEF`) | Optional `specialization` / `experience` at signup |
| Admin | **Not self-registerable** | Bootstrap with `node backend/seedAdmin.js <email> <password> [name]` |

`register.html` now has the account-type selector from PDF §3 (Customer / Restaurant /
Master Chef pill buttons that swap the visible fields). JWTs embed `role`;
`middleware/roleMiddleware.js` gates role-specific API routes, and `assets/api.js`'s
`requireAuth([...roles])` gates frontend pages the same way.

## 2. Module status

All 10 modules from PDF §18 are now built end-to-end (backend + frontend) and
smoke-tested against the live database.

| # | Module (PDF §18) | Backend | Frontend |
|---|---|---|---|
| 1 | Authentication | ✅ `routes/authRoutes.js` | ✅ `register.html` (role selector), `login.html` (role-based redirect) |
| 2 | Restaurant Management | ✅ `routes/restaurantRoutes.js` | ✅ `restaurant-dashboard.html` (profile/categories/menu/orders tabs, menu thumbnails) |
| 3 | Food Browsing | ✅ `routes/menuRoutes.js` (+ `GET /api/menu/restaurants`) | ✅ `menu.html` (all-restaurant grid), `restaurants.html` → `restaurant-menu.html` (restaurant-first browsing) |
| 4 | Cart & Normal Orders | ✅ `routes/orderRoutes.js`, `models/order.js` | ✅ `cart.html` (localStorage cart) → `checkout.html` (address + payment, places real orders) → `my-orders.html` (order history) |
| 5 | Master Chef | ✅ `routes/chefRoutes.js` | ✅ `chef-dashboard.html` (profile/requests/orders tabs) |
| 6 | Custom Orders | ✅ `routes/customOrderRoutes.js` (+ `GET /chefs` picker) | ✅ `custom-order.html` (request form + optional chef picker + list), `custom-order-detail.html` (proposal, confirm & pay, timeline) |
| 7 | Friends | ✅ `routes/friendRoutes.js` | ✅ `friends.html` |
| 8 | Group Orders | ✅ `routes/groupOrderRoutes.js` | ✅ `group-order.html` (create normal/custom), `group-order-detail.html` |
| 9 | Bill Split | ✅ `routes/billSplitRoutes.js` | ✅ built into `group-order-detail.html` (record split, settlement, mark settled) |
| 10 | Admin | ✅ `routes/adminRoutes.js` | ✅ `admin-dashboard.html` (users, orders, custom orders, reports) |

Menu items now have pictures — see §3. All hard-coded `localhost:5500` references
across the frontend were switched to `window.location.origin` so the app no longer
breaks if the port ever changes again.

🟡 **Remaining gaps (deliberately out of scope):**
- No real file upload for menu images or custom-order `referenceImage` — both are
  still plain string (URL) fields. Only the profile picture (§0) got real `multer`
  file upload; the same pattern could be extended to these if wanted.
- No real payment gateway — `custom-orders/:id/payment` and checkout are mock/manual,
  per the PDF's explicit scope note (§10).
- `blog.html`'s like/save buttons call `/api/blogs/...` endpoints that were never part
  of the PDF scope and don't exist — this is a pre-existing, unrelated stub, left as-is.
- `help.html` still has one broken hard-coded local image path (see §0a) — not fixed
  since the referenced file doesn't exist anywhere in the project.

## 3. Menu pictures

Three passes here, each fixing a real problem found in the previous one:

**Pass 1 — one icon per category.** Meant every item within a category looked
identical (e.g. all 18 Beverages showed the exact same cup image).

**Pass 2 — one generated icon per dish.** `backend/utils/foodIcon.js`'s
`getFoodIcon(name, category)` matches ~70 keyword phrases (most-specific-first, e.g.
"biryani" before the generic "chicken" fallback) to a representative emoji, plus a
deterministic color from a 10-pair maroon/gold palette hashed from the name. This
layer is still live and matters: `GET /api/menu/icon?name=&category=` generates the
same SVG on the fly from just a name + category (day-long cache header), and
`routes/restaurantRoutes.js`'s add/edit-menu-item handlers default a blank `image`
field to it. **This is what makes picture coverage durable beyond the 180 seeded
dishes** — any item a restaurant adds later, today or in year 3, still gets a
relevant, distinct picture instead of one generic placeholder. No external URLs, no
broken-link risk, works offline.

**Pass 3 — real photos for the 180 seeded dishes**, per explicit request:

- **`backend/fetch-dish-photos.js`** (one-off, re-runnable script) searches
  **Wikimedia Commons** (chosen over `foodish-api.com`, a common free food-image API,
  which was returning HTTP 503 — down — when checked; Commons is Wikimedia
  Foundation infrastructure, far more durable) for each dish name, verifies the
  license/mime/file-size of candidates, and writes a `{ dishName: photoUrl }` map to
  `dish-photos.json`. `seedMenu.js` reads that file and uses it as each item's
  `image`, falling back to the generated icon (Pass 2) for anything unmatched.
- **Quality gate, added after a real bug was caught**: the first full run blindly
  trusted Commons' search ranking and accepted the first not-yet-used result even from
  a generic category-level fallback query. That produced wrong matches — e.g. "Chicken
  Frankie" (an Indian roll) matched a photo titled "Chickens in market" (live poultry),
  and "Cheese Paneer Wrap" matched a plate of profiteroles. Fixed by requiring every
  accepted candidate's *own* Commons title to share a real word with the *specific dish
  name* (not just the query used to find it), rejecting titles containing red-flag
  context words (`market`, `farm`, `live`, `supermarket`, `raw ingredient`, etc.), and
  auditing all matches (twice) with that same logic before trusting them. Net result:
  **177/180 real, verified, relevant photos**; the 3 that still couldn't find a clean
  match (`Cheese Paneer Wrap`, `Chicken Frankie`, `Paneer Roll`) use the Pass 2
  generated icon instead of a wrong photo.
- **Rate limiting**: Commons returns HTTP 429 under sustained anonymous traffic. The
  script respects `Retry-After`, paces requests, and is safely re-runnable (skips
  dishes already in `dish-photos.json`), which is how the 180-dish run was actually
  completed — in batches, backing off each time the API asked it to.
- **Licensing note**: Commons files carry their own individual licenses (mostly
  Creative Commons variants — CC-BY-SA, CC-BY, or public domain/CC0). Hotlinking
  Commons media is permitted, but strict compliance for a real deployment would mean
  showing each photo's attribution/license (not automated here — this is a college
  project demo, not a production app). Flagging this so it's a known, deliberate
  tradeoff rather than a silent gap.
- `menu.html`'s image `<img onerror>` fallback pointed at a `food-placeholder.jpg` that
  never existed (broken from before this project) — fixed to a `.svg` fallback.
- `restaurant-dashboard.html`'s "My Menu" table gained a photo thumbnail column.
- Restaurants can still set a real image URL per item via the "Image URL" field —
  the generated icon is only the default when they leave it blank.
- `seedMenu.js` was refactored to `module.exports = { menuData, CATEGORY_IMAGES }` and
  only auto-runs the live seed when executed directly (`require.main === module`), so
  other scripts (the icon generator, the photo fetcher) can reuse its dish list
  without triggering a DB write.

## 4. Data cleanup

Found and removed 181 orphaned `Menu` documents whose `restaurantId` didn't match any
existing restaurant account (most likely leftover from browser-cached JWTs during
earlier development iterations before roles/restaurant-ownership existed). They were
duplicating the correctly-seeded catalog and were the reason the very first menu item
checked still had no image after reseeding. The restaurant *accounts* themselves were
left untouched — only the unreachable, broken menu rows were deleted.

## 5. Frontend structure

`backend/public/` was removed — `frontend/` is now the single source of truth, served
directly by `server.js` (`express.static` points at `../frontend`).

- `frontend/assets/theme.css` — shared dark maroon/gold "Thrifty Bite" design system
  (navbar, cards, tabs, forms, tables, badges, buttons) used by every new page.
- `frontend/assets/api.js` — shared JS: `apiFetch()` (authenticated fetch wrapper),
  `requireAuth(roles)` (redirects to `login.html` or the user's own dashboard if the
  role doesn't match), `logout()`, and formatting helpers (`formatMoney`,
  `formatDate`, `statusBadgeClass`, `escapeHtml`, etc.).
- New pages: `restaurant-dashboard.html`, `chef-dashboard.html`, `custom-order.html`,
  `custom-order-detail.html`, `friends.html`, `group-order.html`,
  `group-order-detail.html`, `admin-dashboard.html`.
- `register.html` / `login.html` were edited in place (account-type selector,
  role-based post-login redirect via `DASHBOARD_BY_ROLE`). Both now use
  `window.location.origin` for `API_BASE` instead of a hard-coded port.
- `home.html` nav gained links to "Ask a Chef" / "Friends" / "Group Orders"; its
  broken absolute logo path was fixed to the local `logo.jpeg`.

## 6. What changed in existing backend modules

- **`models/user.js`** — added `name`, `mobile`, `address`, `role` (enum), `ownerName`,
  `isActive`. `username` is still auto-generated from email for backward compatibility.
- **`models/menu.js`** — added required `restaurantId`; `category` is now a free-form
  string (restaurants manage their own categories via `FoodCategory`) instead of a
  fixed enum.
- **`models/order.js`** — rebuilt: `customerId`/`restaurantId` refs, embedded
  `deliveryAddress` snapshot, `paymentMethod`, full status flow
  (`PLACED → ACCEPTED/REJECTED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED → COMPLETED`).
- **`models/cart.js`** — cart items now carry `restaurantId` so checkout can be scoped
  per restaurant.
- **`routes/menuRoutes.js`** — is now read-only/public, plus a new
  `GET /api/menu/restaurants` (public restaurant listing, needed for module 3 and the
  group-order restaurant picker). The old unauthenticated `POST/PUT/DELETE /api/menu`
  endpoints were removed; equivalents (now authenticated + restaurant-scoped) live
  under `/api/restaurant/menu`.
- **`routes/authRoutes.js`** — registration accepts `role` + role-specific fields;
  login response and JWT now include `role`.
- **`seedMenu.js`** / **`seedAdmin.js`** — both fixed to use the DNS override
  (`dns.setServers(["8.8.8.8","1.1.1.1"])`) already present in `server.js`, needed to
  resolve the `mongodb+srv://` SRV record in this environment. `seedMenu.js` also fixed
  a pre-existing bug (`MONGO_URI` vs. the `.env`'s `MONGODB_URI`, and a duplicate
  `insertMany` call) and now creates/reuses a default `kitchen@thriftybite.com`
  (password `thriftybite123`) restaurant account, attaching all seeded items to it
  since `Menu.restaurantId` is required.
- **`backend/.env`** — `PORT` corrected from `5000` to `5500` to match every frontend
  page's hard-coded expectation (this predated today's changes and caused
  "cannot connect to server" errors before it was found).
- **`routes/orderRoutes.js`** — `POST /api/order` was rewritten to accept
  `items: [{menuItemId, quantity}]` directly from the client and look up each item's
  authoritative price/availability server-side, instead of reading from the backend
  `Cart` model. Reason: the real frontend (`menu.html`/`cart.html`) has always used a
  client-side `localStorage` cart and never actually called `POST /api/cart` — the
  backend `Cart` collection was effectively dead code from the customer's point of
  view, so checkout now matches how the app actually works.
- **`routes/menuRoutes.js`** / **`routes/customOrderRoutes.js`** — added
  `GET /api/menu/restaurants` and `GET /api/custom-orders/chefs`, small public/
  authenticated listing endpoints needed by the new browsing and chef-picker pages.

## 7. API reference

All protected routes require `Authorization: Bearer <token>`.

```
POST   /api/auth/register           { email, password, role?, name?, mobile?, address?,
                                       ownerName? (RESTAURANT), specialization?, experience? (MASTER_CHEF) }
POST   /api/auth/login              -> { token, user: { id, username, email, name, role } }

GET    /api/menu/all
GET    /api/menu/restaurants
GET    /api/menu/category/:category
GET    /api/menu/restaurant/:restaurantId
GET    /api/menu/icon?name=&category=   -> image/svg+xml, generated dish icon
GET    /api/menu/:id
POST   /api/menu/voice-match        { text }   -> { matches: [...], unmatched: [...] }

PUT    /api/profile                 [auth]  { name?, mobile?, address? }
PUT    /api/profile/password        [auth]  { currentPassword, newPassword }
POST   /api/profile/avatar          [auth]  multipart/form-data, field "avatar" (jpg/png/webp, <2MB)
DELETE /api/profile/avatar          [auth]

GET    /api/favourites              [auth]
POST   /api/favourites              [auth]  { menuItemId }
DELETE /api/favourites/:menuItemId  [auth]

GET    /api/rewards                 [auth]  -> { totalPoints, transactions }

GET    /api/payment-methods              [auth]
POST   /api/payment-methods              [auth]  { type: UPI|Card, label, detail, isDefault? }
PUT    /api/payment-methods/:id/default  [auth]
DELETE /api/payment-methods/:id          [auth]

POST   /api/order                   [CUSTOMER]  { restaurantId, addressId, paymentMethod,
                                                   items: [{ menuItemId, quantity }] }
GET    /api/order/my                [auth]
GET    /api/order/:id               [owner | restaurant | admin]

GET    /api/restaurant/profile      [RESTAURANT]      PUT same
GET    /api/restaurant/categories   [RESTAURANT]      POST /categories  DELETE /categories/:id
GET    /api/restaurant/menu         [RESTAURANT]      POST/PUT/DELETE /menu(/:id)
GET    /api/restaurant/orders       [RESTAURANT]      PUT /orders/:id/status

GET    /api/chef/profile            [MASTER_CHEF]     PUT same
GET    /api/chef/requests           [MASTER_CHEF]     -> { openRequests, myRequests }
POST   /api/chef/requests/:id/accept
POST   /api/chef/requests/:id/reject
POST   /api/chef/requests/:id/proposal   { amount, preparationTime, chefNotes }
PUT    /api/chef/orders/:id/status       { status }

GET    /api/custom-orders/chefs     [auth]      -> list of Master Chefs for the picker
POST   /api/custom-orders           [CUSTOMER]  { chefId?, foodRequired, description, quantity,
                                                   preferredDate, preferredTime, specialInstructions?, referenceImage? }
GET    /api/custom-orders/my        [CUSTOMER]
GET    /api/custom-orders/:id       [owner | assigned chef | admin]
GET    /api/custom-orders/:id/timeline
POST   /api/custom-orders/:id/reject
POST   /api/custom-orders/:id/payment    { paymentMethod: UPI|Card|Cash }

GET    /api/friends/search?query=
POST   /api/friends/request              { recipientId }
GET    /api/friends/requests
PUT    /api/friends/request/:id/accept
PUT    /api/friends/request/:id/reject
GET    /api/friends

POST   /api/group-orders            [CUSTOMER]  normal: { memberIds, restaurantId, items }
                                                  custom: { memberIds, customRequest: {...} }
GET    /api/group-orders/my
GET    /api/group-orders/:id
PUT    /api/group-orders/:id/status [creator]

POST   /api/bill-split/:groupOrderId     { totalBill, paidBy, splitType, shares? }
GET    /api/bill-split/:groupOrderId     -> { billSplit, settlement }
PUT    /api/bill-split/:groupOrderId/pay { userId, amount }

GET    /api/admin/customers | /restaurants | /chefs   [ADMIN]
PUT    /api/admin/users/:id/status                     { isActive }
GET    /api/admin/orders
GET    /api/admin/custom-orders
GET    /api/admin/reports
```

## 8. Database collections (Mongoose models)

Matches PDF §17 plus the pre-existing collections:

`users`, `chefProfiles`, `foodCategories`, `menus`, `carts`, `orders`, `customOrders`,
`chefProposals`, `customOrderPayments`, `customOrderStatusHistories`, `friends`,
`groupOrders`, `billSplits`, `addresses`, `feedbacks`, `reviews`.

Beyond the PDF (§0): `favourites`, `rewardTransactions`, `paymentMethods`.

(`carts` is populated by `routes/cartRoutes.js` but is no longer read by checkout —
see §6. Left in place since it doesn't hurt anything; safe to remove in a future pass
if nothing else starts using it.)

## 9. Verified (manual smoke tests against the live DB, test data cleaned up after)

- Register/login for all 4 roles → restaurant adds a menu item → customer browses menu.
- Full custom order lifecycle: request → chef accepts → chef proposes → customer
  confirms & pays (mock) → chef advances prep status → timeline reflects every step.
- Friends: search → request → accept → appears in friends list.
- Group order (normal): create with a friend + restaurant items → view detail →
  record equal bill split → settlement correctly shows what the friend owes → marking
  it settled zeroes out the settlement.
- Group order status updates correctly blocked for non-creators (404).
- Normal cart → address → place order → restaurant accepts it → shows in customer
  order history.
- Admin reports/user listing works and is correctly blocked for non-admins (403).
- Every new/edited page's inline `<script>` block passes a Node syntax check, and every
  page returns HTTP 200 from the running server.
- Every field the new frontend pages read from an API response (e.g.
  `billSplit.shares[].userId.name`, `groupOrder.restaurantId.name`,
  `settlement[].from`/`to`) was cross-checked against a live curl response of that
  exact endpoint, not just against the route source.
- Checkout: placed a real order via the exact request shape `checkout.html` sends
  (`items: [{menuItemId, quantity}]`), confirmed it appears correctly in
  `GET /api/order/my` (used by `my-orders.html`).
- Chef picker: created a request targeted at a specific chef, confirmed it shows up
  under that chef's "My Requests" (not the broadcast "Open Requests") immediately.
- `GET /api/menu/all` (menu.html's actual bug) and `GET /api/menu/restaurant/:id`
  (restaurant-menu.html) both confirmed returning items with real `image` paths.

## 9a. Gap found against the PDF: Module 9's "Item-wise split" was never built

PDF §18 Module 9 lists **Equal split** and **Item-wise split** as two distinct bullet
points. Auditing the actual code found only the equal-split path was reachable end to
end: `BillSplit.splitType` had an `ITEM_WISE` enum value, but (a) `GroupOrder` items had
no per-member attribution at all, (b) `group-order.html` never offered a way to assign
an item to a person, and (c) `group-order-detail.html`'s bill-split UI only ever POSTed
`splitType: "EQUAL"` — `ITEM_WISE` was reachable only by calling the API by hand with a
manually pre-computed `shares` array (identical code path to `CUSTOM`). Fixed:

- `models/groupOrder.js` — item schema gained `memberId` (who the item is for; `null` =
  shared/unassigned).
- `routes/groupOrderRoutes.js` — `POST /api/group-orders` accepts `memberId` per item
  (validated as a real member of the group order) and `GET /api/group-orders/:id` now
  populates `items.memberId`.
- `routes/billSplitRoutes.js` — `splitType: "ITEM_WISE"` is now computed server-side
  from the group order's own items (sum of each member's assigned items, plus an equal
  share of anything left "Shared") instead of requiring the caller to pre-compute
  amounts.
- `group-order.html` — each menu row in a normal group order now has a "For" dropdown
  (Shared / Me / any friend); assigning an item to a friend who wasn't yet ticked as a
  group member auto-adds them so the assignment stays valid server-side.
- `group-order-detail.html` — item list shows who each item is "For"; the bill-split
  setup card now offers both **Split Equally** and **Split by Item** (the latter only
  shown for normal orders that actually have items), and the recorded split view shows
  which split type was used.
- Verified: `node --check` on all three edited backend files, a `new Function(...)`
  syntax check on both edited HTML files' inline `<script>` blocks (same technique
  §0b's audit used), and a real server boot against the live DB (all route files still
  log "LOADED", Mongo connects, no schema errors).
- New handlers (`setAssignee`) follow the existing `window.name = function name(...)`
  global-assignment pattern from §0b, since they're declared inside `if(user){...}`
  and called from an inline `onchange` attribute.

## 9b. Checked, not a gap: two orphaned files that look like routes but aren't

`routes/reviewRoutes.js` and (by the same pattern) `routes/feedbackRoutes.js` are not
actually routers — each is a byte-for-byte duplicate of a `models/*.js` Mongoose schema
file (e.g. `reviewRoutes.js` is identical to `models/review.js`), never mounted in
`server.js`, and ratings/reviews were never part of the PDF's 10 modules to begin with.
Left as-is (pre-existing dead code predating the module pivot, not a scope gap) rather
than wiring up a feature the spec never asked for — flagging here so a future pass
doesn't mistake the leftover file names for a missing module.

## 9c. Module 19 — Food-First Discovery & Multi-Platform Price Comparison

New scope arrived as `Food_Delivery_App_II_Updated.pdf` §19, on top of the original
18-module app documented above. It extends (never replaces) Food Browsing and Cart &
Normal Orders with: a home-page food-category carousel, a `/food/<category>` discovery
page, and Swiggy/Zomato *reference-only* price comparison on the menu, cart and
checkout. Per the PDF's own implementation guideline (§19.19 #3 — "extend existing
tables instead of creating conflicting duplicate structures"), this was built on top of
the existing `Menu` model rather than the PDF's suggested normalized
`food_categories`/`foods`/`restaurant_foods` split, since `Menu` already carries
`restaurantId` + `category` + `isVeg` + `isAvailable` per item — i.e. it already *is*
the "restaurant_foods" table. Building a separate master `foods` catalog would have
meant migrating all 180 seeded dishes into food+restaurant_food pairs for no functional
gain in a single-implementation-per-restaurant college project. This simplification is
called out explicitly rather than silently doing less than the PDF asked for.

**New models:**
- `models/discoveryCategory.js` — the home-page category tiles (South Indian, Pizza,
  Biryani, ... — the PDF's §19.1/§19.15 list of 20), admin/seed-managed, distinct from
  the existing per-restaurant `FoodCategory` model (menu management) it sits next to.
- `models/externalFoodPrice.js` — Swiggy/Zomato reference rows against a real
  `Menu` item (`menuItemId` + `platform` unique index, one row per platform per dish).
  `totalPrice` is computed from `price/discountPrice + deliveryFee + packagingFee + tax`
  in a `pre("save")` hook. "Our App" price is *never* stored here — every comparison
  reads it live from the `Menu` item itself, so a restaurant price change is reflected
  immediately without touching comparison records (§19.19's acceptance test for this
  exact case).
  - **Real bug hit and fixed while wiring this up**: the `pre("save")` hook was
    originally written `function (next) { ...; next(); }` — the callback-style pattern
    used throughout older Node tutorials. This project runs **Mongoose 9**, which
    dropped callback-style hook middleware; calling `next()` when Mongoose no longer
    passes one throws `TypeError: next is not a function` on every save. Caught by
    actually calling `POST /api/admin/platform-prices` (not just reading the code) and
    reading the server-side stack trace — fixed by making the hook a plain
    zero-argument function.

**New/changed API (all under the existing `/api/menu` and `/api/admin` routers, no new
route files or `server.js` changes needed):**
- `GET /api/menu/discovery-categories` — the carousel's data source.
- `GET /api/menu/search?q=` — food name / description / category / **restaurant name**
  (§19.12 explicitly required restaurant-name search; the pre-existing Food Browsing
  module had no search endpoint at all, only client-side name/description/category
  filtering in `menu.html` — restaurant name was never matchable before this).
- `GET /api/menu/price-comparison?ids=a,b,c` and `GET /api/menu/:id/price-comparison` —
  batch and single-item comparison reads (cart, checkout, restaurant-menu use these).
- `GET /api/menu/all` and `GET /api/menu/category/:category` now `.populate("restaurantId",
  "name address")` — needed so search/discovery can show/match on restaurant name.
  Verified this is non-breaking: grepped every frontend consumer of both endpoints and
  confirmed none read `dish.restaurantId` as a raw id string (`menu.html`,
  `meal-budget.html` never touch that field at all); `GET /api/menu/:id` — the one route
  `checkout.html` actually depends on for a raw restaurant id string — was deliberately
  left unpopulated.
- `GET/POST/PUT/DELETE /api/admin/platform-prices` — full CRUD, admin-only, added to the
  existing `adminRoutes.js` (no new router file).

**Frontend:**
- `home.html` — new "Order our best food options" horizontal category carousel between
  the hero and the existing feature cards (prev/next buttons + native touch scroll;
  no JS carousel library needed). Each tile links to `food-result.html?category=X`.
  Deliberately did **not** add separate "Popular Foods" / "Restaurants Near You" / "Best
  Price Comparison" home sections from §19.13's page-structure list — the existing nav
  already links to Menu, Restaurants, Ask a Chef, Friends and Group Orders, so those
  flows exist; adding redundant homepage sections for the same destinations was judged
  not worth the added page weight for a college project. Flagging this as a scope
  reduction, not an oversight.
- `food-result.html` (**new page**) — the PDF's `/food/biryani` result page, built as
  `food-result.html?category=Biryani` (query-string, matching this project's existing
  `restaurant-menu.html?id=`/`custom-order-detail.html?id=` pattern rather than adding
  real client-side routing). Tries an exact category match first, falls back to the new
  `/menu/search` endpoint so a specific dish name also works as an entry point. Filters:
  search, restaurant, max price, min rating, veg/non-veg, availability — all client-side
  over the fetched result set, consistent with how `menu.html` already filters.
- `cart.html` — new "Price Comparison" panel: sums Our-App/Swiggy/Zomato totals across
  the whole cart (via the batch endpoint), shows a "You save up to ₹X" banner (only when
  the app is actually cheaper — §19.8's rule against misleading savings claims), and
  falls back to "Price comparison unavailable" when none of the cart's items have any
  reference rows. If only some items have data, it says so explicitly rather than
  silently comparing an incomplete subset as if it were the whole cart.
- `checkout.html` — a small reference-only note per order group ("Reference only —
  Swiggy ~₹X · Zomato ~₹Y") pulled the same way; never affects the actual payable total
  or blocks placing the order when comparison data is missing (§19.11).
- `restaurant-menu.html` — optional per-dish "Our App / Swiggy / Zomato" line, only
  rendered for items an admin actually entered comparison data for (§19.9's
  `show_price_comparison` flag, implemented implicitly as "a comparison row exists"
  rather than a separate boolean field on `Menu` — one less migration for the same
  effect).
- `admin-dashboard.html` — new "Platform Price Comparison" tab: a form (dish picker via
  `<datalist>` search over all 180 seeded dishes + friends, platform, price, delivery/
  packaging/tax fees, availability) and a table of existing records with delete.
- `menu.html` — the existing client-side search (name/description/category) now also
  matches restaurant name, using the same populate added above. No other change to this
  file's existing behavior.

**Seed data:** `backend/seedDiscovery.js` (re-runnable, upserts by name/`(menuItemId,
platform)`) — seeds the 20 discovery categories and 10 sample `SWIGGY`/`ZOMATO` rows
against real seeded dishes matched by name pattern (Chicken Biryani, Paneer Pizza,
Masala Dosa, Veg Noodles, Chocolate Cake — the last sample pattern, Chicken Shawarma,
found no match against the actual 180-dish catalog and was skipped, logged, not
silently dropped). Numbers for the Chicken Biryani row are the PDF's own §19.5 sample
table values verbatim (Swiggy ₹295 / Zomato ₹284 total).

**Verified (real headless Chrome via `playwright-core` + the system's installed Chrome,
same technique as §0b, plus direct `curl`/API checks; all test users, group orders and
temp scripts cleaned up afterward):**
- Home page renders all 20 category tiles; clicking one navigates to
  `food-result.html?category=<name>` with the right query string.
- `food-result.html` for "Biryani" returned 25 real results; the veg/non-veg filter
  correctly narrowed 25 → 17; "Add" correctly pushed a real seeded dish into the same
  `localStorage` cart `menu.html`/`restaurant-menu.html` already use.
- Cart page price comparison: with 2× a dish that has sample data, computed **Our App
  ₹438 / Swiggy ₹590 / Zomato ₹568 / "save up to ₹152"** — matches the formula by hand
  exactly. With a dish that has no comparison rows, correctly showed "Price comparison
  unavailable" instead of a wrong/zeroed table.
- Admin "Platform Price Comparison" tab: 10 seeded rows listed; dish-search `<datalist>`
  populated with all 180 real dishes; POST/PUT/DELETE all round-tripped correctly via
  curl (after the Mongoose 9 hook fix above).
- Regression per §19.19 guideline #9 ("verify all existing modules still work"):
  `menu.html` still rendered all 180 dishes with zero console/page errors after the
  `/api/menu/all` populate change, and a targeted restaurant-name search ("SS Briyani")
  correctly isolated 1 result out of 180 — proving the new populate neither broke the
  old view nor left the new search field non-functional.
- `node --check` on every new/edited backend file; a corrected `new Function(...)`
  syntax check (see note below) on every new/edited HTML file's inline `<script>`.

**Process note:** the first pass of the inline-`<script>` syntax checker used in this
and the prior session had a bug — it tested `wholeScriptMatch.includes("src=")` to skip
external `<script src=...>` tags, but any inline script that builds HTML strings
containing `<img src='...'>` (nearly all of them) also contains the substring `src=`,
so real inline scripts were silently skipped as "external" and never actually checked.
Fixed by checking only the opening `<script ...>` tag text, not the whole match, before
deciding whether to skip it. Re-verified every file already reported "OK" under the old,
broken checker to confirm none of them were false passes.

## 9d. Follow-up pass on §19: restaurant image + verifying what §9c only built

Asked to re-check the same §19 scope again. The document was identical to what §9c
already covers, so this pass instead (a) verified, in a real browser, the two pieces
§9c built but never actually opened a page for — `restaurant-menu.html`'s per-item
comparison badge and `checkout.html`'s reference-price note — both render correctly
(e.g. "Our App ₹219 · Swiggy ₹295 · Zomato ₹284"; cart page has no horizontal overflow
at a 375px mobile viewport per §19.16) — and (b) found and added one genuinely missing
piece: §19.3 asks the food-result page to show "restaurant image, restaurant name,
rating, cuisine, delivery time and distance when available" — only the name was shown.
Added the restaurant's existing `avatar` field (the same field `profile.html`'s photo
upload already writes) to `food-result.html`'s restaurant line, and to the `populate()`
selects in `GET /api/menu/all`, `/search` and `/category/:category` so it's actually
available to read. No schema change needed — the field already existed on `User`.
Restaurant `rating`/`cuisine` remain genuinely absent from the schema (no such fields
exist anywhere), and adding them would mean a real migration plus new restaurant-profile
UI, not a one-line fix — left out and called out here rather than silently skipped,
consistent with "when available" in the PDF's own wording covering data that may not
exist yet. Verified: a restaurant with no avatar renders the link with no broken image
and no JS error, since the `<img>` is only emitted when `restAvatar` is truthy.

**Process note:** while testing, curl kept 404ing real, existing frontend files
(`friends.html`, `restaurant-menu.html`, etc.) even though `menu.html`/`cart.html`/
`home.html` served fine from the same port. This turned out to be a stale server
process left over from earlier testing in this same conversation, still bound to
:5500 and answering requests with an unrelated/incomplete view of the frontend
directory — not a bug in the app. Confirmed by adding a temporary boot-time log of
`FRONTEND_DIR` and an `fs.existsSync` check (removed again immediately after), which
showed a freshly started process resolved the same files correctly. Lesson: always
confirm which PID is actually `LISTENING` on the port (`netstat -ano`) before trusting
a curl result, since more than one `node server.js` can be alive at once across a long
session.

## 9e. Real bug: cart price comparison showed "unavailable" for almost every real cart

Reported with a screenshot: a real cart (Chicken Handi, Chicken Tikka Masala, etc.)
showed "Price comparison unavailable for the items in your cart right now." Root cause
wasn't a code bug — `seedDiscovery.js` had only ever seeded comparison rows for **5 of
the 180** menu items (the PDF's own worked examples: Royal Chicken Biryani, Paneer
Tikka Pizza, Veg Hakka Noodles, Masala Dosa, Chocolate Lava Cake). Any cart built from
the other 175 dishes — i.e. almost any real cart — correctly had no reference data to
show, so "unavailable" was the honest, spec-compliant fallback (§19.11), just not a
useful one for a demo.

Fixed by extending `seedDiscovery.js` with `seedGeneratedPricesForRemainingItems()`:
every dish that isn't one of the 5 PDF showcase rows now gets a deterministically
generated (not random — same output every re-run, hashed from the dish's own id, same
principle as `foodIcon.js`'s deterministic per-dish color) Swiggy/Zomato reference price
— a realistic 4–17% markup over the app's own price, plus delivery/packaging/tax in
plausible ranges, cycling through the PDF's sample restaurant names. Re-ran the seed:
**all 180 dishes now have comparison rows** (`ExternalFoodPrice.distinct("menuItemId")
.length === 180`, was 5). Re-verified in a real browser with the reporter's own cart
contents (Chicken Tikka Masala ×2 + Chicken Handi ×1): now shows **Our App ₹727 /
Swiggy ₹973 / Zomato ₹919 / "save up to ₹246"** instead of "unavailable".

## 10. Suggested next pass

1. Real file upload for menu images and custom-order reference images (currently URL
   strings / bundled SVGs).
2. Wire a real payment gateway once the mock flow is validated as good enough.
3. `menu.html` could link "Add to Cart" items through to `restaurant-menu.html`'s
   per-restaurant view for a more guided browsing path, though both work independently
   today.
