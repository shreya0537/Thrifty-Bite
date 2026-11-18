# Thrifty Kitchen — server-side dashboard guide

This project already has a restaurant dashboard (`frontend/restaurant-dashboard.html`) and a master-chef dashboard (`frontend/chef-dashboard.html`). These are role-specific screens, not the Node server itself.

## Run the backend
1. Open PowerShell in `backend`.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and set `MONGODB_URI` to your own MongoDB Atlas URI. Set a strong `JWT_SECRET`. Never commit `.env`.
4. Run `npm run dev`.
5. Open `http://localhost:5500`.

## Open Thrifty Kitchen
- Create a restaurant account from Register (choose **Restaurant**), then sign in with it. The login workflow should route restaurant users to `restaurant-dashboard.html`.
- The restaurant dashboard is for managing restaurant-side menu/order activity exposed by the existing API.
- A Master Chef account uses `chef-dashboard.html`.
- To add a dedicated Thrifty Kitchen admin account, do not make public registration grant `ADMIN`; create the role manually through a controlled database/admin process.

## Group chat flow
1. Both users must be customers and accepted friends.
2. Sender uses Group Orders → Group Invites & Chat → Send group request.
3. Recipient accepts the invitation. The private chat becomes available and is stored in MongoDB.
4. Use the normal group order menu to select dishes and participants. Messages refresh every 4 seconds; this is polling-based chat, not WebSocket realtime.

## Security note
The `.env.example` is a placeholder only. If a real database password was previously shared in a project ZIP, rotate it in MongoDB Atlas before public deployment.
