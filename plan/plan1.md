# Brand Profile Refactor Plan (Step Flow) — Next Iteration Notes for Codex

> Goal: Make the page cleaner and consistent with other pages, reduce visual crowding, improve navigation clarity, and keep key actions always visible.

---

## 1) Global Visual Style

### 1.1 Background & Surfaces
- **Page background:** change to **pure white** (`#FFFFFF`) to match other pages.
- Use **light neutral borders + subtle shadow** to separate sections (avoid beige/cream page background for hierarchy).
- Optional: Header/Summary can use **very light gray** (e.g., `#F8F9FB`) for subtle separation, but the main canvas stays white.

### 1.2 Card Style Consistency
- Standardize:
  - Card padding: `20–24px`
  - Card radius: consistent (e.g., `12–16px`)
  - Section spacing: `16–20px` (not too large)
- Reduce heavy outlines: **avoid thick black borders** on active step cards.

---

## 2) Header Layout (Top Bar)

### 2.1 Center Title
- **Center-align the page title "Brand Profile" (H1)** — current left alignment looks awkward.
- Recommended header structure:
  - **Left:** Select Company (dropdown) + Add New Company + More menu (···)
  - **Center:** `Brand Profile` (H1)
  - **Right:** Save status (Saved / Unsaved / Saving…) + Save button

### 2.2 Company Switching Rules
- If switching company while there are unsaved changes:
  - Show confirm modal: `Discard / Save & Switch / Cancel`

---

## 3) Layout Restructure (Reduce Crowding)

### 3.1 Move Step 1–5 Navigator to the Left
Current issue: Step cards stacked above the form consume vertical space and make the page feel long.

**Update to a 3-column desktop layout:**
- **Left:** Step Navigator (Stepper) — sticky
- **Middle:** Current step form content (main)
- **Right:** Profile Summary — sticky

**Recommended widths**
- Left Stepper: `280px` (fixed)
- Middle Form: `auto` (max width `720–840px`)
- Right Summary: `320px` (fixed)
- Column gap: `24px`
- Page max width: `1200–1280px`, centered

---

## 4) Stepper Component (Left Column)

### 4.1 Replace “Card List” with a True Stepper
- Each step item:
  - Number circle + Title + short subtitle
  - States:
    - **Active:** subtle highlight (left accent bar OR filled circle)
    - **Completed:** checkmark ✓
    - **Default:** muted
- Avoid strong black border for active state.

### 4.2 Click Behavior
- Allow clicking step to jump.
- If required fields missing, show:
  - Field-level errors
  - Summary checklist updates
  - Optional: toast “Please complete required fields.”

---

## 5) Form Content (Middle Column)

### 5.1 Sticky Bottom Action Bar (Back/Next)
Current issue: Back/Next position changes per section and gets lost in long content.

- Add **sticky bottom action bar** inside the middle column:
  - Left: `Back` (secondary)
  - Right: `Next` / `Save` (primary)
  - Optional: small helper text in center (step guidance)
- Keep global `Save` in the header as well.

### 5.2 Spacing & Density Improvements
- Limit line length by keeping the form column max width `720–840px`.
- Tighten spacing:
  - Title → helper text: smaller gap
  - Field label → input: consistent
- Keep section headings clearly visible:
  - Section Title (16–18, semibold)
  - Helper text (12–13, gray)

---

## 6) Profile Summary (Right Column)

### 6.1 Make Summary More Useful (Not Empty)
- Completion:
  - Show `80%` + progress bar
- Required checklist:
  - If complete: “All required fields completed.”
  - If missing: list missing items and make them **clickable** (jump to step + field)
- Current selections:
  - Show small preview:
    - Tone: “Warm”
    - Audience: show first 3 tags + “+2 more”
    - Products count
    - Goals count
- Jump to:
  - Keep as quick anchors to steps

---

## 7) Mascot (Bottom Right)

Current issue: mascot takes attention and feels like a floating decoration on every screen.

- Do **not** keep mascot always visible on every step.
- Use it only in:
  - Empty state
  - Completion success state (Step 5 saved)
- Or reduce size and place subtly in header corner (optional).

---

## 8) Responsive Behavior

### 8.1 Tablet (768–1199px)
- Switch to **2-column**:
  - Form main
  - Summary collapsible (accordion or top card)
- Stepper becomes a **top horizontal step indicator**: “Step X/5”

### 8.2 Mobile (<768px)
- Single column:
  - Top: “Step X/5”
  - Summary becomes collapsible mini card (progress + missing)
  - Bottom: fixed Back/Next action bar

---

## 9) Implementation Task List (DoD)

1. Set page background to `#FFFFFF`, adjust borders/shadows for hierarchy.
2. Center-align `Brand Profile` title in header; move company controls left and save controls right.
3. Change layout to 3 columns (Left Stepper sticky / Middle Form / Right Summary sticky).
4. Replace Step card list with true stepper UI (active/completed states).
5. Add sticky bottom action bar in form column (Back/Next/Save).
6. Improve Summary usefulness: clickable missing required fields + compact preview of selections.
7. Reduce/limit mascot usage (only empty/completion states).
8. Ensure tablet/mobile responsive behavior matches above spec.

---
