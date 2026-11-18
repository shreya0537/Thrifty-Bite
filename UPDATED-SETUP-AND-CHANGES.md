# Thrifty Bite — Updated Working Folder

## What changed
- Voice-order matching now normalizes common Tamil, Hindi, Kannada, Telugu and Malayalam dish words to the English names used by the existing MongoDB menu, scores names/categories/descriptions/tags, and rejects weak/ambiguous matches rather than confidently adding an unrelated dish.
- Voice ordering sends matched items to the authenticated `POST /api/cart` endpoint before navigating to cart. Sign-in is required so the server can save the cart under the correct user in MongoDB. Browser speech recognition still depends on Chrome/Chromium and the selected language being supported by the browser/device.
- Occasion-plan deletion now executes immediately without a JavaScript confirmation prompt.
- Added a Dine Out page and authenticated `/api/dineout` API. Reservation requests are stored in MongoDB per user and can be cancelled while still in REQUESTED status. These are requests, not live restaurant confirmations or real-time availability.
- Smart Analyzer comparison page retains the existing branded horizontal bar chart and competitor comparison workflow.
- `.env.example` now documents optional email and Razorpay settings.

## Create your own `.env` (never share or commit this file)
1. Open `Livya-Final-Project/backend` in File Explorer.
2. Copy `.env.example` and rename the copy to `.env` (ensure Windows has not made it `.env.txt`).
3. In MongoDB Atlas, open your cluster → Connect → Drivers and copy the connection string. Replace the database username/password and cluster host in `MONGODB_URI`. URL-encode special characters in the database password. Choose the database name `ThriftyBite`.
4. In Atlas → Network Access, allow your current IP address. In Database Access, confirm the database user and password match the URI.
5. Set `JWT_SECRET` to a long random secret (at least 32 characters). Keep it private.
6. `EMAIL_USER`, `EMAIL_PASS`, `RAZORPAY_KEY_ID`, and `RAZORPAY_KEY_SECRET` are optional for features that use those services. Do not invent credentials; if you do not have Razorpay keys, use COD if the existing payment page supports it.
7. Check `.gitignore` includes `.env`. Never upload `.env` or paste its contents into chat/GitHub.
8. Open a terminal in `Livya-Final-Project/backend` and run:
   ```powershell
   npm install
   npm run dev
   ```
   Keep this terminal open. Open `http://localhost:5500/` and sign in before testing cart or Dine Out persistence.

## MongoDB persistence verification
- Cart: sign in, add a menu item, then inspect the `carts` collection in the same Atlas database. Voice ordering uses the same authenticated cart API.
- Occasion plans: save a plan, then inspect the occasion-plan collection. Delete removes the saved plan from the database.
- Dine Out: sign in and submit a reservation request, then inspect the `dineoutbookings` collection.
- Orders, profiles, addresses, favourites, etc. use their existing backend routes. A page input is only guaranteed to persist if that page calls a backend API and the API successfully writes to MongoDB; localStorage-only settings/drafts are not database records. Test each feature rather than assuming every visible input is persisted.
- Use the same `MONGODB_URI` for every app folder that should share the same menu and records. If your friend's database already has menu documents, point your project at that database or export/import the menu collection. Never copy her `.env` secrets.

## Voice-order accuracy notes
The browser converts speech to text first; the backend can only match the transcript it receives. Ask users to choose the spoken language before tapping the mic, speak dish names clearly, and review the matched dishes before adding. Browser speech-to-text accuracy and language support vary by device. Add additional native-language dish aliases to `backend/utils/voiceOrderMatcher.js` as needed for the exact names in your menu.
