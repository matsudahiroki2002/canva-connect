# Canva Connect Token Proxy

Serverless proxy on Vercel Edge Runtime for exchanging OAuth authorization codes with Canva, plus a health-check endpoint to verify environment variable configuration.

## Endpoints

- `GET /api/ping` – Returns JSON showing whether `CANVA_CLIENT_ID` and `CANVA_CLIENT_SECRET` are configured in the deployment environment.
- `POST /api/token` – Accepts Canva OAuth parameters (`grant_type`, `code`, `redirect_uri`, `code_verifier`), forwards them to `https://www.canva.com/api/oauth/token`, and returns Canva's response transparently.

## Deployment

1. Deploy the `canva-connect` directory to Vercel (Git integration or `vercel deploy`).
2. In Vercel Project Settings → Environment Variables, set `CANVA_CLIENT_ID` and `CANVA_CLIENT_SECRET` for production.
3. After deployment, confirm environment variables via `https://<project>.vercel.app/api/ping` (expect `{"ok":true,...}`).
4. Exchange Canva authorization codes by sending a POST request to `/api/token` with the required body fields.

## Local testing

Edge Runtime functions in this project rely on Vercel's runtime. You can use `vercel dev` for local testing if needed.
