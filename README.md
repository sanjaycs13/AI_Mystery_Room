# AI Mystery Room

AI Mystery Room turns a short fictional scenario into a detective case. Review suspects and simulated evidence, make one final accusation, and see the server-checked result.

## Local setup

1. Copy `.env.example` to `.env` and set `MONGODB_URI` and `GEMINI_API_KEY`.
2. Install packages with `npm ci` (or `npm install` if there is no lockfile).
3. Start the app with `npm run dev` and open `http://localhost:5173`.

The API listens on port 5000. Keep Gemini credentials on the backend; never put secrets in `VITE_` variables. Vite proxies local `/api` requests to Express.

## Deployment walkthrough

The checked-in deployment setup targets a Vercel static frontend, Render Node API, and MongoDB Atlas. Follow [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) in order. The Vercel rewrite keeps the API and browser on one origin so the guest ownership cookie works with `SameSite=Lax`.

The Render Blueprint currently selects its Free service plan for a demo deployment. Free services can sleep after 15 minutes without traffic and take about a minute to wake; for a production experience, change `plan: free` to an available paid plan in `render.yaml` or the Render Dashboard before deploying.

## Environment variables

Backend variables are listed in `.env.example`. `MONGODB_URI` and `GEMINI_API_KEY` are secrets. `GEMINI_MODEL` and comma-separated `GEMINI_FALLBACK_MODELS` configure generation. Frontend `VITE_API_BASE_URL` is public configuration; production uses `/api` through the Vercel rewrite.

## Architecture and API

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/API.md](docs/API.md), and [docs/TESTING.md](docs/TESTING.md). Cases and evidence are fictional simulations. Guest ownership depends on an opaque HTTP-only browser cookie; clearing it loses access to that guest case. Authentication, saved account history, hints, image generation, multiplayer, and real video are outside this MVP.
