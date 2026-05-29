# Standard Life / Risk & Controls Transformation Commentary Manager

## Power Apps Build Guide & Formula Sheet — v1.5

**Project:** Commentary Manager prototype  
**Platform:** SharePoint, Power Automate, Power Apps  
**Source of truth:** `CommentaryManager_Handover_Build_Pack_v1.5`  
**Current build priority:** Power Apps shell and Control Centre assignment workflow

---

## 1. Purpose

This guide is the copy/paste build document for the Power Apps side of the Standard Life Commentary Manager prototype.

The app supports controlled commentary collection for report packs such as:

- CRR Board Pack
- Control Reporting
- Future Risk & Controls reporting packs

The v1.5 design is deliberately simple:

- Three core SharePoint lists only:
  - `Reports`
  - `CommentarySlots`
  - `ERM_Commentary`
- No separate `CommentaryActivity` list.
- Latest activity/audit-style UI should come from `ERM_Commentary.Modified`, lifecycle fields, and SharePoint version history.
- `Scope` replaces `OrgUnitCode`.
- Page summaries are normal commentary rows where `Scope = PAGE` and `ItemNumber = 0`.
- Plan Cycle creates unassigned row shells only.
- Person assignment happens in Power Apps Control Centre.

---

## 2. Critical v1.5 rules

### 2.1 Plan Cycle must not populate Person fields

The Plan Cycle flow creates `ERM_Commentary` rows with:

- `Status = Not Started`
- `AssignedContributor` blank
- `Reviewer` blank
- `Gatekeeper` blank
- mirror email fields blank

This avoids Power Automate automatically creating nested `Apply to each` loops around Person/Claims dynamic content.

### 2.2 Person assignment starts in Control Centre

The gatekeeper assigns:

- contributor
- reviewer
- gatekeeper
- due date

Then clicks **Save and notify**.

The app patches the selected row to:

```powerfx
Status: {Value: "Assigned"}
```

The Email Mirror flow then fills:

- `AssignedContributorEmail`
- `ReviewerEmail`
- `GatekeeperEmail`

The Assignment Notification flow then sends the assignment email.

### 2.3 Status is assumed to be a SharePoint Choice column

Most formulas in this guide assume:

```powerfx
Status.Value
```

and patch status values using:

```powerfx
Status: {Value: "Assigned"}
```

If `Status` was created as a plain text column, deliberately replace:

```powerfx
Status.Value
```

with:

```powerfx
Status
```

and replace:

```powerfx
Status: {Value: "Assigned"}
```

with:

```powerfx
Status: "Assigned"
```

Do not mix Choice and text syntax on the same app screen.

---

## 3. Current lifecycle model

| Stage | Status | Owner action | Flow impact |
|---|---|---|---|
| Plan Cycle | `Not Started` | Flow creates row shell | No people populated |
| Assignment | `Assigned` | Gatekeeper assigns people in Control Centre | Email Mirror + Assignment Notification |
| Drafting | `Draft` | Contributor saves working commentary | No lifecycle email unless configured |
| Submit | `Submitted` | Contributor submits for review | Lifecycle Notification emails reviewer |
| Review edits | `Rejected` | Reviewer requests changes | Lifecycle Notification emails contributor |
| Review approval | `Approved` | Reviewer approves | Ready for final sign-off |
| Final sign-off | `Final` | Gatekeeper signs off cycle | Power BI consumes final commentary |
| Not required | `Not Required` | Gatekeeper marks not required | Excluded from required completion checks |

---

## 4. Build order

Build in this order:

1. App shell and theme variables.
2. Connect SharePoint data sources.
3. Connect flows.
4. Build Control Centre.
5. Wire `+ Plan Cycle` button.
6. Build assignment panel.
7. Validate first milestone end-to-end.
8. Build My Items.
9. Build Edit Commentary.
10. Build Approval Queue.
11. Build Approval Detail.
12. Build Home dashboard summaries from `ERM_Commentary`.
13. Build Sign Off Cycle only after the app workflow is stable.

---

## 5. Data sources

Add these SharePoint lists to the canvas app:

| Data source | Purpose |
|---|---|
| `Reports` | Report selection and defaults |
| `CommentarySlots` | Slot catalogue/reference |
| `ERM_Commentary` | Main operational workflow list |

Add these flows to the app:

| Flow | Suggested Power Apps name | Purpose |
|---|---|---|
| `ERM Plan Cycle` | `ERMPlanCycle` | Creates missing `ERM_Commentary` row shells |
| `ERM Send Nudge` | `ERMSendNudge` | Sends contributor nudge and patches nudge fields |

> If Power Apps keeps the original names with spaces, use the exact flow names shown in the Data pane when calling `.Run()`.

---

## 6. SharePoint list assumptions

### 6.1 `CommentarySlots`

`CommentarySlots` contains catalogue/default rows. It should not contain period-specific workflow state.

Key columns used by the app/flows:

| Column | Purpose |
|---|---|
| `ReportCode_Text` | Plain report key used by Plan Cycle |
| `PageCode` | Report page key |
| `PageName` | Display page name |
| `CommentaryKey` | Stable commentary slot key |
| `DefaultItemNumber` | `0` for page summary rows |
| `DefaultSectionName` | Commentary section/card name |
| `DefaultScope` | `PAGE`, `CYBER`, `OPS`, `CENTRAL`, etc. |
| `Active` | Only active rows are generated |
| `IncludedByDefault` | Only default rows are generated by Plan Cycle |
| `RequiredByDefault` | Copied to `RequiredThisCycle` |
| `DefaultPriority` | Copied to `Priority` |
| `StandingPrompt` | Copied to prompt fields |
| `ReviewerPrompt` | Reviewer guidance |
| `ReviewerChecks` | Reviewer checklist |

### 6.2 `ERM_Commentary`

`ERM_Commentary` is the operational list powering the app, flows, and Power BI commentary output.

Important columns:

