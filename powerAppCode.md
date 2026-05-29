# Standard Life Commentary Manager - Power Apps Formula Guide v1.5.1

**Purpose:** copy/paste formula reference for the Standard Life / Risk & Controls Transformation Commentary Manager prototype.

This guide complements the Word build guide. It assumes the v1.5 source-of-truth model:

- SharePoint lists: `Reports`, `CommentarySlots`, `ERM_Commentary`.
- `CommentaryActivity` is not used in v1.
- `Scope` replaces `OrgUnitCode`.
- Page summaries are normal commentary rows where `Scope = "PAGE"` and `ItemNumber = 0`.
- `ERM_Commentary.Status` is a SharePoint **Choice** column unless you deliberately created it as text.
- Plan Cycle creates `Not Started` row shells only. It must not populate Person fields.
- Person assignment is handled in the Power Apps Control Centre.

---

## 1. Data sources and flow names

Add these data sources:

```text
Reports
CommentarySlots
ERM_Commentary
```

Add these Power Automate flows and rename their Power Apps references if possible:

```text
ERMPlanCycle
ERMSendNudge
```

If Power Apps keeps the flow names with spaces, use the exact names shown in the Data pane in `.Run(...)` calls.

---

## 2. Status Choice vs text rule

The preferred v1.5 build uses a SharePoint Choice column for `ERM_Commentary.Status`.

Use this in filters:

```powerfx
Status.Value = "Assigned"
```

Use this in patches:

```powerfx
Status: {Value: "Assigned"}
```

If `Status` was created as a plain text field, deliberately replace those lines with:

```powerfx
Status = "Assigned"
```

and:

```powerfx
Status: "Assigned"
```

Do not mix the two styles in the same app.

---

## 3. App.OnStart baseline

Set `App.OnStart` to:

```powerfx
Set(varLoadingComplete, false);
Set(varDevMode, true);

Set(varUserEmail, Lower(Trim(User().Email)));

Set(varSelectedReportCode, "CRR");
Set(varSelectedPeriod, "2026-Q2");
Set(varPeriodStart, Date(2026, 4, 1));
Set(varPeriodEnd, Date(2026, 6, 30));
Set(varPackDueDate, Date(2026, 6, 28));

Set(varHeaderTitle, "CRR Board Pack - cycle " & varSelectedPeriod & " - publish due " & Text(varPackDueDate, "dd mmmm"));
Set(varCurrentScreen, "Control Centre");
Set(varSelectedCommentary, Blank());
Set(varPlanInProgress, false);
Set(varSavingAssignment, false);
Set(varSavingCommentary, false);
Set(varSubmittingCommentary, false);
Set(varSavingReview, false);
Set(varSearchText, "");
Set(varShowOverdueOnly, false);

ClearCollect(
    colNavTabs,
    {Label: "Home", ScreenName: "Home", Target: scrHome},
    {Label: "My Items", ScreenName: "My Items", Target: scrMyItems},
    {Label: "Edit Commentary", ScreenName: "Edit Commentary", Target: scrEditCommentary},
    {Label: "Approvals", ScreenName: "Approvals", Target: scrApprovalQueue},
    {Label: "Approval Detail", ScreenName: "Approval Detail", Target: scrApprovalDetail},
    {Label: "Control Centre", ScreenName: "Control Centre", Target: scrControlCentre},
    {Label: "Admin", ScreenName: "Admin", Target: scrControlCentre}
);

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

Set(varLoadingComplete, true);
```

Run **App > Run OnStart** after pasting.

---

## 4. Shared theme values

You can either use these as direct RGBA values or set variables in `App.OnStart`.

```powerfx
Set(colNavy, RGBA(28, 55, 120, 1));
Set(colNavyDark, RGBA(13, 37, 86, 1));
Set(colYellow, RGBA(255, 191, 0, 1));
Set(colCanvas, RGBA(245, 247, 251, 1));
Set(colPanel, RGBA(255, 255, 255, 1));
Set(colBorder, RGBA(198, 211, 232, 1));
Set(colText, RGBA(0, 31, 84, 1));
Set(colMuted, RGBA(86, 104, 135, 1));
Set(colRed, RGBA(188, 55, 68, 1));
Set(colAmber, RGBA(213, 125, 28, 1));
Set(colGreen, RGBA(45, 133, 109, 1));
Set(colBlue, RGBA(72, 82, 211, 1));
```

