# CRR Board Pack Design System Handoff

## Purpose

Use this with the screenshot pack when recreating the CRR Board Pack in Power BI. The goal is not to mirror every CSS rule literally, but to preserve the visual language: compact board-pack pages, Standard Life colours, dense but readable tables, clear RAG status, and commentary-led executive reporting.

## Canvas

Use a fixed 16:9 report canvas.

| Item | Value |
| --- | --- |
| Slide/page size | 1280 x 720 px |
| Page background | White inside the report canvas |
| Outer app background | `#16224A` dark navy |
| Primary layout model | Fixed-page board pack, not responsive dashboard |
| Main content density | High density, compact cards and tables |
| Corner radius | 3-8 px only; panels usually 6-7 px |

For Power BI, set page size to 16:9 and design against 1280 x 720 screenshots. Avoid oversized dashboard whitespace; this is a board pack, so every page should feel presentation-ready and information-dense.

## Colour Tokens

### Brand

| Token | Hex | Usage |
| --- | --- | --- |
| Heritage Blue | `#0A2F73` | Primary text, key headings, selected states |
| Section Blue | `#17377F` | Main slide title/header band |
| Vibrant Blue | `#2140CE` | Secondary selected state, current markers |
| Deep Navy | `#07235A` | Footers and darkest bands |
| Outer Navy | `#16224A` | App shell/stage background |
| Heritage Yellow | `#FFBB00` | Header accent line, amber bar segment, brand marker |
| Light Yellow | `#FFFFB9` | Soft yellow family, rarely used directly |
| Core Teal | `#006B5C` | Green RAG foreground and effective controls |
| Vibrant Teal | `#02BE98` | Green bar segment in helicopter view |
| Light Teal | `#9AE5D6` | Soft teal accent |
| Core Coral | `#CA3F4C` | Red RAG foreground, severe items |
| Vibrant Coral | `#FA6166` | High attention coral |
| Dark Coral | `#681A38` | Material-control ineffective / extreme accent |
| White | `#FFFFFF` | Slide background and card background |
| Black | `#000000` | KPI labels where high contrast is needed |

### Neutrals

| Token | Hex / RGBA | Usage |
| --- | --- | --- |
| Body text secondary | `#1F3458` | Commentary and paragraph text |
| Muted text | `#5B6B83` | Subtitles, helper text |
| Muted label | `#8294AE` | Table headers and low-emphasis labels |
| Border / line | `#D8E0EC` | Panel and card borders |
| Soft panel | `#F7F9FC` | Table headers and subtle panel backgrounds |
| Soft blue panel | `#F8FBFF` | Notes and callouts |
| Hairline | `rgba(10,47,115,0.14)` | Header borders and subtle separators |
| Hairline soft | `rgba(10,47,115,0.07)` | Table row dividers |

### RAG And Status

| Status | Foreground | Background | Border | Notes |
| --- | --- | --- | --- | --- |
| Red / Limit | `#CA3F4C` | `#FDE2E4` or `#FDE6E8` | `#F0A3AA` / `#EDA9AF` | Use for formal breach / red status |
| Amber / Trigger | `#DE4721` | `#FFF4D1` or `#FFF2C2` | `#F0C96D` / `#EFD273` | Use dark orange text rather than yellow text |
| Watch | `#8F6200` | `#FFF7D9` | `#EFD273` | Separate watch/near-trigger from formal trigger |
| Green / Within | `#006B5C` | `#E6F5F1` or `#E3F3EF` | `#95D5C8` / `#A9D8CD` | Use for within appetite/effective |
| Pending / Grey | `#69778C` | `#EEF2F7` | `#D2DBE7` | Use for placeholder / not scored |
| Purple / Material ineffective | `#681A38` | `#FFF4F5` or light tint | `#681A38` | Used sparingly for material-control ineffective |

### Bar Colours

| Segment | Hex |
| --- | --- |
| RCSA red segment | `#CA3F4C` |
| RCSA amber segment | `#FFBB00` |
| RCSA green segment | `#02BE98` |
| Control effective | `#006B5C` |
| Control partial | `#DE4721` |
| Control ineffective | `#681A38` |

## Typography

Preferred font stack:

```text
Aptos, Segoe UI, Arial, sans-serif
```

Fallback monospace for IDs/dates:

```text
Aptos Mono, Cascadia Mono, Consolas, monospace
```

Power BI mapping:

- Use Aptos where available.
- If Aptos is not available, use Segoe UI.
- Keep headings bold, labels uppercase, body compact.
- Avoid negative letter spacing in Power BI. The prototype uses slight negative tracking in HTML headers, but Power BI should use normal tracking for stability.

### Type Scale

