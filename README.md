# Renoviq AI: web app

The web app of Renoviq AI, a service that redesigns a room from a photo. Users sign up, upload a photo of a room, pick a room type and a design style, and get an AI redesign shown next to the original. Designs are saved to a personal gallery.

The API lives in its own repository, [renoviq-backend](https://github.com/Renoviq/renoviq-backend). In production this app is a folder of static files served by nginx on the same EC2 server as the API container, so the browser talks to one address and `/api` and `/auth` are forwarded to the backend.

| Part | What it uses |
| --- | --- |
| App | React 18 + Vite (TypeScript), wouter routing, TanStack Query, Tailwind CSS, Radix / shadcn UI, react-hook-form + zod |
| Photos | The browser uploads the room photo straight to Firebase Storage and sends only its URL to the API |
| Delivery | GitHub Actions (manual) builds the app and copies `dist/` to the server, nginx serves it. No container |

## Run it locally

Start the backend first (see its README), then:

```bash
npm install
cp .env.example .env     # fill in the Firebase web-app settings
npm run dev              # http://localhost:5173
```

The dev server forwards `/api` and `/auth` to `http://localhost:3000`. Set `VITE_DEV_API` in `.env` if the backend runs elsewhere.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve `dist/` locally |
| `npm run check` | Type-check |

The `VITE_FIREBASE_*` values are the public web-app settings from the Firebase console. They are baked into the build, so set them before `npm run build`. Your Storage rules must allow writes to `uploads/`.

## Deploy

Actions tab → **Deploy frontend** → Run workflow. It is manual only (it never runs on a push). The workflow:

1. installs, type-checks and builds the app on the GitHub runner (`dist/`);
2. connects to the server over SSH and copies `dist/` into `/var/www/renoviq/releases/<commit>`;
3. points the `/var/www/renoviq/current` link at that folder in one step, so visitors never see a half-copied site, and keeps the 3 newest releases.

nginx serves `/var/www/renoviq/current` and proxies the API. Its config is `deploy/nginx/renoviq.conf` in the **backend** repository, and the server setup (folders, nginx, certbot, SSH key) is described in the backend README. One server setup serves both repositories.

Settings in this repository (Settings → Secrets and variables → Actions):

| Name | Type | Value |
| --- | --- | --- |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` | variables | Firebase web-app settings |
| `EC2_HOST`, `EC2_USER` | variables | Server address and SSH user |
| `EC2_SSH_KEY` | secret | Private key whose public key is in the server's `~/.ssh/authorized_keys` |
| `EC2_KNOWN_HOSTS` | secret | Output of `ssh-keyscan -t ed25519 <EC2_HOST>` |

Optionally create an environment named `production` with required reviewers to get an approval step.

Go back to an older release on the server:

```bash
ls -1t /var/www/renoviq/releases
ln -sfn /var/www/renoviq/releases/<older-commit> /var/www/renoviq/current
```

## Notes

- `shared/schema.ts` is a copy of `src/schema.ts` from the backend repository (types and the sign-up form schema). Copy it again when the backend file changes.
- The photos for the six design-style tiles are expected at `public/images/design-styles/<style>.jpg` (modern, industrial, bohemian, traditional, rustic, minimalist). They were never added to the repository, so the tiles show a colour swatch with the style name until you add them.
- Photos must be JPG or PNG up to 5 MB, and the API allows 10 designs per hour per user.
- The production bundle is about 830 kB (250 kB gzipped); routes are not split yet.
- Design reference screenshots from the original project are in `docs/design-reference/`.
