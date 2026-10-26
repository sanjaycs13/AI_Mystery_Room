# API

All endpoints use JSON. Responses use `{ "success": true, "data": ... }` or `{ "success": false, "error": { "code", "message", "details" } }`. Guest case ownership uses the opaque `mystery_guest` HTTP-only cookie set on first generation. Keep credentials in the browser cookie jar; case IDs alone do not grant access.

| Method and route | Purpose |
|---|---|
| `GET /api/health` | API and MongoDB status |
| `POST /api/cases/generate` | Validate scenario (30–2,000 chars), generate and validate case, persist private solution; returns case ID, status, title, and difficulty |
| `GET /api/cases/:caseId` | Get owner-authorized public case (never solution) |
| `GET /api/cases/:caseId/evidence` | Get owner-authorized evidence |
| `POST /api/cases/:caseId/investigations` | Start or resume an active investigation |
| `PATCH /api/investigations/:investigationId/progress` | Save evidence opened by owner |
| `POST /api/investigations/:investigationId/accusations` | Submit the one final suspect ID and receive server-checked result |
| `GET /api/investigations/:investigationId/result` | Read result after completion |

Generation is synchronous (HTTP 201), rate-limited to 3 requests per minute per IP, and bounded by Gemini timeout and retry settings. Errors include `VALIDATION_ERROR`, `UNAUTHORIZED`, `CASE_NOT_FOUND`, `INVALID_SUSPECT`, `ALREADY_COMPLETED`, `AI_GENERATION_FAILED`, `AI_SERVICE_UNAVAILABLE`, and `RATE_LIMITED`. Authentication and hints are not part of this MVP.