| Column | Type | Notes |
|---|---|---|
| `RowKey` | Single line text | Composite unique key. Index this. |
| `ReportCode` | Single line text | Plain report code. Do not use a lookup object here. |
| `PageCode` | Single line text | Copied from `CommentarySlots`. |
| `PageName` | Single line text | Copied from `CommentarySlots`. |
| `CommentaryKey` | Single line text | Copied from `CommentarySlots`. |
| `PeriodKey` | Single line text | Example: `2026-Q2`. |
| `PeriodStart` | Date | From Plan Cycle input. |
| `PeriodEnd` | Date | From Plan Cycle input. |
| `PackDueDate` | Date | From Plan Cycle input. |
| `Scope` | Single line text | Copied from `DefaultScope`, fallback `PAGE`. |
| `ItemNumber` | Number | `0` means page summary. |
| `SectionName` | Single line text | Copied from `DefaultSectionName`. |
| `Status` | Choice preferred | Values listed below. |
| `RequiredThisCycle` | Yes/No | Copied from `RequiredByDefault`. |
| `Priority` | Choice or text | Copied from `DefaultPriority`. |
| `DueDate` | Date | Set in Control Centre. |
| `AssignedContributor` | Person | Single person only. Set in Control Centre. |
| `Reviewer` | Person | Single person only. Set in Control Centre. |
| `Gatekeeper` | Person | Single person only. Set in Control Centre. |
| `AssignedContributorEmail` | Text | Flow-maintained mirror field. |
| `ReviewerEmail` | Text | Flow-maintained mirror field. |
| `GatekeeperEmail` | Text | Flow-maintained mirror field. |
| `CommentaryText` | Multiple lines | Contributor draft text. |
| `FinalCommentaryText` | Multiple lines | Approved/final wording. |
| `LatestReviewerFeedback` | Multiple lines | Latest reviewer feedback on rejection. |
| `NudgeCount` | Number | Starts at `0`. |
| `PreviousRejectionCount` | Number | Starts at `0`. |
| `AssignedDate` | Date/time | Set when assigned. |
| `SubmittedDate` | Date/time | Set when submitted. |
| `ReviewedDate` | Date/time | Set when reviewed. |
| `ApprovedDate` | Date/time | Set when approved. |
| `FinalisedDate` | Date/time | Set by Sign Off Cycle later. |
| `LastNudgeDate` | Date/time | Set by Send Nudge flow. |

Recommended `Status` Choice values:

- `Not Started`
- `Assigned`
- `Draft`
- `Submitted`
- `Rejected`
- `Approved`
- `Final`
- `Not Required`

---

## 7. RowKey standard

The clean `RowKey` format is:

```text
ReportCode|PageCode|CommentaryKey|PeriodKey|Scope
```

Example:

```text
CRR|P2|CRR-P2-CYBER-APP|2026-Q2|CYBER
```

Delete bad rows where the `RowKey` includes SharePoint lookup JSON, for example:

```text
{"@odata.type":"#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference","Id":1,"Value":"CRR"}|P2|...
```

Also delete rows where expression text was inserted rather than evaluated, for example:

```text
CRR|P2|CRR-P2-CYBER-APP|2026-Q2|if(empty(CYBER), 'PAGE', CYBER)
```

---

## 8. App setup

### 8.1 Suggested screen names

Create these screens:

| Screen | Purpose | Build stage |
|---|---|---|
| `scrHome` | Dashboard and status summary | Later |
| `scrMyItems` | Contributor work queue | After Control Centre |
| `scrEditCommentary` | Contributor draft/submit screen | After My Items |
| `scrApprovalQueue` | Reviewer queue | After Edit Commentary |
| `scrApprovalDetail` | Reviewer approve/reject screen | After Approval Queue |
| `scrControlCentre` | Gatekeeper planning/assignment screen | First |

### 8.2 Suggested control names

| Control | Suggested name |
|---|---|
| Main Control Centre gallery | `galControlCentre` |
| Contributor combo box | `cmbContributor` |
| Reviewer combo box | `cmbReviewer` |
| Gatekeeper combo box | `cmbGatekeeper` |
| Due date picker | `dpDueDate` |
| Plan Cycle button | `btnPlanCycle` |
| Save and notify button | `btnSaveAndNotify` |
| Nudge button | `btnSendNudge` |
| Nudge message input | `txtNudgeMessage` |
| My Items gallery | `galMyItems` |
| Commentary text input | `txtCommentary` |
| Approval queue gallery | `galApprovalQueue` |
| Reviewer feedback input | `txtReviewerFeedback` |

---

## 9. App theme variables

Use these in `App.OnStart` so the UI can stay consistent.

```powerfx
Set(varColorSLBlue, ColorValue("#0A2F73"));
Set(varColorSLBlueDark, ColorValue("#121F47"));
Set(varColorSLBlueAlt, ColorValue("#147CB3"));
Set(varColorSLYellow, ColorValue("#FFBB00"));
Set(varColorBackground, ColorValue("#F6F8FB"));
Set(varColorSurface, Color.White);
Set(varColorText, ColorValue("#1F2937"));
Set(varColorMutedText, ColorValue("#6B7280"));
Set(varColorBorder, ColorValue("#D8DEE9"));
Set(varColorSuccess, ColorValue("#107C10"));
Set(varColorWarning, ColorValue("#FFB900"));
Set(varColorDanger, ColorValue("#A4262C"));
```

Suggested button usage:

| Button | Fill | Colour |
|---|---|---|
| Primary save/submit | `varColorSLBlue` | `Color.White` |
| Secondary/cancel/discard | `Color.White` | `varColorSLBlueDark` |
| Warning/destructive | `varColorDanger` | `Color.White` |
| Plan Cycle/action | `varColorSLYellow` | `varColorSLBlueDark` |

---

## 10. `App.OnStart`

Use this as the baseline.

