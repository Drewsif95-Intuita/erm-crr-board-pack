# Commentary Manager — Power Apps Formula Pack

**Version 1.0** · Standard Life · Intuita Consulting · May 2026

Companion to the *Power Apps Build Guide*. Every Power Fx formula from the build guide, extracted verbatim and grouped by screen so you can keep this open in one window and copy straight into Power Apps Studio. Section numbers map to the build guide for cross-reference.

**How to use:** find the control by its name (e.g. `btnSubmit.OnSelect`), copy the fenced block, paste into the matching property in Studio. Formulas are exactly as documented in the build guide — no paraphrasing.

**Naming conventions used throughout:**

| Prefix | Control type |
|---|---|
| `scr` | Screen |
| `cmp` | Component |
| `gal` | Gallery |
| `btn` | Button |
| `lbl` | Label |
| `txt` | Text input |
| `cbo` | Combobox / dropdown |
| `dte` | Date picker |
| `tgl` | Toggle |
| `ctn` | Container |
| `col` | Collection (in-memory) |
| `var` | Global variable (Set) |

---

## Contents

1. [App OnStart](#app-onstart)
2. [Identity & Access Denied](#2-identity--access-denied)
3. [Shell Components](#shell-components)
4. [Home](#home)
5. [Edit Commentary](#edit-commentary)
6. [Edit Commentary — Read-only](#edit-commentary-read-only)
7. [Approval Queue](#approval-queue)
8. [Approval Detail](#approval-detail)
9. [Control Centre](#control-centre)
10. [Modals](#modals)
11. [Cross-cutting Patterns](#cross-cutting-patterns)
12. [Power BI Binding (DAX)](#power-bi-binding-dax)

---

## 1. App OnStart

*Build guide: 3. App OnStart and global variables*  ·  *Controls live on: `App`*

### `App.OnStart`

Runs once on app launch. Identity, role detection, data collections, dirty-state vars, routing.

<sub>3.2 OnStart formula</sub>

```powerfx
// === Identity resolution ===
Set(varUserEmail, Lower(User().Email));
Set(varUserFullName, User().FullName);

// === Role detection ===
// Query Office 365 Groups (or AAD via a separate flow) to determine which
// ERM-* groups the user belongs to. For v1, we simplify by maintaining
// role config in three small collections seeded from a Reports row.
// Real production would use Office365Groups.ListGroupMembers() per role group.

ClearCollect(colAdmins, {Email: "doug.admin@standardlife.co.uk"});
ClearCollect(colGatekeepers,
    {Email: "sarah.mitchell@standardlife.co.uk"},
    {Email: "alex.harper@standardlife.co.uk"}
);
ClearCollect(colReviewers,
    {Email: "james.perry@standardlife.co.uk"}
    // ... reviewer list maintained here in v1; v2 moves to AAD group lookup
);

Set(varIsAdmin, varUserEmail in colAdmins.Email);
Set(varIsGatekeeper, varUserEmail in colGatekeepers.Email || varIsAdmin);
Set(varIsReviewer, varUserEmail in colReviewers.Email || varIsAdmin);
Set(varIsContributor, true); // Everyone can potentially be a contributor

// === Reports data ===
ClearCollect(colReports, Filter(Reports, Active = true));
Set(varActiveReport, First(colReports));

// === Period dropdown options ===
// Combine distinct historical periods with computed future periods
ClearCollect(colHistoricalPeriods,
    Distinct(
        Filter(ERM_Commentary, ReportCode = varActiveReport.ReportCode),
        PeriodKey
    )
);

// Quarterly cadence: compute next 4 quarters from today
Set(varCurrentYear, Year(Today()));
Set(varCurrentQuarter,
    RoundUp(Month(Today()) / 3, 0)
);

ClearCollect(colFuturePeriods,
    {Result: varCurrentYear & "-Q" & varCurrentQuarter},
    {Result: varCurrentYear & "-Q" & (varCurrentQuarter + 1)},
    {Result: varCurrentYear & "-Q" & (varCurrentQuarter + 2)},
    {Result: (varCurrentYear + 1) & "-Q1"}
);

// Combine and dedupe; default to current quarter
ClearCollect(colPeriodOptions,
    Distinct(colHistoricalPeriods, Result),
    colFuturePeriods.Result
);
Set(varSelectedPeriod, varCurrentYear & "-Q" & varCurrentQuarter);

// === User's items (My Items collection) ===
ClearCollect(colMyItems,
    Filter(
        ERM_Commentary,
        AssignedContributorEmail = varUserEmail,
        PeriodKey = varSelectedPeriod
    )
);

// === Reviewer's queue (only loaded if user is reviewer) ===
If(varIsReviewer,
    ClearCollect(colMyReviewQueue,
        Filter(
            ERM_Commentary,
            ReviewerEmail = varUserEmail,
            Status.Value = "Submitted",
            PeriodKey = varSelectedPeriod
        )
    )
);

// === Gatekeeper's full cycle view (only loaded if user is gatekeeper) ===
If(varIsGatekeeper,
    ClearCollect(colCycleItems,
        Filter(
            ERM_Commentary,
            ReportCode = varActiveReport.ReportCode,
            PeriodKey = varSelectedPeriod
        )
    )
);

// === Dirty-state tracking ===
Set(varDirtyEditCommentary, false);
Set(varDirtyControlCentre, false);
Set(varSidePanelItem, Blank()); // Currently selected item in Control Centre

// === Modal visibility flags ===
Set(varShowAddItem, false);
Set(varShowPlanCycle, false);
Set(varShowSignOff, false);
Set(varShowDiscardConfirm, false);
Set(varPendingNav, Blank());

// === Navigate to role-appropriate landing screen ===
Navigate(scrHome, ScreenTransition.None);
```

---

## 2. Identity & Access Denied

*Build guide: 4. Identity screen and access denied*  ·  *Controls live on: `scrAccessDenied`*

### `lblAccessDetail.Text`

Access-denied explanation line.

<sub>4.1 scrAccessDenied</sub>

```powerfx
"You're signed in as " & varUserEmail & " but you're not yet a member of any
of the Commentary Manager access groups. This usually means your access hasn't been
provisioned yet. If you were recently added to a group, sign out and back in to refresh."
```

### `btnAccessRetry.OnSelect`

Re-run role detection after the user is added to a group.

<sub>4.1 scrAccessDenied</sub>

```powerfx
Refresh(Reports);
// Re-run OnStart's role detection
Set(varIsGatekeeper, varUserEmail in colGatekeepers.Email);
Set(varIsReviewer, varUserEmail in colReviewers.Email);
If(varIsGatekeeper || varIsReviewer,
    Navigate(scrHome),
    Notify("Still no access detected.", NotificationType.Warning)
)
```

### `App.OnStart (routing tail)`

Append to OnStart: route lockout users to Access Denied.

<sub>4.2 When to route to Access Denied</sub>

```powerfx
If(
    !varIsGatekeeper && !varIsReviewer && IsEmpty(colMyItems),
    Navigate(scrAccessDenied, ScreenTransition.None),
    Navigate(scrHome, ScreenTransition.None)
);
```

---

## 3. Shell Components

*Build guide: 5. Shell — header, navigation, footer*  ·  *Controls live on: `cmpTopBar / cmpTabNav / cmpFooterStrip`*

### `btnRoleCTA.Text`

Role-aware CTA label in the top context bar.

<sub>5.2 Build cmpTopBar as a component</sub>

```powerfx
If(varIsGatekeeper, "→ Plan cycle",
   varIsReviewer, "→ Open next item",
   "→ Open my draft")
```

### `btnRoleCTA.OnSelect`

Role-aware CTA action — opens the right screen per role.

<sub>5.2 Build cmpTopBar as a component</sub>

```powerfx
If(varIsGatekeeper,
    Set(varShowPlanCycle, true),
   varIsReviewer,
    If(CountRows(colMyReviewQueue) > 0,
        Set(varSidePanelItem, First(colMyReviewQueue));
        Navigate(scrApprovalDetail),
        Navigate(scrApprovalQueue)
    ),
    // Contributor
    If(CountRows(colMyItems) > 0,
        Set(varSidePanelItem,
            First(Sort(colMyItems, DueDate, Ascending))
        );
        Navigate(scrEditCommentary),
        Navigate(scrMyItems)
    )
)
```

### `btnTabApprovals.OnSelect`

Tab nav with dirty-state guard. Same pattern for every tab.

<sub>5.3 Build cmpTabNav as a component</sub>

```powerfx
If(varDirtyEditCommentary || varDirtyControlCentre,
    Set(varPendingNav, "scrApprovalQueue");
    Set(varShowDiscardConfirm, true),
    Navigate(scrApprovalQueue, ScreenTransition.None)
)
```

---

## 4. Home

*Build guide: 6. Screen 1 — Home (scrHome)*  ·  *Controls live on: `scrHome`*

### `scrHome.OnVisible`

Refresh the user's items/queue/cycle collections on navigation.

<sub>6.4 OnVisible behaviour</sub>

```powerfx
ClearCollect(colMyItems,
    Filter(ERM_Commentary,
        AssignedContributorEmail = varUserEmail,
        PeriodKey = varSelectedPeriod,
        !(Status.Value in ["Approved", "Final", "Archived", "Not Required"])
    )
);

If(varIsReviewer,
    ClearCollect(colMyReviewQueue,
        Filter(ERM_Commentary,
            ReviewerEmail = varUserEmail,
            PeriodKey = varSelectedPeriod,
            Status.Value = "Submitted"
        )
    )
);

If(varIsGatekeeper,
    ClearCollect(colCycleItems,
        Filter(ERM_Commentary,
            ReportCode = varActiveReport.ReportCode,
            PeriodKey = varSelectedPeriod
        )
    )
);
```

---

## 5. Edit Commentary

*Build guide: 8. Screen 3 — Edit Commentary (scrEditCommentary)*  ·  *Controls live on: `scrEditCommentary`*

### `scrEditCommentary.OnVisible`

Re-read the selected item from SharePoint; reset dirty flag.

<sub>8.5 OnVisible behaviour</sub>

```powerfx
If(!IsBlank(varSidePanelItem),
    Set(varSidePanelItem,
        LookUp(ERM_Commentary, ID = varSidePanelItem.ID)
    )
);
// Reset dirty flag because we just freshly loaded
Set(varDirtyEditCommentary, false);
```

### `btnSaveDraft.OnSelect`

Patch CommentaryText + set status Draft.

<sub>8.6 Save Draft button</sub>

```powerfx
Patch(ERM_Commentary,
    LookUp(ERM_Commentary, ID = varSidePanelItem.ID),
    {
        CommentaryText: txtCommentary.Text,
        Status: { Value: "Draft" },
        LastEditedDate: Now()
    }
);
// Refresh local collection
Refresh(ERM_Commentary);
Set(varSidePanelItem, LookUp(ERM_Commentary, ID = varSidePanelItem.ID));
Set(varDirtyEditCommentary, false);
Notify("Draft saved.", NotificationType.Success);
```

### `btnSubmit.OnSelect`

Validate length, patch status Submitted, notify reviewer.

<sub>8.7 Submit button</sub>

```powerfx
If(Len(txtCommentary.Text) < 50,
    Notify("Commentary needs at least 50 characters before submitting.", NotificationType.Warning),

    Patch(ERM_Commentary,
        LookUp(ERM_Commentary, ID = varSidePanelItem.ID),
        {
            CommentaryText: txtCommentary.Text,
            Status: { Value: "Submitted" },
            SubmittedDate: Now(),
            LastEditedDate: Now()
        }
    );
    Refresh(ERM_Commentary);
    Set(varDirtyEditCommentary, false);
    Notify("Submitted to " & varSidePanelItem.Reviewer.DisplayName & ".",
           NotificationType.Success);
    Navigate(scrMyItems, ScreenTransition.None)
)
```

### `btnSubmit.Text`

Submit vs Resubmit label.

<sub>8.7 Submit button</sub>

```powerfx
If(varSidePanelItem.Status.Value = "Rejected", "Resubmit →", "Submit →")
```

---

## 6. Edit Commentary — Read-only

*Build guide: 9. Screen 3b — Edit Commentary (Approved/Read-only)*  ·  *Controls live on: `scrEditCommentary`*

### `ctnApprovedBanner message`

Green banner text for Approved / Final states.

<sub>9.2 Status banner replacements</sub>

```powerfx
If(varSidePanelItem.Status.Value = "Approved",
    "✓ This commentary is approved and locked for editing. It will appear in the published board pack once the gatekeeper signs off the " & varSidePanelItem.PeriodKey & " cycle. Reach out to " & varSidePanelItem.AssignedBy & " if it needs to change.",
    "✓ This commentary is final and visible in the published board pack."
)
```

---

## 7. Approval Queue

*Build guide: 10. Screen 4 — Approval Queue (scrApprovalQueue)*  ·  *Controls live on: `scrApprovalQueue`*

### `galApprovalQueue.Items`

Reviewer's submitted-item queue with filter chips.

<sub>10.3 Main gallery: galApprovalQueue</sub>

```powerfx
SortByColumns(
    Filter(colMyReviewQueue,
        If(IsBlank(cboFilterPage.SelectedItems),
            true,
            PageCode in cboFilterPage.SelectedItems.PageCode
        ),
        If(IsBlank(cboFilterPriority.SelectedItems),
            true,
            Priority.Value in cboFilterPriority.SelectedItems.Result
        )
        // ... similar for other filters
    ),
    "DueDate", SortOrder.Ascending,
    "Priority", SortOrder.Descending
)
```

---

## 8. Approval Detail

*Build guide: 11. Screen 5 — Approval Detail (scrApprovalDetail)*  ·  *Controls live on: `scrApprovalDetail`*

### `btnApprove.OnSelect`

Approve, set ApprovedDate, advance to next in queue.

<sub>11.2 Approve button</sub>

```powerfx
Patch(ERM_Commentary,
    LookUp(ERM_Commentary, ID = varSidePanelItem.ID),
    {
        Status: { Value: "Approved" },
        ApprovedDate: Now(),
        ReviewComments: If(IsBlank(txtApproveNote.Text), Blank(), txtApproveNote.Text)
    }
);
Refresh(ERM_Commentary);
Set(varSidePanelItem, Blank());
Notify("Approved. Will be visible in Power BI when the cycle is signed off.",
       NotificationType.Success);

// Move to next in queue
If(CountRows(colMyReviewQueue) > 0,
    Set(varSidePanelItem, First(colMyReviewQueue));
    Navigate(scrApprovalDetail),
    Navigate(scrApprovalQueue)
)
```

### `btnReject.OnSelect`

Reveal the reject-comment textarea.

<sub>11.3 Reject button</sub>

```powerfx
Set(varRejectMode, true);
SetFocus(txtRejectReason)
```

### `btnSubmitRejection.OnSelect`

Validate comment, patch Rejected, append RejectionHistory.

<sub>11.3 Reject button</sub>

```powerfx
If(Len(txtRejectReason.Text) < 20,
    Notify("Rejection comment must be at least 20 characters.",
           NotificationType.Warning),

    Patch(ERM_Commentary,
        LookUp(ERM_Commentary, ID = varSidePanelItem.ID),
        {
            Status: { Value: "Rejected" },
            ReviewComments: txtRejectReason.Text,
            RejectionHistory: Concatenate(
                Coalesce(varSidePanelItem.RejectionHistory, ""),
                If(IsBlank(varSidePanelItem.RejectionHistory), "", Char(10)),
                "[", Text(Now(), "yyyy-MM-dd HH:mm"), "] ",
                User().FullName, ": ", txtRejectReason.Text
            ),
            SubmittedDate: Blank()
        }
    );
    Refresh(ERM_Commentary);
    Reset(txtRejectReason);
    Set(varRejectMode, false);
    Notify("Rejected. Contributor has been notified.", NotificationType.Info);

    // Move to next
    If(CountRows(colMyReviewQueue) > 0,
        Set(varSidePanelItem, First(colMyReviewQueue));
        Navigate(scrApprovalDetail),
        Navigate(scrApprovalQueue)
    )
)
```

---

## 9. Control Centre

*Build guide: 12. Screen 6 — Control Centre (scrControlCentre)*  ·  *Controls live on: `scrControlCentre`*

### `cboPeriodSelector.OnChange`

Re-load cycle + my-items collections for the chosen period.

<sub>12.2 Period selector and Plan/Sign Off buttons</sub>

```powerfx
Set(varSelectedPeriod, cboPeriodSelector.Selected.Result);

ClearCollect(colCycleItems,
    Filter(ERM_Commentary,
        ReportCode = varActiveReport.ReportCode,
        PeriodKey = varSelectedPeriod
    )
);

// Refresh other collections that depend on period
ClearCollect(colMyItems,
    Filter(ERM_Commentary,
        AssignedContributorEmail = varUserEmail,
        PeriodKey = varSelectedPeriod
    )
);

// Clear side panel selection
Set(varSidePanelItem, Blank());
Set(varDirtyControlCentre, false);
```

### `btnPlanCycle.OnSelect`

Open the Plan Cycle modal.

<sub>12.2 Period selector and Plan/Sign Off buttons</sub>

```powerfx
Set(varShowPlanCycle, true)
```

### `galCycleItems.Items`

Control Centre grid — chained filters + search.

<sub>12.4 The main grid: galCycleItems</sub>

```powerfx
SortByColumns(
    Filter(colCycleItems,
        // Page filter
        If(IsBlank(cboFilterPage.SelectedItems),
            true,
            PageCode in cboFilterPage.SelectedItems.PageCode),
        // Item filter
        If(IsBlank(cboFilterItem.SelectedItems),
            true,
            ItemNumber in cboFilterItem.SelectedItems.Result),
        // Status filter
        If(IsBlank(cboFilterStatus.SelectedItems),
            true,
            Status.Value in cboFilterStatus.SelectedItems.Value),
        // Overdue filter
        If(tglOverdueOnly.Value,
            DueDate < Today() && !(Status.Value in ["Approved", "Final", "Not Required"]),
            true),
        // Search
        If(IsBlank(txtSearch.Text),
            true,
            SectionName like ("*" & txtSearch.Text & "*") ||
            AssignedContributorEmail like ("*" & txtSearch.Text & "*"))
    ),
    "PageCode", SortOrder.Ascending,
    "ItemNumber", SortOrder.Ascending
)
```

### `Side panel history timeline`

Read-only lifecycle timeline for the selected item.

<sub>12.6 The side panel (right column)</sub>

```powerfx
"• Assigned " & Text(varSidePanelItem.AssignedDate, "dd MMM") &
" by " & varSidePanelItem.AssignedBy & Char(10) &

If(!IsBlank(varSidePanelItem.LastEditedDate),
    "• Last edited " & Text(varSidePanelItem.LastEditedDate, "dd MMM HH:mm") & Char(10),
    "") &

If(!IsBlank(varSidePanelItem.SubmittedDate),
    "• Submitted " & Text(varSidePanelItem.SubmittedDate, "dd MMM HH:mm") & Char(10),
    "") &

If(!IsBlank(varSidePanelItem.ApprovedDate),
    "• Approved " & Text(varSidePanelItem.ApprovedDate, "dd MMM HH:mm") & Char(10),
    "")
```

### `btnSendNudge.OnSelect`

Call Send Nudge flow; show success/cool-down toast.

<sub>12.7 Side panel actions</sub>

```powerfx
Set(varNudgeResult,
    Send_Nudge.Run(varSidePanelItem.ID, varUserEmail)
);
If(varNudgeResult.success,
    Notify(varNudgeResult.message, NotificationType.Success),
    Notify(varNudgeResult.message, NotificationType.Warning)
);
// Refresh just this row
Set(varSidePanelItem, LookUp(ERM_Commentary, ID = varSidePanelItem.ID))
```

### `btnNotRequired.OnSelect`

Mark item Not Required; refresh cycle.

<sub>12.7 Side panel actions</sub>

```powerfx
Patch(ERM_Commentary,
    LookUp(ERM_Commentary, ID = varSidePanelItem.ID),
    {
        Status: { Value: "Not Required" },
        RequiredThisCycle: false
    }
);
Refresh(ERM_Commentary);
ClearCollect(colCycleItems, Filter(ERM_Commentary,
    ReportCode = varActiveReport.ReportCode, PeriodKey = varSelectedPeriod));
Set(varSidePanelItem, Blank());
Set(varDirtyControlCentre, false);
Notify("Item marked Not Required.", NotificationType.Info)
```

### `btnDiscard.OnSelect`

Reset side-panel edit controls; clear dirty flag.

<sub>12.7 Side panel actions</sub>

```powerfx
// Reset all edit controls to their defaults
Reset(cboContributor); Reset(cboReviewer); Reset(dteDueDate);
Reset(cboPriority); Reset(tglRequired); Reset(txtAssignmentPrompt);
Set(varDirtyControlCentre, false)
```

### `btnSaveChanges.OnSelect`

Patch assignment fields incl. Person columns.

<sub>12.7 Side panel actions</sub>

```powerfx
Patch(ERM_Commentary,
    LookUp(ERM_Commentary, ID = varSidePanelItem.ID),
    {
        AssignedContributor: {
            '@odata.type': "#Microsoft.Azure.Connectors.SharePoint.SPListExpandedUser",
            Claims: "i:0#.f|membership|" & cboContributor.Selected.Mail,
            DisplayName: cboContributor.Selected.DisplayName
        },
        Reviewer: {
            '@odata.type': "#Microsoft.Azure.Connectors.SharePoint.SPListExpandedUser",
            Claims: "i:0#.f|membership|" & cboReviewer.Selected.Mail,
            DisplayName: cboReviewer.Selected.DisplayName
        },
        DueDate: dteDueDate.SelectedDate,
        Priority: { Value: cboPriority.Selected.Value },
        RequiredThisCycle: tglRequired.Value,
        AssignmentPrompt: txtAssignmentPrompt.Text,
        Gatekeeper: {
            '@odata.type': "#Microsoft.Azure.Connectors.SharePoint.SPListExpandedUser",
            Claims: "i:0#.f|membership|" & varUserEmail,
            DisplayName: varUserFullName
        },
        AssignedBy: "Risk Operating Office"
    }
);
Refresh(ERM_Commentary);
ClearCollect(colCycleItems, Filter(ERM_Commentary,
    ReportCode = varActiveReport.ReportCode, PeriodKey = varSelectedPeriod));
Set(varSidePanelItem, LookUp(ERM_Commentary, ID = varSidePanelItem.ID));
Set(varDirtyControlCentre, false);
Notify("Changes saved.", NotificationType.Success)
```

---

## 10. Modals

*Build guide: 13. Modals — Add Item, Plan Cycle, Sign Off*  ·  *Controls live on: `Add Item / Plan Cycle / Sign Off`*

### `txtAddItemNumber.Text`

Smart next-available item number for the chosen page.

<sub>13.2 Modal 1 — Add Commentary Item</sub>

```powerfx
Max(
    Filter(colCycleItems,
        PageCode = cboAddPage.Selected.PageCode
    ),
    ItemNumber
) + 1 & " (next available)"
```

### `btnConfirmAddItem.OnSelect`

Create one-off ERM_Commentary row; optionally add to catalogue.

<sub>13.2 Modal 1 — Add Commentary Item</sub>

```powerfx
If(IsBlank(cboAddPage.Selected) || IsBlank(txtAddSectionName.Text),
    Notify("Page and Section name are required.", NotificationType.Warning),

    // Create the ERM_Commentary row
    Patch(ERM_Commentary, Defaults(ERM_Commentary), {
        RowKey: varActiveReport.ReportCode & "|" &
                cboAddPage.Selected.PageCode & "|" &
                "ADHOC-" & GUID() & "|" &
                varSelectedPeriod & "|" &
                "CROSS",
        ReportCode: varActiveReport.ReportCode,
        PageCode: cboAddPage.Selected.PageCode,
        CommentaryKey: "ADHOC-" & Text(Now(), "yyyyMMddHHmmss"),
        ItemNumber: Max(
            Filter(colCycleItems, PageCode = cboAddPage.Selected.PageCode),
            ItemNumber
        ) + 1,
        PeriodKey: varSelectedPeriod,
        OrgUnitCode: "CROSS",
        SectionName: txtAddSectionName.Text,
        PackDueDate: varActiveReport.PackDueDate,
        AssignedContributor: If(IsBlank(cboAddContributor.Selected), Blank(),
            {
                '@odata.type': "#Microsoft.Azure.Connectors.SharePoint.SPListExpandedUser",
                Claims: "i:0#.f|membership|" & cboAddContributor.Selected.Mail,
                DisplayName: cboAddContributor.Selected.DisplayName
            }
        ),
        Status: { Value: If(IsBlank(cboAddContributor.Selected),
            "Not Started", "Assigned") },
        Priority: { Value: "Standard" },
        RequiredThisCycle: true
    });

    // If catalogue checkbox is ticked, also write to CommentarySlots
    If(chkAddToCatalogue.Value,
        Patch(CommentarySlots, Defaults(CommentarySlots), {
            ReportCode_Text: varActiveReport.ReportCode,
            PageCode: cboAddPage.Selected.PageCode,
            DefaultItemNumber: Max(
                Filter(colCycleItems, PageCode = cboAddPage.Selected.PageCode),
                ItemNumber
            ) + 1,
            CommentaryKey: "ADHOC-" & Text(Now(), "yyyyMMddHHmmss"),
            DefaultSectionName: txtAddSectionName.Text,
            DefaultOrgUnitCode: "CROSS",
            DefaultPriority: { Value: "Standard" },
            IncludedByDefault: true,
            Active: true
        })
    );

    // Refresh
    Refresh(ERM_Commentary);
    ClearCollect(colCycleItems, Filter(ERM_Commentary,
        ReportCode = varActiveReport.ReportCode, PeriodKey = varSelectedPeriod));

    // Reset and close
    Reset(cboAddPage); Reset(txtAddSectionName); Reset(cboAddContributor);
    Reset(chkAddToCatalogue);
    Set(varShowAddItem, false);
    Notify("Item added.", NotificationType.Success)
)
```

### `Plan modal — Pages seeded`

Preview tile: distinct pages in the catalogue.

<sub>13.3 Modal 2 — Plan Commentary Cycle</sub>

```powerfx
CountRows(
    Distinct(
        Filter(CommentarySlots,
            ReportCode_Text = varActiveReport.ReportCode,
            Active = true,
            IncludedByDefault = true
        ),
        PageCode
    )
)
```

### `Plan modal — Slots created`

Preview tile: total catalogue slots to seed.

<sub>13.3 Modal 2 — Plan Commentary Cycle</sub>

```powerfx
CountRows(
    Filter(CommentarySlots,
        ReportCode_Text = varActiveReport.ReportCode,
        Active = true,
        IncludedByDefault = true
    )
)
```

### `Plan modal — Pre-assigned`

Preview tile: count rolled forward from previous cycle.

<sub>13.3 Modal 2 — Plan Commentary Cycle</sub>

```powerfx
If(chkRollForward.Value,
    CountRows(
        Filter(CommentarySlots,
            ReportCode_Text = varActiveReport.ReportCode,
            Active = true,
            IncludedByDefault = true,
            !IsBlank(LookUp(ERM_Commentary,
                CommentaryKey = ThisRecord.CommentaryKey,
                AssignedContributorEmail
            ))
        )
    ),
    0
)
```

### `btnConfirmPlanCycle.OnSelect`

Pre-flight duplicate check, call Plan Cycle flow.

<sub>13.3 Modal 2 — Plan Commentary Cycle</sub>

```powerfx
// Pre-flight check: doesn't already exist?
If(CountRows(Filter(ERM_Commentary,
        ReportCode = varActiveReport.ReportCode,
        PeriodKey = cboPlanPeriod.Selected.Result)) > 0,

    Notify("Cycle for " & cboPlanPeriod.Selected.Result &
           " already exists. Use Control Centre to manage it.",
           NotificationType.Error),

    // Call the Plan Cycle flow
    Set(varPlanResult,
        Plan_Cycle.Run(
            varActiveReport.ReportCode,
            cboPlanPeriod.Selected.Result,
            chkRollForward.Value,
            varUserEmail,
            Text(txtPlanPackDue.SelectedDate, "yyyy-MM-dd")
        )
    );

    Refresh(ERM_Commentary);
    Set(varSelectedPeriod, cboPlanPeriod.Selected.Result);
    ClearCollect(colCycleItems, Filter(ERM_Commentary,
        ReportCode = varActiveReport.ReportCode, PeriodKey = varSelectedPeriod));

    Set(varShowPlanCycle, false);
    Notify(varPlanResult.slotsCreated & " slots created. " &
           varPlanResult.preAssigned & " pre-assigned.",
           NotificationType.Success)
)
```

### `btnConfirmSignOff.DisplayMode`

Type-to-confirm guard ('sign off').

<sub>13.4 Modal 3 — Sign Off Cycle</sub>

```powerfx
If(Lower(Trim(txtSignOffConfirm.Text)) = "sign off",
    DisplayMode.Edit,
    DisplayMode.Disabled
)
```

### `btnConfirmSignOff.OnSelect`

Call Sign Off Cycle flow; handle success/failure.

<sub>13.4 Modal 3 — Sign Off Cycle</sub>

```powerfx
Set(varSignOffResult,
    Sign_Off_Cycle.Run(
        varActiveReport.ReportCode,
        varSelectedPeriod,
        varUserEmail
    )
);

If(varSignOffResult.success,
    Refresh(ERM_Commentary);
    ClearCollect(colCycleItems, Filter(ERM_Commentary,
        ReportCode = varActiveReport.ReportCode, PeriodKey = varSelectedPeriod));
    Set(varShowSignOff, false);
    Reset(txtSignOffConfirm);
    Notify(varSignOffResult.message, NotificationType.Success),

    Notify(varSignOffResult.message, NotificationType.Error)
)
```

---

## 11. Cross-cutting Patterns

*Build guide: 14. Cross-cutting patterns*  ·  *Controls live on: `all screens`*

### `Tab nav dirty-state guard`

Generic guard pattern applied to every nav control.

<sub>14.1 Dirty-state handling</sub>

```powerfx
If(varDirtyEditCommentary || varDirtyControlCentre,
    Set(varPendingNav, "scrXyz");
    Set(varShowDiscardConfirm, true),
    Navigate(scrXyz, ScreenTransition.None)
)
```

### `Status pill — Fill colour`

Switch() mapping status to background colour.

<sub>14.2 Status pill colour</sub>

```powerfx
Switch(varItem.Status.Value,
    "Not Started", RGBA(236, 239, 244, 1),
    "Assigned", RGBA(227, 242, 253, 1),
    "Draft", RGBA(255, 248, 225, 1),
    "Submitted", RGBA(255, 248, 225, 1),
    "Rejected", RGBA(255, 235, 238, 1),
    "Approved", RGBA(232, 245, 233, 1),
    "Final", RGBA(46, 125, 50, 1),
    "Not Required", RGBA(244, 246, 250, 1),
    "Archived", RGBA(229, 231, 235, 1),
    RGBA(244, 246, 250, 1)
)
```

### `Status pill — text colour`

Switch() mapping status to label colour.

<sub>14.2 Status pill colour</sub>

```powerfx
Switch(varItem.Status.Value,
    "Not Started", RGBA(90, 101, 119, 1),
    "Assigned", RGBA(20, 124, 179, 1),
    "Draft", RGBA(141, 110, 0, 1),
    "Submitted", RGBA(141, 110, 0, 1),
    "Rejected", RGBA(198, 40, 40, 1),
    "Approved", RGBA(46, 125, 50, 1),
    "Final", RGBA(255, 255, 255, 1),  // White on green pill
    "Not Required", RGBA(90, 101, 119, 1),
    "Archived", RGBA(154, 163, 178, 1),
    RGBA(90, 101, 119, 1)
)
```

### `Role detection (v2)`

Replace hardcoded role collections with a flow lookup.

<sub>14.4 Role detection in v2</sub>

```powerfx
Set(varRoles,
    GetUserRoles.Run(varUserEmail)
);
Set(varIsGatekeeper, "Gatekeeper" in varRoles.roles);
Set(varIsReviewer, "Reviewer" in varRoles.roles);
Set(varIsAdmin, "Admin" in varRoles.roles)
```

---

## 12. Power BI Binding (DAX)

*Build guide: 15. Power BI binding measure*  ·  *Controls live on: `Power BI dataset`*

### `Power BI — status filter`

Dataset filter: Final only (recommended).

<sub>15.2 The status filter</sub>

```dax
FILTER(
    'ERM_Commentary',
    'ERM_Commentary'[Status] = "Final"
)
```

### `Power BI — commentary lookup`

LOOKUPVALUE on the composite RowKey.

<sub>15.3 The commentary lookup measure</sub>

```dax
Commentary =
LOOKUPVALUE(
    'ERM_Commentary'[CommentaryText],

    'ERM_Commentary'[RowKey],
    [ReportCode] & "|" & [PageCode] & "|" & [CommentaryKey] & "|" &
    [PeriodKey] & "|" & [OrgUnitCode]
)
```

### `Power BI — fallback text`

Display placeholder when commentary not yet signed off.

<sub>15.4 Fallback text</sub>

```dax
Commentary_Display =
COALESCE(
    [Commentary],
    "[Commentary pending sign-off]"
)
```

---

## Notes

- **Person-column patches** (in `btnSaveChanges.OnSelect`, `btnConfirmAddItem.OnSelect`) require the `@odata.type` + `Claims` shape exactly as shown. If a Person field silently fails to save, check this first.
- **`Refresh()` after every Patch** keeps the in-memory collections in sync with SharePoint. Acceptable at CRR's ~130-rows-per-year scale; revisit at 10× volume.
- **Flow calls** (`Plan_Cycle.Run`, `Sign_Off_Cycle.Run`, `Send_Nudge.Run`) must be added as data sources before these formulas will resolve. See build guide §2.3.
- **Role collections** (`colAdmins`, `colGatekeepers`, `colReviewers`) are hardcoded in v1 OnStart. Swap to the flow-based lookup in §14.4 (Role detection v2) when membership grows.
- The `like` operator with leading wildcards in `galCycleItems.Items` is non-delegable — fine for ~130 rows, replace with `StartsWith()` if the list grows past ~500 rows.
