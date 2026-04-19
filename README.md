# ki-assistent

Ein KI-gestütztes Lernsystem mit einem **Python FastAPI-Backend** und einem **minimalen Next.js-Frontend**. Die gesamte Businesslogik liegt im Backend — das Frontend ist nur eine dünne Rendering-Schicht.

---

## Architekturprinzip

```
Browser  ←→  Next.js (nur Rendering)  ←→  FastAPI (alle Logik)  ←→  Supabase
```

- **FastAPI**: Auth, LLM-Calls, Datenbankzugriffe, Analyse-Pipeline, Profilmanagement
- **Next.js**: Server Components für SSR, `use client` nur wo unbedingt nötig (Monaco Editor, Formulare)
- **Kein Supabase-JS im Frontend** — Frontend berührt Supabase nie direkt
- **Kein Zustand-Management** — `useState` statt Zustand-Stores
- **Keine Zod-Validierung im Frontend** — FastAPI (Pydantic) validiert alles

---

## Projektstruktur

```
ki-assistent/
├── backend/                              # FastAPI Python-App
│   ├── main.py                           # App-Einrichtung, CORS, Router-Registrierung
│   ├── config.py                         # Pydantic-Settings (Env-Vars)
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example
│   ├── core/
│   │   └── supabase.py                   # Auth, JWT-Verifizierung, Profil-CRUD
│   ├── components/
│   │   ├── auth/                         # /api/auth/*
│   │   │   ├── auth_routes.py
│   │   │   ├── auth_classes.py           # Pydantic-Modelle
│   │   │   ├── auth_functions.py         # Business-Logik
│   │   │   └── auth_repository.py        # DB-Zugriff
│   │   ├── profile/                      # /api/profile/*
│   │   ├── analyze/                      # /api/analyze (LLM + Mock-Fallback)
│   │   └── data/                         # /api/data/{snippets,tasks,concepts}
│   └── data/
│       └── mock_data.py                  # Starter-Snippets, Konzepte, Aufgaben
│
├── frontend/                             # Next.js minimales Frontend
│   ├── proxy.ts                          # Cookie-Check, Route-Schutz (kein Supabase)
│   ├── next.config.js
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── .env.example
│   ├── lib/
│   │   └── api.ts                        # Server-seitige Fetch-Helfer zu FastAPI
│   ├── app/
│   │   ├── layout.tsx                    # Root-Layout (Server Component)
│   │   ├── globals.css
│   │   ├── (marketing)/page.tsx          # Landing Page
│   │   ├── (auth)/{login,register}/      # LoginForm / RegisterForm
│   │   ├── (workspace)/                  # workspace, onboarding, settings, tasks, concepts, history
│   │   └── auth/callback/route.ts        # Supabase E-Mail-Bestätigung → FastAPI exchange-code
│   └── components/
│       ├── auth/                         # LoginForm, RegisterForm
│       ├── layout/                       # SidebarNav, WorkspaceGate
│       ├── profile/ProfileForm.tsx
│       └── workspace/WorkspaceClient.tsx # Monaco Editor + POST /api/analyze
│
├── docker-compose.yml                    # Produktions-Compose (zieht Images von ghcr.io)
└── .github/workflows/deploy.yml          # Build → Push zu ghcr.io → SSH-Deploy auf Server
```

---

## Auth-Flow

```
Browser                   Next.js (SSR)              FastAPI             Supabase
   |-- POST /api/auth/login -------------------------------->                 |
   |   (credentials: include)                           |-- sign_in -------->|
   |<-- 200 + Set-Cookie (httpOnly) --------------------|<-- access_token ---|
   |
   |-- GET /workspace -------->|-- reads cookie
   |                           |-- GET /api/profile --->|
   |<-- HTML (SSR) ------------|<-- profile ------------|
   |
   |-- POST /api/analyze (credentials: include) -------->|
   |<-- {result} ----------------------------------------|<-- verify JWT ----|
```

**Prinzip:**
- Cookies werden von FastAPI gesetzt (`httpOnly`, `SameSite=Lax`)
- Browser sendet sie automatisch bei `credentials: "include"`
- Next.js Server Components lesen das Cookie aus `next/headers` und leiten es als `Bearer`-Header an FastAPI weiter

---

## Backend-Endpunkte