```powerfx
Set(varLoadingComplete, false);
Set(varDevMode, true);

Set(
    varUserEmail,
    Lower(Trim(User().Email))
);

Set(varSelectedReportCode, "CRR");
Set(varSelectedPeriod, "2026-Q2");
Set(varPeriodStart, Date(2026, 4, 1));
Set(varPeriodEnd, Date(2026, 6, 30));
Set(varPackDueDate, Date(2026, 6, 28));

Set(varColorSLBlue, ColorValue("#0A2F73"));
Set(varColorSLBlueDark, ColorValue("#121F47"));
Set(varColorSLBlueAlt, ColorValue("#147CB3"));
Set(varColorSLYellow, ColorValue("#FFBB00"));
Set(varColorBackground, ColorValue("#F6F8FB"));
Set(varColorSurface, Color.White);
Set(varColorText, ColorValue("#1F2937"));
Set(varColorMutedText, ColorValue("#6B7280"));
Set(varColorBorder, ColorValue("#D8DEE9"));
Set(varColorSuccess, ColorValue("#107C10"));
Set(varColorWarning, ColorValue("#FFB900"));
Set(varColorDanger, ColorValue("#A4262C"));

Concurrent(
    Refresh(Reports),
    Refresh(CommentarySlots),
    Refresh(ERM_Commentary)
);

Set(
    varActiveReport,
    LookUp(
        Reports,
        ReportCode = varSelectedReportCode
    )
);

Set(varSelectedCommentary, Blank());
Set(varCurrentScreen, "Control Centre");

Set(varLoadingComplete, true);
```

After adding this, run:

```text
App > Run OnStart
```

Validation label:

```powerfx
varUserEmail
```

Expected result: your lowercase email address.

---

## 11. Control Centre screen

Build `scrControlCentre` first.

The Control Centre is where gatekeepers:

- view the rows created by Plan Cycle
- select a row
- assign contributor/reviewer/gatekeeper
- set a due date
- save and notify
- send nudges later

---

## 12. Control Centre gallery

Add a vertical gallery called:

```text
galControlCentre
```

### 12.1 `galControlCentre.Items`

```powerfx
SortByColumns(
    Filter(
        ERM_Commentary,
        ReportCode = varSelectedReportCode &&
        PeriodKey = varSelectedPeriod
    ),
    "PageCode",
    SortOrder.Ascending,
    "ItemNumber",
    SortOrder.Ascending
)
```

### 12.2 `galControlCentre.OnSelect`

```powerfx
Set(varSelectedCommentary, ThisItem)
```

### 12.3 Optional selected row styling

Set the gallery template fill to:

```powerfx
If(
    !IsBlank(varSelectedCommentary.ID) && ThisItem.ID = varSelectedCommentary.ID,
    ColorFade(varColorSLBlueAlt, 85%),
    Color.White
)
```

---

## 13. Control Centre gallery labels

### 13.1 Row title label

```powerfx
ThisItem.PageCode & " - " & ThisItem.SectionName
```

### 13.2 Page name label

```powerfx
ThisItem.PageName
```

### 13.3 Summary/item label

```powerfx
If(
    Upper(Coalesce(ThisItem.Scope, "")) = "PAGE" && Coalesce(ThisItem.ItemNumber, -1) = 0,
    "Summary",
    "Item " & Text(ThisItem.ItemNumber) & " • " & ThisItem.Scope
)
```

### 13.4 Status label — Choice column

```powerfx
ThisItem.Status.Value
```

### 13.5 Status label — text column alternative

```powerfx
ThisItem.Status
```

### 13.6 Contributor label

```powerfx
Coalesce(
    ThisItem.AssignedContributor.DisplayName,
    "Unassigned"
)
```

### 13.7 Due date label

```powerfx
If(
    IsBlank(ThisItem.DueDate),
    "No due date",
    Text(ThisItem.DueDate, "dd mmm yyyy")
)
```

### 13.8 Required label

```powerfx
If(
    ThisItem.RequiredThisCycle,
    "Required",
    "Optional"
)
```

---

## 14. `+ Plan Cycle` button

Add a button called:

```text
btnPlanCycle
```

Set `Text` to:

```powerfx
"+ Plan Cycle"
```

Set `OnSelect` to:

```powerfx
IfError(
    Set(
        varPlanResult,
        ERMPlanCycle.Run(
            varSelectedReportCode,
            varSelectedPeriod,
            Text(varPeriodStart, "[$-en-US]yyyy-mm-dd"),
            Text(varPeriodEnd, "[$-en-US]yyyy-mm-dd"),
            Text(varPackDueDate, "[$-en-US]yyyy-mm-dd")
        )
    );

    Refresh(ERM_Commentary);
    Set(varSelectedCommentary, Blank());

    Notify(
        "Plan cycle completed. Rows should now appear in the Control Centre.",
        NotificationType.Success
    ),

    Notify(
        "Plan cycle failed: " & FirstError.Message,
        NotificationType.Error
    )
)
```

> If your flow expects different Power Apps trigger input names or order, adjust the `.Run()` parameters to match the flow.

### 14.1 Plan Cycle validation

After clicking the button:

1. Open `ERM_Commentary` in SharePoint.
2. Confirm rows were created.
3. Confirm `Status = Not Started`.
4. Confirm Person fields are blank.
5. Confirm `RowKey` is clean text.
6. Confirm rerunning the same report/period skips duplicates.

---

## 15. Assignment panel

Create a details/assignment panel beside the gallery.

The panel should show details for:

```powerfx
varSelectedCommentary
```

### 15.1 Selected row heading

```powerfx
If(
    IsBlank(varSelectedCommentary.ID),
    "Select a commentary row",
    varSelectedCommentary.PageCode & " - " & varSelectedCommentary.SectionName
)
```

### 15.2 Selected row helper text

```powerfx
If(
    IsBlank(varSelectedCommentary.ID),
    "Choose a row from the list to assign ownership.",
    varSelectedCommentary.PageName & " • " & varSelectedCommentary.Scope
)
```

---

## 16. Contributor picker

Add a combo box called:

```text
cmbContributor
```

### 16.1 `cmbContributor.Items`

```powerfx
Choices([@ERM_Commentary].AssignedContributor)
```

### 16.2 `cmbContributor.SelectMultiple`

```powerfx
false
```

### 16.3 `cmbContributor.DefaultSelectedItems`

```powerfx
If(
    IsBlank(varSelectedCommentary.ID) || IsBlank(varSelectedCommentary.AssignedContributor.Email),
    [],
    [varSelectedCommentary.AssignedContributor]
)
```

If Power Apps rejects `[]`, use:

```powerfx
If(
    IsBlank(varSelectedCommentary.ID) || IsBlank(varSelectedCommentary.AssignedContributor.Email),
    Blank(),
    [varSelectedCommentary.AssignedContributor]
)
```

