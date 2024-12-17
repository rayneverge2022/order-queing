# Job Order Queuing System

A simple and efficient job order queuing system with client and admin dashboards.

## Features

- Client dashboard for submitting new orders and viewing order status
- Admin dashboard for managing order workflow
- Real-time status updates
- Color-coded status indicators
- Integration with Turso database

## Status Colors

- Project Received: Orange
- Printing: Light Orange
- Packaging: Pink
- Completed: Green

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
- Copy `.env.example` to `.env`
- Update the DATABASE_AUTH_TOKEN with your Turso database token

3. Run the development server:
```bash
npm run dev
```

## Deployment to Render

1. Fork this repository
2. Create a new Web Service on Render
3. Connect your repository
4. Add the environment variables:
   - DATABASE_URL
   - DATABASE_AUTH_TOKEN
5. Deploy!

## Accessing the Dashboards

- Client Dashboard: `http://localhost:3000/`
- Admin Dashboard: `http://localhost:3000/admin`

## Tech Stack

- Node.js
- Express
- EJS Templates
- Turso Database
- Tailwind CSS