| Element | Size | Weight | Notes |
| --- | --- | --- | --- |
| Slide title | 22-24 px | 700-900 | White text on blue header |
| Header subtitle | 11.5-13 px | 400-600 | White at about 80 percent opacity |
| Panel title | 13-16 px | 700-900 | Heritage Blue |
| Card title | 10-12.5 px | 700-900 | Heritage Blue |
| KPI value | 21-27 px | 600 | Heritage Blue |
| KPI label | 8-9.2 px | 700-800 | Uppercase, letter spacing about 0.08em |
| Table header | 6.5-8 px | 700-900 | Uppercase, muted blue-grey |
| Table body | 8-9.2 px | 600-800 | Compact row height |
| Commentary body | 9-11 px | 400-600 | Line height about 1.3-1.4 |
| Pill/chip text | 6.5-9 px | 800-950 | Uppercase where status-like |
| Footer text | 9 px | 600-800 | Light blue text on navy |

## Global Page Structure

Most internal slide frames use:

| Region | Height | Notes |
| --- | --- | --- |
| Brand strip | 36 px | White, Standard Life logo left |
| Header band | 56 px | `#17377F`, gold 3 px accent along bottom |
| Body | 596 px | Main report content |
| Footer | 32 px | `#07235A` or `#082B67` |

Risk Appetite external pages use a slightly taller header:

| Region | Height | Notes |
| --- | --- | --- |
| Brand strip | 36 px | White |
| Header band | 68 px | `#0A2F73`, gold/blue accent line |
| Body | 584 px | KPI row plus main view/commentary |
| Footer | 32 px | Deep navy |

Header layout:

- Horizontal padding: 32 px.
- Title/subtitle gap: 16 px.
- Accent line: 3 px high, gold first 12 percent then blue.
- Body padding usually 12-18 px vertical and 30-40 px horizontal.
- Common grid gaps: 8, 10, 12, 14, 16 px.

## Components

### KPI Tiles

Use compact rectangular tiles, not large dashboard cards.

| Property | Value |
| --- | --- |
| Border | `1 px #D8E0EC` |
| Top border | 3 px status colour |
| Radius | 6-7 px |
| Padding | 6-10 px |
| Label | 8-9 px uppercase |
| Value | 21-27 px, 600 weight |
| Background | White |

Typical layouts:

- Executive summary: 5 or 6 KPI tiles across.
- Risk appetite: 3-4 KPI tiles across.
- RCSA/control detail: 4 KPI tiles across.

### Panels And Cards

| Component | Border | Radius | Padding | Notes |
| --- | --- | --- | --- | --- |
| Main panel | `1 px #D8E0EC` | 7 px | 10-14 px | Used for large content areas |
| Repeated card | `1 px #D8E0EC` | 6 px | 8-12 px | Used for commentary, profile cards, action cards |
| Commentary card | `1 px #D8E0EC` plus 3-4 px left border | 6 px | 9-12 px | Left border indicates status/category |
| Note / callout | Dashed `#CDD7E6` | 5 px | 5-8 px | Soft blue background `#F8FBFF` |

Avoid nested-card styling. If a section contains cards, the section itself should be a panel or unframed layout, not another decorative card.

### Status Pills / Chips

| Property | Value |
| --- | --- |
| Radius | 3-4 px |
| Padding | 2-7 px |
| Font | 6.5-9 px, 800-950 weight |
| Text | Uppercase for status; title case for simple labels |
| Background | Use status soft background |
| Border | Use status border where contrast is useful |

Metric/risk chips should be small and wrap. Use plain text chips; avoid heavy pill styling where the user has asked for simpler text.

### Tables

Tables are dense and board-pack oriented.

| Property | Value |
| --- | --- |
| Header background | `#F7F9FC` or white with bottom border |
| Header font | 6.5-8 px uppercase, muted |
| Body font | 8-9.2 px |
| Row divider | `rgba(10,47,115,0.07)` or `#EDF1F7` |
| Row height | 14 px for appendix micro tables; 22 px for main detail tables |
| Cell padding | 1-6 px |
| Table layout | Fixed widths where possible |

Power BI note: use matrix/table visuals with reduced row padding, compact headers, and careful column widths. For detail tables, prefer horizontal scroll only if absolutely necessary.

### RAG Indicators

Use both colour and shape/pattern where possible:

- Red RAG in compact tables can use a coral fill with diagonal cross-hatch.
- Amber RAG can use yellow fill with vertical striping and dark orange text.
- Green RAG can use teal/green fill with subtle dot pattern.
- Final expert overlay uses a dark blue outline around the RAG cell.

If Power BI cannot reproduce hatch patterns easily, use:

- Red: coral background, coral/dark red border, white or dark red text depending fill depth.
- Amber: yellow/cream background, dark orange text.
- Green: teal light background, core teal text.
- Expert overlay: 2 px Heritage Blue outline or border.

### Stacked Bars

Use thin rounded stacked bars.

