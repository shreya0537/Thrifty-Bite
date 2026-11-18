# Livya Final Project — Thrifty Bite

## Run on Windows

1. Extract the complete `Livya-Final-Project` folder.
2. Open PowerShell in `Livya-Final-Project\backend`.
3. Install dependencies:
   ```powershell
   npm install
   ```
4. Create your private environment file:
   ```powershell
   Copy-Item .env.example .env
   ```
5. Open `backend\.env` and replace the placeholder `MONGODB_URI` with your own MongoDB Atlas connection string. Keep `PORT=5500` and set a long private `JWT_SECRET`.
6. Start the backend:
   ```powershell
   npm run dev
   ```
7. Wait for `MongoDB connected successfully` and `Thrifty Bite server running at http://localhost:5500`.
8. Open `http://localhost:5500/register.html` in your browser.

## Registration workflow

- Register form posts to `POST /api/auth/register` served by `backend/routes/authRoutes.js`.
- Server normalizes and validates email, validates the 10-digit Indian mobile number, checks existing email/mobile, hashes the password with bcrypt, and saves the account in MongoDB.
- A duplicate email/mobile receives a conflict response and an explanatory message.
- On successful creation, the register page displays a success message and redirects to `login.html`.
- The login page uses `POST /api/auth/login`; use the same email and password you registered with.

## Security notes

- Do not commit or share `.env`; it contains private credentials.
- Passwords should be stored only as bcrypt hashes. Do not manually insert plaintext passwords.
- The client-side checks improve usability, but the backend checks are authoritative.
- Browser location, map tiles, and email OTP functions require browser permissions or valid external configuration as applicable.

## If MongoDB does not connect

- Check that `MONGODB_URI` is present and correct in `backend\.env`.
- In MongoDB Atlas, allow your current IP under Network Access and confirm the database user/password.
- Do not paste secrets into chat or screenshots.
