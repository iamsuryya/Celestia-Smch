# Implementation Plan: Incharges Portal Streamlined Enhancements

A focused, clean implementation to elevate the **Event Incharges Portal (`/incharges`)** by adding three specific tools without visual clutter or unnecessary noise:

---

## Targeted Features to Implement

### 1. Student College ID Card Proof Viewer
- **Experience**:
  - Each participant has a small, tasteful **"View ID"** action button (with an eye / card icon).
  - Clicking opens an elegant **Student ID Card Modal** showing the student's name, role, college, and their uploaded ID card image in high resolution.
  - If no ID proof was attached during registration, displays a clean notice: *"Digital ID proof not provided · Please check physical student ID card"*.
  - Includes a quick-close button and background click to dismiss.

### 2. College Delegation & SMCH Host Student Indicators
- **Experience**:
  - **College Delegation**: Display a clean inline badge `🎓 College Delegation` next to the college name, showing the designated college representative contact.
  - **SMCH Host Student Waiver**: For internal Srinivasan Medical College students, display a subtle `🏥 SMCH Host Student` indicator showing their **Register Number** and **MBBS Batch** so in-charges can easily verify their hospital lanyard badge.
  - Displayed neatly in both **Cards View** and **Call Sheet Table View** without crowding the layout.

### 3. Stage Queue Filter Tabs (All / Checked-In / Awaiting Arrival)
- **Experience**:
  - Add a sleek, clean segmented control next to the search bar:
    - **All Teams** (`Count`)
    - **Checked In** (`Count`)
    - **Awaiting Arrival** (`Count`)
  - When in-charges select **"Awaiting Arrival"**, the list immediately narrows to only the teams that haven't arrived backstage yet, so coordinators can quickly click **WhatsApp Captain** or **Call**.

---

## Design Principles (Anti-Clutter)
- **Zero Messy Pills**: Unboxed metadata with clean typographic separators (`·`).
- **Readable Spacing**: Generous card padding and clean contrast for outdoor/backstage phone viewing.
- **Strictly Read-Only**: Absolutely no edit or delete access for participant records.

---

## Verification & Build
1. Test ID proof viewer modal on desktop and mobile viewports.
2. Verify segmented filter tabs accurately update counts and filter items.
3. Verify host student batch and register numbers display accurately.
4. Run `lint_applet` (`tsc --noEmit`) and `compile_applet` to confirm 0 errors.
