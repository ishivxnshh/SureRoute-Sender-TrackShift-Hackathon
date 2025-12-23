# Deployment Guide

This guide explains how to deploy the SureRoute application using Render (Backend) and Vercel (Frontend).

## Prerequisites

1.  **GitHub Repository**: Push this project to a GitHub repository.
2.  **MongoDB Atlas**: You need a hosted MongoDB database. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
3.  **Redis (Optional)**: If you want to use Redis for caching/queueing in production, you can use [Redislabs](https://redis.com/try-free/) or Render's Redis service.

---

## Part 1: Backend Deployment (Render)

We will deploy the `backend` folder as a Node.js Web Service on Render.

1.  Go to [Render Dashboard](https://dashboard.render.com/).
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub repository.
4.  Configure the service:
    *   **Name**: `sureroute-backend` (or similar)
    *   **Root Directory**: `backend`
    *   **Environment**: `Node`
    *   **Region**: Choose one close to you.
    *   **Build Command**: `npm install`
    *   **Start Command**: `npm start`
5.  **Environment Variables**:
    Current `.env.example` keys you need to set:
    *   `MONGODB_URI`: Your MongoDB connection string (e.g., `mongodb+srv://user:pass@...`)
    *   `MONGODB_DB`: `sureroute`
    *   `JWT_SECRET`: A long random string.
    *   `FRONTEND_BASE_URL`: The URL of your future frontend (you can update this later after deploying Vercel).
    *   `PORT`: `10000` (Render sets this automatically, but good to know).

6.  Click **Create Web Service**.
    *   Wait for the deployment to finish.
    *   **Copy the SERVICE URL** (e.g., `https://sureroute-backend.onrender.com`). You will need this for the Frontend.

---

## Part 1.5: Configure Google Authentication

Your Google Auth will fail if it's still pointing to `localhost`.

1.  **Google Cloud Console**:
    *   Go to your Google Cloud Console -> APIs & Services -> Credentials.
    *   Edit your OAuth 2.0 Client ID.
    *   **Add Authorized Redirect URI**: `https://YOUR-BACKEND-URL.onrender.com/auth/google/callback`
    *   (Make sure `https://YOUR-BACKEND-URL.onrender.com` is also in "Authorized JavaScript origins" if you use the client-side library, though our flow is server-side mostly).

2.  **Render Environment Variables**:
    *   Go back to your Service on Render -> Environment.
    *   Update `GOOGLE_REDIRECT_URI` to match exactly: `https://YOUR-BACKEND-URL.onrender.com/auth/google/callback`
    *   **Redeploy** (or typically updating env vars triggers a restart).

---

## Part 2: Frontend Deployment (Vercel)

We will deploy the `frontend` folder to Vercel.

1.  Go to [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository.
4.  Configure the project:
    *   **Root Directory**: User `Edit` to select `frontend`.
    *   **Framework Preset**: `Vite` (should be auto-detected).
    *   **Build Command**: `npm run build` (default).
    *   **Output Directory**: `dist` (default).
5.  **Environment Variables**:
    Expand the "Environment Variables" section and add:
    *   `VITE_API_BASE_URL`: `https://YOUR-BACKEND-URL.onrender.com/api` (Replace with your actual backend URL)
    *   `VITE_WS_URL`: `https://YOUR-BACKEND-URL.onrender.com` (Same URL, no `/api` suffix)

6.  Click **Deploy**.

---

## Part 3: Final Configuration

1.  Once Vercel is deployed, copy your **Frontend URL** (e.g., `https://sureroute-frontend.vercel.app`).
2.  Go back to **Render** -> **Environment** settings for your backend.
3.  Update/Add `FRONTEND_BASE_URL` to equal your new Vercel URL.
4.  **Redeploy** the backend (Manual Deploy -> Clear build cache & deploy, or just trigger a deploy) to ensure it picks up the new variable (useful for CORS/Auth redirects).

## Troubleshooting

*   **CORS Errors**: If you see CORS errors in the browser console, checking the Backend logs on Render. Ensure `cors` is configured to accept requests from your Vercel domain.
*   **Connection Refused**: Ensure your `VITE_API_BASE_URL` generally does NOT have a trailing slash, or if it does, ensure the code handles it. Our code expects `.../api`, so `https://backend.com/api` is correct.
