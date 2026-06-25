# CRR Board Pack Dummy Data Handoff

## Purpose

This handoff explains the static mock data currently used by the CRR Board Pack prototype. It is intended for another build or modelling tool to understand what is being shown, where the data lives, and how the dummy records should map to a future semantic model.

The app is not connected to a database, Power BI dataset, Excel file, or API. All values are currently hard-coded in HTML and JavaScript for design validation.

## Current Reporting Period

| Item | Current Prototype Value |
| --- | --- |
| Default period | Q1 2026 |
| Refresh date shown | 31 Mar 2026 |
| Period dropdown | Visual only |
| Other period options shown | Q4 2025, Q3 2025, Q2 2025, Q1 2025 |
| Filtering behaviour | None yet. Selecting a period does not change the data. |

## Source File Map

| Data Area | Source File | Notes |
| --- | --- | --- |
| Report shell, page list, navigation, prototype banner, period control | `index.html` | Owns the board-pack frame and most embedded slide HTML. |
| Executive summary KPIs, committee commentary, top 5 actions, helicopter view | `index.html` | Embedded in P1 `srcdoc`. |
| RCSA financial and non-financial summary/detail views | `index.html` | Embedded in P4-P7 `srcdoc` blocks. |
| Material controls, key controls, control register, losses, incidents, emerging and regulatory pages | `index.html` | Embedded in page `srcdoc` blocks. |
| Risk appetite financial and non-financial summary pages | `public/slides/risk-appetite.html` | Uses `?view=financial` and `?view=nonfinancial`. |
| Risk appetite detail appendix | `public/slides/risk-appetite-appendix.html` | Repeats the core metric array and reads additional appetite data. |
| Additional appetite and RCSA profile data | `public/slides/risk-appetite-additional-data.js` | Shared by the appetite pages and executive helicopter view. |
| Commentary workflow mock | `public/powerapp/hosted-commentary-app.html` | Prototype of commentary assignment / approval workflow. |

## Executive Summary Dummy Data

### Headline KPIs

| KPI | Value | Source / Meaning |
| --- | ---: | --- |
| RCSA Red L2 Risks | 5 | Count of L2 risks rated red after final RAG. |
| Amber L2 Risks | 22 | Count of L2 risks rated amber after final RAG. |
| Appetite Breach | 1 | Formal risk appetite limit breach. Kept deliberately rare. |
| Overdue Assessments | 4 | RCSA assessment timeliness indicator. |
| Loss YTD vs GBP25m | GBP16.8m / 67% | Losses remain below appetite trigger but are worsening. |
| Material Ctrl Ineff. | 9% | Ineffective material control rate. |

### Committee-Level Readout

The executive commentary currently says the overall posture is Amber, driven by:

- 1 formal appetite breach;
- 5 red L2 RCSA risks;
- 22 amber L2 RCSA risks;
- 4 overdue assessments;
- GBP16.8m YTD losses;
- 9% material controls ineffective.

The named board-focus themes are Cyber and IT appetite triggers, the single Customer appetite breach, amber-risk concentration in Operational and Customer, loss trend, and material/key control response.

### Top 5 Actions

These are dummy remediation actions linked to RCSA red/amber risk themes, sorted by action date.

| Risk | Action | Owner | Due | Status |
| --- | --- | --- | --- | --- |
| Funding | Approve contingency funding ladder and trigger playbook. | Hannah Patel | 30 Apr | On track |
| Op Resilience | Evidence critical-service fix and retest route to green. | James Walker | 15 May | At risk |
| Data Protection | Close retention controls and breach-response evidence pack. | Priya Shah | 31 May | At risk |
| Mortality | Complete assumption review and management action sign-off. | Sarah Collins | 30 Jun | On track |
| Investment Cpty | Refresh downgrade watchlist limits and exposure action plan. | Mark Evans | 15 Jul | On track |

## RCSA Dummy Data

### Structure

The prototype represents an RCSA hierarchy:

- L1 risk area;
- L2 risk;
- L3 risks beneath the L2;
- business area or owner context;
- prior raw, prior final, current raw, current final RAG;
- issue count and action count;
- percentage driving RAG;
- number of L3 risks;
- number of red L3 risks;
- number of accepted L3 risks;
- worst L3 risk examples.

