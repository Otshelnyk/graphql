# GraphQL Profile

Personal profile page for Tomorrow School, built with vanilla JavaScript and GraphQL. Displays user stats, XP, grades, audit ratio, and interactive SVG charts.

## Features

- JWT login (username or email + password)
- GraphQL data fetching with Bearer authentication
- Profile dashboard with user info, XP, grades, audit ratio, pass/fail stats
- Four SVG charts: XP progress (line), pass/fail ratio (pie), XP by project (bar), skills (bar)
- Logout support

## Architecture

The project uses a dependency flow from the UI towards infrastructure. Each layer
has one responsibility and does not import a layer above it.

```
js/
├── app.js                         # Composition root and UI flow
├── config/                        # API constants
├── auth/                          # Token persistence and sign-in service
├── infrastructure/graphqlClient.js # HTTP/GraphQL transport
├── repositories/profileRepository.js # GraphQL queries and API-to-data mapping
├── application/loadProfile.js      # Dashboard loading use case
├── domain/                        # Pure metrics and formatting rules
└── presentation/                  # Views, escaping, and SVG charts
```

`app.js` wires these dependencies together. Presentation receives a prepared
profile model; it never performs network calls. The repository owns GraphQL
query text, while the GraphQL client owns authorization and HTTP error handling.

### GraphQL query types used

| Type | Example |
|------|---------|
| Normal | `user { id login }` |
| Nested | `result { user { login } }` |
| Arguments | `object(where: { id: { _eq: $id } })` |

## Run locally

Serve the folder with any static server:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Open `http://localhost:8080` and log in with your Tomorrow School credentials.

## Checks

Run the domain checks with Node.js:

```bash
npm test
```

## Hosting

Deploy to any static host:

- **GitHub Pages**: push to `gh-pages` branch or enable Pages in repo settings
- **Netlify**: drag-and-drop the project folder or connect the repo

## API

- Sign in: `POST https://01.tomorrow-school.ai/api/auth/signin` (Basic auth)
- GraphQL: `POST https://01.tomorrow-school.ai/api/graphql-engine/v1/graphql` (Bearer JWT)
