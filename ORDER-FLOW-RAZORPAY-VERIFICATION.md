# Order flow and payment verification notes

## Individual order
1. Select dishes from the regular menu and open Cart.
2. **Place Group Order** stays disabled/faded unless the cart was reached from the Group Order menu-selection flow.
3. **Proceed to Checkout** clears any stale group-order metadata, so the checkout displays an individual Order Summary and bill-split controls stay faded/disabled.
4. Complete payment. Successful online payment is only accepted after the backend verifies the Razorpay signature; cancelled/failed payments leave the cart available for retry.

## Group order
1. Open Group Order, select group members and dishes, then place the group order.
2. The selected dishes are copied into Cart and group-order metadata is stored.
3. In Cart, choose **Place Group Order** to open Group Order Summary.
4. Choose **Split Equal** or **Split by Item**. The summary displays a calculated share breakdown and carries the selected split method into Checkout.
5. Checkout is opened with `?groupOrder=1`; the group summary and split method remain active through payment.

## Razorpay workflow
- Backend creates the Razorpay order using the server-calculated order draft total; the secret key stays on the server.
- The browser receives only the public key ID and Razorpay order ID.
- On payment success, the backend validates the HMAC-SHA256 signature and only then creates/marks the order paid. Repeated verification returns the existing paid order rather than creating a duplicate.
- Payment failure or dismissal does not clear the cart.
- With no Razorpay keys configured, non-production uses the clearly labelled demo payment flow; this does **not** charge real money. Production requires valid Razorpay credentials in `backend/.env` and should be tested with Razorpay test credentials before enabling live credentials.

## Checks performed for this delivery
- `node --check` passed for the payment, order and group-order backend routes.
- Inline JavaScript syntax checks passed for `frontend/cart.html`, `frontend/checkout.html`, and `frontend/group-order.html`.
- `npm test` in `backend/` passed: 16 single-dish and 4 multi-dish voice matcher cases.
- Live Razorpay payment was not executed because it requires configured credentials and a reachable running backend; this package has static-flow verification, not a claim of a live transaction test.