| Bar Type | Height | Radius | Segment Order |
| --- | --- | --- | --- |
| Helicopter RCSA mix | 7-12 px | 999 px | Red, Amber, Green |
| Risk Appetite status mix | 12 px | 999 px | Limit, Trigger, Watch, Within, Pending |
| Control effectiveness | 7-20 px | 999 px or 4 px | Effective, Partial, Ineffective |

Use labels sparingly inside bars only where space allows. Keep legends compact and aligned to the top right of the panel.

### Helicopter View Cards

Used on Executive Summary to show L1 risk areas.

| Property | Value |
| --- | --- |
| Card grid | 4 columns x 2 rows |
| Card radius | 6-7 px |
| Card header | Heritage Blue background |
| Header text | White, 11-12 px, bold |
| Top border | Red/amber/green status |
| Main bar | Small horizontal RAG mix |
| Chips | Small L2 or metric chips, 7-8 px |
| Risk appetite section | Label clearly as Risk Appetite; split core/additional only when useful |

Do not over-highlight the count text. Keep counts as plain supporting text unless the status itself is the main message.

### Risk Appetite Area Rows

The current RA financial/non-financial slides use row cards:

| Property | Value |
| --- | --- |
| Row border | `1 px #D8E0EC` |
| Left status border | 4 px, status colour |
| Radius | 6 px |
| Grid | Rank, area title, status bar/metric pills, stats/commentary |
| Rank | 18 px, muted grey-blue |
| Area name | 15 px, bold Heritage Blue |
| Status bar | 12 px rounded |
| Metric pills | 18 px min-height, 7 px text |

Financial areas currently include Capital, Liquidity, Dividend. Non-financial areas currently include Operational and Customer.

### Commentary Cards

Commentary is central to the report, especially executive summary, RCSA detail, and RA pages.

| Property | Value |
| --- | --- |
| Border | `1 px #D8E0EC` |
| Left border | 3-4 px status/category colour |
| Radius | 6 px |
| Padding | 9-12 px |
| Title | 10-12.5 px, bold |
| Owner/meta | 8-8.5 px muted |
| Body | 9-10.6 px, line height 1.35-1.4 |

For Power BI, commentary should look like editorial board-pack text, not dashboard tooltip text.

### Top Actions Table

Executive page top actions are compact.

| Field | Guidance |
| --- | --- |
| Title | "Top 5 Actions" |
| Sort | Due date ascending |
| Owner | Fake person names in prototype; real owner in model |
| Status | Plain text, no heavy pill |
| Risk/action | Risk label plus concise action text |
| Row height | Compact, around 18-22 px |

## Page Design Patterns

### Executive Summary

Primary layout:

- KPI strip across the top.
- Left column: committee readout plus Top 5 Actions table.
- Right/main area: RCSA helicopter view with risk appetite status under each L1 area.
- Control snapshot at bottom where space allows.

Tone: most impactful page, but still dense and committee-ready. Avoid a generic dashboard look.

### Risk Appetite Financial / Non-Financial

Primary layout:

- KPI tiles at top.
- Large area appetite rows left/main.
- Commentary panel on right.
- Use status mix bars and metric chips.
- Keep breach counts rare; most dummy data should be amber/watch/within rather than red.

### RCSA Summary

Primary layout:

- KPI strip.
- L2 risk table and heatmap/summary visual.
- Show context columns such as `# Risks`, `# Red Risks`, `# Accepted`.
- Use `Prior Final` and `Current Final` naming.
- Issues and actions should be separate columns.

### RCSA Detail

Primary layout:

- L2-level table with commentary assigned at L2.
- Side commentary panel for red/amber risks.
- Keep L3 details in appendix.

### Controls

Primary layout:

- KPI tiles at top.
- Table split by L2 risk / business area.
- Commentary panel to the right.
- Remove control-cluster column.
- Avoid highlighted BAN cards for simple totals; keep the KPI tiles clean.

### Incidents

Primary layout:

- KPI strip.
- Top incidents table.
- Customer outcome x severity matrix.
- Severity headers must sit directly above columns.
- Remediation register and assignment cards to the right.

## Power BI Implementation Notes

- Use a theme JSON with the colour tokens above.
- Set report canvas to 16:9 and design against 1280 x 720.
- Use grouped shapes and cards for page chrome if recreating the board-pack frame.
- Use standard table/matrix visuals only where dense formatting can be controlled.
- For RAG chips, consider SVG measures or conditional-formatting measures if built-in table formatting is too limited.
- For commentary cards, use text boxes/cards backed by filtered commentary measures where possible.
- Maintain consistent header/footer/page chrome across all pages.
- Keep all appendix pages visually separated by the appendix divider page.

## Screenshot Pack To Pair With This

Use these alongside the design spec:

```text
screenshots/CRR_Board_Pack_Screenshots_2026-06-22_revised_pack.zip
screenshots/CRR_Board_Pack_Screenshots_2026-06-22_revised/
```

The screenshot pack has 21 PNGs. P05 RCSA Fin Detail repeatedly timed out in the capture engine, but the live page exists in the app.