---

## 17. Reviewer picker

Add a combo box called:

```text
cmbReviewer
```

### 17.1 `cmbReviewer.Items`

```powerfx
Choices([@ERM_Commentary].Reviewer)
```

### 17.2 `cmbReviewer.SelectMultiple`

```powerfx
false
```

### 17.3 `cmbReviewer.DefaultSelectedItems`

```powerfx
If(
    IsBlank(varSelectedCommentary.ID) || IsBlank(varSelectedCommentary.Reviewer.Email),
    [],
    [varSelectedCommentary.Reviewer]
)
```

If Power Apps rejects `[]`, use:

```powerfx
If(
    IsBlank(varSelectedCommentary.ID) || IsBlank(varSelectedCommentary.Reviewer.Email),
    Blank(),
    [varSelectedCommentary.Reviewer]
)
```

---

## 18. Gatekeeper picker

Add a combo box called:

```text
cmbGatekeeper
```

### 18.1 `cmbGatekeeper.Items`

```powerfx
Choices([@ERM_Commentary].Gatekeeper)
```

### 18.2 `cmbGatekeeper.SelectMultiple`

```powerfx
false
```

### 18.3 `cmbGatekeeper.DefaultSelectedItems`

```powerfx
If(
    IsBlank(varSelectedCommentary.ID) || IsBlank(varSelectedCommentary.Gatekeeper.Email),
    [],
    [varSelectedCommentary.Gatekeeper]
)
```

If Power Apps rejects `[]`, use:

```powerfx
If(
    IsBlank(varSelectedCommentary.ID) || IsBlank(varSelectedCommentary.Gatekeeper.Email),
    Blank(),
    [varSelectedCommentary.Gatekeeper]
)
```

---

## 19. Due date picker

Add a date picker called:

```text
dpDueDate
```

### 19.1 `dpDueDate.DefaultDate`

```powerfx
If(
    IsBlank(varSelectedCommentary.ID),
    Blank(),
    Coalesce(
        varSelectedCommentary.DueDate,
        varSelectedCommentary.PackDueDate,
        varPackDueDate
    )
)
```

---

## 20. Save and notify button

Add a button called:

```text
btnSaveAndNotify
```

Set `Text` to:

```powerfx
"Save and notify"
```

### 20.1 `btnSaveAndNotify.DisplayMode`

```powerfx
If(
    IsBlank(varSelectedCommentary.ID),
    DisplayMode.Disabled,
    DisplayMode.Edit
)
```

### 20.2 `btnSaveAndNotify.OnSelect` — Status as Choice

Use this version if `ERM_Commentary.Status` is a SharePoint Choice column.

```powerfx
If(
    IsBlank(varSelectedCommentary.ID) ||
    IsEmpty(cmbContributor.SelectedItems) ||
    IsEmpty(cmbReviewer.SelectedItems) ||
    IsEmpty(cmbGatekeeper.SelectedItems) ||
    IsBlank(dpDueDate.SelectedDate),

    Notify(
        "Select a commentary row, contributor, reviewer, gatekeeper and due date before saving.",
        NotificationType.Warning
    ),

    IfError(
        Set(
            varPatchedCommentary,
            Patch(
                ERM_Commentary,
                LookUp(
                    ERM_Commentary,
                    ID = varSelectedCommentary.ID
                ),
                {
                    AssignedContributor: First(cmbContributor.SelectedItems),
                    Reviewer: First(cmbReviewer.SelectedItems),
                    Gatekeeper: First(cmbGatekeeper.SelectedItems),
                    DueDate: dpDueDate.SelectedDate,
                    Status: {Value: "Assigned"},
                    AssignedDate: Now()
                }
            )
        );

        Refresh(ERM_Commentary);

        Set(
            varSelectedCommentary,
            LookUp(
                ERM_Commentary,
                ID = varPatchedCommentary.ID
            )
        );

        Notify(
            "Commentary assigned. Email notification will be sent automatically.",
            NotificationType.Success
        ),

        Notify(
            "Assignment save failed: " & FirstError.Message,
            NotificationType.Error
        )
    )
)
```

### 20.3 `btnSaveAndNotify.OnSelect` — Status as text

Use this version only if `ERM_Commentary.Status` is a plain text column.

```powerfx
If(
    IsBlank(varSelectedCommentary.ID) ||
    IsEmpty(cmbContributor.SelectedItems) ||
    IsEmpty(cmbReviewer.SelectedItems) ||
    IsEmpty(cmbGatekeeper.SelectedItems) ||
    IsBlank(dpDueDate.SelectedDate),

    Notify(
        "Select a commentary row, contributor, reviewer, gatekeeper and due date before saving.",
        NotificationType.Warning
    ),

    IfError(
        Set(
            varPatchedCommentary,
            Patch(
                ERM_Commentary,
                LookUp(
                    ERM_Commentary,
                    ID = varSelectedCommentary.ID
                ),
                {
                    AssignedContributor: First(cmbContributor.SelectedItems),
                    Reviewer: First(cmbReviewer.SelectedItems),
                    Gatekeeper: First(cmbGatekeeper.SelectedItems),
                    DueDate: dpDueDate.SelectedDate,
                    Status: "Assigned",
                    AssignedDate: Now()
                }
            )
        );

        Refresh(ERM_Commentary);

        Set(
            varSelectedCommentary,
            LookUp(
                ERM_Commentary,
                ID = varPatchedCommentary.ID
            )
        );

        Notify(
            "Commentary assigned. Email notification will be sent automatically.",
            NotificationType.Success
        ),

        Notify(
            "Assignment save failed: " & FirstError.Message,
            NotificationType.Error
        )
    )
)
```

### 20.4 Do not patch mirror email fields from Power Apps

Do not patch these fields in the app:

```text
AssignedContributorEmail
ReviewerEmail
GatekeeperEmail
```

They should be populated by the Email Mirror flow.

---

## 21. First milestone test

Run this exact test before building the rest of the app.

