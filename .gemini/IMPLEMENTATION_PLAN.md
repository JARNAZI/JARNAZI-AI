# Debate Page UX Fixes - Implementation Plan

## Issues Identified

### A) INPUT FOCUS BUG
**Location**: `src/app/[lang]/debate/[id]/DebateClient.tsx` lines 1130-1148
- TEXT button (line 1131) does NOT focus the textarea automatically
- MATH button (line 1141) does NOT focus MathInput automatically
- Users must click inside input area after clicking mode buttons

**Fix**: Add explicit focus handlers to both buttons

### B) MATHLIVE UI / LAYOUT
**Location**: `src/components/math/MathPanel.tsx`
- Currently renders as bottom panel (line 51)
- Need responsive side panel for desktop
- MathLive buttons (lines 63-74) may not work on desktop

**Fix**: 
1. Add responsive layout (side panel on desktop, bottom on mobile)
2. Test MathLive buttons, remove/disable if non-functional
3. Ensure close button always reachable

### C) MOBILE TOOLBAR: AUDIO BUTTON HIDDEN
**Location**: `src/app/[lang]/debate/[id]/DebateClient.tsx` lines 1129-1158
- Horizontal scroll required to see Audio button (line 1157)
- No visual hint for scrolling
- Scroll hints exist (lines 1160-1185) but buttons still overflow

**Fix**: Adjust toolbar layout to show all buttons without horizontal scroll

### D) ICON STYLE CONSISTENCY
**Location**: Throughout toolbar icons
- Mix of glow and flat styles
- Need consistent glow effect

**Fix**: Apply consistent glow styling to all toolbar icons

### E) SPELLING / ENCODING / TYPO FIXES
**Locations**: All i18n dictionaries
- `en.ts` line 116: `â€"` should be `—` (em dash)
- `en.ts` line 139: `â€™` should be `'` (apostrophe)
- `en.ts` line 146: `â€¢` should be `•` (bullet)
- `en.ts` line 164: `â€"` should be `—` (em dash)

**Fix**: Replace all broken UTF-8 characters across ALL language files

### F) CACHE / STALE ASSETS ISSUE
**Analysis**:
- Next.js with `output: 'standalone'` (next.config.ts line 4)
- Layout has `dynamic = "force-dynamic"` and `revalidate = 0` (layout.tsx lines 13-14)
- No service worker or PWA manifest found
- Docker build uses proper Next.js standalone output

**Likely Cause**: Browser caching of static assets without proper cache headers

**Fix**: Add cache-control headers in next.config.ts for static assets

## Implementation Order

1. **Fix i18n encoding issues** (E) - Quick wins, affects all languages
2. **Fix input focus bugs** (A) - Critical UX issue
3. **Fix mobile toolbar overflow** (C) - Mobile UX blocker
4. **Add icon glow consistency** (D) - Visual polish
5. **Redesign MathPanel for desktop** (B) - Complex layout change
6. **Fix cache headers** (F) - Infrastructure fix

## Files to Modify

1. `src/i18n/dictionaries/en.ts` - Fix encoding
2. `src/i18n/dictionaries/ar.ts` - Fix encoding
3. `src/i18n/dictionaries/de.ts` - Fix encoding
4. `src/i18n/dictionaries/es.ts` - Fix encoding
5. `src/i18n/dictionaries/fr.ts` - Fix encoding
6. `src/i18n/dictionaries/it.ts` - Fix encoding
7. `src/i18n/dictionaries/ja.ts` - Fix encoding
8. `src/i18n/dictionaries/pt.ts` - Fix encoding
9. `src/i18n/dictionaries/sv.ts` - Fix encoding
10. `src/app/[lang]/debate/[id]/DebateClient.tsx` - Focus handlers, toolbar layout, icon styles
11. `src/components/math/MathPanel.tsx` - Responsive layout
12. `src/components/math/MathInput.tsx` - Focus improvements
13. `next.config.ts` - Cache headers

## Testing Checklist

- [ ] TEXT icon focuses input immediately (desktop + mobile)
- [ ] MATH icon focuses math input immediately (desktop + mobile)
- [ ] Desktop: MathLive opens in right-side panel, close button reachable
- [ ] Mobile: all toolbar buttons visible (no horizontal scroll), Audio visible
- [ ] Icon glow consistent across all toolbar buttons
- [ ] No dead MathLive buttons (either working or removed/disabled)
- [ ] All languages: no broken characters/typos fixed
- [ ] No need for Ctrl+Shift+R; normal refresh works
