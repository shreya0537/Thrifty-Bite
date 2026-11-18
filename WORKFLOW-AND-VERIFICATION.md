# Thrifty Bite — workflow and verification guide

## Main customer workflows
1. Register or sign in. The backend issues a JWT; authenticated API calls use `thriftyBiteToken`.
2. Browse menu. Menu items are loaded from MongoDB through `/api/menu/all` and should only be added by their MongoDB IDs.
3. Cart. Add/update/remove operations use `/api/cart` and are account-specific. Keep the token available; local storage is only a compatibility cache for older UI code.
4. Voice ordering. Choose the spoken language before pressing the microphone. Browser speech recognition creates a transcript; `/api/menu/voice-match` compares it against available MongoDB menu items; review matches and save them through authenticated `/api/cart` requests. Browser support and microphone permission are required.
5. Occasion Planner. Plans are scoped to the signed-in account through `/api/occasion-plans`; delete is immediate and does not ask for confirmation.
6. Dine Out. Browse the cafe guide, follow the venue map/menu links, select a date/time and submit a request. `/api/dineout` stores requests under the signed-in account. A request is not a live confirmed booking.
7. Rating & feedback. Guests can submit a 1–5 star rating and comment to `/api/feedback`; the backend validates and stores it in MongoDB.

## Run locally (Windows PowerShell)
1. Copy `backend/.env.example` to `backend/.env`.
2. Set `MONGODB_URI` to your own Atlas connection string and set a strong private `JWT_SECRET` (32+ characters). Do not commit `.env` or share credentials.
3. Open PowerShell in `backend`: `npm install`, then `npm run dev`.
4. Open `http://localhost:5500/`. The root route serves `home.html`.
5. Check `http://localhost:5500/api/test` and then test registration, login, menu loading, cart persistence, voice match, occasion save/delete, Dine Out request, and feedback submission.

## Checks
Run `node utils/voiceOrderMatcher.test.js` from `backend` to test common language aliases and quantity parsing. The test uses sample menu rows and does not require a live MongoDB connection.

## Important
- `npm run dev` waits for a valid MongoDB connection before opening the server. If connection fails, confirm the Atlas IP access list, database user/password, URL-encoded special characters in the password, and `MONGODB_URI`.
- Razorpay and email settings are optional unless you enable those flows. Never put secrets in frontend files.
- Café photos, prices and budgets are informational examples; verify current venue details directly.
- A successful syntax/test run is not the same as a live browser, microphone, payment-provider, or Atlas integration test.
