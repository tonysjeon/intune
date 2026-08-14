# InTune

InTune is a consent-first Spotify taste matching app. Two people connect their own Spotify accounts, compare listening patterns, and get shared insights and mutual song recommendations.

## Stack

- Next.js 16 with the App Router
- React 19 and TypeScript
- Tailwind CSS 4
- ESLint

The data and analysis layers will be added behind explicit boundaries as the Spotify authentication, persistence, and comparison features are implemented.

## Local development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Planned environment variables

Copy `.env.example` to `.env.local` before implementing Spotify authentication and persistence. Never commit client secrets or database credentials.

## MVP

1. Spotify authentication and individual listening dashboard
2. Individual and shared taste maps
3. Track similarity explorer
4. Invite-based friend comparisons
5. Multi-factor compatibility scoring
6. Mutual song recommendations

Each comparison member must independently authenticate and consent before analysis begins.
