# Final Group Checkout and Back Button Update

- Cart's Place Group Order opens the group order summary for the currently selected cart items.
- The user chooses Split Equal or Split by Item in that summary.
- Continue to Checkout stores the group order summary and split method, then redirects to `checkout.html?groupOrder=1&split=...`.
- Checkout reads the saved group order data and displays the group checkout summary before the normal delivery/payment workflow.
- The universal Back control is positioned at the bottom-left on pages where it is installed, and uses browser history when available with Home as a fallback.

Validation performed: source-level assertions for the cart-to-checkout flow, Node syntax check of backend server, and ZIP integrity. This does not constitute live MongoDB/payment end-to-end testing.
