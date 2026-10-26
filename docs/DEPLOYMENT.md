# Deployment walkthrough

This setup uses Vercel for the Vite frontend, Render for Express, and MongoDB Atlas for persistent case data. The frontend sends `/api` requests through a Vercel external rewrite to Render. The browser therefore sees the API and UI as one origin, which lets the guest ownership cookie remain host-only, `Secure`, and `SameSite=Lax`.

## 1. Prepare the repository

1. Make sure the project is in a GitHub repository and that your latest code is pushed to the branch you want to deploy.
2. Confirm `.env` is not committed. `.gitignore` excludes it; only `.env.example` belongs in Git.
3. Do not copy credentials into `render.yaml`, Vercel settings files, or GitHub. Add secrets in the hosting dashboards.

## 2. Create the MongoDB Atlas database

1. Create an Atlas project and cluster, then create a **database user** with a strong password. Use a separate database user for this app, not an Atlas account password.
2. In Atlas, choose **Connect → Drivers**, copy the Node.js connection URI, replace the password placeholder, and select a database name such as `ai-mystery-room`. URL-encode special characters in the database password.
3. Keep the URI private. Create a fresh database password if any earlier credential was exposed.

Atlas only accepts connections from its IP access list. We'll add Render's outbound ranges after creating the Render service, since its dashboard shows the region-specific ranges. ([Atlas IP access list](https://www.mongodb.com/docs/atlas/security/ip-access-list/), [Render outbound IP ranges](https://render.com/docs/outbound-ip-addresses))

## 3. Deploy the API to Render

1. In Render, choose **New → Blueprint** and connect the repository containing `render.yaml`.
2. Select the repository's root directory and the deployment branch, then create the Blueprint. The file configures `npm ci`, `npm start`, and `/api/health` as the health check.
3. Enter the requested secret values in Render:
   - `MONGODB_URI`: the Atlas URI from Step 2.
   - `GEMINI_API_KEY`: your Gemini Developer API key.
   - `CLIENT_ORIGIN`: set this after Vercel deploys in Step 5. If Render requires an initial value, use the expected Vercel origin and correct it later.
4. Note the service URL from the Render deploy log (for this deployment: `https://ai-mystery-room-4eki.onrender.com`) and open the service's **Connect → Outbound** panel.
5. In Atlas **Network Access → IP Access List**, add every outbound CIDR range shown for this Render service's region. The initial Render deploy may fail its database connection while Atlas is still allowlisting; after adding the ranges, trigger a redeploy.
6. Visit `https://<your-render-host>/api/health`. It should return JSON with `status: "ok"` and `database: "connected"`.

The Render URL can differ from the Blueprint service name; `vercel.json` is set to the URL from this deployment. If Render assigns a different host later, update the API rewrite destination in `vercel.json`. Render Blueprints support secret prompts using `sync: false` and HTTP health checks. ([Blueprint reference](https://render.com/docs/blueprint-spec), [health checks](https://render.com/docs/health-checks))

## 4. Deploy the frontend to Vercel

1. In Vercel, choose **Add New → Project** and import the same GitHub repository.
2. Leave the project root at the repository root. Vercel should detect Vite; use build command `npm run build` and output directory `dist` if it asks.
3. Add the frontend environment variable for **Production** (and Preview if desired):

   | Name | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `/api` |

4. Deploy. The `vercel.json` rewrite proxies `/api/*` to Render, and its catch-all rewrite serves React Router routes such as `/case/:caseId/result`.
5. Copy the deployed Vercel origin, for example `https://mystery-room.vercel.app`.

Vercel external rewrites forward requests without changing the browser-visible URL, which is why the API cookie stays on the frontend host. ([Vercel rewrites](https://vercel.com/docs/routing/rewrites))

## 5. Set the exact production origin on Render

1. In the Render API service, open **Environment** and set `CLIENT_ORIGIN` to the Vercel origin, with no trailing slash. If you use a custom domain too, separate origins with commas, for example `https://mystery-room.vercel.app,https://play.example.com`.
2. Save the change and redeploy/restart the Render service.
3. If you changed the Render service hostname, ensure `vercel.json` points at the final Render host, push that change, and wait for Vercel to redeploy.

`CLIENT_ORIGIN` is an allowlist. Do not use `*` for credentialed requests. The app's guest cookie is HTTP-only, secure in production, and SameSite=Lax; the same-origin proxy means it does not need third-party cookie access.

## 6. Verify the deployed user journey

1. Open the Vercel URL and check that the landing page loads.
2. Open `https://<vercel-host>/api/health`; it should show a connected database through the proxy.
3. Create a case with a scenario of at least 30 characters. The first request sets the guest cookie.
4. Open evidence, refresh the case page, and confirm the same browser can still access the case.
5. Submit one accusation and confirm results load. Opening a case URL in a different browser should not grant access.
6. If generation fails, inspect Render logs. Provider 429/5xx responses are reported as a temporary Gemini outage; check your model setting and Gemini API availability.

## 7. Custom domain (optional)

Add the custom domain in Vercel and complete its DNS instructions. Then add that exact HTTPS origin to Render's comma-separated `CLIENT_ORIGIN`. The browser still uses `/api`, so no frontend API URL change is needed.

## Free-plan caveat

The included Render Blueprint uses the Free web-service plan to make trying the walkthrough possible without selecting a paid plan. Render Free services sleep after 15 minutes idle and can take about a minute to wake, and Render advises against Free instances for production. Change the service plan to a paid tier if you need consistently available API responses. ([Render Free services](https://render.com/docs/free))
