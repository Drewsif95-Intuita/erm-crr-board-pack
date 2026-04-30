# ERM CRR Board Pack

Static interactive CRR executive board pack prepared for Azure Static Web Apps.

The deployed app is the standalone `CRR_Exec_Pack_v3_interactive.html` prototype copied to `index.html` and served by Vite. The report design remains self-contained: eight fixed 1280 x 720 iframe slides, Standard Life branding, top navigation, thumbnail tray, intro overlay, page info panel, and keyboard shortcuts are preserved from the source HTML.

## Local Run

Requires Node.js 20.19 or newer.

```bash
npm install
npm run dev
```

Vite will print the local URL, usually `http://localhost:5173/`.

## Production Build

```bash
npm run build
npm run preview
```

The production build is written to `dist/`. Azure Static Web Apps deploys that built folder.

## Key Files

- `index.html` - source-of-truth interactive report prototype.
- `package.json` - Vite scripts for local run, build, and preview.
- `vite.config.js` - builds the app to `dist/`.
- `public/staticwebapp.config.json` - Azure Static Web Apps navigation fallback.
- `.github/workflows/azure-static-web-apps.yml` - GitHub Actions build and deploy workflow.
- `AZURE_DEPLOY.md` - Azure and GitHub setup notes.

There is no React `src/` app for this conversion because the supplied prototype is already a complete standalone HTML application.

## Navigation

- Left and right arrows move between slides.
- Number keys `1` to `8` jump directly to a page.
- `I` toggles the page info panel.
- `Esc` closes the page info panel.
- The thumbnail tray switches pages.

## Deployment

This repo is configured for Azure Static Web Apps through GitHub Actions.

- Source branch: `main`
- Build command: `npm run build`
- Build output: `dist`
- Workflow: `.github/workflows/azure-static-web-apps.yml`
- Required GitHub secret: `AZURE_STATIC_WEB_APPS_API_TOKEN_VICTORIOUS_FLOWER_00B1E901E`

See `AZURE_DEPLOY.md` for the full setup checklist.

## Data And Asset Notes

The report is static HTML with embedded report content and no API calls. It references Google Fonts for Ubuntu and Ubuntu Mono; if the target environment blocks external font requests, switch to approved local web fonts or system font fallbacks before deployment.

Do not publish real client, confidential, or personal data in a public Static Web App unless the sharing model has been approved.

## Known Limitations

- This is a static prototype, not a connected dashboard.
- `node_modules/` and `dist/` are intentionally excluded from source control.
- Azure deployment requires the GitHub repository secret named in the workflow.
