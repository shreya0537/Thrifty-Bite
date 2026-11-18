# Final user-requested fixes

## Default theme
- Burgundy Gold is the default theme on first launch and on upgrade from the previous default theme.
- The user's explicitly selected palette is saved in localStorage and reused on all pages that load `assets/theme-preference.js`.
- Account Settings includes Burgundy Gold and the Apply Theme action.

## Demo payment
- Checkout exposes separate `Simulate Payment Success` and `Simulate Payment Failure` controls for demo card payment.
- The UPI demo page also exposes separate success and failure simulation controls.
- Failed or expired demo sessions may be retried through the demo-only confirmation endpoint. Paid sessions remain final. These are simulations and do not charge real money.

## Order tracking
- Payment success now links directly to `track-order.html`.
- Track Order continues to load the signed-in customer's orders from `/api/order/my`, display the five milestones, and refresh status periodically.
- Added protection against overlapping periodic order refresh requests and a more useful backend/login error message.

## Verification
- Ran `node --check` over every backend JavaScript file in this folder.
- This source package still requires the user's own `.env`, a reachable MongoDB database, and runtime testing for a full end-to-end verification. No live payment or database transaction is claimed.