### Aggregation Rule

The displayed L2 RAG is based on worst-case aggregation from L3 risks. If one L3 risk is red under an L2, the L2 can still be red even if most other L3 risks are amber or green.

### Risk Acceptance Rule

Risk acceptance is context only. It does not change the L3-to-L2 aggregation. Example: if an L2 has 5 red L3 risks and 3 are accepted, the L2 remains red but the accepted count explains why the position may be more tolerable or already formally acknowledged.

### Financial RCSA Examples

| L2 Theme | # Risks | # Red Risks | # Accepted | Example Driver |
| --- | ---: | ---: | ---: | --- |
| Spread | 7 | 2 | 1 | Spread stress, liquidity premium and credit spread widening |
| Investment Counterparty | 4 | 1 | 0 | Default watchlist deterioration and downgrade concentration |
| Liquidity | 5 | 1 | 1 | Liquidity stress buffer |
| Mortality | 5 | 2 | 1 | Mortality assumption drift |
| Funding | 3 | 1 | 1 | Wholesale funding concentration |
| Equity | 6 | 0 | 0 | Equity volatility spike |

### Detail Page KPIs

| Page | Example KPIs |
| --- | --- |
| RCSA Financial Detail | 16 financial L2 risks, 5 red L2 risks, 6 amber L2 risks, 9 open action plans |
| RCSA Non-Financial Detail | Non-financial L2 detail is embedded in `index.html` and follows the same issues/actions and prior/current final structure |

## Risk Appetite Dummy Data

Risk appetite data is split between:

- core metrics in `public/slides/risk-appetite.html`;
- duplicated core metric logic in `public/slides/risk-appetite-appendix.html`;
- additional L2 appetite coverage in `public/slides/risk-appetite-additional-data.js`;
- executive summary appetite overlays in `index.html`, using the same overall design logic.

### Status Vocabulary

| Prototype Status | Meaning |
| --- | --- |
| `limit` | Formal appetite limit breach. Count should stay rare. |
| `trigger` | Amber trigger or appetite pressure requiring commentary. |
| `watch` | Near trigger or deteriorating trend. |
| `green` | Within appetite. |
| `grey` | Pending, placeholder, not scored, or metric to be confirmed. |

### Core Risk Appetite Metrics

| ID | Area | Metric | Current | Status | Owner | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| DIV-01 | Dividend | Dividend Risk Appetite | Placeholder | grey | Finance / Capital Management | No quarterly metric yet. |
| LIQ-01 | Liquidity | Liquidity Risk Appetite | Placeholder | grey | Treasury | Approved liquidity metrics are pending. |
| CAP-01 | Capital | Group SCRC | 166% | green | Capital Management | Lower is worse; trigger below 160%. |
| CAP-02 | Capital | PLL SCRC | 147% | watch | Capital Management | Near trigger at below 145%. |
| CAP-03 | Capital | RAL SCRC | 133% | trigger | Capital Management | Below trigger of 135%; target action 31 Jul 2026. |
| CAP-04 | Capital | PLCL SCRC | 152% | green | Capital Management | Improved from prior. |
| CUS-01 | Customer | Consumer Duty Assessment Impact Rating | 1 Amber / 0 Red | trigger | Customer Outcomes | Amber pressure. |
| CUS-02 | Customer | Systemic Product / Proposition Flaws | No exception | green | Product Governance | Event-driven. |
| CUS-03 | Customer | Material Customer Detriment Incidents | 1 | limit | Customer Operations | The single formal appetite breach example. |
| CUS-04 | Customer | Essential Services Downtime | 3.4h | watch | Service Resilience | Near trigger at 4h. |
| CUS-05 | Customer | Distribution and Advice Partner Failures | 0 | green | Distribution Risk | No current event. |
| CUS-06 | Customer | Customer Risk RCSA Ratings | 1 Amber / 0 Red | trigger | Customer Risk | Amber without approved route to green. |
| OP-01 | Operational | Total Operational Loss Amount | GBP16.8m | watch | Operational Risk | Below trigger but worsening. |
| OP-02 | Operational | Operational Loss Near Misses | GBP12.8m | watch | Operational Risk | Near trigger at GBP15m. |
| OP-03 | Operational | Major / Critical Operational Risk Incidents | 2 | trigger | Incident Management | Trigger-level open incident count. |
| OP-04 | Operational | Operational Risks RCSA Ratings | 1 Amber / 0 Red | trigger | Operational Risk | Amber without approved route to green. |

