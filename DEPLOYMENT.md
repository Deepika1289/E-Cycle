# 🚀 Deployment Guide - E-Cycle Application

This guide will walk you through deploying the complete E-Cycle application on **Render** with **MongoDB Atlas** - all on free tiers with zero code changes!

---

## 📋 Prerequisites

1. **GitHub Account** - Your code must be on GitHub
2. **Render Account** - Sign up at https://render.com (use GitHub login)
3. **MongoDB Atlas Account** - Sign up at https://www.mongodb.com/cloud/atlas
4. **Gmail Account** - For sending OTP emails (optional but recommended)

---

## 🗄️ Step 1: Setup MongoDB Atlas (Database)

### 1.1 Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up with your email or Google account
3. Complete the initial setup wizard

### 1.2 Create Free Cluster
1. Click **"Build a Database"**
2. Select **"FREE"** tier (M0 Sandbox)
3. Choose cloud provider: **AWS** (recommended)
4. Select region closest to your target users
   - US East: Virginia
   - US West: Oregon
   - Europe: Frankfurt
   - Asia: Singapore
5. Cluster Name: `Cluster0` (default is fine)
6. Click **"Create"**

### 1.3 Create Database User
1. In left sidebar, click **"Database Access"**
2. Click **"+ Add New Database User"**
3. Authentication Method: **Password**
4. Username: `ecycle_admin`
5. Password: Click "Autogenerate Secure Password" and **SAVE IT**
6. Database User Privileges: **"Read and write to any database"**
7. Click **"Add User"**

### 1.4 Configure Network Access
1. Click **"Network Access"** in left sidebar
2. Click **"+ Add IP Address"**
3. Click **"Allow Access from Anywhere"** (adds 0.0.0.0/0)
4. Click **"Confirm"**

### 1.5 Get Connection String
1. Click **"Database"** in left sidebar
2. Click **"Connect"** button on your cluster
3. Select **"Connect your application"**
4. Driver: **Node.js**, Version: **4.1 or later**
5. Copy the connection string:
   ```
   mongodb+srv://ecycle_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual password (the one you saved)
7. Replace `?retryWrites=true&w=majority` with `/cycles?retryWrites=true&w=majority`

**Final format should be:**
```
mongodb+srv://ecycle_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/cycles?retryWrites=true&w=majority
```

**✅ Save this connection string - you'll need it in Step 2!**

---

## 🔧 Step 2: Deploy Backend API on Render

### 2.1 Push Code to GitHub
If your code isn't already on GitHub:

```bash
cd d:\E-Cycle\E-Cycle
git init
git add .
git commit -m "Initial commit - E-Cycle application"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ecycle.git
git push -u origin main
```

### 2.2 Create Render Account
1. Go to https://render.com
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (recommended)
4. Authorize Render to access your repositories

### 2.3 Create Backend Web Service
1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Find and select your `ecycle` repository
4. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `ecycle-api` |
| **Root Directory** | `server` |
| **Environment** | `Node` |
| **Region** | Choose closest to you |
| **Branch** | `main` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

### 2.4 Add Environment Variables
Scroll down to **"Environment Variables"** and add these:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Required |
| `MONGODB_URI` | `mongodb+srv://...` | From Step 1.5 |
| `JWT_SECRET` | Random string | Render can auto-generate |
| `JWT_EXPIRES_IN` | `7d` | Token expiry |
| `CLIENT_URL` | `https://localhost:5173` | Temp value, update later |
| `PORT` | `3000` | Don't change |
| `SMTP_HOST` | `smtp.gmail.com` | Email server |
| `SMTP_PORT` | `587` | Email port |
| `SMTP_USER` | `ecyclecutm@gmail.com` | Your Gmail |
| `SMTP_PASS` | `your_app_password` | 16-char Gmail App Password |
| `SMTP_FROM` | `ecyclecutm@gmail.com` | Same as SMTP_USER |

**For JWT_SECRET:** Click "Generate" next to the field to create a secure random string.

**For SMTP_PASS:** You need a Gmail App Password:
1. Enable 2-Step Verification: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Select "Mail" and "Other (Custom name)"
4. Copy the 16-character password (remove spaces)

