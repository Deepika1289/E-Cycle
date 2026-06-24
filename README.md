# EcoRide+ (E-Cycle) — AI-Enhanced E-Bike Booking Platform

**Live full-stack e-cycle booking application with AI demand forecasting, JWT auth, and role-based dashboards**

🔗 **[Live Demo](https://your-vercel-url.vercel.app)** ← replace with your actual Vercel URL

---

## Overview

EcoRide+ is a production-deployed full-stack web application for e-cycle ride booking. It integrates an AI microservice for intelligent ride demand forecasting, role-based access control for admins and managers, and automated booking workflows — all deployed live on Vercel.

| Layer | Technology |
|---|---|
| Frontend | React · TypeScript · Vite |
| Backend | Node.js · Express.js |
| Database | MongoDB Atlas |
| Auth | JWT (role-based: User / Admin / Manager) |
| AI Service | FastAPI microservice — usage pattern analysis + demand forecasting |
| Deployment | Vercel (frontend) · Railway/Render (backend) |

---

## Features

- **Ride booking** — browse available e-cycles, book by location and time slot
- **Real-time availability** — live inventory updates as rides are booked/returned
- **JWT authentication** — secure login with role-based access control
- **Admin dashboard** — full fleet management, booking oversight, user management
- **Manager dashboard** — approval workflows, booking confirmation/cancellation with email notifications
- **AI demand forecasting** — FastAPI microservice analyzes usage patterns and predicts peak demand periods
- **Payment processing** — integrated wallet system with booking confirmation workflows
- **Automated notifications** — email confirmations on booking, cancellation, and manager approval events

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   React + Vite  │────▶│  Express.js API  │────▶│  MongoDB Atlas  │
│   (Frontend)    │     │  (REST Backend)  │     │  (Database)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌──────────────────┐
                        │  FastAPI Service │
                        │  (AI Forecasting)│
                        └──────────────────┘
```

---

## Project Structure

```
E-Cycle/
├── client/                    # React + TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── hooks/
│   └── vite.config.ts
├── server/                    # Node.js + Express backend
│   ├── routes/
│   ├── models/                # Mongoose schemas
│   ├── middleware/            # JWT auth middleware
│   └── index.js
├── ai-service/                # FastAPI demand forecasting
│   ├── main.py
│   └── requirements.txt
└── README.md
```

---

## Quick Start

```bash
git clone https://github.com/Deepika1289/E-Cycle.git
cd E-Cycle

# Backend
cd server
npm install
cp .env.example .env   # fill in MONGODB_URI, JWT_SECRET, EMAIL creds
npm run dev

# Frontend (new terminal)
cd client
npm install
npm run dev

# AI Service (new terminal)
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## Environment Variables

```env
# server/.env
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
AI_SERVICE_URL=http://localhost:8000
```

---

## Author

**N.V. Mani Deepika** — Full-Stack Developer / ML Engineer  
[Portfolio](https://deepika-nuti.vercel.app) · [LinkedIn](https://linkedin.com/in/deepika-nuti-252118274) · [GitHub](https://github.com/Deepika1289)