### Additional Appetite Coverage

The additional appetite file broadens the universe beyond the core scored metrics. It includes Market, Credit, Insurance, Climate, Liquidity, Customer, Operational, and Strategic L2 appetite rows. Several items are intentionally grey because the metric basis, trigger, or limit is still proposed or pending.

| Area | Additional L2 Rows | Main Dummy Status Mix |
| --- | ---: | --- |
| Market | 5 | Interest Rate, Inflation and Currency pending; Equity and Property green; Credit Spread watch. |
| Credit | 3 | Investment Counterparty and Reinsurance Counterparty green; Credit Spread watch. |
| Insurance | 6 | Longevity, Morbidity and Persistency green; Mortality watch; Expense and New Business Pricing pending. |
| Climate | 4 | Climate, Transition, Physical and Greenwashing pending. |
| Liquidity | 2 | Liquidity and Funding pending. |
| Customer | 3 | Proposition Design trigger; Pre-sales and Post-sales green. |
| Operational | 6 | Cyber, Op Resilience, Regulatory Compliance, Technology and Data Protection trigger; Financial Crime pending. |
| Strategic | 3 | Reputation trigger; Strategy Execution and Strategy Selection green. |

### Cross-Cutting Appetite

| ID | Name | Status | Scope | Notes |
| --- | --- | --- | --- | --- |
| XCAP | Capital | trigger | Market, Credit & Counterparty, Insurance | Capital cascade across multiple L1 areas. |
| XDIV | Dividend | grey | All L1 risk areas | Overarching planning constraint; scoring basis pending. |

## RCSA Helicopter Data

The helicopter view ranks L1 risk areas and shows RCSA RAG mix plus appetite context. The current dummy profile is:

| Area | Red | Amber | Green | Trend | Driver Examples |
| --- | ---: | ---: | ---: | --- | --- |
| Operational | 2 | 7 | 3 | Worse | Info Security, Op Resilience, Reg Compliance, Technology |
| Customer | 1 | 4 | 3 | Worse | Data Protection, AI, Sales |
| Liquidity & Funding | 1 | 1 | 0 | Worse | Funding, Liquidity |
| Market | 0 | 3 | 3 | Stable | Spread, Equity, Inflation |
| Insurance | 0 | 3 | 2 | Better | Mortality, Longevity, Persistency |
| Credit & Counterparty | 0 | 2 | 1 | Better | Investment Cpty, Illiquid Credit |
| Strategic | 1 | 1 | 2 | Worse | Reputation |
| Climate | 0 | 1 | 2 | Better | Greenwashing |

## Controls Dummy Data

### Executive Snapshot

| Control Population | Effective | Partial | Ineffective | Tests Complete |
| --- | ---: | ---: | ---: | ---: |
| Material Controls | 71% | 20% | 9% | 47% / 21 of 45 scheduled |
| Key Controls | 80% | 19% | 1% | 33% / 27 of 81 scheduled |

### Material Controls Environment

| KPI | Value |
| --- | ---: |
| Material Controls | 34 |
| Ineffective | 4 / 12% |
| Partially Effective | 7 / 21% |
| Exception Actions Linked | 82% |
| Linked Key Controls | 39 |
| Q1 Tests Complete | 68% / 23 of 34 scheduled |

### Key Controls Environment

| KPI | Value |
| --- | ---: |
| Key Controls | 1,426 |
| Ineffective | 18 / 1.3% |
| Partially Effective | 263 / 18.4% |
| Exception Actions Linked | 71% |
| Linked Supporting Controls | 620 |
| Q1 Tests Complete | 69% / 318 of 460 scheduled |
| YTD Tests Complete | 49% / 690 of 1,420 scheduled |
| Q1 Overdue Tests | 29 |
| YTD Overdue Tests | 96 |

### Material Control Register Examples

