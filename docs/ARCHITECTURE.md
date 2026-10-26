# Architecture

- `src/` is the React/Vite single-page application. `src/services/api.js` owns HTTP calls; browser routes render creation, investigation, accusation, and result screens.
- `server/src/` is the Express API. Controllers are expressed as route handlers; Gemini generation, schemas, Mongoose models, and error mapping are separate modules.
- Gemini is called only by `server/src/services/gemini.service.js`. Model output is parsed, schema-checked, and checked for stable IDs and references before persistence.
- MongoDB stores the public case content with a private `solution` subdocument and a SHA-256 hash of the opaque guest cookie. Explicit `safeCase` response projection omits the solution.
- Investigations store opened evidence and an immutable, server-calculated result. A conditional atomic update permits only one final accusation.
- The browser receives an HTTP-only, SameSite=Lax guest cookie. Authorization checks compare its hash on every case and investigation request.

The initial MVP omits account authentication, CSRF-sensitive cookie endpoints, external asset storage, and asynchronous generation jobs. Keep deployment on one site or configure credentialed CORS and secure HTTPS cookies deliberately.