1. Run `App.OnStart`.
2. Go to `scrControlCentre`.
3. Click `+ Plan Cycle`.
4. Confirm rows appear in `galControlCentre`.
5. Confirm rows are `Not Started`.
6. Select one row.
7. Set yourself as contributor, reviewer, and gatekeeper.
8. Pick a due date.
9. Click **Save and notify**.
10. In SharePoint, confirm:
    - `Status = Assigned`
    - `AssignedContributor` populated
    - `Reviewer` populated
    - `Gatekeeper` populated
    - `DueDate` populated
    - `AssignedDate` populated
11. Wait briefly, then confirm:
    - `AssignedContributorEmail` populated
    - `ReviewerEmail` populated
    - `GatekeeperEmail` populated
12. Confirm only one assignment email sends.

Do not continue to My Items until this works.

---

## 22. Send Nudge button

Add this only after assignment works.

Add text input:

```text
txtNudgeMessage
```

Add button:

```text
btnSendNudge
```

Set `Text` to:

```powerfx
"Send nudge"
```

Set `OnSelect` to:

```powerfx
If(
    IsBlank(varSelectedCommentary.ID) || IsBlank(varSelectedCommentary.AssignedContributorEmail),

    Notify(
        "Select an assigned commentary row before sending a nudge.",
        NotificationType.Warning
    ),

    IfError(
        Set(
            varNudgeResult,
            ERMSendNudge.Run(
                varSelectedCommentary.ID,
                txtNudgeMessage.Text
            )
        );

        Refresh(ERM_Commentary);

        Set(
            varSelectedCommentary,
            LookUp(
                ERM_Commentary,
                ID = varSelectedCommentary.ID
            )
        );

        Notify(
            "Nudge sent.",
            NotificationType.Success
        ),

        Notify(
            "Nudge failed: " & FirstError.Message,
            NotificationType.Error
        )
    )
)
```

---

## 23. My Items screen

Build this after Control Centre assignment works.

Create screen:

```text
scrMyItems
```

Create gallery:

```text
galMyItems
```

### 23.1 `galMyItems.Items` — Status as Choice

```powerfx
SortByColumns(
    Filter(
        ERM_Commentary,
        Lower(AssignedContributorEmail) = varUserEmail &&
        ReportCode = varSelectedReportCode &&
        PeriodKey = varSelectedPeriod &&
        Status.Value <> "Final" &&
        Status.Value <> "Not Required"
    ),
    "DueDate",
    SortOrder.Ascending
)
```

### 23.2 `galMyItems.Items` — Status as text

```powerfx
SortByColumns(
    Filter(
        ERM_Commentary,
        Lower(AssignedContributorEmail) = varUserEmail &&
        ReportCode = varSelectedReportCode &&
        PeriodKey = varSelectedPeriod &&
        Status <> "Final" &&
        Status <> "Not Required"
    ),
    "DueDate",
    SortOrder.Ascending
)
```

### 23.3 `galMyItems.OnSelect`

```powerfx
Set(varSelectedCommentary, ThisItem);
Navigate(scrEditCommentary, ScreenTransition.Fade)
```

### 23.4 My Items row title

```powerfx
ThisItem.PageCode & " - " & ThisItem.SectionName
```

### 23.5 My Items row status — Choice

```powerfx
ThisItem.Status.Value
```

### 23.6 My Items row due date

```powerfx
If(
    IsBlank(ThisItem.DueDate),
    "No due date",
    "Due " & Text(ThisItem.DueDate, "dd mmm yyyy")
)
```

---

## 24. Edit Commentary screen

Create screen:

```text
scrEditCommentary
```

Create a multiline text input:

```text
txtCommentary
```

### 24.1 Screen heading

```powerfx
If(
    IsBlank(varSelectedCommentary.ID),
    "Commentary",
    If(
        Upper(Coalesce(varSelectedCommentary.Scope, "")) = "PAGE" && Coalesce(varSelectedCommentary.ItemNumber, -1) = 0,
        varSelectedCommentary.PageName & " Summary",
        varSelectedCommentary.SectionName & " Commentary"
    )
)
```

### 24.2 Prompt label

```powerfx
Coalesce(
    varSelectedCommentary.GatekeeperPrompt,
    varSelectedCommentary.StandingPrompt,
    "No prompt has been provided for this item."
)
```

> Use whichever prompt column exists in your SharePoint list. The v1.5 schema references copied prompt/check fields from `CommentarySlots`.

### 24.3 `txtCommentary.Default`

```powerfx
Coalesce(
    varSelectedCommentary.CommentaryText,
    ""
)
```

### 24.4 Save Draft button — Status as Choice

```powerfx
If(
    IsBlank(varSelectedCommentary.ID),

    Notify("No commentary row is selected.", NotificationType.Warning),

    IfError(
        Set(
            varPatchedCommentary,
            Patch(
                ERM_Commentary,
                LookUp(ERM_Commentary, ID = varSelectedCommentary.ID),
                {
                    CommentaryText: txtCommentary.Text,
                    Status: {Value: "Draft"}
                }
            )
        );

        Refresh(ERM_Commentary);
        Set(varSelectedCommentary, LookUp(ERM_Commentary, ID = varPatchedCommentary.ID));
        Notify("Draft saved.", NotificationType.Success),

        Notify("Draft save failed: " & FirstError.Message, NotificationType.Error)
    )
)
```

### 24.5 Save Draft button — Status as text

```powerfx
If(
    IsBlank(varSelectedCommentary.ID),

    Notify("No commentary row is selected.", NotificationType.Warning),

    IfError(
        Set(
            varPatchedCommentary,
            Patch(
                ERM_Commentary,
                LookUp(ERM_Commentary, ID = varSelectedCommentary.ID),
                {
                    CommentaryText: txtCommentary.Text,
                    Status: "Draft"
                }
            )
        );

        Refresh(ERM_Commentary);
        Set(varSelectedCommentary, LookUp(ERM_Commentary, ID = varPatchedCommentary.ID));
        Notify("Draft saved.", NotificationType.Success),

        Notify("Draft save failed: " & FirstError.Message, NotificationType.Error)
    )
)
```

### 24.6 Submit for Review button — Status as Choice

