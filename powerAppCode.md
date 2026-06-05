# Commentary Manager — Power Apps Formula Pack

**Version 2.0** · Standard Life · Intuita Consulting · June 2026

Companion to the *Power Apps Build Guide (Step-by-Step v2)*. Every Power Fx and DAX formula from the guide, extracted verbatim and grouped by screen, so you can keep this open in one window and copy straight into Power Apps Studio. Section names match the build guide.

**This version** reflects the rebuilt navigation (per-tab formulas) and the corrected OnStart period-options block (the `Distinct()` fix).

---

## 3. App OnStart and global variables

### `3.3 The OnStart formula`

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
// Build the list of distinct historical periods already in the data.
// NOTE: Distinct() names its output column "Result" (not PeriodKey).
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

// Combine historical + future periods, dedupe, default to current quarter
// colHistoricalPeriods is ALREADY distinct, with a column named "Result".
// Do NOT wrap it in Distinct() again. Append future periods only if not
// already present, to avoid a duplicate of the current quarter.
ClearCollect(colPeriodOptions, colHistoricalPeriods);
ForAll(
    colFuturePeriods,
    If(
        !(Result in colPeriodOptions.Result),
        Collect(colPeriodOptions, {Result: Result})
    )
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

## 4. Identity screen and access denied

### `lblAccessDetail.Text`
<sub>4.2 Add the controls</sub>

```powerfx
"You're signed in as " & varUserEmail & " but you're not yet a member of any
of the Commentary Manager access groups. This usually means your access hasn't been
provisioned yet. If you were recently added to a group, sign out and back in to refresh."
```

### `lblAccessContact.Text`
<sub>4.2 Add the controls</sub>

```powerfx
"Contact " & varActiveReport.OwnerEmail & " if you should have access."
```

### `btnAccessRetry.OnSelect`
<sub>4.2 Add the controls</sub>

```powerfx
If(
    !varIsGatekeeper && !varIsReviewer && IsEmpty(colMyItems),
    Navigate(scrAccessDenied, ScreenTransition.None),
    Navigate(scrHome, ScreenTransition.None)
);
```

### `4.3 Route to Access Denied`

```powerfx
If(
    !varIsGatekeeper && !varIsReviewer && IsEmpty(colMyItems),
    Navigate(scrAccessDenied, ScreenTransition.None),
    Navigate(scrHome, ScreenTransition.None)
);
```

---

## 5. The shell — top bar, navigation, footer

### `lblReportContext.Text`
<sub>5.2 Top context bar</sub>

```powerfx
"CRR Board Pack   ·   cycle " & varSelectedPeriod &
"   ·   publish due " & Text(varActiveReport.PackDueDate, "dd mmmm")
```

### `btnRoleCTA.Text`
<sub>5.2 Top context bar</sub>

```powerfx
If(varIsGatekeeper, "→ Plan cycle",
   varIsReviewer, "→ Open next item",
   "→ Open my draft")
```

### `btnRoleCTA.OnSelect`
<sub>5.2 Top context bar</sub>

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

### `btnTabHome.OnSelect`
<sub>5.3 Tab navigation — the nav bar</sub>

```powerfx
If(varDirtyEditCommentary || varDirtyControlCentre,
    Set(varPendingNav, "scrHome");
    Set(varShowDiscardConfirm, true),
    Navigate(scrHome, ScreenTransition.None)
)
```

### `btnTabMyItems.OnSelect`
<sub>5.3 Tab navigation — the nav bar</sub>

```powerfx
If(varDirtyEditCommentary || varDirtyControlCentre,
    Set(varPendingNav, "scrMyItems");
    Set(varShowDiscardConfirm, true),
    Navigate(scrMyItems, ScreenTransition.None)
)
```

### `btnTabApprovals.OnSelect`
<sub>5.3 Tab navigation — the nav bar</sub>

```powerfx
If(varDirtyEditCommentary || varDirtyControlCentre,
    Set(varPendingNav, "scrApprovalQueue");
    Set(varShowDiscardConfirm, true),
    Navigate(scrApprovalQueue, ScreenTransition.None)
)
```

### `btnTabControl.OnSelect`
<sub>5.3 Tab navigation — the nav bar</sub>

```powerfx
If(varDirtyEditCommentary || varDirtyControlCentre,
    Set(varPendingNav, "scrControlCentre");
    Set(varShowDiscardConfirm, true),
    Navigate(scrControlCentre, ScreenTransition.None)
)
```

---

## 6. Screen 1 — Home (scrHome)

### `lblHomeCaption.Text`
<sub>6.B Header strip</sub>

```powerfx
varUserFullName & "   ·   " & varActiveReport.ReportCode & "   ·   " &
varSelectedPeriod & "   ·   pack due to CRO " &
Text(varActiveReport.PackDueDate, "dd mmmm")
```

### `lblTileMyItemsCount.Text`
<sub>6.C Role tiles (top-right of header)</sub>

```powerfx
CountRows(colMyItems) & " assigned"
```

### `6.D OnVisible — refresh data`

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

### `6.E Overdue and Due This Week galleries`

```powerfx
Sort(Filter(colMyItems, DueDate < Today()), DueDate, Ascending)
```

### `6.E Overdue and Due This Week galleries`

```powerfx
Sort(
    Filter(colMyItems, DueDate >= Today(), Status.Value <> "Rejected"),
    DueDate, Ascending
)
```

### `lblCardMeta.Text`
<sub>6.F The item card template (inside each gallery)</sub>

```powerfx
"Page " & ThisItem.PageCode & " · " & ThisItem.PageName &
" · assigned by " & ThisItem.AssignedBy
```

### `lblCardDue.Text`
<sub>6.F The item card template (inside each gallery)</sub>

```powerfx
Text(ThisItem.DueDate, "dd mmm") &
If(ThisItem.DueDate < Today(),
   " — " & RoundDown(Today() - ThisItem.DueDate, 0) & " days overdue", "")
```

### `lnkCardOpen.OnSelect`
<sub>6.F The item card template (inside each gallery)</sub>

```powerfx
Set(varSidePanelItem, ThisItem);
Navigate(scrEditCommentary, ScreenTransition.None)
```

---

## 7. Screen 2 — My Items (scrMyItems)

### `galActionNeeded`
<sub>7.C The three list sections</sub>

```powerfx
Sort(Filter(colMyItems, DueDate < Today() || Status.Value = "Rejected"), DueDate, Ascending)
```

### `galInProgress`
<sub>7.C The three list sections</sub>

```powerfx
Sort(Filter(colMyItems, Status.Value in ["Assigned","Draft"], DueDate >= Today()), DueDate, Ascending)
```

### `7.C The three list sections`

```powerfx
Sort(Filter(colMyItems, Status.Value in ["Approved","Final"]), Modified, Descending)
```

---

## 8. Screen 3 — Edit Commentary (scrEditCommentary)

### `lblEditMeta.Text`
<sub>8.C Title block</sub>

```powerfx
varSidePanelItem.ReportCode & "   ·   Page " & varSidePanelItem.PageCode &
" " & varSidePanelItem.PageName & "   ·   " & varSidePanelItem.PeriodKey
```

### `txtCommentary.DisplayMode`
<sub>8.D The commentary editor</sub>

```powerfx
If(
    varSidePanelItem.Status.Value in ["Assigned", "Draft", "Rejected"]
    && varSidePanelItem.AssignedContributorEmail = varUserEmail,
    DisplayMode.Edit,
    DisplayMode.View
)
```

### `8.D The commentary editor`

```powerfx
If(!IsBlank(varSidePanelItem),
    Set(varSidePanelItem,
        LookUp(ERM_Commentary, ID = varSidePanelItem.ID)
    )
);
// Reset dirty flag because we just freshly loaded
Set(varDirtyEditCommentary, false);
```

### `8.E OnVisible`

```powerfx
If(!IsBlank(varSidePanelItem),
    Set(varSidePanelItem, LookUp(ERM_Commentary, ID = varSidePanelItem.ID))
);
Set(varDirtyEditCommentary, false);
```

### `8.F Save Draft button`

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

### `8.G Submit button`

```powerfx
If(varSidePanelItem.Status.Value = "Rejected", "Resubmit →", "Submit →")
```

### `8.G Submit button`

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

---

## 9. Screen 3b — Edit Commentary (read-only state)

### `9.A Green status banner`

```powerfx
If(varSidePanelItem.Status.Value = "Approved",
    "✓ This commentary is approved and locked for editing. It will appear in the published board pack once the gatekeeper signs off the " & varSidePanelItem.PeriodKey & " cycle. Reach out to " & varSidePanelItem.AssignedBy & " if it needs to change.",
    "✓ This commentary is final and visible in the published board pack."
)
```

---

## 10. Screen 4 — Approval Queue (scrApprovalQueue)

### `10.C Main gallery — galApprovalQueue`

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

## 11. Screen 5 — Approval Detail (scrApprovalDetail)

### `11.C Approve button`

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
ClearCollect(colMyReviewQueue,
    Filter(ERM_Commentary,
        ReviewerEmail = varUserEmail,
        Status.Value = "Submitted",
        PeriodKey = varSelectedPeriod
    )
);
Set(varSidePanelItem, First(Filter(ERM_Commentary, false)));
Notify("Approved. Will be visible in Power BI when the cycle is signed off.",
       NotificationType.Success);

// Move to next in queue (now reading a fresh collection)
If(CountRows(colMyReviewQueue) > 0,
    Set(varSidePanelItem, First(colMyReviewQueue));
    Navigate(scrApprovalDetail),
    Navigate(scrApprovalQueue)
)
```

### `btnReject.OnSelect`
<sub>11.D Reject flow</sub>

```powerfx
Set(varRejectMode, true);
SetFocus(txtRejectReason)
```

### `btnSubmitRejection.OnSelect`
<sub>11.D Reject flow</sub>

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
                varUserFullName, ": ", txtRejectReason.Text
            ),
            SubmittedDate: Blank()
        }
    );
    Refresh(ERM_Commentary);
    ClearCollect(colMyReviewQueue,
        Filter(ERM_Commentary,
            ReviewerEmail = varUserEmail,
            Status.Value = "Submitted",
            PeriodKey = varSelectedPeriod
        )
    );
    Reset(txtRejectReason);
    Set(varRejectMode, false);
    Notify("Rejected. Contributor has been notified.", NotificationType.Info);

    // Move to next (fresh collection)
    If(CountRows(colMyReviewQueue) > 0,
        Set(varSidePanelItem, First(colMyReviewQueue));
        Navigate(scrApprovalDetail),
        Navigate(scrApprovalQueue)
    )
)
```

---

## 12. Screen 6 — Control Centre (scrControlCentre)

### `12.B Header — period selector, Plan, Sign Off`

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

### `12.B Header — period selector, Plan, Sign Off`

```powerfx
Set(varShowPlanCycle, true)
```

### `12.D The main grid — galCycleItems`

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

### `12.E The side panel`

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
<sub>12.F Side panel actions</sub>

```powerfx
Set(varNudgeResult,
    SendNudge.Run(
        varSidePanelItem.ID,
        "Reminder: your commentary for " & varSidePanelItem.SectionName &
        " (" & varSidePanelItem.PeriodKey & ") is due " &
        Text(varSidePanelItem.DueDate, "dd MMM yyyy") & "."
    )
);
If(varNudgeResult.success,
    Notify(varNudgeResult.message, NotificationType.Success),
    Notify(varNudgeResult.message, NotificationType.Warning)
);
Set(varSidePanelItem, LookUp(ERM_Commentary, ID = varSidePanelItem.ID))
```

### `btnNotRequired.OnSelect`
<sub>12.F Side panel actions</sub>

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
<sub>12.F Side panel actions</sub>

```powerfx
// Reset all edit controls to their defaults
Reset(cboContributor); Reset(cboReviewer); Reset(dteDueDate);
Reset(cboPriority); Reset(tglRequired); Reset(txtAssignmentPrompt);
Set(varDirtyControlCentre, false)
```

### `btnSaveChanges.OnSelect`
<sub>12.F Side panel actions</sub>

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

## 13. Modals — Add Item, Plan Cycle, Sign Off

### `txtAddItemNumber.Text (smart next-available)`
<sub>13.B Modal 1 — Add Commentary Item</sub>

```powerfx
Max(
    Filter(colCycleItems,
        PageCode = cboAddPage.Selected.PageCode
    ),
    ItemNumber
) + 1 & " (next available)"
```

### `btnConfirmAddItem.OnSelect`
<sub>13.B Modal 1 — Add Commentary Item</sub>

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

### `Plan Cycle modal with preview tiles.`
<sub>13.C Modal 2 — Plan Commentary Cycle</sub>

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

### `Plan Cycle modal with preview tiles.`
<sub>13.C Modal 2 — Plan Commentary Cycle</sub>

```powerfx
CountRows(
    Filter(CommentarySlots,
        ReportCode_Text = varActiveReport.ReportCode,
        Active = true,
        IncludedByDefault = true
    )
)
```

### `Plan Cycle modal with preview tiles.`
<sub>13.C Modal 2 — Plan Commentary Cycle</sub>

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
<sub>13.C Modal 2 — Plan Commentary Cycle</sub>

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

### `btnConfirmSignOff.DisplayMode (type-to-confirm)`
<sub>13.D Modal 3 — Sign Off Cycle</sub>

```powerfx
If(Lower(Trim(txtSignOffConfirm.Text)) = "sign off",
    DisplayMode.Edit,
    DisplayMode.Disabled
)
```

### `btnConfirmSignOff.OnSelect`
<sub>13.D Modal 3 — Sign Off Cycle</sub>

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

## 14. Cross-cutting patterns

### `14.1 Dirty-state handling and the discard-confirm modal`

```powerfx
If(varDirtyEditCommentary || varDirtyControlCentre,
    Set(varPendingNav, "scrXyz");
    Set(varShowDiscardConfirm, true),
    Navigate(scrXyz, ScreenTransition.None)
)
```

### `14.1 Dirty-state handling and the discard-confirm modal`

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

### `14.2 Status pill colour`

```powerfx
Switch(varItem.Status.Value,
    "Not Started", RGBA(236,239,244,1),
    "Assigned",    RGBA(227,242,253,1),
    "Draft",       RGBA(255,248,225,1),
    "Submitted",   RGBA(255,248,225,1),
    "Rejected",    RGBA(255,235,238,1),
    "Approved",    RGBA(232,245,233,1),
    "Final",       RGBA(46,125,50,1),
    "Not Required",RGBA(244,246,250,1),
    "Archived",    RGBA(229,231,235,1),
    RGBA(244,246,250,1)
)
```

### `14.2 Status pill colour`

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

### `14.4 Role detection in v2`

```powerfx
Set(varRoles, GetUserRoles.Run(varUserEmail));
Set(varIsGatekeeper, "Gatekeeper" in varRoles.roles);
Set(varIsReviewer, "Reviewer" in varRoles.roles);
Set(varIsAdmin, "Admin" in varRoles.roles)
```

---

## 15. Power BI binding measure

### `15.1 Data source and status filter`

```dax
FILTER('ERM_Commentary', 'ERM_Commentary'[Status] = "Final")
```

### `15.2 The commentary lookup measure`

```dax
Commentary =
LOOKUPVALUE(
    'ERM_Commentary'[CommentaryText],
    'ERM_Commentary'[RowKey],
    [ReportCode] & "|" & [PageCode] & "|" & [CommentaryKey] & "|" &
    [PeriodKey] & "|" & [OrgUnitCode]
)
```

### `15.3 Fallback text`

```dax
Commentary_Display =
COALESCE([Commentary], "[Commentary pending sign-off]")
```

---

## Common gotchas

- **`Distinct()` renames your column to `Result`.** Never wrap an already-distinct collection in `Distinct()` again, and reference its column as `Result`, not the original name. (This caused the OnStart error in v1.)
- **Person-column patches** need the exact `@odata.type` + `Claims` shape. If an assignment won't stick, check this first.
- **Nav must call `Navigate()` from a screen, not a component** — components are sandboxed. The nav bar is built on the template screen for this reason.
- **`Refresh()` after every Patch** keeps collections in sync. Fine at ~130 rows.
- **Flows must be added as data sources** before `Plan_Cycle.Run` / `Sign_Off_Cycle.Run` / `Send_Nudge.Run` resolve.
- **`like` with leading wildcards is non-delegable** — fine for ~130 rows; swap to `StartsWith()` past ~500.
