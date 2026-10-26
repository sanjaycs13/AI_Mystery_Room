# AI Mystery Room

AI Mystery Room turns a short fictional scenario into a detective case. Review the suspects and simulated evidence, make one final accusation, and see the server-checked result.

## Requirements

- Node.js 20 or newer and npm
- MongoDB local instance or MongoDB Atlas database
- A Google Gemini API key

## Run locally

1. Copy `.env.example` to `.env` and provide `MONGODB_URI` and `GEMINI_API_KEY`. Keep the Gemini key on the backend; never prefix it with `VITE_`.
2. Install dependencies with `npm install`.
3. Run `npm run dev` to start the Vite frontend and Express API.
4. Open `http://localhost:5173`.

The API listens on port 5000 by default. Set `CLIENT_ORIGIN` to the frontend origin if it changes. Vite proxies `/api` requests to the API in development. For a production deployment, build the frontend with `npm run build` and deploy it to a static host; run the backend on a Node-compatible host with its own environment variables and MongoDB connection. Configure the production frontend origin, HTTPS, and secure cookies on the backend.

## Environment variables

Set the backend environment variables described in the setup configuration. The backend requires `MONGODB_URI`; generation requires `GEMINI_API_KEY`. `GEMINI_MODEL` and comma-separated `GEMINI_FALLBACK_MODELS` are configurable. Transient provider failures use bounded retries with backoff and model fallback. `VITE_API_BASE_URL` is a public API address only; never put secrets in a `VITE_` variable.

## API and project notes

See [docs/API.md](docs/API.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md), and [docs/TESTING.md](docs/TESTING.md). Cases and evidence are fictional simulations. Guest ownership depends on an opaque, HTTP-only browser cookie; clearing it loses access to the guest case.

Authentication, account history, hints, image generation, multiplayer, and real video are outside this initial MVP. CCTV records are clearly presented as simulations; no fake playable video is shown.
