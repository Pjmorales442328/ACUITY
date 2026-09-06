# AcuityVoice - Cloud Deployment Guide ☁️

This guide explains how to deploy **AcuityVoice** to the cloud so you have a public, working URL (required for your [lablab.ai hackathon submission](https://lablab.ai/delivering-your-hackathon-solution)).

The application is cloud-ready with native WebSocket support, production Docker containerization, and configuration files for **Render** and **Railway**.

---

## Option 1: Render (Recommended — Free & Easiest)

Render provides free hosting with full native support for persistent WebSockets and HTTPS.

### Step-by-Step Instructions:
1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: AcuityVoice initial cloud release"
   git remote add origin https://github.com/YOUR_USERNAME/acuityvoice.git
   git branch -M main
   git push -u origin main
   ```

2. **Create a Web Service on Render**:
   * Go to [dashboard.render.com](https://dashboard.render.com) and sign in.
   * Click **New +** $\rightarrow$ **Web Service**.
   * Connect your `acuityvoice` GitHub repository.

3. **Configure Settings**:
   * **Name**: `acuityvoice` (or any name you prefer)
   * **Region**: US East (Ohio) or Oregon (closest to AssemblyAI US agent servers)
   * **Language / Runtime**: `Python 3` (or `Docker`)
   * **Branch**: `main`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `uvicorn backend.app:app --host 0.0.0.0 --port $PORT`
   * **Instance Type**: `Free`

4. **Add Environment Variables**:
   Under the **Environment Variables** tab, add:
   * `ASSEMBLYAI_API_KEY`: `your_actual_assemblyai_api_key`
   * `MOCK_MODE`: `false`
   * `MAX_SESSION_SECONDS`: `180`

5. **Deploy**:
   * Click **Create Web Service**.
   * In ~2 minutes, your app will be live at:
     `https://acuityvoice.onrender.com`
   * **HTTPS and WSS (secure WebSockets) are enabled automatically!**

---

## Option 2: Railway (Ultra-Fast 60-Second Deploy)

1. Go to [railway.app](https://railway.app).
2. Click **New Project** $\rightarrow$ **Deploy from GitHub repo**.
3. Select your `acuityvoice` repository (Railway automatically detects `Dockerfile` and `railway.json`).
4. In the project dashboard, go to **Variables** and add:
   * `ASSEMBLYAI_API_KEY`: `your_actual_assemblyai_api_key`
   * `MOCK_MODE`: `false`
5. Go to **Settings** $\rightarrow$ **Networking** $\rightarrow$ Click **Generate Domain**.
6. Your app is live at `https://acuityvoice-production.up.railway.app`.

---

## Option 3: Hugging Face Spaces (Free Docker Hosting)

1. Go to [huggingface.co/spaces](https://huggingface.co/spaces) and click **Create new Space**.
2. Select **Docker** (Blank) as the Space SDK.
3. In Space Settings $\rightarrow$ **Variables and secrets**, add a Secret:
   * `ASSEMBLYAI_API_KEY` = `your_actual_api_key`
4. Push your repository to the Hugging Face Git remote.
5. Your app runs in a free container with a permanent public link.

---

## Verifying Cloud Microphone & WebSocket Access

Once deployed to your public cloud URL:
1. Open the URL in Google Chrome, Edge, or Safari on desktop or mobile.
2. The browser will prompt: *"Allow acuityvoice to use your microphone?"* $\rightarrow$ Click **Allow**.
3. Select an assessment scenario (e.g. *Fintech Card Dispute*) and click **Start Assessment Call**.
4. Speak into your microphone to verify sub-second turn-taking and real-time radar metric updates.
