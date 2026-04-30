# Quick Start - Deploy to Render

## 🚀 Deploy in 5 Minutes

### Step 1: Setup MongoDB Atlas (5 mins)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account and cluster
3. Create database user
4. Allow access from anywhere (0.0.0.0/0)
5. Get connection string

### Step 2: Deploy on Render (10 mins)
1. Push code to GitHub
2. Go to https://render.com
3. Sign up with GitHub
4. Click "New +" → "Web Service"
5. Connect your repo
6. Configure:
   - Root Directory: `server`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
7. Add environment variables (see DEPLOYMENT.md)
8. Deploy!

### Step 3: Deploy Frontend (5 mins)
1. Click "New +" → "Static Site"
2. Configure:
   - Root Directory: `.` (root)
   - Build Command: `npm install && npm run client:build`
   - Publish Directory: `dist`
3. Add environment variables (see DEPLOYMENT.md)
4. Deploy!

## 📝 Required Environment Variables

### Backend (server)
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/cycles
JWT_SECRET=your_secret_key
CLIENT_URL=https://your-frontend.onrender.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
```

### Frontend
```
VITE_API_BASE_URL=https://your-backend.onrender.com/api
VITE_SERVER_URL=https://your-backend.onrender.com
```

## ✅ Test Your Deployment
- Frontend: `https://your-app.onrender.com`
- Backend: `https://your-api.onrender.com/api/health`
- API Docs: `https://your-api.onrender.com/api/docs`

## 📖 Full Guide
See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.
