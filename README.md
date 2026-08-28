# SmartHire — AI-Powered Mock Interview & Career Readiness Platform

7th-semester MVP. Stack: MongoDB, Express, React (Vite), Node.js + Gemini AI.

## What's built (7th sem scope)

- **Auth**: signup/login with JWT + bcrypt
- **Mock Interview Engine**: pick a role/domain/difficulty → Gemini generates questions →
  answer each → Gemini scores + gives feedback → session completes with an overall
  readiness score
- **Resume Analysis**: upload a PDF → Gemini extracts skills, gives a role-match score,
  missing keywords, and suggestions
- **Dashboard**: score history chart, recent sessions, latest resume check
- **Career Resources**: static tips by track (SDE / Data Analyst / HR)

Deferred to 8th sem (by design — see project plan): voice-based interviews, video/webcam
confidence analysis, deeper analytics, peer/mentor review, gamification.

---

## 1. Prerequisites

- Node.js 18+
- A MongoDB connection string (local `mongod`, or a free MongoDB Atlas cluster)
- A Gemini API key: https://aistudio.google.com/app/apikey (free tier is enough for a demo)

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:

```
PORT=5000
MONGO_URI=<your MongoDB connection string>
JWT_SECRET=<any long random string>
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=<your Gemini API key>
CLIENT_URL=http://localhost:5173
```

Run it:

```bash
npm run dev
```

You should see `MongoDB connected` and `SmartHire API running on port 5000`.
Sanity check: open `http://localhost:5000/api/health` — should return `{"status":"ok"}`.

## 3. Frontend setup

In a new terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`.

## 4. Demo flow for Monday

1. Sign up with a target role (e.g. "SDE").
2. Go to **Mock Interview** → pick domain (DSA / System Design / Behavioral) and
   difficulty → Start. Gemini generates 5 questions live.
3. Answer 2–3 questions to show per-answer AI scoring + feedback, then finish the
   session to show the overall readiness score.
4. Go to **Resume Check** → upload any PDF resume → show the match score, detected
   skills, missing keywords, and suggestions.
5. Go to **Dashboard** → show the score trend chart and session history building up.
6. Mention **Career Resources** as the supporting static content, and that 8th sem
   will add voice-based interviews and deeper analytics.

## Project structure

```
SmartHire/
├── backend/
│   ├── config/db.js
│   ├── models/          User, Interview, Resume
│   ├── controllers/     auth, interview, resume, dashboard
│   ├── routes/
│   ├── middleware/      JWT auth guard
│   ├── services/        geminiService.js — all AI calls live here
│   └── server.js
└── frontend/
    └── src/
        ├── pages/        Login, Signup, Dashboard, Interview, Resume, CareerResources
        ├── components/   Navbar, ReadinessMeter (signature score gauge), ProtectedRoute
        ├── context/      AuthContext (JWT stored in localStorage)
        └── api/axios.js  attaches JWT to every request
```

## Notes for your presentation

- All AI logic (question generation, answer scoring, resume analysis) is isolated in
  `backend/services/geminiService.js` — easy to point to in a code walkthrough, and easy
  to extend in 8th sem without touching controllers.
- Resumes are parsed with `pdf-parse` and only the extracted text is sent to Gemini —
  the raw file is deleted from disk right after.
- If Gemini's free-tier rate limit gets hit during a live demo, wait ~60 seconds between
  question generations, or pre-run one full session beforehand as a backup screenshot.