### 2.5 Deploy Backend
1. Click **"Create Web Service"**
2. Wait for deployment (3-5 minutes)
3. Once deployed, copy your backend URL:
   ```
   https://ecycle-api.onrender.com
   ```

**✅ Backend is now live!**

---

## 🎨 Step 3: Deploy Frontend on Render

### 3.1 Create Static Site
1. Go back to Render Dashboard
2. Click **"New +"** → **"Static Site"**
3. Connect your GitHub repository (same repo)
4. Configure the static site:

| Setting | Value |
|---------|-------|
| **Name** | `ecycle-app` |
| **Root Directory** | `.` (root, leave blank) |
| **Branch** | `main` |
| **Build Command** | `npm install && npm run client:build` |
| **Publish Directory** | `dist` |

### 3.2 Add Environment Variables
Add these environment variables:

| Key | Value | Notes |
|-----|-------|-------|
| `VITE_API_BASE_URL` | `https://ecycle-api.onrender.com/api` | Use your backend URL |
| `VITE_SERVER_URL` | `https://ecycle-api.onrender.com` | Use your backend URL |
| `VITE_APP_API_URL` | `https://ecycle-api.onrender.com/api` | Use your backend URL |
| `VITE_APP_AI_URL` | `http://localhost:8000` | Optional, for AI features |

**IMPORTANT:** Replace `ecycle-api.onrender.com` with your actual backend URL from Step 2.5.

### 3.3 Deploy Frontend
1. Click **"Create Static Site"**
2. Wait for deployment (2-3 minutes)
3. Once deployed, copy your frontend URL:
   ```
   https://ecycle-app.onrender.com
   ```

**✅ Frontend is now live!**

---

## 🔄 Step 4: Update Backend CORS

Now that you have your frontend URL, update the backend:

1. Go to Render Dashboard
2. Click on `ecycle-api` service
3. Go to **"Environment"** tab
4. Find `CLIENT_URL` variable
5. Update it to your frontend URL:
   ```
   CLIENT_URL=https://ecycle-app.onrender.com
   ```
6. Click **"Save Changes"**
7. Backend will automatically redeploy (1-2 minutes)

**✅ CORS is now configured correctly!**

---

## ✅ Step 5: Test Your Deployment

### 5.1 Visit Your Application
Open your browser and go to:
```
https://ecycle-app.onrender.com
```

### 5.2 Test Core Features

**Test 1: API Health Check**
```
https://ecycle-api.onrender.com/api/health
```
Should return: `{"status": "ok"}` or similar

**Test 2: API Documentation**
```
https://ecycle-api.onrender.com/api/docs
```
Should show Swagger UI

**Test 3: User Registration**
1. Go to your frontend
2. Click "Register"
3. Fill in the form
4. Submit
5. Check if OTP email arrives (if SMTP configured)

**Test 4: Login**
1. Go to login page
2. Enter credentials
3. Verify you can access the dashboard

**Test 5: Real-time Features**
1. Open browser console (F12)
2. Look for Socket.IO connection message
3. Should see: `Socket connected`

---

## 🌐 Step 6: Custom Domain (Optional)

### 6.1 Add Custom Domain to Frontend
1. Go to Render Dashboard → `ecycle-app`
2. Click **"Settings"** tab
3. Scroll to **"Custom Domain"**
4. Click **"Add Custom Domain"**
5. Enter your domain: `www.yourdomain.com`
6. Follow the DNS configuration instructions:
   - Add CNAME record in your domain's DNS settings
   - Point to `ecycle-app.onrender.com`
7. Wait for DNS propagation (up to 48 hours)

### 6.2 Add Custom Domain to Backend (Optional)
Same process for backend:
1. Go to `ecycle-api` settings
2. Add custom domain: `api.yourdomain.com`
3. Update all environment variables with new URLs

### 6.3 Update Environment Variables
After adding custom domains:

**Backend:**
```
CLIENT_URL=https://www.yourdomain.com
```

**Frontend:**
```
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_SERVER_URL=https://api.yourdomain.com
```

---

