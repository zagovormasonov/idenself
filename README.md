# Mental Health AI MVP

## Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for local development)

## Getting Started

1. **Environment Variables**
   The `docker-compose.yml` has default values. For production, update:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `GEMINI_API_KEY` (in `server/Dockerfile` or `docker-compose.yml`)

2. **Run with Docker**
   ```bash
   docker-compose up --build
   ```
   - Frontend: http://localhost:80
   - Backend: http://localhost:3000

## Development

### Server
```bash
cd server
npm install
# Setup Database (Local)
# Update .env with local DB credentials
npx prisma generate
npx prisma db push
npm run start:dev
```

### Client
```bash
cd client
npm install
npm run dev
```

## AI Integration
- The system uses Google Gemini.
- To enable real AI generation, set `GEMINI_API_KEY` environment variable in the server.
- Without the key, the system runs in **Mock Mode**, returning pre-defined premium-style content for testing.

## Tech Stack
- **Frontend**: React, Vite, TailwindCSS, TypeScript
- **Backend**: NestJS, Prisma, PostgreSQL
- **AI**: Google Gemini Flash 1.5
- **Infrastructure**: Docker



