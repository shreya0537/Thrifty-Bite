# Updated Group Chat and Payment Confirmation

## Group order chat
- Added a Notifications button with a pending-invitation count and attention pulse.
- Chat messages use a WhatsApp-inspired dark conversation layout with incoming/outgoing bubbles and timestamps.
- Added persistent message reactions (❤️, 👍, 😂, 😮, 😢, 🔥). Clicking the same reaction again removes it; choosing another changes your reaction.
- Reactions are stored with group messages in MongoDB. Only accepted group members can read messages or react.
- Chat refreshes periodically while open; this project does not require a separate socket server.

## Payment confirmation
- The order-backed payment success page now displays the payment/order status, amount, restaurant, order ID, payment reference, item summary, and Track Order / Continue Shopping actions without a demo-labelled banner.
- A success page should be reached only with an order ID that the backend can retrieve. The page no longer treats a browser-only query parameter as server-confirmed payment success.
- A locally simulated payment is not a real charge. To accept real payments, configure valid Razorpay credentials in `backend/.env` and test using Razorpay's test credentials before going live.

## Run
1. Extract the folder.
2. Create `backend/.env` using the project's setup notes; configure `MONGODB_URI`, JWT secret and any required mail/Razorpay values.
3. In a terminal, `cd backend`, run `npm install`, then `npm start`.
4. Open the site through the Express server (default port is documented in `backend/server.js`), not by opening HTML files directly.

## Validation performed
- Node syntax checks passed for the modified group-order route and message model.
- Inline JavaScript syntax checks passed for the modified group-order and payment-success pages.
- Existing voice-order matcher test suite passed (16 single-dish and 4 multi-dish cases).
- A live MongoDB/payment provider integration test was not possible in this environment; configure your own `.env` and verify with your database/provider credentials.
