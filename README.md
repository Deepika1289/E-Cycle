# EcoRide+: AI-Enhanced Ride Booking Platform

A full-stack application for booking and managing bicycle rides with AI-powered features.

## Prerequisites

- Node.js (v16 or later)
- npm (v8 or later) or yarn
- MongoDB (v5 or later)
- Git

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd EcoRide+
```

### 2. Set up the backend

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the server directory and copy the contents from `.env.example`:
   ```bash
   cp ../.env.example .env
   ```
   Then edit the `.env` file with your configuration.

4. Start the development server:
   ```bash
   npm run dev
   ```
   The server will start on `http://localhost:3000` by default.

### 3. Set up the frontend

1. In a new terminal, navigate to the project root:
   ```bash
   cd ..
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and copy the contents from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Update the frontend environment variables as needed.

4. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173` by default.

## Available Scripts

### Frontend
- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build

### Backend
- `npm run dev` - Start the development server with hot-reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start the production server
- `npm run seed` - Seed the database with sample data
- `npm test` - Run tests

## Environment Variables

### Server (`.env` in server directory)
- `PORT` - Port to run the server on (default: 3000)
- `NODE_ENV` - Node environment (development/production)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT authentication
- `JWT_EXPIRES_IN` - JWT expiration time
- `CLIENT_URL` - Frontend URL for CORS
- `SERVER_URL` - Backend URL for API documentation
- `STRIPE_SECRET_KEY` - Stripe secret key (optional)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret (optional)
- `SMTP_*` - Email configuration (optional)

### Frontend (`.env` in root directory)
- `VITE_API_BASE_URL` - Base URL for API requests (default: http://localhost:3000/api)
- `VITE_*` - Other Vite environment variables

## Project Structure

```
EcoRide+/
├── public/             # Static files
├── server/             # Backend code
│   ├── src/
│   │   ├── config/    # Configuration files
│   │   ├── controllers/# Request handlers
│   │   ├── middleware/# Express middleware
│   │   ├── models/    # Database models
│   │   ├── routes/    # API routes
│   │   ├── services/  # Business logic
│   │   └── utils/     # Utility functions
│   ├── .env           # Environment variables
│   └── package.json   # Backend dependencies
├── src/               # Frontend code
│   ├── components/    # React components
│   ├── pages/         # Page components
│   ├── services/      # API services
│   ├── store/         # State management
│   ├── styles/        # Global styles
│   └── utils/         # Utility functions
├── .env               # Frontend environment variables
└── package.json       # Frontend dependencies
```

## Troubleshooting

### CORS Issues
- Ensure the `CLIENT_URL` in the backend `.env` matches your frontend URL
- Check that the frontend's `VITE_API_BASE_URL` points to the correct backend URL

### Database Connection
- Make sure MongoDB is running
- Verify the `MONGODB_URI` in the backend `.env` is correct

### Development Tools
- Use the browser's developer tools to check for errors in the console and network tabs
- Check the terminal/console where the servers are running for any error messages

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