```powerfx
If(
    IsBlank(varSelectedCommentary.ID) || IsBlank(Trim(txtCommentary.Text)),

    Notify(
        "Add commentary text before submitting for review.",
        NotificationType.Warning
    ),

    IfError(
        Set(
            varPatchedCommentary,
            Patch(
                ERM_Commentary,
                LookUp(ERM_Commentary, ID = varSelectedCommentary.ID),
                {
                    CommentaryText: txtCommentary.Text,
                    Status: {Value: "Submitted"},
                    SubmittedDate: Now()
                }
            )
        );

        Refresh(ERM_Commentary);
        Set(varSelectedCommentary, LookUp(ERM_Commentary, ID = varPatchedCommentary.ID));
        Notify("Submitted for review.", NotificationType.Success);
        Navigate(scrMyItems, ScreenTransition.Fade),

        Notify("Submit failed: " & FirstError.Message, NotificationType.Error)
    )
)
```

### 24.7 Submit for Review button — Status as text

```powerfx
If(
    IsBlank(varSelectedCommentary.ID) || IsBlank(Trim(txtCommentary.Text)),

    Notify(
        "Add commentary text before submitting for review.",
        NotificationType.Warning
    ),

    IfError(
        Set(
            varPatchedCommentary,
            Patch(
                ERM_Commentary,
                LookUp(ERM_Commentary, ID = varSelectedCommentary.ID),
                {
                    CommentaryText: txtCommentary.Text,
                    Status: "Submitted",
                    SubmittedDate: Now()
                }
            )
        );

        Refresh(ERM_Commentary);
        Set(varSelectedCommentary, LookUp(ERM_Commentary, ID = varPatchedCommentary.ID));
        Notify("Submitted for review.", NotificationType.Success);
        Navigate(scrMyItems, ScreenTransition.Fade),

        Notify("Submit failed: " & FirstError.Message, NotificationType.Error)
    )
)
```

---

## 25. Approval Queue screen

Create screen:

```text
scrApprovalQueue
```

Create gallery:

```text
galApprovalQueue
```

### 25.1 `galApprovalQueue.Items` — Status as Choice

```powerfx
SortByColumns(
    Filter(
        ERM_Commentary,
        Lower(ReviewerEmail) = varUserEmail &&
        ReportCode = varSelectedReportCode &&
        PeriodKey = varSelectedPeriod &&
        Status.Value = "Submitted"
    ),
    "DueDate",
    SortOrder.Ascending
)
```

### 25.2 `galApprovalQueue.Items` — Status as text

```powerfx
SortByColumns(
    Filter(
        ERM_Commentary,
        Lower(ReviewerEmail) = varUserEmail &&
        ReportCode = varSelectedReportCode &&
        PeriodKey = varSelectedPeriod &&
        Status = "Submitted"
    ),
    "DueDate",
    SortOrder.Ascending
)
```

### 25.3 `galApprovalQueue.OnSelect`

```powerfx
Set(varSelectedCommentary, ThisItem);
Navigate(scrApprovalDetail, ScreenTransition.Fade)
```

---

## 26. Approval Detail screen

Create screen:

```text
scrApprovalDetail
```

Add a label showing submitted commentary:

```powerfx
Coalesce(
    varSelectedCommentary.CommentaryText,
    "No commentary text submitted."
)
```

Add reviewer feedback text input:

```text
txtReviewerFeedback
```

### 26.1 Reviewer prompt/checks label

```powerfx
Coalesce(
    varSelectedCommentary.ReviewerChecks,
    varSelectedCommentary.ReviewerPrompt,
    "No reviewer checks have been provided."
)
```

### 26.2 Approve button — Status as Choice

```powerfx
If(
    IsBlank(varSelectedCommentary.ID),

    Notify("No commentary row is selected.", NotificationType.Warning),

    IfError(
        Set(
            varPatchedCommentary,
            Patch(
                ERM_Commentary,
                LookUp(ERM_Commentary, ID = varSelectedCommentary.ID),
                {
                    Status: {Value: "Approved"},
                    ReviewedDate: Now(),
                    ApprovedDate: Now(),
                    FinalCommentaryText: varSelectedCommentary.CommentaryText
                }
            )
        );

        Refresh(ERM_Commentary);
        Set(varSelectedCommentary, LookUp(ERM_Commentary, ID = varPatchedCommentary.ID));
        Notify("Commentary approved.", NotificationType.Success);
        Navigate(scrApprovalQueue, ScreenTransition.Fade),

        Notify("Approval failed: " & FirstError.Message, NotificationType.Error)
    )
)
```

### 26.3 Approve button — Status as text

```powerfx
If(
    IsBlank(varSelectedCommentary.ID),

    Notify("No commentary row is selected.", NotificationType.Warning),

    IfError(
        Set(
            varPatchedCommentary,
            Patch(
                ERM_Commentary,
                LookUp(ERM_Commentary, ID = varSelectedCommentary.ID),
                {
                    Status: "Approved",
                    ReviewedDate: Now(),
                    ApprovedDate: Now(),
                    FinalCommentaryText: varSelectedCommentary.CommentaryText
                }
            )
        );

        Refresh(ERM_Commentary);
        Set(varSelectedCommentary, LookUp(ERM_Commentary, ID = varPatchedCommentary.ID));
        Notify("Commentary approved.", NotificationType.Success);
        Navigate(scrApprovalQueue, ScreenTransition.Fade),

        Notify("Approval failed: " & FirstError.Message, NotificationType.Error)
    )
)
```

### 26.4 Request edits / Reject button — Status as Choice

```powerfx
If(
    IsBlank(varSelectedCommentary.ID) || IsBlank(Trim(txtReviewerFeedback.Text)),

    Notify(
        "Add reviewer feedback before requesting edits.",
        NotificationType.Warning
    ),

    IfError(
        Set(
            varPatchedCommentary,
            Patch(
                ERM_Commentary,
                LookUp(ERM_Commentary, ID = varSelectedCommentary.ID),
                {
                    Status: {Value: "Rejected"},
                    ReviewedDate: Now(),
                    LatestReviewerFeedback: txtReviewerFeedback.Text,
                    PreviousRejectionCount: Coalesce(varSelectedCommentary.PreviousRejectionCount, 0) + 1
                }
            )
        );

        Refresh(ERM_Commentary);
        Set(varSelectedCommentary, LookUp(ERM_Commentary, ID = varPatchedCommentary.ID));
        Notify("Edits requested.", NotificationType.Success);
        Navigate(scrApprovalQueue, ScreenTransition.Fade),

        Notify("Request edits failed: " & FirstError.Message, NotificationType.Error)
    )
)
```

