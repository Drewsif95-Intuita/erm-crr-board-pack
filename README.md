# CRR Board Pack Prototype

Static interactive board pack for CRR reporting. The app is intentionally simple: Vite serves a self-contained HTML report shell plus a small number of supporting static slide and commentary files.

This is a prototype with indicative mock data. It has no backend, no API calls, no React source tree, and no live Power BI connection.

## Run Locally

Requires Node.js 20.19 or newer.

```bash
npm ci --include=dev
npm run dev
```

Vite will print a local URL, usually `http://localhost:5173/`.

For the same port used during review:

```bash
npm run build
npm run preview:host
```

Then open `http://127.0.0.1:4173/`.

## Build

```bash
npm run build
```

The production build is written to `dist/`. Azure Static Web Apps deploys that built folder.

## App Structure

- `index.html` - source-of-truth report shell. It holds the outer chrome, prototype banner, period selector, navigation tray, and most slide frames as embedded `srcdoc` iframes.
- `public/slides/risk-appetite.html` - reusable Risk Appetite visual slide. Query string controls financial vs non-financial view.
- `public/slides/risk-appetite-appendix.html` - reusable Risk Appetite detail appendix. Query string controls financial vs non-financial view.
- `public/slides/risk-appetite-proximity-appendix.html` - Risk Appetite proximity appendix.
- `public/slides/risk-appetite-additional-data.js` - additional appetite L2 coverage used by the RA appendix.
- `public/slides/appendix-header.html` - appendix divider page.
- `public/powerapp/hosted-commentary-app.html` - hosted commentary workflow mock embedded by the commentary page.
- `powerAppCode.md` - supporting Power Fx formula pack for the commentary workflow concept.
- `public/staticwebapp.config.json` - Azure Static Web Apps fallback routing.
- `vite.config.js` - Vite build settings.
- `.github/workflows/azure-static-web-apps.yml` - GitHub Actions deployment workflow.

There is no `src/` folder because the supplied prototype is already a complete static HTML application.

## Report Pages

The current pack contains 22 pages:

1. Executive Summary
2. Risk Appetite: Financial
3. Risk Appetite: Non-Financial
4. RCSA: Financial Risk Summary
5. RCSA: Financial Risk Detail
6. RCSA: Non-Financial Risk Summary
7. RCSA: Non-Financial Risk Detail
8. Material Controls Environment
9. Key Controls Environment
10. Material Control Register
11. Losses and Near Misses
12. Incidents and Breaches
13. Emerging Risks
14. Regulatory Risks
15. Commentary Power App
16. Appendix divider
17. Risk Appetite Financial Detail Appendix
18. Risk Appetite Non-Financial Detail Appendix
19. Risk Appetite Proximity Appendix
20. RCSA L3 Detail Appendix
21. RCSA Financial Commentary Spillover
22. RCSA Non-Financial Commentary Spillover

## Data Model Handoff

For a model or Power BI validation pass, start with:

- `docs/APP_HANDOFF.md`
- `docs/SEMANTIC_MODEL_ALIGNMENT.md`

Those files describe how the static prototype is assembled, which mock data concepts are being displayed, and the semantic-model grains the report is implicitly expecting.

## Deployment

This repo is configured for Azure Static Web Apps through GitHub Actions.

- Source branch: `main`
- Build command: `npm run build`
- Build output: `dist`
- Workflow: `.github/workflows/azure-static-web-apps.yml`
- Required secret: `AZURE_STATIC_WEB_APPS_API_TOKEN_VICTORIOUS_FLOWER_00B1E901E`

See `AZURE_DEPLOY.md` for the full setup checklist.

## Notes

- All business data shown in the report is indicative mock data.
- Period selectors are currently visual controls only; they do not reload source data.
- The app references Google Fonts. If the target environment blocks external fonts, switch to approved local fonts or system fallbacks before deployment.
