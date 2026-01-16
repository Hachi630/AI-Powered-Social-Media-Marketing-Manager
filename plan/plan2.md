# Brand Profile UI Polish Plan (Next Iteration) — Make It Feel “Premium”

Based on the latest screenshots: the overall structure is correct (Left Stepper / Middle Form / Right Summary), but it still feels **too empty on large screens**, the **gray title bar feels inconsistent**, and some **UI details reduce the “premium” feel**. Below is a clear plan for Codex.

---

## 1) Too Empty on Large Screens — Fix with Container Width + Column Ratios + Density

### 1.1 Increase Page Container Width (Key)
- The content area is currently too narrow, creating huge side whitespace.
- Set **page max-width to `1360–1440px`** and center it.
- Use a 3-column layout with clear widths:
  - **Left Stepper:** `280–320px`
  - **Middle Form:** `720–820px` (main column must be wider)
  - **Right Summary:** `320–360px`
  - **Column gap:** `24px`

✅ Result: the layout will “fill” large screens better and look more professional.

### 1.2 Make the Stepper Visually Lighter + More Compact
- The left stepper currently looks like a stack of heavy cards.
- Convert it to a **lightweight list stepper**:
  - Minimal background
  - Subtle dividers
  - Clear active indicator

**Active step style (premium):**
- Thin left accent bar (2–3px)
- Very light background highlight
- **No thick black border**

### 1.3 Improve the Middle Form “Section Grouping”
Right now, each step has multiple small cards. For a more premium look:
- Option A (Recommended): Add a **Step Header** like `Step 1 · Basic Info`, then sections below.
- Option B: Merge multiple small cards into **one larger card** per step (reduces fragmentation).

---

## 2) Title Bar (“Brand Profile” Row) — Remove Gray Background (Agree)

### 2.1 Header Background
- Set the **header/title bar background to white** (same as page).
- Use only a subtle bottom border:
  - `border-bottom: 1px solid #ECEFF3`
- Avoid gray background—it visually “splits” the page and feels inconsistent.

### 2.2 Simplify the Top Area (Per Your Request)
You said: “Keep only company selection in the Brand Profile row.”  
Recommended premium header layout:

- **Left:** Company Select (dropdown) ✅
- **Center:** `Brand Profile` title (keep centered) ✅
- **Right:** `Save` button (optionally keep a tiny “Saved” status)

Move `Add New Company` and `More` into the Company dropdown:
- At the bottom of the dropdown:
  - `+ Add new company`
  - `Manage companies` (Edit/Delete inside)

✅ This makes the header clean and “SaaS-like”.

---

## 3) Why It Still Doesn’t Feel Premium (And How to Fix)

### 3.1 Too Many Accent Colors
Currently: green buttons + blue progress bar + green step accents + red delete icons.  
For a premium look:
- Keep **one primary brand accent** (your green).
- Make progress bar use the same accent (not blue).
- Keep red only for destructive actions, but soften it until hover.

### 3.2 Inconsistent Borders & Shadows
Premium UI comes from consistency:
- Use either:
  - light border + very subtle shadow OR
  - border only (no shadow)
- Standardize:
  - Border: 1px neutral gray
  - Radius: `12px` or `14px` across the page
  - Active state: light highlight + thin accent bar (no thick outlines)

### 3.3 Typography Hierarchy Needs More Contrast
Suggested scale:
- Page title (H1): `24–28px`, semibold
- Section title: `16–18px`
- Field label: `12–13px`, medium
- Helper text: `12px`, muted

### 3.4 Mascot Reduces Professional Feel
The mascot is cute but hurts the “premium SaaS form” vibe if always visible.
- Default: **do not show it**
- Only show for:
  - empty states
  - success/completion state (Step 5 saved)

---

## 4) Right Summary Panel — Make It More Useful (Not Empty)

### 4.1 Increase Information Density (Still Clean)
- Current selections should show concise previews:
  - Tone: Warm
  - Audience: Women, Men, Elderly +1
  - Products: 3
  - Goals: 4

### 4.2 Required Checklist
- If complete: one green line “All required fields completed.”
- If missing: list missing fields and make them **clickable** (jump to step/field)

### 4.3 “Jump to” Should Behave Like Real Anchors
- Hover highlight
- Click scrolls to step
- Stepper highlights update accordingly

---

## 5) Form UX Polish (More Like Mature Products)

### 5.1 Sticky Bottom Action Bar (Optional but Premium)
Instead of placing Back/Next inside each card:
- Add a sticky bottom action bar inside the middle column:
  - Left: Back
  - Right: Next / Save
  - White background + top border

### 5.2 Tags Input Should Feel “Pro”
- Differentiate:
  - Selected tags: slightly stronger fill
  - Suggested tags: outline/light fill
- Consider removing the `Add` button and support:
  - Enter to add (more premium)
  - Keep button only if needed, but style it lighter

---

## 6) Codex To-do List (Prioritized)

### P0 (Must Do — Biggest impact)
1. Increase container max-width to `1360–1440px`; adjust column widths (middle wider).
2. Remove gray header background → white + subtle bottom border.
3. Simplify header: only Company Select + centered title + Save (move Add/More into dropdown).
4. Unify accent color: progress bar should match primary button color (no blue).
5. Mascot not always visible (only empty/success states).

### P1 (Nice to Have — Quality boost)
6. Stepper becomes lightweight list (no heavy card borders).
7. Merge small cards into bigger step sections or add step header to reduce fragmentation.
8. Make Summary richer: clickable missing items + more compact selection preview.

---

If you want, I can also provide a **Design Tokens table** (colors, border, shadow, radius, typography, spacing) so Codex can apply consistent styling across the whole app.