| Methode | Pfad | Beschreibung |
|---|---|---|
| `GET` | `/health` | Health-Check |
| `POST` | `/api/auth/login` | E-Mail/Passwort-Login, setzt Cookies |
| `POST` | `/api/auth/register` | Registrierung |
| `POST` | `/api/auth/logout` | Abmelden, löscht Cookies |
| `GET` | `/api/auth/me` | Aktueller Nutzer |
| `POST` | `/api/auth/exchange-code` | E-Mail-Bestätigung Code einlösen |
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

python -m venv venv
source venv/bin/activate
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

### Backend (`backend/.env`)

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

OPENAI_API_KEY=                      # Optional — ohne Key greift der Mock-Analyzer
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_ENABLED=true

FRONTEND_ORIGIN=http://localhost:3000
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000   # Browser-seitig (ins Bundle gebacken)
FASTAPI_URL=http://localhost:8000               # Server-seitig (SSR)
```

---

## Deployment

### Architektur

```
GitHub push → Actions                           Server
  ├─ Build backend image                        /root/ki-assistent/
  ├─ Build frontend image                       ├── docker-compose.yml
  ├─ Push → ghcr.io                             ├── backend/.env
  └─ SSH: docker compose pull && up -d   ←──────┤
                                                └── (pullt Images von ghcr.io)

Browser ──HTTPS──→ Nginx (automation-consultancy.de)
                     ├── /        → 127.0.0.1:8092 (frontend container)
                     └── /api/    → 127.0.0.1:8091 (backend container)
```

### GitHub Secrets

| Secret | Wert |
|---|---|
| `SSH_HOST` | Server-IP |
| `SSH_USER` | `root` |
| `SSH_KEY` | Privater SSH-Key (dedizierter Deploy-Key, ohne Passphrase) |
| `SSH_PORT` | Optional, default `22` |
| `NEXT_PUBLIC_FASTAPI_URL` | Öffentliche URL, z. B. `https://automation-consultancy.de` — wird **zur Build-Zeit** ins Frontend-Bundle gebacken |

### Server-Setup (`/root/ki-assistent/`)

Nur drei Dateien nötig — kein Code, keine Dockerfiles:

```
/root/ki-assistent/
├── docker-compose.yml
├── backend/.env
└── frontend/              # leer (Next.js Runtime liest keine .env im Container)
```

Einmalig, falls Packages privat sind:
```bash
docker login ghcr.io -u MertK69
# Password: Personal Access Token mit "read:packages" Scope
```
(Oder Packages public stellen → kein Login nötig.)

### Nginx

`/etc/nginx/sites-available/ki-assistenzsysteme` routet:
- `/` → `127.0.0.1:8092` (Frontend)
- `/api/` → `127.0.0.1:8091` (Backend, ohne Prefix-Strip — Routen tragen `/api/` selbst)

### Deploy auslösen

- **Automatisch:** Push zu `main`
- **Manuell:** GitHub → Actions → "Build & Deploy" → "Run workflow"

### Container-interne Netzwerk-Logik

Das Frontend macht zwei Arten von Requests:

| Code läuft | Env-Var | Zielt auf |
|---|---|---|
| Browser (`"use client"`) | `NEXT_PUBLIC_FASTAPI_URL` | `https://automation-consultancy.de` (über Nginx) |
| Next.js SSR (im Container) | `FASTAPI_URL` | `http://backend:8000` (Docker-intern, direkt) |

Dadurch umgeht SSR den Nginx-Umweg und bleibt unabhängig von DNS/SSL.

---

## Was wurde vereinfacht gegenüber dem Original (`ki-assistenzsystem`)

| Original | ki-assistent |
|---|---|
| Zustand-Store (Zustand) | `useState` in `WorkspaceClient` |
| Server Actions für Auth | Direkter `fetch` zu FastAPI |
| `@supabase/ssr` im Frontend | Kein Supabase im Frontend |
| Next.js API-Route `/api/analyze` | FastAPI-Endpunkt |
| Framer Motion Animationen | Entfernt |
| Zod-Validierung im Frontend | Entfernt (Pydantic im Backend) |
| shadcn/ui-Wrapper-Komponenten | Native HTML + Tailwind |
| Komplexes Supabase-Middleware | Einfaches Cookie-Lesen in `proxy.ts` |
