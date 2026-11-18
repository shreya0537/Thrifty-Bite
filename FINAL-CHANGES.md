# Thrifty Bite — changes and verification notes

## Changes included
- Registration page now shows a live password-strength meter, password requirements, and confirm-password match feedback.
- Registration backend now validates email format, password complexity, name length when supplied, and mobile-number format before creating an account.
- Occasion Meal Planner has more prominent save/resume labels and an additional planning-priority preference; saved plans still use the existing authenticated occasion-plan API.
- My Orders now renders a five-step order progress display using status returned by the backend.
- Backend order statuses support `PACKED` and `SHIPPED` in addition to existing statuses.
- Cart's Check to Comparison button remains before Proceed to Checkout and retains its existing empty-cart disabled behavior.
- Cash on Delivery remains available in checkout.

## Verification performed
- Ran `node --check` on all backend JavaScript files.
- Ran `node --check` against inline JavaScript in register, my-orders, occasion-planner, cart, comparison and checkout pages.

## Important integration limits
- Registration validates email syntax, but this version does **not** verify ownership of the email address via a registration OTP. Configure SMTP and add a registration-specific OTP flow before treating an email as verified.
- Order tracking displays real backend order status updates. It does **not** show a live delivery rider on a map. That requires a driver/courier location source that regularly sends GPS coordinates and a configured map provider/API.
- End-to-end MongoDB, SMTP and payment tests require your own valid `.env` credentials and were not run in this environment.


## Occasion Planner persistence patch (2026-10-12)
- Added persisted `convenience` preference to OccasionPlan schema.
- Added authenticated PUT update and DELETE endpoints for saved occasion plans.
- Save now creates or updates an existing plan; saved cards expose Resume and Delete actions with accessible labels.
- Prevented repeat clicks from duplicating the same saved/draft plan items in the local cart.
- Cart already places Check to Comparison above Proceed to Checkout; preserved that order.

Important limitation to test before a live demo: generated occasion suggestions are currently planning estimates and are not guaranteed to map to purchasable Menu database item IDs. Checkout's order API validates real menu item IDs, so a fully transactional occasion-plan-to-order flow requires matching each suggestion to actual menu records before payment. Real-time driver GPS tracking also requires a driver/location-update source and a maps provider/API key; the existing UI alone cannot provide real live driver coordinates.

## Admin dashboard enhancement (2026-10-13)
- Added an Overview tab with a 7-day order-count chart, order status summary, and recent orders sourced from the existing admin API.
- Added a Refresh Dashboard action to reload the existing dashboard data.
- Added customer and order search fields while preserving the existing customer, restaurant, chef, order, custom-order, platform-price, and coupon workflows.
- Kept admin access protected by the existing ADMIN role check and reused existing authenticated API routes; no new database collections or fake data were introduced.


## Admin workflow integration (2026-10-13)
- Added admin-only endpoints to update standard order status and custom-order status, using the same MongoDB records read by customer pages.
- Added admin menu availability management, with customer menu visibility governed by the existing `isAvailable` field.
- Added status controls to the Admin Orders and Custom Orders tables.
- Added a Menu Availability tab to the Admin Dashboard.
- Customer My Orders and Track Order pages refresh every 20 seconds so status changes appear without manual reload.
- These endpoints are protected by the existing ADMIN role middleware.