Recommended screen fill:

```powerfx
RGBA(245, 247, 251, 1)
```

Recommended panel border:

```powerfx
RGBA(198, 211, 232, 1)
```

Recommended card corner radius:

```powerfx
6
```

---

## 5. Shared shell formulas

### Header title

```powerfx
"CRR Board Pack - cycle " & varSelectedPeriod & " - publish due " & Text(varPackDueDate, "dd mmmm")
```

### User label

```powerfx
User().FullName & " - Risk Operating Office"
```

### Footer text

```powerfx
"Workflow: gatekeeper assigns -> owner drafts -> reviewer approves -> Power BI reads final text"
```

### Period label in footer

```powerfx
Right(varSelectedPeriod, 2) & " " & Left(varSelectedPeriod, 4)
```

### Top nav gallery items

```powerfx
colNavTabs
```

### Top nav selected fill

```powerfx
If(
    ThisItem.ScreenName = varCurrentScreen,
    RGBA(255, 255, 255, 1),
    RGBA(255, 255, 255, 0)
)
```

### Top nav underline visible

```powerfx
ThisItem.ScreenName = varCurrentScreen
```

### Top nav button OnSelect

```powerfx
Set(varCurrentScreen, ThisItem.ScreenName);
Navigate(ThisItem.Target, ScreenTransition.None)
```

---

## 6. Status badge formulas

Use this pattern for a label or container behind a status badge.

### Status text - Choice column

```powerfx
ThisItem.Status.Value
```

### Status text - text column alternative

```powerfx
ThisItem.Status
```

### Status badge fill - Choice column

```powerfx
Switch(
    ThisItem.Status.Value,
    "Not Started", RGBA(235, 242, 252, 1),
    "Assigned", RGBA(238, 242, 255, 1),
    "Draft", RGBA(255, 247, 225, 1),
    "Submitted", RGBA(255, 247, 225, 1),
    "Rejected", RGBA(255, 235, 237, 1),
    "Approved", RGBA(231, 248, 242, 1),
    "Final", RGBA(231, 248, 242, 1),
    RGBA(245, 247, 251, 1)
)
```

### Status badge colour - Choice column

```powerfx
Switch(
    ThisItem.Status.Value,
    "Not Started", RGBA(0, 31, 84, 1),
    "Assigned", RGBA(72, 82, 211, 1),
    "Draft", RGBA(180, 101, 12, 1),
    "Submitted", RGBA(180, 101, 12, 1),
    "Rejected", RGBA(188, 55, 68, 1),
    "Approved", RGBA(45, 133, 109, 1),
    "Final", RGBA(45, 133, 109, 1),
    RGBA(86, 104, 135, 1)
)
```

---

## 7. Common item label helpers

### Page summary vs item label

```powerfx
If(
    Upper(Coalesce(ThisItem.Scope, "")) = "PAGE" && Coalesce(ThisItem.ItemNumber, -1) = 0,
    "Summary",
    "Item " & Text(ThisItem.ItemNumber)
)
```

### Page and item subtitle

```powerfx
ThisItem.PageCode & " " & ThisItem.PageName & " - " &
If(
    Upper(Coalesce(ThisItem.Scope, "")) = "PAGE" && Coalesce(ThisItem.ItemNumber, -1) = 0,
    "Summary",
    "Item " & Text(ThisItem.ItemNumber)
)
```

### Commentary heading

```powerfx
If(
    Upper(Coalesce(varSelectedCommentary.Scope, "")) = "PAGE" && Coalesce(varSelectedCommentary.ItemNumber, -1) = 0,
    varSelectedCommentary.PageName & " Summary",
    varSelectedCommentary.SectionName & " Commentary"
)
```

---

## 8. Control Centre screen

Create `scrControlCentre` first. This is the first milestone screen.

### Screen OnVisible

```powerfx
Set(varCurrentScreen, "Control Centre");
Refresh(ERM_Commentary)
```

### Main gallery `galControlCentre.Items`

Basic version:

```powerfx
SortByColumns(
    Filter(
        ERM_Commentary,
        ReportCode = varSelectedReportCode &&
        PeriodKey = varSelectedPeriod
    ),
    "PageCode", SortOrder.Ascending,
    "ItemNumber", SortOrder.Ascending
)
```

With search and overdue-only filtering:

