# KibaliGuard — Digital Recruitment and Consent Management Platform

**Tagline:** Apply with confidence. Your data stays yours.
**Built by:** Cheryl Atieno Odhiambo, Zetech University, Cheryl Kreativ Studio

This is a full rebuild of every file from our chat conversation, reconstructed
from scratch into a real project folder. Follow the steps below in order.

---

## 1. What you need to do FIRST

### A. Add Kiba's images
Go to `frontend/public/images/` and drop in your 9 mascot images named
exactly `pose1.png` through `pose9.png`. The app already references these
paths everywhere, so they will show up automatically once added.

### B. Create your real `.env` files

**Backend** - copy `backend/.env.example` to `backend/.env` and fill in your
real values:

```
MONGO_URI=your_real_mongodb_atlas_connection_string
JWT_SECRET=kibaliGuard_super_secret_jwt_key_2024
PORT=5000
RESEND_API_KEY=your_real_resend_key
GEMINI_API_KEY=your_real_gemini_key
FRONTEND_URL=http://localhost:3000
```

**Frontend** - only needed if testing on your phone. Copy
`frontend/.env.example` to `frontend/.env` and uncomment the line, replacing
the IP with your laptop's real network IP (find it with `ipconfig` in CMD,
look for IPv4 Address under your WiFi adapter):

```
REACT_APP_API_URL=http://192.168.x.x:5000
```

Leave this file absent or commented out for normal laptop-only testing,
the app defaults to `http://localhost:5000` automatically.

---

## 2. Install dependencies

Open Command Prompt, run:

```
cd "path\to\kibaliGuard\backend"
npm install
```

Open Git Bash, run:

```bash
cd "path/to/kibaliGuard/frontend"
npm install
```

---

## 3. Run the project

CMD (backend):
```
cd "path\to\kibaliGuard\backend"
npm run dev
```
Wait for: `KibaliGuard server running on port 5000` and `MongoDB connected`.

Git Bash (frontend):
```bash
cd "path/to/kibaliGuard/frontend"
npm start
```
Your browser opens automatically at `http://localhost:3000`.

---

## 4. First-time setup inside the app

1. Register an Administrator account.
2. In the Admin Dashboard, Companies tab, create a company.
3. Register a Staff / HR Officer account (use a different browser or
   logout/login between accounts).
4. Back in Admin, Companies tab, assign the staff member to the company.
5. Login as staff, Post a Job with required documents listed.
6. Register/login as a Customer, browse jobs on the landing page, apply,
   upload documents, and set consent rules.
7. Login as staff, Request Access tab, select the customer, use the
   EXACT purpose text the customer used when applying, select matching
   documents, submit. This should show GRANTED.
8. Try a different purpose, should show DENIED.
9. Login as the customer, Access Logs shows both attempts.

---

## 5. Project structure

```
kibaliGuard/
  backend/
    config/         (db connection, notification templates, multer)
    middleware/      (JWT auth middleware)
    models/           (Mongoose schemas)
    routes/            (all API routes)
    scripts/            (backfillIds.js utility)
    .env.example
    package.json
    server.js
  frontend/
    public/
      images/        (PUT pose1.png through pose9.png HERE)
      index.html
    src/
      components/    (Navbar, Footer, KibaShield, NotificationBell, KibaReminder)
      context/        (AuthContext)
      pages/           (all 13 pages: Landing, Login, Register, dashboards, etc)
      Icons.js          (shared SVG icon library, no emojis used in core UI)
      App.js
      index.js
```

---

## 6. Known things to double check after setup

- Gemini model name: currently set to `gemini-2.5-flash` in
  `backend/routes/chatRoutes.js`. If Google retires this model again in the
  future, run the diagnostic command from our chat history to find an
  available model name and swap it in. Kiba has a built-in fallback that
  answers using real database data even if Gemini fails entirely, so the
  chat will never show a broken error during a demo.
- Resend email: free tier only sends to your own verified sender email
  unless you verify a custom domain. Verify your Gmail under Resend,
  Emails, to receive password reset OTP codes during testing.
- Firewall (for phone testing): Windows Firewall may block incoming
  connections to port 5000 from other devices. Add an inbound rule for
  TCP port 5000 if login/register fails from your phone.

---

## 7. Deployment (when ready)

- Backend goes on Render. Root directory: `backend`. Build command: `npm install`.
  Start command: `npm start`. Add all env vars from your `.env` file.
- Frontend goes on Vercel. Root directory: `frontend`. Add env var
  `REACT_APP_API_URL` pointing to your deployed Render backend URL.
- Replace any remaining `http://localhost:5000` references before final push
  (the codebase already uses `process.env.REACT_APP_API_URL` everywhere with
  a localhost fallback, so this should be automatic once the env var is set).
- Set up UptimeRobot to ping your Render backend's `/ping` endpoint every
  5 minutes to prevent it from sleeping on the free tier.

Good luck with your presentation!
