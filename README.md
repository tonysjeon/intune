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

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

## Configuration

Copy `.env.example` to `.env.local`, then provide a PostgreSQL connection string, an authentication secret of at least 32 characters, and credentials from a Spotify developer application. Never commit client secrets or database credentials.

Register this exact local redirect URI in the Spotify developer dashboard:

```text
http://127.0.0.1:3000/api/auth/callback/spotify
```

Initialize the database and start the app:

```bash
npm run db:migrate
npm run dev
```

InTune requests `user-read-email`, `user-read-private`, `user-top-read`, `user-read-recently-played`, and `user-library-read`. Access and refresh tokens are encrypted before they are persisted.

### Automatic Spotify sync

The dashboard refreshes listening data automatically when the latest completed sync is at least six hours old. To update inactive accounts on the same cadence, set a random `CRON_SECRET` of at least 32 characters and configure your hosting provider to request this endpoint every six hours:

```text
GET /api/cron/spotify-sync
Authorization: Bearer <CRON_SECRET>
```

The endpoint skips fresh accounts and active syncs. Users must reconnect Spotify when their authorization expires or is revoked.

## Quality checks

```bash
npm run lint
npm test
npm run build
```

## MVP

1. Spotify authentication and individual listening dashboard
2. Individual and shared taste maps
3. Track similarity explorer
4. Invite-based friend comparisons
5. Multi-factor compatibility scoring
6. Mutual song recommendations

Each comparison member must independently authenticate and consent before analysis begins.
