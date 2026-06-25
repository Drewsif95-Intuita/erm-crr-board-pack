# CRR Board Pack App Handoff

## Purpose

This repo contains a static prototype of the CRR Board Pack. It is designed to show the target reporting experience and to help validate the semantic model needed for a future Power BI implementation.

The app is not a connected dashboard. It is a Vite-hosted static site with mock data embedded in HTML and JavaScript.

## Build Flow

1. `npm ci --include=dev` installs Vite.
2. `npm run build` copies `index.html` and `public/` assets into `dist/`.
3. `npm run preview:host` serves the built site at `http://127.0.0.1:4173/`.
4. Azure Static Web Apps deploys the pre-built `dist/` folder through `.github/workflows/azure-static-web-apps.yml`.

## Runtime Shape

`index.html` is the report shell. It provides:

- top prototype banner;
- report stage and scaling logic;
- period dropdown control;
- page navigation tray;
- keyboard navigation;
- page information metadata;
- iframe frame mounting.

Most report pages are embedded directly inside `index.html` as `srcdoc` iframes. The risk appetite pages are external static files in `public/slides/` so they can reuse the same metric logic for financial, non-financial, and appendix views.

## External Static Frames

| File | Used For |
| --- | --- |
| `public/slides/risk-appetite.html` | P2 and P3, controlled by `?view=financial` or `?view=nonfinancial` |
| `public/slides/risk-appetite-appendix.html` | P17 and P18, controlled by `?view=financial` or `?view=nonfinancial` |
| `public/slides/risk-appetite-proximity-appendix.html` | P19 |
| `public/slides/appendix-header.html` | P16 |
| `public/powerapp/hosted-commentary-app.html` | P15 embedded commentary workflow mock |

## Main Mock Data Locations

| Area | Current Location |
| --- | --- |
| Executive summary metrics, helicopter view, top actions | Embedded in `index.html` P1 `srcdoc` |
| RCSA financial and non-financial summaries | Embedded in `index.html` P4 and P6 `srcdoc` |
| RCSA financial and non-financial detail tables | Embedded in `index.html` P5 and P7 `srcdoc` |
| Controls, losses, incidents, emerging and regulatory slides | Embedded in `index.html` page `srcdoc` blocks |
| Risk Appetite core metrics | `public/slides/risk-appetite.html` and duplicated detail logic in `risk-appetite-appendix.html` |
| Risk Appetite additional L2 coverage | `public/slides/risk-appetite-additional-data.js` |
| Commentary workflow mock data | `public/powerapp/hosted-commentary-app.html` |

## Report Page Inventory

| Page | Title | Primary Model Area |
| --- | --- | --- |
| P1 | Executive Summary | Cross-domain summary, RCSA, Risk Appetite, Controls, Actions |
| P2 | Risk Appetite: Financial | Risk Appetite metrics and commentary |
| P3 | Risk Appetite: Non-Financial | Risk Appetite metrics and commentary |
| P4 | RCSA: Financial Risk Summary | RCSA L1/L2/L3 hierarchy and RAG aggregation |
| P5 | RCSA: Financial Risk Detail | RCSA L2 detail, action status, issues/actions |
| P6 | RCSA: Non-Financial Risk Summary | RCSA L1/L2/L3 hierarchy and RAG aggregation |
| P7 | RCSA: Non-Financial Risk Detail | RCSA L2 detail, action status, issues/actions |
| P8 | Material Controls Environment | Control effectiveness and risk/control mapping |
| P9 | Key Controls Environment | Key control effectiveness and linkage |
| P10 | Material Control Register | Control testing register |
| P11 | Losses and Near Misses | Loss events, near misses, appetite thresholds |
| P12 | Incidents and Breaches | Incident severity, customer outcome, remediation |
| P13 | Emerging Risks | Emerging risk register |
| P14 | Regulatory Risks | Regulatory risk register |
| P15 | Commentary Power App | Commentary workflow and ownership |
| P16 | Appendix | Divider |
| P17 | RA Financial Detail Appendix | Detailed appetite metric inventory |
| P18 | RA Non-Financial Detail Appendix | Detailed appetite metric inventory |
| P19 | RA Proximity Appendix | Appetite proximity to trigger/limit |
| P20 | RCSA L3 Detail Appendix | L3 risk detail and business-function split |
| P21 | RCSA Financial Commentary Spillover | Additional financial commentary |
| P22 | RCSA Non-Financial Commentary Spillover | Additional non-financial commentary |

## Current Prototype Boundaries

- Period dropdowns are visual only.
- The report uses indicative mock data and should not be treated as a controlled source.
- RCSA aggregation is worst-case from L3 to L2; accepted risk counts are context only and do not change aggregation.
- Commentary and actions are mocked to show desired workflow fields rather than connected SharePoint or Power BI data.
- The static shell is intentionally monolithic while the future Power BI model should be normalized.

## Cleanup Notes

- The intended deployment path is Azure Static Web Apps.
- Historical screenshot packs, local review bundles, and old cloned experiments are working-folder artifacts, not part of the app source.
- The old standalone Risk Appetite commentary page is no longer part of the report flow; commentary now sits on the split financial and non-financial appetite pages.
