Cash on Delivery demo flow fix

- Checkout now routes Cash on Delivery and UPI through the existing payment demo-session page.
- COD shows the cash-at-delivery icon, amount-to-collect summary, and simulate cash received / collection failed actions.
- The checkout processing overlay is hidden when payment-session creation fails, so it no longer remains indefinitely after an error.
- The selected demo result is handled by the existing payment result page. No real cash is collected by this demo.

Test: choose Cash on Delivery, set a delivery map pin, place order, verify the COD demo page appears, then test both result buttons.