## 📊 Cost Breakdown

### Free Tier (Recommended for Testing)
| Service | Cost | Limits |
|---------|------|--------|
| MongoDB Atlas | FREE | 512MB storage |
| Render Backend | FREE | 750 hours/month, spins down after 15min |
| Render Frontend | FREE | 100GB bandwidth/month |
| **Total** | **$0/month** | |

### Production Tier (Recommended for Live)
| Service | Cost | Features |
|---------|------|----------|
| MongoDB Atlas (M10) | $9/month | 10GB storage, backups |
| Render Backend | $7/month | Always-on, faster |
| Render Frontend | FREE | 100GB bandwidth |
| **Total** | **$16/month** | |

---

## ⚠️ Important Notes

### Free Tier Limitations
1. **Backend spins down** after 15 minutes of inactivity
2. **First request** after spin-up takes 30-50 seconds
3. **Monthly hours**: 750 hours (enough for one service always-on)
4. **Sleep schedule**: Service sleeps when not used

### Solutions for Production
1. **Upgrade to $7/month** for always-on backend
2. **Use uptime monitoring** (e.g., UptimeRobot) to keep it awake
3. **Pre-warm** by visiting the site periodically

### Auto-Deploy
- Every push to `main` branch triggers automatic deployment
- Changes go live in 3-5 minutes
- You can disable auto-deploy in settings if needed

---

## 🐛 Troubleshooting

### Backend Won't Start
**Problem:** Deployment fails or service crashes

**Solution:**
1. Go to Render Dashboard → `ecycle-api` → **"Logs"**
2. Check for error messages
3. Common issues:
   - ❌ Invalid MONGODB_URI → Verify connection string
   - ❌ Missing environment variables → Check all vars are set
   - ❌ Port already in use → PORT must be 3000 or use $PORT
   - ❌ Build command failed → Check `server/package.json`

### CORS Errors
**Problem:** Frontend can't connect to backend

**Solution:**
1. Verify `CLIENT_URL` in backend matches your frontend URL EXACTLY
2. Include `https://` in the URL
3. No trailing slash
4. Check backend logs for CORS errors

### WebSocket Not Connecting
**Problem:** Socket.IO connection fails

**Solution:**
1. Check browser console (F12) for errors
2. Verify `VITE_SERVER_URL` points to correct backend
3. Ensure backend has WebSocket support enabled
4. Check if firewall blocks WebSocket connections

### SMTP Email Not Working
**Problem:** OTP emails not being sent

**Solution:**
1. Verify 2-Step Verification is enabled on Gmail
2. Use App Password (not regular password)
3. Check SMTP credentials are correct
4. Test with Gmail's "Less secure apps" (not recommended)

### Frontend Build Fails
**Problem:** Static site deployment fails

**Solution:**
1. Check build logs in Render
2. Verify `npm run client:build` works locally
3. Ensure all dependencies are in `package.json`
4. Check for TypeScript errors

---

## 🚀 Quick Deploy Commands

### Local Testing Before Deploy
```bash
# Install dependencies
npm run setup

# Test backend
cd server
npm run dev

# Test frontend (new terminal)
npm run client:dev

# Build for production
npm run build
```

### Deploy to Render
```bash
# Just push to GitHub!
git add .
git commit -m "Your changes"
git push origin main

# Render will automatically deploy
```

---

## 📞 Support

If you encounter issues:

1. **Check Render Logs** - Dashboard → Your Service → Logs
2. **Check MongoDB Atlas** - Verify connection and network access
3. **Review Environment Variables** - All required vars must be set
4. **Test Locally First** - Ensure app works before deploying

---

## 🎉 Success!

Your E-Cycle application is now live and accessible worldwide! 

**Your URLs:**
- Frontend: `https://ecycle-app.onrender.com`
- Backend API: `https://ecycle-api.onrender.com`
- API Docs: `https://ecycle-api.onrender.com/api/docs`

**Next Steps:**
1. Share your app with users
2. Monitor usage in Render Dashboard
3. Upgrade to paid tier when ready for production
4. Add custom domain for professional look

**Happy Hosting! 🎊**
