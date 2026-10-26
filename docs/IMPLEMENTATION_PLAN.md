# Implementation plan

## MVP status

- [x] Repository inspected; no application existed, so a new client/server structure was created.
- [x] Frontend/backend foundation and MongoDB connection.
- [x] Case models, request validation, public case projection, and private solution storage.
- [x] Backend Gemini JSON generation, local output checks, bounded retries, and generation rate limit.
- [x] Guest case creation, evidence investigation, accusation, and results routes.
- [x] Landing, creation, case investigation, evidence views, accusation, and results screens.
- [x] Setup, architecture, API, and testing documentation.
- [ ] Add and execute the automated test suite.
- [ ] Run against a configured MongoDB and Gemini key; perform desktop/mobile browser verification.
- [ ] Optional P1 accounts, dashboard/history, hints, and score history.

## Known MVP limitations

Generated case logical quality cannot be guaranteed by schema validation alone. Generated evidence relationships and timeline order receive structural/reference checks, but not independent semantic adjudication. User scenario safety relies on the controlled prompt and fictionalization requirements; add a dedicated moderation provider before accepting high-risk public traffic. Generation is synchronous. Guest data access depends on retaining the browser cookie.
