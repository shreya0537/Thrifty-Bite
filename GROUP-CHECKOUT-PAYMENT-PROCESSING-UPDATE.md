# Group Checkout → Payment Processing Update

- The Cart page's group order summary continues to carry the selected `Split Equal` or `Split by Item` method to checkout.
- After a user submits checkout, an explicit **Processing Your Payment** overlay appears while the payment flow is prepared.
- UPI and Cash continue into the existing UPI/demo payment page; card payments continue into the existing Razorpay flow.
- The processing overlay is hidden when the card payment popup opens, or when a failed/cancelled flow returns to checkout.
- Existing payment success/failure screens and group-order summary data are retained.

Validation performed: checkout inline JavaScript syntax checks and ZIP archive integrity check. Live database/payment provider end-to-end testing was not performed.
