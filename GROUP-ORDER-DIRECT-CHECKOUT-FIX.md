# Group Order Direct Checkout Fix

## Changes
- After the group-order API accepts a valid group order, the group-order page saves the existing cart and group metadata, then redirects directly to `checkout.html?groupOrder=1&split=equal`.
- Checkout recognizes the saved group-order metadata and enables the split options only for group orders.
- Checkout now displays an expense breakdown for the selected split method. Equal split distributes the total in cents across the creator and group members. Item split totals the assigned dishes per member and lists unassigned items separately.
- Changing the split option updates the saved group split method and refreshes the breakdown.
- Existing checkout and payment-processing code paths were not otherwise changed.

## Checks
- Inline JavaScript syntax check passed for all script blocks in `group-order.html` and `checkout.html`.
- Live end-to-end API and Razorpay payment testing still requires the project backend to be running and valid Razorpay test credentials.