| Control ID | Control | L2 Risk | RCSA RAG | Test RAG |
| --- | --- | --- | --- | --- |
| CTL_CO_612 | Advice suitability 2nd-line QA sample | Sales & Distribution | Red | Red |
| CTL_IS_112 | Endpoint vulnerability remediation SLA | Info Sec & Cyber | Red | Red |
| CTL_FC_031 | AML transaction monitoring alert QA | Financial Crime | Red | Red |
| CTL_TP_101 | Critical vendor resilience attestation | Third Party | Red | Not tested |

## Losses, Incidents, Emerging and Regulatory

These pages are currently embedded in `index.html`. They should be treated as mock fact tables in the future semantic model:

| Area | Current Prototype Shape |
| --- | --- |
| Losses and Near Misses | Material loss event register, near-miss exposure, root cause and YTD loss narrative. |
| Incidents and Breaches | 11 total incidents, 7 Sev 1 / Sev 2 incidents, 4 regulatory notifiable events, top incidents table, customer outcome by severity matrix, remediation register. |
| Emerging Risks | Emerging-risk list with velocity, horizon, owner and board-action context. |
| Regulatory Risks | Regulatory-risk list with milestone, owner, RAG and board-decision context. |

## Commentary Workflow Dummy Data

The hosted commentary app is a static mock of future commentary workflow. Example values:

| KPI | Value |
| --- | ---: |
| Assigned commentary items | 22 |
| In draft | 7 |
| Approved | 9 |
| Overdue | 4 |

Example assigned commentary rows:

| Item | Page | Status |
| --- | --- | --- |
| Cyber and IT Risk appetite commentary | P2 | Rejected |
| Spread - liquidity premium widened | P4 | Draft |
| Operational Resilience red L2 | P6 | Review |
| Material controls ineffective | P7 | Approved |
| Data breach remediation status | P10 | Overdue |

## Future Semantic Model Mapping

The dummy data implies these model objects:

| Model Object | Prototype Source |
| --- | --- |
| `DimPeriod` | Period dropdown and refresh date. |
| `DimRiskHierarchy` | L1, L2 and L3 risk rows across RCSA and appetite. |
| `FactRCSAAssessment` | RCSA prior/final/current/final RAG, L3 counts, issue/action counts, accepted risk counts. |
| `FactRiskAcceptance` | Accepted L3 risk counts and acceptance context. |
| `FactRiskAppetiteMetric` | Core and additional appetite metrics, thresholds, values, statuses and commentary need. |
| `FactControlAssessment` | Material/key control counts, testing status and effectiveness split. |
| `BridgeRiskControl` | Mapping from controls to L2/L3 risks and key/supporting control relationships. |
| `FactLossEvent` | YTD losses, gross loss, near misses and root causes. |
| `FactIncident` | Incident severity, customer outcome, regulatory status and remediation. |
| `FactAction` | Top actions and wider remediation actions with owner, due date and status. |
| `FactCommentaryWorkflow` | Commentary assignment, draft/review/approval status and due dates. |

## Known Gaps and Caveats

- The same mock concept can appear in more than one file because pages are static and not yet backed by a shared data layer.
- Risk appetite core metrics are duplicated between the summary and appendix pages, so a future source model should remove that duplication.
- Period selection is for show only and has no data filtering.
- Some embedded page records have display labels but no stable IDs. The future model should assign durable IDs for L1, L2, L3, controls, incidents, losses, actions and commentary items.
- The dummy values are intentionally designed for the board-pack story, not for statistical consistency. Use them to validate shape, relationships and visuals, not real-world totals.
- RCSA risk acceptance is context only and should not alter worst-case aggregation unless the business later agrees a different methodology.

## Recommended Use By Another Tool

1. Read `docs/dummy-data-inventory.json` first for a compact machine-readable summary.
2. Use this document to understand data intent and current limitations.
3. Inspect `public/slides/risk-appetite.html` and `public/slides/risk-appetite-additional-data.js` for the cleanest appetite data structures.
4. Inspect `index.html` for the remaining embedded mock tables until those values are externalised.
5. Compare against `docs/SEMANTIC_MODEL_ALIGNMENT.md` to check whether every prototype field has a landing place in the proposed Power BI model.
