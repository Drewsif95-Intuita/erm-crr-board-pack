# Semantic Model Alignment Notes

## What The Prototype Needs From A Model

The report expects one reporting period to filter all domains. Most visuals are organised around the risk hierarchy, then linked to appetite metrics, controls, actions, incidents, losses, commentary, and appendix detail.

The Power BI model should be normalized even though the prototype is static HTML.

## Core Dimensions

| Dimension | Grain | Key Fields |
| --- | --- | --- |
| `DimReportingPeriod` | One row per reporting period | Period key, label, prior period key, period end date, refresh date, current-period flag |
| `DimRiskHierarchy` | One row per risk node | Risk key, L1 risk, L2 risk, L3 risk, risk level, financial/non-financial flag, parent risk key |
| `DimBusinessArea` | One row per business area | Business area key, name, owning department, reporting segment |
| `DimControl` | One row per control | Control key, control name, material/key flag, owning department, control type |
| `DimMetric` | One row per appetite metric | Metric key, metric name, appetite area, core/additional flag, preference, metric type, direction of concern |
| `DimOwner` | One row per person/team owner | Owner key, display name, role, department, email where available |

## Core Facts

| Fact | Grain | Required For |
| --- | --- | --- |
| `FactRCSAAssessment` | Period x L3 risk x business area or function | RCSA summaries, L3 appendices, red/amber/green roll-ups |
| `FactRiskAppetiteMetric` | Period x metric | RA financial/non-financial slides, RA detail appendices, proximity view |
| `FactControlAssessment` | Period x control | Material/key control environment, testing register |
| `BridgeRiskControl` | Risk key x control key | Mapping controls back to L2/L3 risk context |
| `FactIssue` | Issue x period or issue snapshot | Issues count and open issue context |
| `FactAction` | Action x period or action snapshot | Top 5 actions, remediation due date, status, owner |
| `FactLossEvent` | Loss or near-miss event | Losses and near misses slide |
| `FactIncident` | Incident or breach event | Incidents and breaches slide |
| `FactEmergingRisk` | Emerging risk x period | Emerging risks slide |
| `FactRegulatoryRisk` | Regulatory item x period | Regulatory risks slide |
| `FactCommentary` | Commentary item x period x report object | Assigned commentary and Power App workflow |

## Key Relationship Expectations

- `DimReportingPeriod` should filter every fact table.
- `DimRiskHierarchy` should filter RCSA assessments, risk appetite mappings, incidents, losses, issues, actions, controls via bridge tables, and commentary where a risk object is referenced.
- RCSA L3 rows aggregate to L2 using worst-case RAG logic.
- Risk acceptance is a context attribute or measure on the RCSA fact. It must not alter the L3 to L2 aggregation.
- Controls can map to multiple risks and risks can map to multiple controls, so use a bridge rather than storing only one risk key on a control.
- Commentary and actions should be linkable to a report object, ideally through typed fields such as object type, risk key, metric key, control key, incident key, and page key.

## RCSA Fields To Validate

At L3 or assessment grain:

- reporting period;
- L1, L2, L3 risk keys;
- financial/non-financial classification;
- business area or function;
- prior raw RAG;
- prior final RAG;
- current raw RAG;
- current final RAG;
- percent driving RAG;
- expert overlay flag and rationale;
- issue count;
- action count;
- number of underlying risks;
- number of red underlying risks;
- accepted risk count;
- worst L3 risk label;
- movement direction;
- action plan status;
- next action due date;
- assessment date.

## Risk Appetite Fields To Validate

At period x metric grain:

- risk area;
- mapped L1 and, where applicable, L2 risk;
- core or additional appetite flag;
- metric name;
- appetite statement;
- preference in full, for example Minimise, Accept, Prefer, Not applicable;
- metric type, for example continuous, count, RAG, binary, placeholder;
- trigger threshold;
- limit threshold;
- prior value;
- current value;
- derived status, for example Within, Watch, Triggered, Limit, Pending;
- worsened flag;
- nearing trigger flag;
- owner;
- data source;
- data confidence;
- commentary requirement/status.

Cross-cutting appetite items such as Capital and Dividend need explicit mapping because they can span multiple L1 risk areas.

## Control Fields To Validate

At period x control grain:

- control key;
- material or key control flag;
- effectiveness status;
- partial or ineffective reason;
- test completion status;
- tests scheduled;
- tests completed;
- exception action linked flag;
- rerun/new flag;
- owning department;
- all-impacted mapping where applicable.

Controls need a risk/control bridge that supports multiple L2/L3 risk links without double counting.

## Actions And Commentary Fields To Validate

At action/commentary item grain:

- linked report page;
- linked risk, metric, control, incident, issue, or loss key;
- action text;
- owner name;
- due date;
- status;
- on-time/at-risk/overdue indicator;
- escalation flag;
- commentary summary;
- driver;
- impact;
- route to green;
- approval status;
- last updated date.

## Prototype To Model Checks

Use these checks when comparing the semantic model to the prototype:

- Can a single selected reporting period drive all pages?
- Can financial and non-financial RCSA pages be produced from the same RCSA fact and risk hierarchy?
- Can worst-case L3 to L2 aggregation be reproduced while separately showing accepted risk context?
- Can RCSA detail split issues and actions as separate measures?
- Can risk appetite show financial and non-financial pages from the same metric fact?
- Can core and additional appetite metrics be separated without losing their L1/L2 mapping?
- Can Capital and Dividend cascade across multiple L1 areas?
- Can material and key control pages share the same control assessment fact with different filters?
- Can the top 5 actions on the executive summary be sorted by due date and limited to red/amber RCSA risks?
- Can commentary be attached to the relevant risk, appetite metric, control, incident, or report page?

## Known Gaps In The Static Prototype

- Some RCSA and controls data is duplicated inside page HTML rather than generated from a shared source.
- Risk appetite metric arrays are duplicated between the main RA slide and RA detail appendix.
- Period selection does not currently recalculate values.
- The commentary Power App is a visual mock and is not connected to SharePoint.
- Semantic model keys are implied by labels today; a live model needs stable IDs.