### 26.5 Request edits / Reject button — Status as text

```powerfx
If(
    IsBlank(varSelectedCommentary.ID) || IsBlank(Trim(txtReviewerFeedback.Text)),

    Notify(
        "Add reviewer feedback before requesting edits.",
        NotificationType.Warning
    ),

    IfError(
        Set(
            varPatchedCommentary,
            Patch(
                ERM_Commentary,
                LookUp(ERM_Commentary, ID = varSelectedCommentary.ID),
                {
                    Status: "Rejected",
                    ReviewedDate: Now(),
                    LatestReviewerFeedback: txtReviewerFeedback.Text,
                    PreviousRejectionCount: Coalesce(varSelectedCommentary.PreviousRejectionCount, 0) + 1
                }
            )
        );

        Refresh(ERM_Commentary);
        Set(varSelectedCommentary, LookUp(ERM_Commentary, ID = varPatchedCommentary.ID));
        Notify("Edits requested.", NotificationType.Success);
        Navigate(scrApprovalQueue, ScreenTransition.Fade),

        Notify("Request edits failed: " & FirstError.Message, NotificationType.Error)
    )
)
```

---

## 27. Home dashboard screen

Create screen:

```text
scrHome
```

This screen should use `ERM_Commentary`, not `CommentaryActivity`.

### 27.1 Total rows count

```powerfx
CountRows(
    Filter(
        ERM_Commentary,
        ReportCode = varSelectedReportCode &&
        PeriodKey = varSelectedPeriod
    )
)
```

### 27.2 Submitted count — Status as Choice

```powerfx
CountRows(
    Filter(
        ERM_Commentary,
        ReportCode = varSelectedReportCode &&
        PeriodKey = varSelectedPeriod &&
        Status.Value = "Submitted"
    )
)
```

### 27.3 Approved count — Status as Choice

```powerfx
CountRows(
    Filter(
        ERM_Commentary,
        ReportCode = varSelectedReportCode &&
        PeriodKey = varSelectedPeriod &&
        Status.Value = "Approved"
    )
)
```

### 27.4 Open required count — Status as Choice

```powerfx
CountRows(
    Filter(
        ERM_Commentary,
        ReportCode = varSelectedReportCode &&
        PeriodKey = varSelectedPeriod &&
        RequiredThisCycle = true &&
        !(Status.Value in ["Approved", "Final", "Not Required"])
    )
)
```

If `Status` is text, replace `Status.Value` with `Status`.

---

## 28. Latest activity without `CommentaryActivity`

Add a gallery for latest activity.

### 28.1 Latest activity gallery Items

```powerfx
FirstN(
    SortByColumns(
        Filter(
            ERM_Commentary,
            ReportCode = varSelectedReportCode &&
            PeriodKey = varSelectedPeriod
        ),
        "Modified",
        SortOrder.Descending
    ),
    5
)
```

### 28.2 Activity title — Status as Choice

```powerfx
ThisItem.SectionName & " - " & ThisItem.Status.Value
```

If `Status` is text:

```powerfx
ThisItem.SectionName & " - " & ThisItem.Status
```

### 28.3 Activity subtitle

```powerfx
"Updated " & Text(ThisItem.Modified, "dd mmm yyyy HH:mm") & " by " & ThisItem.'Modified By'.DisplayName
```

If Power Apps exposes the SharePoint modified-by field as `Editor`, use:

```powerfx
"Updated " & Text(ThisItem.Modified, "dd mmm yyyy HH:mm") & " by " & ThisItem.Editor.DisplayName
```

---

## 29. Simple navigation formulas

Use normal screen navigation first. Avoid overengineering components until the workflow is working.

### 29.1 Home nav button

```powerfx
Navigate(scrHome, ScreenTransition.Fade)
```

### 29.2 My Items nav button

```powerfx
Navigate(scrMyItems, ScreenTransition.Fade)
```

### 29.3 Approval Queue nav button

```powerfx
Navigate(scrApprovalQueue, ScreenTransition.Fade)
```

### 29.4 Control Centre nav button

```powerfx
Navigate(scrControlCentre, ScreenTransition.Fade)
```

---

## 30. Status colour helper formulas

For quick status chips, use a label fill formula.

### 30.1 Status chip fill — Choice column

```powerfx
Switch(
    ThisItem.Status.Value,
    "Not Started", ColorValue("#E5E7EB"),
    "Assigned", ColorValue("#DBEAFE"),
    "Draft", ColorValue("#FEF3C7"),
    "Submitted", ColorValue("#E0E7FF"),
    "Rejected", ColorValue("#FEE2E2"),
    "Approved", ColorValue("#DCFCE7"),
    "Final", ColorValue("#D1FAE5"),
    "Not Required", ColorValue("#F3F4F6"),
    ColorValue("#E5E7EB")
)
```

### 30.2 Status chip colour

```powerfx
Switch(
    ThisItem.Status.Value,
    "Rejected", varColorDanger,
    "Assigned", varColorSLBlueDark,
    "Submitted", varColorSLBlueDark,
    "Approved", varColorSuccess,
    "Final", varColorSuccess,
    varColorText
)
```

If `Status` is text, replace `ThisItem.Status.Value` with `ThisItem.Status`.

---

## 31. Internal column names checklist

If a formula or flow patch fails, check the internal SharePoint column name.

In SharePoint:

1. Open list settings.
2. Select the column.
3. Look at the URL.
4. The value after `Field=` is the internal name.

Examples:

| Display name | Possible internal name |
|---|---|
| `Assigned Contributor` | `AssignedContributor` or `Assigned_x0020_Contributor` |
| `Reviewer Email` | `ReviewerEmail` or `Reviewer_x0020_Email` |
| `Gatekeeper Email` | `GatekeeperEmail` or `Gatekeeper_x0020_Email` |
| `Modified By` | `Editor` |

