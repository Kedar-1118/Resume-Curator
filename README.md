# ATS Resume Builder

AI-powered resume builder that helps you create, optimize, and export ATS-friendly resumes. Powered by Claude AI with real-time scoring, keyword analysis, and smart bullet rewrites.

## Tech Stack

- **Frontend:** React + Vite, Tailwind CSS, shadcn/ui, Zustand, React Router
- **Backend:** Node.js + Express, Passport.js (Google OAuth), JWT, Mongoose
- **Database:** MongoDB
- **AI:** Claude API (claude-opus-4-5)
- **Export:** Puppeteer (PDF), docx (DOCX)

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Google OAuth credentials
- Anthropic API key

## Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd ats-resume-builder
```

### 2. Environment Variables

Copy the example env file to `server/.env` and fill in your values:

```bash
cp .env.example server/.env
```

### 3. Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Set Application type to **Web application**
6. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
7. Copy the **Client ID** and **Client Secret** to your `server/.env`

### 4. Anthropic API Key

1. Go to [Anthropic Console](https://console.anthropic.com)
2. Create an API key
3. Add it to `server/.env` as `ANTHROPIC_API_KEY`

### 5. Install Dependencies

```bash
# Install all dependencies (root, server, and client)
npm run install:all
```

Or install individually:

```bash
npm install          # Root (concurrently)
cd server && npm install
cd ../client && npm install
```

### 6. Start MongoDB

Make sure MongoDB is running locally on port 27017, or set `MONGODB_URI` in your `.env` to your Atlas connection string.

### 7. Start Development

```bash
npm run dev
```

This starts both the server (port 5000) and client (port 5173) concurrently.

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:5000
- **Health check:** http://localhost:5000/api/health

## Project Structure

```
ats-resume-builder/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/ui/   # shadcn/ui components
│   │   ├── pages/           # Route pages
│   │   ├── store/           # Zustand store
│   │   └── lib/             # API client, utilities
│   └── ...
├── server/                  # Express backend
│   ├── routes/              # API routes (auth, resume, ai, export)
│   ├── models/              # Mongoose schemas
│   ├── middleware/          # JWT auth middleware
│   └── index.js             # Entry point
├── CONTEXT.md               # Full project specification
├── .env.example             # Environment variable template
└── README.md                # This file
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/google` | Redirect to Google OAuth |
| GET | `/api/auth/google/callback` | OAuth callback |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/resume` | List user's resumes |
| GET | `/api/resume/:id` | Get single resume |
| POST | `/api/resume` | Create resume |
| PUT | `/api/resume/:id` | Update resume |
| DELETE | `/api/resume/:id` | Delete resume |
| POST | `/api/ai/score` | ATS score analysis |
| POST | `/api/ai/keywords` | Keyword gap analysis |
| POST | `/api/ai/rewrite` | Bullet point rewrite |
| POST | `/api/ai/summary` | Generate summary |
| POST | `/api/ai/improve` | Full resume improvement |
| POST | `/api/export/pdf` | Export as PDF |
| POST | `/api/export/docx` | Export as DOCX |

## License

MIT
