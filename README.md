# SkillLayer Policy Engine

Backend policy engine for governing AI assistance with Bayesian Knowledge Tracing
and an XState v5 policy machine.

## Requirements

- Node.js 20+
- A Supabase project

## Setup

```bash
npm install
cp .env.example .env
```

Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`, then apply
`supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor or
through the Supabase CLI.

Run the development server:

```bash
npm run dev
```

Build and run the compiled server:

```bash
npm run build
npm start
```

## Assist API

`POST /api/v1/assist`

```json
{
  "userId": "00000000-0000-0000-0000-000000000000",
  "context": {
    "currentFileContext": "const result = await fetch(url)",
    "userPrompt": "Why is this async call slow?"
  },
  "requestedAssistanceLevel": 6
}
```

The response includes the detected abstraction layer, macro-state, current
mastery score, permitted level, and whether a Socratic checkpoint is required.
