# Thrifty Bite – Targeted Group Order and Login Welcome Fix

## Changes made
- Kept existing individual-order, checkout, and payment-processing flows unchanged.
- Preserved group-order metadata (group order ID, member IDs/names, creator ID, and restaurant ID) when the user selects a bill split and proceeds to checkout.
- Made the Group Order Summary render the split options and live expense breakdown whenever the cart is reached from a successfully placed group order.
- Equal split shows each group participant's share and handles currency rounding in cents.
- Split by Item shows the assigned member, assigned dishes, and their total share; unassigned items remain visible as a separate share.
- Added a one-time “Welcome to Thrifty Bite!” greeting after a successful login when the user lands on the home page. It does not alter the home page's existing hero content or navigation.

## Verification
- JavaScript syntax checked for 124 inline script blocks across frontend HTML files: passed.
- Backend test command (`npm test`): passed (16 single-dish and 4 multi-dish voice matcher cases).
- Razorpay live/test payment was not executed; payment processing was intentionally not modified. Verify transactions using configured Razorpay test credentials before production use.