Power Apps usually uses display names or logical names more gracefully than Power Automate HTTP MERGE, but internal names matter heavily in flows.

---

## 32. Person picker Patch notes

The preferred pattern in this app is:

```powerfx
AssignedContributor: First(cmbContributor.SelectedItems)
```

This works when the combo box uses:

```powerfx
Choices([@ERM_Commentary].AssignedContributor)
```

and `SelectMultiple = false`.

If Power Apps gives a type mismatch, try the simpler selected-record version:

```powerfx
AssignedContributor: cmbContributor.Selected
```

If this still fails, check that the SharePoint Person column is:

- single-select
- not a group-only picker
- not required during Plan Cycle
- connected via `Choices([@ERM_Commentary].AssignedContributor)`

Avoid manually constructing claims records unless the Choices-based patch fails.

---

## 33. Choice column Patch notes

For a SharePoint Choice column, patch this:

```powerfx
Status: {Value: "Assigned"}
```

For a SharePoint text column, patch this:

```powerfx
Status: "Assigned"
```

For filters against a Choice column, use this:

```powerfx
Status.Value = "Submitted"
```

For filters against a text column, use this:

```powerfx
Status = "Submitted"
```

---

## 34. Power Automate interaction points

### 34.1 Email Mirror flow

Triggered by changes to `ERM_Commentary`.

When Control Centre patches Person fields, the Email Mirror flow should populate:

- `AssignedContributorEmail`
- `ReviewerEmail`
- `GatekeeperEmail`

This enables easier app filtering and simpler notification flows.

### 34.2 Assignment Notification flow

Triggered by modified row.

Should send one email when:

- status is `Assigned`
- contributor is populated
- `AssignedContributor` or `Status` changed

### 34.3 Lifecycle Status Notification flow

Triggered by modified row.

Should send emails when `Status` changes to:

- `Submitted`
- `Rejected`
- `Approved`

### 34.4 Send Nudge flow

Triggered manually from Power Apps.

Inputs:

- `ItemID`
- `NudgeMessage`

Patches:

- `LastNudgeDate`
- `NudgeCount`

### 34.5 Sign Off Cycle flow

Do not build yet.

Build it only after:

- Control Centre assignment works
- My Items works
- Submit works
- Approval works
- required row completion logic is proven

---

## 35. End-to-end app QA checklist

### 35.1 Backend regression checks

| Test | Expected result |
|---|---|
| Plan Cycle first run | Creates rows from active/default `CommentarySlots`. |
| Plan Cycle second run same report/period | Creates no duplicates. |
| Plan Cycle different period | Creates a fresh set of rows. |
| RowKey | Clean text, no lookup JSON. |
| Person fields after Plan Cycle | Blank. |
| Status after Plan Cycle | `Not Started`. |

### 35.2 Control Centre checks

| Test | Expected result |
|---|---|
| Gallery loads | Rows filtered by report and period. |
| Select row | `varSelectedCommentary` is populated. |
| Save without contributor | Warning notification. |
| Save without reviewer | Warning notification. |
| Save without gatekeeper | Warning notification. |
| Save without due date | Warning notification. |
| Save complete assignment | Person fields, due date, `Status = Assigned`, `AssignedDate` patched. |
| Email Mirror | Mirror email fields populated. |
| Assignment Notification | One assignment email sent. |

### 35.3 Contributor checks

| Test | Expected result |
|---|---|
| My Items | Assigned rows visible for current user. |
| Save Draft | Commentary text saved, `Status = Draft`. |
| Submit | `Status = Submitted`, `SubmittedDate` populated. |
| Lifecycle Notification | Reviewer receives submitted notification. |

### 35.4 Reviewer checks

| Test | Expected result |
|---|---|
| Approval Queue | Submitted rows visible for reviewer. |
| Reject without feedback | Warning notification. |
| Reject with feedback | `Status = Rejected`, feedback saved, rejection count increments. |
| Approve | `Status = Approved`, dates populated, final commentary copied. |

---

## 36. Common troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Gallery blank after Plan Cycle | Wrong `ReportCode`/`PeriodKey` filter or rows not created | Check SharePoint rows and app variables. |
| Status formula errors | `Status` is text, not Choice | Replace `Status.Value` with `Status`. |
| Patch status fails | Choice/text mismatch | Use `{Value: "Assigned"}` for Choice, plain text for text. |
| Person patch type mismatch | Combo box not using Choices or field is multi-select | Use `Choices([@ERM_Commentary].PersonField)` and single-select Person field. |
| Email fields stay blank | Email Mirror flow failed or not triggered | Check flow run history and internal column names. |
| Duplicate rows created | RowKey duplicate check failed | Check RowKey expression in Plan Cycle. |
| RowKey contains JSON | Flow used lookup object instead of plain text | Use `ReportCode_Text`, not lookup object. |
| Assignment emails duplicate | Notification flow condition too broad | Ensure it only fires when contributor/status changed and status is Assigned. |
| Latest activity Modified By errors | Power Apps field name differs | Try `ThisItem.Editor.DisplayName`. |

---

## 37. What not to build yet

Do not build Sign Off Cycle until the core workflow is stable.

Sign Off Cycle should eventually:

1. Accept `ReportCode` and `PeriodKey` from Power Apps.
2. Check that all required rows are `Approved`, `Final`, or `Not Required`.
3. Block sign-off if any required row is `Not Started`, `Assigned`, `Draft`, `Submitted`, or `Rejected`.
4. Patch approved rows to `Final`.
5. Set `FinalisedDate`.
6. Allow Power BI to consume only `Final` rows.

Do not describe it as atomic unless a proper transaction/batch pattern is implemented. Sequential HTTP updates can partially complete if one row fails.

---

## 38. Recommended immediate next action

Complete this milestone before moving on:

```text
+ Plan Cycle creates Not Started rows
Control Centre displays them
Select a row
Assign contributor/reviewer/gatekeeper/due date
Save and notify patches Status = Assigned
Email Mirror fills email fields
Assignment Notification sends one email
```

Once this is working, move to:

```text
My Items -> Edit Commentary -> Submit -> Approval Queue -> Approval Detail
```
