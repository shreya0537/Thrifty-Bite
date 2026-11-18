# Thrifty Bite — updated project notes

This patch keeps the project's existing HTML/CSS structure and its burgundy, cream and gold Occasion Planner styling.

## What was updated in this pass
- Occasion Plan saves are now user-scoped through the existing JWT middleware.
- Added update and delete endpoints for saved occasion plans.
- The Save button updates an existing resumed plan instead of always creating another copy.
- Saved plans show Resume and Delete controls.
- The planner persists the convenience choice (`balanced`, `budget`, `quick`, `variety`).
- Repeated Add to Cart clicks for the same plan no longer duplicate that plan's items.
- Confirmed the cart places **Check to Comparison** before **Proceed to Checkout**.
- Ran `node --check` against the backend JavaScript files and planner inline script.

## Run locally
1. Extract this ZIP.
2. Open PowerShell in `Thrifty-Bite-Final-Project\backend`.
3. Run `npm install`.
4. Copy `.env.example` to `.env` and fill in your own MongoDB URI and JWT/email settings. Do not share `.env`.
5. Run `npm run dev` (or `npm start`).
6. Open `http://localhost:5500`.

## Important items that still need integration/testing
- Occasion planner rows currently include generic menu suggestions and estimated prices. They do not all map to real Menu document IDs, while the checkout API validates real menu IDs. To place a fully valid order from an occasion plan, the planner must select actual available menu records and carry their IDs into the cart.
- A live driver map requires a configured map provider and real driver/device location updates. A static map or browser geolocation by itself is not live driver tracking.
- Order tracking is a status timeline driven by the saved order status; status changes must be made by authorized restaurant/admin workflows.
- Test with your own `.env` and MongoDB data. Static syntax checks do not prove database connectivity or end-to-end checkout.
