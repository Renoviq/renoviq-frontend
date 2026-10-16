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

Actions tab → **Deploy frontend** → Run workflow. It is manual only (it never runs on a push), and it is the only thing you do to publish a new version. It:

1. installs, type-checks and builds the app on the GitHub runner (`dist/`);
2. creates `/var/www/renoviq` on the server on the first run (it needs passwordless sudo for that, the default on EC2 Ubuntu images);
3. copies the new build into its own folder `/var/www/renoviq/releases/<commit>`; the old builds are not touched;
4. points the `/var/www/renoviq/current` link at the new folder in one step, so visitors never see a half-copied site, and keeps the new build plus the 2 previous ones as backup.

nginx serves `/var/www/renoviq/current` and proxies the API. **You configure nginx on the server yourself**; the workflow never touches it. A ready config to start from is `deploy/nginx/renoviq.conf` in the **backend** repository, which also describes the rest of the server setup. One server setup serves both repositories.

GitHub secrets (Settings → Secrets and variables → Actions → Repository secrets):

| Secret | Value |
| --- | --- |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` | Firebase web-app settings (they are built into the public app) |
| `EC2_HOST`, `EC2_USER` | Server address and SSH user |
| `EC2_SSH_KEY` | Private key whose public key is in the server's `~/.ssh/authorized_keys` |
| `EC2_FINGERPRINT` | The server's host-key fingerprint, from `ssh-keygen -l -f /etc/ssh/ssh_host_ed25519_key.pub \| cut -d ' ' -f2` run on the server (`SHA256:…`) |

The SSH action and the copy action come from `appleboy` and are pinned to a commit; they receive the SSH key, so update the pin deliberately.

Go back to an older build on the server:

```bash
ls -1t /var/www/renoviq/releases
ln -sfn /var/www/renoviq/releases/<older-commit> /var/www/renoviq/current.new && mv -Tf /var/www/renoviq/current.new /var/www/renoviq/current
```

## Notes

- `shared/schema.ts` is a copy of `src/schema.ts` from the backend repository (types and the sign-up form schema). Copy it again when the backend file changes.
- The photos for the six design-style tiles are expected at `public/images/design-styles/<style>.jpg` (modern, industrial, bohemian, traditional, rustic, minimalist). They were never added to the repository, so the tiles show a colour swatch with the style name until you add them.
- Photos must be JPG or PNG up to 5 MB, and the API allows 10 designs per hour per user.
- The production bundle is about 830 kB (250 kB gzipped); routes are not split yet.
- Design reference screenshots from the original project are in `docs/design-reference/`.