```powerfx
SortByColumns(
    Filter(
        ERM_Commentary,
        ReportCode = varSelectedReportCode &&
        PeriodKey = varSelectedPeriod &&
        (
            IsBlank(txtControlSearch.Text) ||
            Lower(txtControlSearch.Text) in Lower(Coalesce(SectionName, "")) ||
            Lower(txtControlSearch.Text) in Lower(Coalesce(PageName, "")) ||
            Lower(txtControlSearch.Text) in Lower(Coalesce(AssignedContributor.DisplayName, "")) ||
            Lower(txtControlSearch.Text) in Lower(Coalesce(AssignedContributorEmail, ""))
        ) &&
        (
            !varShowOverdueOnly ||
            (!IsBlank(DueDate) && DueDate < Today() && !(Status.Value in ["Approved", "Final", "Not Required"]))
        )
    ),
    "PageCode", SortOrder.Ascending,
    "ItemNumber", SortOrder.Ascending
)
```

Text-status alternative for the last status condition:

```powerfx
!(Status in ["Approved", "Final", "Not Required"])
```

### Gallery `OnSelect`

```powerfx
Set(varSelectedCommentary, ThisItem)
```

### Gallery row selected fill

```powerfx
If(
    !IsBlank(varSelectedCommentary.ID) && ThisItem.ID = varSelectedCommentary.ID,
    RGBA(236, 242, 255, 1),
    RGBA(255, 255, 255, 1)
)
```

### Progress KPI value

```powerfx
With(
    {
        rows: Filter(ERM_Commentary, ReportCode = varSelectedReportCode && PeriodKey = varSelectedPeriod),
        approvedRows: Filter(ERM_Commentary, ReportCode = varSelectedReportCode && PeriodKey = varSelectedPeriod && Status.Value in ["Approved", "Final"])
    },
    If(
        CountRows(rows) = 0,
        "0%",
        Text(Round(CountRows(approvedRows) / CountRows(rows) * 100, 0)) & "%"
    )
)
```

### Progress KPI subtitle

```powerfx
With(
    {
        rows: Filter(ERM_Commentary, ReportCode = varSelectedReportCode && PeriodKey = varSelectedPeriod),
        approvedRows: Filter(ERM_Commentary, ReportCode = varSelectedReportCode && PeriodKey = varSelectedPeriod && Status.Value in ["Approved", "Final"])
    },
    CountRows(approvedRows) & " of " & CountRows(rows) & " approved"
)
```

### In flight KPI

```powerfx
CountRows(
    Filter(
        ERM_Commentary,
        ReportCode = varSelectedReportCode &&
        PeriodKey = varSelectedPeriod &&
        Status.Value in ["Assigned", "Draft", "Submitted", "Rejected"]
    )
)
```

### Overdue KPI

```powerfx
CountRows(
    Filter(
        ERM_Commentary,
        ReportCode = varSelectedReportCode &&
        PeriodKey = varSelectedPeriod &&
        !IsBlank(DueDate) &&
        DueDate < Today() &&
        !(Status.Value in ["Approved", "Final", "Not Required"])
    )
)
```

### Not Started KPI

```powerfx
CountRows(
    Filter(
        ERM_Commentary,
        ReportCode = varSelectedReportCode &&
        PeriodKey = varSelectedPeriod &&
        Status.Value = "Not Started"
    )
)
```

### Assignment picker items

```powerfx
Choices([@ERM_Commentary].AssignedContributor)
```

Use equivalent formulas for `Reviewer` and `Gatekeeper`:

```powerfx
Choices([@ERM_Commentary].Reviewer)
Choices([@ERM_Commentary].Gatekeeper)
```

Set each picker `SelectMultiple` to:

```powerfx
false
```

### Contributor picker default

```powerfx
If(
    IsBlank(varSelectedCommentary.ID) || IsBlank(varSelectedCommentary.AssignedContributor.Email),
    [],
    [varSelectedCommentary.AssignedContributor]
)
```

If your tenant rejects `[]`, use `Blank()` in the blank branch.

### Reviewer picker default

```powerfx
If(
    IsBlank(varSelectedCommentary.ID) || IsBlank(varSelectedCommentary.Reviewer.Email),
    [],
    [varSelectedCommentary.Reviewer]
)
```

### Gatekeeper picker default

```powerfx
If(
    IsBlank(varSelectedCommentary.ID) || IsBlank(varSelectedCommentary.Gatekeeper.Email),
    [],
    [varSelectedCommentary.Gatekeeper]
)
```

