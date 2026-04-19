# learnsystem — CodeMentor Learn (FastAPI-Klon)

Ein vollständiger Klon des `ki-assistenzsystem`-Projekts mit einem **Python FastAPI-Backend** und einem **minimalen Next.js-Frontend**. Die gesamte Businesslogik liegt im Backend — das Frontend ist nur eine dünne Rendering-Schicht.

---

## Architekturprinzip

```
Browser  ←→  Next.js (nur Rendering)  ←→  FastAPI (alle Logik)  ←→  Supabase
```

- **FastAPI**: Auth, LLM-Calls, Datenbankzugriffe, Analyse-Pipeline, Profilmanagement
- **Next.js**: Server Components für SSR, `use client` nur wo unbedingt nötig (Monaco Editor, Formulare)
- **Kein Supabase-JS im Frontend** — Frontend berührt Supabase nie direkt
- **Kein Zustand-Management** — `useState` statt Zustand-Stores, kein Zustand
- **Keine Zod-Validierung im Frontend** — FastAPI (Pydantic) validiert alles

---

## Projektstruktur

```
learnsystem/
├── backend/                        # FastAPI Python-App
│   ├── main.py                     # App-Einrichtung, CORS, Router-Registrierung
│   ├── config.py                   # Pydantic-Settings (Env-Vars)
│   ├── requirements.txt
│   ├── .env.example
│   ├── models/
│   │   ├── analysis.py             # Pydantic-Modelle: AnalyzeRequest, AnalysisResult, Hint
│   │   └── profile.py              # QualificationProfile, ProfileUpsertRequest
│   ├── services/
│   │   ├── llm.py                  # OpenAI HTTP-Client, Prompts, Learner-Context-Block
│   │   ├── mock_analyzer.py        # Mock-Analyse-Fallback (5 Szenarien)
│   │   └── supabase.py             # Auth, JWT-Verifizierung, Profil-CRUD
│   ├── routers/
│   │   ├── auth.py                 # /api/auth/{login,register,logout,me,exchange-code}
│   │   ├── analyze.py              # POST /api/analyze
│   │   ├── profile.py              # GET/PUT /api/profile
│   │   └── data.py                 # GET /api/data/{snippets,tasks,concepts}
│   └── data/
│       └── mock_data.py            # Starter-Snippets, Konzepte, Aufgaben, Fallback-Analyse
│
└── frontend/                       # Next.js minimales Frontend
    ├── middleware.ts                # Cookie-Check, Route-Schutz (kein Supabase)
    ├── next.config.js
    ├── tsconfig.json               # strict: false — nur nötiges TypeScript
    ├── .env.example
    ├── lib/
    │   └── api.ts                  # Server-seitige Fetch-Helfer zu FastAPI
    ├── app/
    │   ├── layout.tsx              # Root-Layout (Server Component)
    │   ├── globals.css
    │   ├── (marketing)/page.tsx    # Landing Page (Server Component, kein "use client")
    │   ├── (auth)/
    │   │   ├── layout.tsx          # Auth-Layout (Server Component)
    │   │   ├── login/page.tsx      # Rendert LoginForm
    │   │   └── register/page.tsx   # Rendert RegisterForm
    │   ├── (workspace)/
    │   │   ├── layout.tsx          # Liest Cookie, ruft FastAPI auf, rendert Sidebar
    │   │   ├── workspace/page.tsx  # Snippets + Profil via FastAPI laden → WorkspaceClient
    │   │   ├── onboarding/page.tsx # Profil laden → ProfileForm
    │   │   ├── settings/page.tsx   # Profil laden → ProfileForm
    │   │   ├── tasks/page.tsx      # Aufgaben via FastAPI laden (reines SSR)
    │   │   ├── concepts/page.tsx   # Konzepte via FastAPI laden (reines SSR)
    │   │   └── history/page.tsx    # Mock-Verlauf (statisch)
    │   └── auth/callback/route.ts  # Supabase E-Mail-Bestätigung → FastAPI exchange-code
    └── components/
        ├── auth/
        │   ├── LoginForm.tsx       # "use client" — fetch zu FastAPI /api/auth/login
        │   └── RegisterForm.tsx    # "use client" — fetch zu FastAPI /api/auth/register
        ├── layout/
        │   ├── SidebarNav.tsx      # "use client" — Logout via FastAPI
        │   └── WorkspaceGate.tsx   # "use client" — Onboarding-Redirect
        ├── profile/
        │   └── ProfileForm.tsx     # "use client" — PUT /api/profile
        └── workspace/
            └── WorkspaceClient.tsx # "use client" — Monaco Editor + POST /api/analyze
```

