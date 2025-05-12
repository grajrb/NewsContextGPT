# NewsContextGPT Backend

This is the backend server for NewsContextGPT, built with Node.js and TypeScript.

## Tech Stack

- Node.js
- TypeScript
- Google's Generative AI (Gemini)
- WebSocket
- Redis for vector storage
- Drizzle ORM

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Redis instance
- Google Cloud API key for Gemini

## Setup

1. Navigate to the project root directory:
```bash
cd NewsContextGPT
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables by creating a `.env` file:
```env
# Database
DATABASE_URL=your_database_url

# Google AI
GOOGLE_API_KEY=your_google_api_key

# Redis
REDIS_URL=your_redis_url

# Server
PORT=3000
NODE_ENV=development
```

4. Set up the database:
```bash
npm run db:push
# or
yarn db:push
```

## Development

To run the backend in development mode:

```bash
npm run dev
# or
yarn dev
```

This will start the development server with hot-reload enabled.

## Production

To build and run in production:

```bash
npm run build
npm run start
# or
yarn build
yarn start
```

## Project Structure

- `/backend`: Main backend directory
  - `index.ts`: Entry point
  - `embedding.ts`: Text embedding functionality
  - `gemini.ts`: Google Gemini AI integration
  - `rag.ts`: Retrieval Augmented Generation logic
  - `redis.ts`: Redis configuration and operations
  - `routes.ts`: API routes
  - `vectorStore.ts`: Vector storage management
  - `websocket.ts`: WebSocket server implementation

## Features

- Real-time chat using WebSocket
- Vector similarity search for news context
- Integration with Google's Gemini AI
- Redis-based vector storage
- TypeScript for type safety
- Environment-based configuration

## API Endpoints

The server exposes various endpoints for:
- News article management
- Chat interactions
- WebSocket connections

## Notes

- Ensure Redis is running before starting the server
- Set up appropriate API keys and environment variables
- The server uses ESM modules