### Due date default

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

### Quick edit panel visible

```powerfx
!IsBlank(varSelectedCommentary.ID)
```

### Save and notify button DisplayMode

```powerfx
If(
    IsBlank(varSelectedCommentary.ID) ||
    IsEmpty(cmbContributor.SelectedItems) ||
    IsEmpty(cmbReviewer.SelectedItems) ||
    IsEmpty(cmbGatekeeper.SelectedItems) ||
    IsBlank(dpDueDate.SelectedDate) ||
    varSavingAssignment,
    DisplayMode.Disabled,
    DisplayMode.Edit
)
```

### Save and notify button OnSelect - Choice Status version

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
        Set(varSavingAssignment, true);

        Set(
            varPatchedCommentary,
            Patch(
                ERM_Commentary,
                LookUp(ERM_Commentary, ID = varSelectedCommentary.ID),
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
            LookUp(ERM_Commentary, ID = varPatchedCommentary.ID)
        );

        Set(varSavingAssignment, false);

        Notify(
            "Commentary assigned. Email notification will be sent automatically.",
            NotificationType.Success
        ),

        Set(varSavingAssignment, false);
        Notify(
            "Assignment save failed: " & FirstError.Message,
            NotificationType.Error
        )
    )
)
```

Text-status replacement inside the patch:

```powerfx
Status: "Assigned"
```

Do not patch these fields from Power Apps:

```text
AssignedContributorEmail
ReviewerEmail
GatekeeperEmail
```

The `ERM Email Mirror` flow fills them.

### Plan Cycle button DisplayMode

```powerfx
If(varPlanInProgress, DisplayMode.Disabled, DisplayMode.Edit)
```

### Plan Cycle button OnSelect

```powerfx
IfError(
    Set(varPlanInProgress, true);

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
    Set(varPlanInProgress, false);

    Notify(
        "Plan cycle completed. Rows should now appear in the Control Centre.",
        NotificationType.Success
    ),

    Set(varPlanInProgress, false);
    Notify(
        "Plan cycle failed: " & FirstError.Message,
        NotificationType.Error
    )
)
```

### Send Nudge button OnSelect

```powerfx
If(
    IsBlank(varSelectedCommentary.ID) || IsBlank(varSelectedCommentary.AssignedContributorEmail),
    Notify("Select an assigned commentary row before sending a nudge.", NotificationType.Warning),

    IfError(
        Set(
            varNudgeResult,
            ERMSendNudge.Run(
                varSelectedCommentary.ID,
                Coalesce(txtNudgeMessage.Text, "Please update your commentary item.")
            )
        );
        Refresh(ERM_Commentary);
        Set(varSelectedCommentary, LookUp(ERM_Commentary, ID = varSelectedCommentary.ID));
        Notify("Nudge sent.", NotificationType.Success),

        Notify("Nudge failed: " & FirstError.Message, NotificationType.Error)
    )
)
```

### Send Nudge button visible

```powerfx
!IsBlank(varSelectedCommentary.ID) &&
!IsBlank(varSelectedCommentary.AssignedContributorEmail) &&
!(varSelectedCommentary.Status.Value in ["Approved", "Final", "Not Required"])
```

---

## 9. My Items screen

Create `scrMyItems` after the assignment loop is working.

### Screen OnVisible

```powerfx
Set(varCurrentScreen, "My Items");
Refresh(ERM_Commentary)
```

### Gallery `galMyItems.Items` - Choice Status version

```powerfx
SortByColumns(
    Filter(
        ERM_Commentary,
        Lower(AssignedContributorEmail) = varUserEmail &&
        ReportCode = varSelectedReportCode &&
        PeriodKey = varSelectedPeriod &&
        !(Status.Value in ["Final", "Not Required"])
    ),
    "DueDate", SortOrder.Ascending
)
```

Text-status alternative:

```powerfx
SortByColumns(
    Filter(
        ERM_Commentary,
        Lower(AssignedContributorEmail) = varUserEmail &&
        ReportCode = varSelectedReportCode &&
        PeriodKey = varSelectedPeriod &&
        !(Status in ["Final", "Not Required"])
    ),
    "DueDate", SortOrder.Ascending
)
```

### Gallery OnSelect

```powerfx
Set(varSelectedCommentary, ThisItem)
```

### Overdue count badge

```powerfx
CountRows(
    Filter(
        ERM_Commentary,
        Lower(AssignedContributorEmail) = varUserEmail &&
        ReportCode = varSelectedReportCode &&
        PeriodKey = varSelectedPeriod &&
        !IsBlank(DueDate) &&
        DueDate < Today() &&
        !(Status.Value in ["Approved", "Final", "Not Required"])
    )
)
```

### Draft count badge

```powerfx
CountRows(
    Filter(
        ERM_Commentary,
        Lower(AssignedContributorEmail) = varUserEmail &&
        ReportCode = varSelectedReportCode &&
        PeriodKey = varSelectedPeriod &&
        Status.Value = "Draft"
    )
)
```

### Approved count badge

```powerfx
CountRows(
    Filter(
        ERM_Commentary,
        Lower(AssignedContributorEmail) = varUserEmail &&
        ReportCode = varSelectedReportCode &&
        PeriodKey = varSelectedPeriod &&
        Status.Value in ["Approved", "Final"]
    )
)
```

### Open edit view button OnSelect

```powerfx
If(
    IsBlank(varSelectedCommentary.ID),
    Notify("Select an item first.", NotificationType.Warning),
    Set(varCurrentScreen, "Edit Commentary");
    Navigate(scrEditCommentary, ScreenTransition.None)
)
```

### Selected panel visible

```powerfx
!IsBlank(varSelectedCommentary.ID)
```

### Latest rejection card visible

```powerfx
!IsBlank(varSelectedCommentary.LatestReviewerFeedback)
```

---

## 10. Edit Commentary screen

Create `scrEditCommentary` after My Items.

### Screen OnVisible

```powerfx
Set(varCurrentScreen, "Edit Commentary");
Set(varSavingCommentary, false);
Set(varSubmittingCommentary, false)
```

### Back button OnSelect

```powerfx
Set(varCurrentScreen, "My Items");
Navigate(scrMyItems, ScreenTransition.None)
```

### Title label

```powerfx
If(
    IsBlank(varSelectedCommentary.ID),
    "Edit Commentary",
    If(
        Upper(Coalesce(varSelectedCommentary.Scope, "")) = "PAGE" && Coalesce(varSelectedCommentary.ItemNumber, -1) = 0,
        varSelectedCommentary.PageName & " Summary",
        varSelectedCommentary.PageName & " Commentary"
    )
)
```

### Subtitle label

```powerfx
varSelectedCommentary.ReportCode & " - Page " & varSelectedCommentary.PageCode & " " &
varSelectedCommentary.PageName & " - " & Coalesce(varSelectedCommentary.Scope, "") &
" - " & varSelectedCommentary.PeriodKey
```

### Reviewer feedback banner visible

```powerfx
!IsBlank(varSelectedCommentary.LatestReviewerFeedback)
```

### Previous rejection count text

```powerfx
"Previous rejections (" & Text(Coalesce(varSelectedCommentary.PreviousRejectionCount, 0)) & ")"
```

### Gatekeeper prompt visible

```powerfx
!IsBlank(varSelectedCommentary.GatekeeperPrompt) || !IsBlank(varSelectedCommentary.StandingPrompt)
```

### Gatekeeper prompt text

```powerfx
Coalesce(varSelectedCommentary.GatekeeperPrompt, varSelectedCommentary.StandingPrompt, "No prompt set for this item.")
```

### Commentary input default

```powerfx
Coalesce(varSelectedCommentary.CommentaryText, "")
```

### Commentary input DisplayMode

```powerfx
If(
    IsBlank(varSelectedCommentary.ID) ||
    varSelectedCommentary.Status.Value in ["Submitted", "Approved", "Final", "Not Required"],
    DisplayMode.Disabled,
    DisplayMode.Edit
)
```

Text-status alternative:

```powerfx
If(
    IsBlank(varSelectedCommentary.ID) ||
    varSelectedCommentary.Status in ["Submitted", "Approved", "Final", "Not Required"],
    DisplayMode.Disabled,
    DisplayMode.Edit
)
```

### Character counter

```powerfx
Text(Len(txtCommentary.Text)) & " / 2000"
```

### Save Draft button DisplayMode

```powerfx
If(
    IsBlank(varSelectedCommentary.ID) ||
    varSavingCommentary ||
    varSelectedCommentary.Status.Value in ["Submitted", "Approved", "Final", "Not Required"],
    DisplayMode.Disabled,
    DisplayMode.Edit
)
```

### Save Draft button OnSelect

```powerfx
IfError(
    Set(varSavingCommentary, true);

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
    Set(varSavingCommentary, false);
    Notify("Draft saved.", NotificationType.Success),

    Set(varSavingCommentary, false);
    Notify("Draft save failed: " & FirstError.Message, NotificationType.Error)
)
```

Text-status replacement inside the patch:

```powerfx
Status: "Draft"
```

### Submit for Review button DisplayMode

```powerfx
If(
    IsBlank(varSelectedCommentary.ID) ||
    IsBlank(Trim(txtCommentary.Text)) ||
    varSubmittingCommentary ||
    varSelectedCommentary.Status.Value in ["Submitted", "Approved", "Final", "Not Required"],
    DisplayMode.Disabled,
    DisplayMode.Edit
)
```

### Submit for Review button OnSelect

```powerfx
If(
    IsBlank(Trim(txtCommentary.Text)),
    Notify("Enter commentary before submitting for review.", NotificationType.Warning),

    IfError(
        Set(varSubmittingCommentary, true);

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
        Set(varSubmittingCommentary, false);
        Notify("Submitted for review.", NotificationType.Success),

        Set(varSubmittingCommentary, false);
        Notify("Submit failed: " & FirstError.Message, NotificationType.Error)
    )
)
```

Text-status replacement inside the patch:

```powerfx
Status: "Submitted"
```

---

## 11. Approval Queue screen

Create `scrApprovalQueue` after Edit Commentary.

### Screen OnVisible

```powerfx
Set(varCurrentScreen, "Approvals");
Refresh(ERM_Commentary)
```

### Gallery `galApprovalQueue.Items`

```powerfx
SortByColumns(
    Filter(
        ERM_Commentary,
        Lower(ReviewerEmail) = varUserEmail &&
        ReportCode = varSelectedReportCode &&
        PeriodKey = varSelectedPeriod &&
        Status.Value = "Submitted"
    ),
    "DueDate", SortOrder.Ascending
)
```

If reviewers should also see rejected items they previously returned, use:

```powerfx
SortByColumns(
    Filter(
        ERM_Commentary,
        Lower(ReviewerEmail) = varUserEmail &&
        ReportCode = varSelectedReportCode &&
        PeriodKey = varSelectedPeriod &&
        Status.Value in ["Submitted", "Rejected"]
    ),
    "DueDate", SortOrder.Ascending
)
```

### Gallery OnSelect

```powerfx
Set(varSelectedCommentary, ThisItem)
```

### Open selected approval button OnSelect

```powerfx
If(
    IsBlank(varSelectedCommentary.ID),
    Notify("Select an approval item first.", NotificationType.Warning),
    Set(varCurrentScreen, "Approval Detail");
    Navigate(scrApprovalDetail, ScreenTransition.None)
)
```

### Open selected approval DisplayMode

```powerfx
If(IsBlank(varSelectedCommentary.ID), DisplayMode.Disabled, DisplayMode.Edit)
```

### Review summary numerator example

For a named page or page group, change the filter term to match your page names.

```powerfx
CountRows(
    Filter(
        ERM_Commentary,
        ReportCode = varSelectedReportCode &&
        PeriodKey = varSelectedPeriod &&
        PageName = "Risk Appetite" &&
        Status.Value in ["Approved", "Final"]
    )
) & "/" &
CountRows(
    Filter(
        ERM_Commentary,
        ReportCode = varSelectedReportCode &&
        PeriodKey = varSelectedPeriod &&
        PageName = "Risk Appetite"
    )
)
```

---

## 12. Approval Detail screen

### Screen OnVisible

```powerfx
Set(varCurrentScreen, "Approval Detail");
Set(varSavingReview, false)
```

### Back button OnSelect

```powerfx
Set(varCurrentScreen, "Approvals");
Navigate(scrApprovalQueue, ScreenTransition.None)
```

### Reviewer checks visible

```powerfx
!IsBlank(varSelectedCommentary.ReviewerChecks)
```

### Reviewer checks text

```powerfx
Coalesce(varSelectedCommentary.ReviewerChecks, "No reviewer checks were provided for this item.")
```

### Reviewer feedback input visible

```powerfx
varSelectedCommentary.Status.Value = "Submitted"
```

### Approve Final button DisplayMode

```powerfx
If(
    IsBlank(varSelectedCommentary.ID) ||
    varSavingReview ||
    varSelectedCommentary.Status.Value <> "Submitted",
    DisplayMode.Disabled,
    DisplayMode.Edit
)
```

### Approve Final button OnSelect

```powerfx
IfError(
    Set(varSavingReview, true);

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
    Set(varSavingReview, false);
    Notify("Commentary approved.", NotificationType.Success),

    Set(varSavingReview, false);
    Notify("Approval failed: " & FirstError.Message, NotificationType.Error)
)
```

Text-status replacement inside the patch:

```powerfx
Status: "Approved"
```

### Request Edits button DisplayMode

```powerfx
If(
    IsBlank(varSelectedCommentary.ID) ||
    varSavingReview ||
    varSelectedCommentary.Status.Value <> "Submitted" ||
    IsBlank(Trim(txtReviewerFeedback.Text)),
    DisplayMode.Disabled,
    DisplayMode.Edit
)
```

### Request Edits button OnSelect

```powerfx
If(
    IsBlank(Trim(txtReviewerFeedback.Text)),
    Notify("Add reviewer feedback before requesting edits.", NotificationType.Warning),

    IfError(
        Set(varSavingReview, true);

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
        Set(varSavingReview, false);
        Notify("Edits requested.", NotificationType.Success),

        Set(varSavingReview, false);
        Notify("Request edits failed: " & FirstError.Message, NotificationType.Error)
    )
)
```

Text-status replacement inside the patch:

```powerfx
Status: "Rejected"
```

### Reject button OnSelect

For the prototype, `Reject` can use the same patch as `Request Edits`. Keep both buttons only if you want different labels or escalation behaviour later.

---

## 13. Home screen

Build after the workflow screens, because it relies on real data.

### Screen OnVisible

```powerfx
Set(varCurrentScreen, "Home");
Refresh(ERM_Commentary)
```

### Assigned KPI

```powerfx
CountRows(
    Filter(
        ERM_Commentary,
        ReportCode = varSelectedReportCode &&
        PeriodKey = varSelectedPeriod &&
        Status.Value = "Assigned"
    )
)
```

### In Draft KPI

```powerfx
CountRows(
    Filter(
        ERM_Commentary,
        ReportCode = varSelectedReportCode &&
        PeriodKey = varSelectedPeriod &&
        Status.Value = "Draft"
    )
)
```

### Approved KPI

```powerfx
CountRows(
    Filter(
        ERM_Commentary,
        ReportCode = varSelectedReportCode &&
        PeriodKey = varSelectedPeriod &&
        Status.Value in ["Approved", "Final"]
    )
)
```

### Overdue KPI

```powerfx
CountRows(
    Filter(
        ERM_Commentary,
        ReportCode = varSelectedReportCode &&
        PeriodKey = varSelectedPeriod &&
        !IsBlank(DueDate) &&
        DueDate < Today() &&
        !(Status.Value in ["Approved", "Final", "Not Required"])
    )
)
```

### Page summary gallery/table items

```powerfx
SortByColumns(
    AddColumns(
        GroupBy(
            Filter(
                ERM_Commentary,
                ReportCode = varSelectedReportCode &&
                PeriodKey = varSelectedPeriod
            ),
            "PageCode",
            "PageRows"
        ),
        "PageNameValue",
        First(PageRows).PageName,
        "SlotCount",
        CountRows(PageRows),
        "ApprovedCount",
        CountRows(Filter(PageRows, Status.Value in ["Approved", "Final"])),
        "PageStatus",
        If(
            CountRows(Filter(PageRows, Status.Value in ["Rejected"])) > 0,
            "Rejected",
            If(
                CountRows(Filter(PageRows, Status.Value in ["Submitted"])) > 0,
                "Review",
                If(
                    CountRows(PageRows) > 0 && CountRows(Filter(PageRows, Status.Value in ["Approved", "Final"])) = CountRows(PageRows),
                    "Approved",
                    "Draft"
                )
            )
        )
    ),
    "PageCode",
    SortOrder.Ascending
)
```

### Latest activity gallery

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

### Activity title

```powerfx
ThisItem.SectionName & " " & Lower(ThisItem.Status.Value)
```

### Activity subtitle

```powerfx
"Updated " & Text(ThisItem.Modified, "dd mmm yyyy HH:mm") & " by " & ThisItem.'Modified By'.DisplayName
```

If Power Apps exposes the SharePoint modified-by field as `Editor`, use:

```powerfx
"Updated " & Text(ThisItem.Modified, "dd mmm yyyy HH:mm") & " by " & ThisItem.Editor.DisplayName
```

---

## 14. Audit trail panel without CommentaryActivity

v1 removed `CommentaryActivity`. Use `ERM_Commentary.Modified`, lifecycle fields, and SharePoint version history.

For a simple audit panel on Approval Detail, create a local table expression in a gallery:

```powerfx
SortByColumns(
    Filter(
        Table(
            {
                EventTitle: "Draft created",
                EventDate: varSelectedCommentary.AssignedDate,
                EventBody: "Item assigned and draft shell opened."
            },
            {
                EventTitle: "Submitted for approval",
                EventDate: varSelectedCommentary.SubmittedDate,
                EventBody: "Contributor submitted commentary for review."
            },
            {
                EventTitle: "Reviewed",
                EventDate: varSelectedCommentary.ReviewedDate,
                EventBody: Coalesce(varSelectedCommentary.LatestReviewerFeedback, "Reviewer action recorded.")
            },
            {
                EventTitle: "Approved",
                EventDate: varSelectedCommentary.ApprovedDate,
                EventBody: "Final wording approved."
            },
            {
                EventTitle: "Last nudge",
                EventDate: varSelectedCommentary.LastNudgeDate,
                EventBody: "Nudge sent to contributor."
            }
        ),
        !IsBlank(EventDate)
    ),
    "EventDate",
    SortOrder.Descending
)
```

This is not a full audit log. SharePoint version history remains the audit backstop.

---

## 15. Validation formulas

### Show row key label for debug only

`Visible`:

```powerfx
varDevMode
```

`Text`:

```powerfx
varSelectedCommentary.RowKey
```

Good `RowKey` example:

```text
CRR|P2|CRR-P2-CYBER-APP|2026-Q2|CYBER
```

Delete rows where `RowKey` starts with JSON such as:

```text
{"@odata.type":"#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference"
```

### First milestone test label

```powerfx
"Rows this cycle: " & CountRows(
    Filter(
        ERM_Commentary,
        ReportCode = varSelectedReportCode &&
        PeriodKey = varSelectedPeriod
    )
)
```

---

## 16. First milestone test script

1. Run `App.OnStart`.
2. Open `scrControlCentre`.
3. Click `+ Plan Cycle`.
4. Confirm rows appear in `galControlCentre` with `Status = Not Started`.
5. Select a row.
6. Set yourself as contributor, reviewer and gatekeeper.
7. Pick a due date.
8. Click `Save and notify`.
9. Confirm the SharePoint row has Person fields, due date, `AssignedDate`, and `Status = Assigned`.
10. Wait for `ERM Email Mirror`; confirm the mirror email fields are populated.
11. Confirm `Assignment Notification` sends one email only.
12. Open `My Items`; confirm the assigned row is visible for your user.
13. Save a draft, submit for review, approve or reject through approval screens.

---

## 17. Common troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Status.Value` errors | `Status` is text, not Choice | Change formulas to `Status` and patch `Status: "Assigned"`, or recreate the column as Choice. |
| Person picker default errors on `[]` | Tenant/formula parser rejects empty table literal | Use `Blank()` for the empty branch. |
| Person patch creates invalid user value | Combo box is not using `Choices([@ERM_Commentary].PersonField)` | Set Items to the SharePoint Person field choices and patch `First(SelectedItems)`. |
| Assignment email does not send | Mirror email flow has not populated or Get changes condition did not match | Check Person fields, Status, versioning, and flow run history. |
| Plan Cycle creates duplicate-looking rows | Bad or dirty `RowKey` | Delete JSON RowKey rows and ensure Plan Cycle uses `ReportCode_Text`, not a lookup object. |
| Control Centre rows missing | Wrong period/report filters or SharePoint view confusion | Check `varSelectedReportCode`, `varSelectedPeriod`, and the All Items view sorted by Created descending. |
| Nudge does not send | Selected row lacks `AssignedContributorEmail` | Wait for Email Mirror or confirm Person field is populated. |
| Activity panel looks empty | No lifecycle dates yet | Use Modified-based latest activity on Home; use lifecycle dates only where present. |