---

## Auth-Flow

```
Browser                   Next.js (SSR)              FastAPI             Supabase
   |                           |                         |                   |
   |-- POST /api/auth/login -------------------------------->                 |
   |   (fetch, credentials: include)                    |-- sign_in -------->|
   |<-- 200 + Set-Cookie (httpOnly) --------------------|<-- access_token ---|
   |   sb-access-token                                  |                   |
   |   sb-refresh-token                                 |                   |
   |                           |                        |                   |
   |-- GET /workspace -------->|                        |                   |
   |   (Cookies auto-gesendet) |-- reads cookie         |                   |
   |                           |-- GET /api/profile --->|                   |
   |                           |<-- profile ------------|                   |
   |<-- HTML (SSR) ------------|                        |                   |
   |                           |                        |                   |
   |-- POST /api/analyze (credentials: include) -------->|                  |
   |   (Cookies auto-gesendet)                          |-- verify JWT ---->|
   |<-- {result} ----------------------------------------|<-- user_id ------|
```

**Prinzip:**
- Cookies werden von FastAPI gesetzt (`httpOnly`, `SameSite=Lax`)
- Browser sendet sie automatisch bei `credentials: "include"`
- Next.js Server Components lesen das Cookie aus `next/headers` und leiten es als `Bearer`-Header an FastAPI weiter
- Next.js berührt Supabase nie direkt

---

## Backend-Endpunkte

| Methode | Pfad | Beschreibung |
|---|---|---|
| `GET` | `/health` | Health-Check |
| `POST` | `/api/auth/login` | E-Mail/Passwort-Login, setzt Cookies |
| `POST` | `/api/auth/register` | Registrierung |
| `POST` | `/api/auth/logout` | Abmelden, löscht Cookies |
| `GET` | `/api/auth/me` | Aktueller Nutzer (user_id, email) |
| `POST` | `/api/auth/exchange-code` | Supabase E-Mail-Bestätigung Code einlösen |
| `GET` | `/api/profile` | Lernerprofil lesen |
| `PUT` | `/api/profile` | Lernerprofil upserten |
| `POST` | `/api/profile/reset-onboarding` | Onboarding zurücksetzen |
| `POST` | `/api/analyze` | Code analysieren (LLM + Mock-Fallback) |
| `GET` | `/api/data/snippets` | Starter-Snippets |
| `GET` | `/api/data/tasks` | Lernaufgaben |
| `GET` | `/api/data/concepts` | Konzeptbibliothek |

---

## Lokale Entwicklung

### Backend

```bash
cd backend
cp .env.example .env
# .env ausfüllen

python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

uvicorn main:app --reload --port 8000
```

Swagger UI: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
cp .env.example .env.local
# NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000

npm install
npm run dev
```

App: `http://localhost:3000`

---

## Umgebungsvariablen

### Backend (`.env`)

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

OPENAI_API_KEY=          # Optional — ohne Key wird Mock-Analyzer genutzt
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_ENABLED=true

FRONTEND_ORIGIN=http://localhost:3000
```

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000   # Browser-seitiger Zugriff
FASTAPI_URL=http://localhost:8000                # Server-seitiger Zugriff (SSR)
```

---

## Was wurde vereinfacht gegenüber dem Original

| Original (ki-assistenzsystem) | learnsystem |
|---|---|
| Zustand-Store (Zustand) | `useState` in `WorkspaceClient` |
| Server Actions für Auth | Direkter `fetch` zu FastAPI |
| Server Actions für Profil | Direkter `fetch` zu FastAPI |
| `@supabase/ssr` im Frontend | Kein Supabase im Frontend |
| Next.js API-Route `/api/analyze` | FastAPI-Endpunkt |
| Framer Motion Animationen | Entfernt |
| Zod-Validierung im Frontend | Entfernt (Pydantic im Backend) |
| shadcn/ui-Wrapper-Komponenten | Native HTML + Tailwind |
| `WorkspaceSessionContext` | E-Mail als Prop aus Server-Layout |
| Komplexes Middleware mit Supabase | Einfaches Cookie-Lesen |
# ki-assistent
