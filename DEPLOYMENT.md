# Production Deployment Guide • Zenith

This application is fully production-ready and configured for 1-click cloud deployment.

---

## ☁️ Option 1: Deploy on Render (Recommended & Free)

Render supports WebSockets / Socket.IO, static asset serving, and automatic HTTPS out of the box.

### Step 1: Set Up Free MongoDB Atlas Database
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free account.
2. Create a free **M0 Shared Cluster**.
3. Under **Database Access**, create a database user (e.g., `zenithuser` with a strong password).
4. Under **Network Access**, click **Add IP Address** -> Select **Allow Access from Anywhere (`0.0.0.0/0`)**.
5. Click **Connect** -> **Connect your application** -> Copy the connection URI:
   ```text
   mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/zenith?retryWrites=true&w=majority
   ```

### Step 2: Push to GitHub
If you haven't committed and pushed yet:
```bash
git add .
git commit -m "Production release: Zenith StudySync & Task Planner"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

### Step 3: Create Web Service on Render
1. Go to [render.com](https://render.com) and log in.
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Set the following settings:
   - **Name**: `zenith-app` (or any custom name)
   - **Region**: Closest to you (e.g., Oregon or Singapore)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm run postinstall && npm run build
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
5. Add **Environment Variables**:
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
   - `MONGODB_URI` = `mongodb+srv://<username>:<password>@cluster0...` (Your MongoDB Atlas connection string)
   - `JWT_SECRET` = (Any long, random 32+ character string)
6. Click **Deploy Web Service**!

Once deployed, your app will be live at `https://zenith-app.onrender.com`!

---

## 🚂 Option 2: Deploy on Railway

1. Go to [railway.app](https://railway.app) and click **New Project** -> **Deploy from GitHub repo**.
2. Railway will automatically detect the `Dockerfile` or `package.json`.
3. Add Environment Variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV` = `production`
4. Click **Generate Domain** in the Service Settings.
5. Your app is live with automatic SSL!

---

## 🐳 Option 3: Run with Docker

To test or deploy using Docker:

```bash
# Build Docker image
docker build -t zenith-app .

# Run container
docker run -p 5000:5000 \
  -e MONGODB_URI="your_mongodb_atlas_uri" \
  -e JWT_SECRET="your_secret_key" \
  -e NODE_ENV=production \
  zenith-app
```

---

## 🔒 Post-Deployment Verification Checklist
- [ ] Visit the deployed URL (`https://your-domain.com/`). The disguised **Zenith To-Do List** should load cleanly.
- [ ] In the task input, type `2006` and press Enter. The romantic sanctuary unlocks.
- [ ] Register an account, connect with your partner, and verify real-time Socket.IO chat, chime audio, and disguised push alerts.
- [ ] Install PWA on your phone via Safari / Chrome to enjoy the native app experience!
