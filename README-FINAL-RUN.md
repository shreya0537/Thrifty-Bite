# Thrifty Bite — final UI update

This package keeps your existing frontend pages and adds the Occasion Meal Planner and Check Comparison pages using the project's existing royal maroon/gold styling. It also adds a disabled-until-cart-has-items comparison action on the cart page, touch swipe navigation on the new workflow pages, and authenticated MongoDB endpoints for saving/resuming occasion plans.

## Run on Windows
1. Copy `backend/.env.example` to `backend/.env` and add your own MongoDB Atlas URI and private credentials. The real `.env` is intentionally not included.
2. Open PowerShell in `backend` and run `npm install` then `npm run dev`.
3. Visit `http://localhost:5500`.

## Pages
- `frontend/cart.html` — existing cart with comparison and checkout controls
- `frontend/check-comparison.html` — price comparison overview and graphical bars
- `frontend/occasion-planner.html` — generate, save, and resume occasion meal plans

Saving plans requires a valid login token in `localStorage` (`thriftyBiteToken`) and a successful MongoDB connection. Competitor comparisons use the project's backend reference-price endpoint when available; they are not live Swiggy/Zomato API quotes.
