# RaySense Frontend

A modern Vue.js frontend for the RaySense smart attendance platform.

## Overview

RaySense Frontend is the user-facing client application for the RaySense attendance system. It allows students and lecturers to:

- Register accounts
- Login securely using JWT authentication
- Register facial data
- Mark attendance using facial recognition
- Manage attendance sessions
- View attendance history

The frontend communicates with the Spring Boot backend API.

---

## Architecture

Frontend (Vue.js + Vercel)
↓
Spring Boot Backend API (Railway)
↓
FastAPI Face Recognition Service (Railway)
↓
MySQL Database (Railway)

---

## Features

- JWT Authentication
- Student & Lecturer roles
- Face registration
- Attendance tracking
- Responsive UI
- REST API integration
- Production deployment on Vercel

---

## Tech Stack

- Vue.js
- Vite
- Axios
- Vue Router
- JavaScript
- CSS
- Vercel

---

## Environment Variables

### `.env.development`

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

### `.env.production`

```env
VITE_API_BASE_URL=https://your-backend.up.railway.app/api
```

---

## Installation

Clone the repository:

```bash
git clone https://github.com/yourusername/raysense-frontend.git
```

Navigate into the project:

```bash
cd raysense-frontend
```

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

---

## Build for Production

```bash
npm run build
```

---

## Deployment

The frontend is deployed using Vercel.

### Deployment Steps

1. Push project to GitHub
2. Import repository into Vercel
3. Configure environment variables
4. Deploy

---

## API Integration

Example Axios configuration:

```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})
```

---

## Challenges Solved

- CORS handling between Vercel and Railway
- Production environment configuration
- JWT authentication flow
- Base64 image transfer
- API endpoint debugging
- Deployment troubleshooting

---

## Future Improvements

- Real-time attendance updates
- Push notifications
- PWA offline support
- Analytics dashboard
- Dark mode

---

## License

This project is for educational and portfolio purposes.
