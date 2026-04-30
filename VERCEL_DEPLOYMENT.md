# Production Deployment

This repository is configured for the production layout that fits the app:

| Part | Host |
| --- | --- |
| Frontend React/Vite | Vercel |
| Backend Express + Socket.IO API | Render, Railway, Fly.io, or another persistent Node host |
| AI FastAPI service | Render, Railway, Fly.io, or another persistent Python host |
| Database | MongoDB Atlas |

## Deploy Frontend To Vercel

1. Push this repository to GitHub.
2. In Vercel, choose **Add New Project** and import the repository.
3. Use these project settings:

| Setting | Value |
| --- | --- |
| Framework Preset | Vite |
| Install Command | `npm install` |
| Build Command | `npm run client:build` |
| Output Directory | `dist` |

4. Add these environment variables in Vercel:

| Key | Value |
| --- | --- |
| `VITE_APP_API_URL` | `https://YOUR_BACKEND_HOST/api` |
| `VITE_SERVER_URL` | `https://YOUR_BACKEND_HOST` |
| `VITE_APP_AI_URL` | `https://YOUR_AI_SERVICE_HOST` |

5. Deploy.

## Deploy Backend API

Use a persistent Node host for `server/`. Render can use the existing `render.yaml`, or you can configure the service manually:

| Setting | Value |
| --- | --- |
| Root Directory | `server` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

Set these backend environment variables:

| Key | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | MongoDB Atlas URI, for example `mongodb+srv://.../cycles?retryWrites=true&w=majority` |
| `JWT_SECRET` | A long random secret |
| `JWT_EXPIRES_IN` | `7d` |
| `CLIENT_URL` | Your Vercel frontend URL |
| `SERVER_URL` | Your backend URL |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Your Gmail address |
| `SMTP_PASS` | Your Gmail app password |
| `SMTP_FROM` | Your Gmail address |
| `STRIPE_SECRET_KEY` | Optional, required for real Stripe payments |
| `STRIPE_WEBHOOK_SECRET` | Optional, required for Stripe webhooks |

After the frontend deploys, set the backend `CLIENT_URL` environment variable to your Vercel URL, for example:

```text
CLIENT_URL=https://your-project.vercel.app
```

Then redeploy the backend so CORS allows the Vercel frontend.

## Deploy AI Service

Use a persistent Python host for `ai-service/`:

| Setting | Value |
| --- | --- |
| Root Directory | `ai-service` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

Set the frontend `VITE_APP_AI_URL` to this AI service URL.

## MongoDB Atlas

Create a MongoDB Atlas cluster and use a URI with the `cycles` database name:

```text
mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/cycles?retryWrites=true&w=majority
```

Put that value in the backend host as `MONGODB_URI`.
