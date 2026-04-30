# Azure Static Web Apps Deployment

This app is a frontend-only Vite static site and should be hosted as an Azure Static Web App.

## Azure Setup

1. Create an Azure Static Web App resource.
2. Connect it to the GitHub repository `Drewsif95-Intuita/erm-crr-board-pack`.
3. Select branch `main`.
4. Use a custom build preset if Azure asks for one.
5. Add the Azure deployment token to GitHub repository secrets.
6. Ensure the secret name matches the workflow.
7. Push to `main` or re-run the workflow.
8. Confirm the Azure Static Web Apps URL loads the board pack.

## Required GitHub Secret

The workflow currently expects this repository secret:

```text
AZURE_STATIC_WEB_APPS_API_TOKEN_VICTORIOUS_FLOWER_00B1E901E
```

Azure generated this resource-specific secret name for the Static Web App. Ensure the GitHub repository contains a secret with this exact name and the Azure deployment token as its value.

## Build And Deploy Flow

The GitHub Actions workflow:

1. checks out the repo;
2. installs Node 20;
3. runs `npm ci --include=dev`;
4. verifies Vite with `npx vite --version`;
5. runs `npm run build`;
6. uploads the pre-built `dist` folder to Azure Static Web Apps using `skip_app_build: true`.

This avoids Azure/Oryx auto-detecting the app and rebuilding it differently.

## Local Verification

Requires Node.js 20.19 or newer.

```bash
npm ci --include=dev
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

Confirm these files exist after build:

```text
dist/index.html
dist/staticwebapp.config.json
```

Manual smoke checks:

- page loads at `/`;
- intro overlay appears;
- start button hides intro;
- left and right arrows navigate;
- number keys `1` to `8` jump to the correct slide;
- `I` opens the page info panel;
- `Esc` closes the page info panel;
- thumbnails switch pages;
- slide frame scales to the viewport.

## Troubleshooting

- `vite: not found`: run `npm install`, commit `package-lock.json`, and ensure the workflow uses `npm ci --include=dev`.
- `npm ci` fails: regenerate the lockfile with `npm install` and commit the updated `package-lock.json`.
- Blank deployed page: confirm `dist/index.html` exists and the workflow uploads `dist` with `skip_app_build: true`.
- 404 on refresh: confirm `public/staticwebapp.config.json` exists and is copied to `dist/staticwebapp.config.json`.
- Missing assets or fonts: check browser console for 404s and confirm external font access is allowed.
- Missing secret: add the exact secret name referenced by `.github/workflows/azure-static-web-apps.yml` in GitHub repository settings.
