# NSQ UI Fix: Import Bar + Player Visual Parity

## Source Artifact Ledger

| Field | Value |
|---|---|
| Artifact URL | `http://127.0.0.1:5501/projects/nsq/.superpowers/brainstorm/63778-1780113690/content/nsq-shadowing-v5.html` |
| Artifact path | `projects/nsq/.superpowers/brainstorm/63778-1780113690/content/nsq-shadowing-v5.html` |
| Artifact type | Brainstorm HTML (v5 design reference) |
| Selected screen | ① 홈 (Home), ③ 몰입 (Immersion / Player) |
| User decision | Import bar must match v5 height/alignment; Player must match two-column layout with controls bar, mode badge, segment list container, and TutorPanel title |
| Implementation scope | Scoped subset — Import bar + Player view only; Import/Sentence pages not touched |

**Non-goals / Known deviations:**
- Progress bar scrubbing (click-to-seek) is not implemented — only visual display
- Audio time/duration display is best-effort (depends on audio load state)
- Sentence mode visual refinements are out of scope for this plan

---

## Scope Lock

This plan implements pixel-faithful fixes to two screens (Home import bar, Player immersion view) to match `nsq-shadowing-v5.html`. No new routes, no new API endpoints.

---

## Visual Contract

### Home — Import Bar

| Element | Reference spec | Current problem |
|---|---|---|
| Container | `padding: 10px 12px; background: #1e293b; border: 1px solid #334155; border-radius: 10px; display: flex; align-items: center; gap: 8px` | `items-start`, height too small |
| URL input | `flex: 1; padding: 9px 12px; border-radius: 6px; font-size: 13px; background: #0f172a; border: 1px solid #475569; color: #94a3b8` | TextField component adds label height, misaligned |
| Import button | `padding: 9px 18px; background: #3b82f6; border-radius: 6px; font-size: 13px; font-weight: 700` | Button wrapped in `pt-1` div causing misalignment |
| Error text | Displayed below container | Keep existing behavior |

### Player — Immersion Mode

| Element | Reference spec | Current problem |
|---|---|---|
| Top bar | `flex; align-items: center; gap: 8px; background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px 14px` — episode title + mode badge + mode switch btn | Header has title but no badge, no controls bar |
| Mode badge (immersion) | `background: #1d4ed8; color: #bfdbfe; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 4px` "몰입" | Missing |
| Mode badge (sentence) | `background: #7c3aed; color: #ddd6fe` "문장" | Missing |
| Player controls bar | `flex; align-items: center; gap: 8px; padding: 10px 14px; background: #1e293b; border: 1px solid #334155; border-radius: 8px` with ◀ 이전, ⏸/▶, 다음 ▶, 반복 R buttons + progress bar + time | Completely missing |
| Segment list wrapper | `background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 6px; overflow-y: auto` | Segments rendered without outer container |
| Active segment | `background: #1e3a5f; border-left: 3px solid #3b82f6` | Currently `border-2 border-primary-normal bg-fill-strong` |
| Inactive segment text | `color: #e2e8f0` (bright enough to read) | May be too dim |
| TutorPanel header | `padding: 12px 14px; border-bottom: 1px solid #334155` with title `🤖 AI Tutor` (13px 700 `#f8fafc`) + persona tabs below | No title, just persona tabs |

---

## Task Breakdown

### Task 1 — Home: Fix Import Bar
**File:** `projects/nsq/src/app/page.tsx`

**Changes:**
1. Change import-bar container: `items-start` → `items-center`
2. Replace `<TextField>` with a raw `<input>` element:
   ```tsx
   <input
     type="text"
     className="flex-1 bg-[#0f172a] border border-[#475569] rounded-md px-3 py-[9px] text-sm text-[#94a3b8] placeholder-[#475569] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
     placeholder="YouTube URL 입력..."
     value={url}
     onChange={(e) => { setUrl(e.target.value); setUrlError(undefined) }}
     onKeyDown={(e) => { if (e.key === 'Enter') handleImport() }}
   />
   ```
3. Remove `<div className="pt-1">` wrapper around the Button
4. Show error text below the container (keep existing `urlError` state)

**Expected rendering after task:** Import bar is a single-row flex container with a dark rounded input (same height as the blue Import button) and no vertical misalignment.

**Verification:**
- `npm run dev` → open `http://localhost:3000/`
- Import bar must be a single aligned row: input + button same height
- No extra space above/below input vs button
- Error text appears below bar when invalid URL submitted

**시각 검증:**
- [ ] `npm run dev` 후 브라우저 `/` 직접 확인
- [ ] screenshot target: route `/`, full page, desktop 1440px
- [ ] import bar 한 행으로 정렬, input과 button 높이 동일 여부
- [ ] 다크 배경(#1e293b 컨테이너) 적용 여부

---

### Task 2 — Player: Add Mode Badge to Header
**File:** `projects/nsq/src/app/player/[videoId]/page.tsx`

**Changes:**

In the `<header>` section, add a mode badge span next to the title area:
```tsx
<span className={[
  'text-[11px] font-extrabold px-[10px] py-[3px] rounded',
  state.mode === 'immersion'
    ? 'bg-[#1d4ed8] text-[#bfdbfe]'
    : 'bg-[#7c3aed] text-[#ddd6fe]',
].join(' ')}>
  {state.mode === 'immersion' ? '몰입' : '문장'}
</span>
```

Place it between the title and the mode-toggle Button.

**Expected rendering:** Header shows `[episode title] [blue "몰입" pill] [mode toggle button]`.

**Verification:**
- Header has colored pill next to title
- Switches between blue/purple when mode toggles

---

### Task 3 — Player: Add Player Controls Bar
**File:** `projects/nsq/src/app/player/[videoId]/page.tsx`

**Changes:**

1. Add `currentTime` and `duration` state in `PlayerContent`:
   ```tsx
   const [currentTime, setCurrentTime] = useState(0)
   const [duration, setDuration] = useState(0)
   ```

2. Wire timeupdate and durationchange events in the existing audio useEffect:
   ```tsx
   const handleDuration = () => setDuration(audio.duration || 0)
   const handleTimeUpdateCtrl = () => setCurrentTime(audio.currentTime)
   audio.addEventListener('durationchange', handleDuration)
   audio.addEventListener('timeupdate', handleTimeUpdateCtrl)
   // return cleanup includes both
   ```

3. Add a `formatTime(seconds: number)` utility function:
   ```tsx
   function formatTime(s: number) {
     const m = Math.floor(s / 60)
     const sec = Math.floor(s % 60)
     return `${m}:${sec.toString().padStart(2, '0')}`
   }
   ```

4. Add controls bar JSX between `<header>` and `{/* Main content area */}`:
   ```tsx
   {/* Player controls bar */}
   <div className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] border-b border-[#334155]">
     <button
       className="px-3 py-1.5 rounded text-xs font-bold bg-[#334155] text-[#e2e8f0] hover:bg-[#475569] transition-colors"
       onClick={() => dispatch({ type: 'PREV' })}
     >◀ 이전</button>
     <button
       className="px-3 py-1.5 rounded text-xs font-bold bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors"
       onClick={() => dispatch({ type: 'TOGGLE_PLAY' })}
     >{state.isPlaying ? '⏸ 정지' : '▶ 재생'}</button>
     <button
       className="px-3 py-1.5 rounded text-xs font-bold bg-[#334155] text-[#e2e8f0] hover:bg-[#475569] transition-colors"
       onClick={() => dispatch({ type: 'NEXT' })}
     >다음 ▶</button>
     <button
       className="px-3 py-1.5 rounded text-xs font-bold bg-[#334155] text-[#e2e8f0] hover:bg-[#475569] transition-colors"
       onClick={() => {
         const seg = state.segments[state.currentIndex]
         if (seg && audioRef.current) {
           audioRef.current.currentTime = seg.start
           audioRef.current.play().catch(() => {})
           dispatch({ type: 'SET_PLAYING', payload: true })
         }
       }}
     >반복 R</button>
     <div className="flex-1 h-1 bg-[#334155] rounded mx-2 overflow-hidden">
       <div
         className="h-full bg-[#3b82f6] rounded transition-all"
         style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
       />
     </div>
     <span className="text-[11px] text-[#94a3b8] whitespace-nowrap font-mono">
       {formatTime(currentTime)} / {formatTime(duration)}
     </span>
   </div>
   ```

**Expected rendering:** A dark controls bar below the episode header with prev/play/next/repeat buttons, a thin progress bar, and a time display (`0:00 / 0:00` while audio loads).

**Verification:**
- Controls bar visible below header
- ▶/⏸ toggle works
- 이전/다음 moves segments
- 반복 R replays current segment
- Time display updates during playback

**시각 검증:**
- [ ] `/player/visualdemo1` 페이지에서 controls bar 확인
- [ ] screenshot target: route `/player/visualdemo1`, full page, desktop 1440px

---

### Task 4 — ImmersionMode: Segment List Container + Card Styles
**File:** `projects/nsq/src/components/ImmersionMode.tsx`

**Changes:**

1. Wrap segments in a scrollable container matching reference `.seg-list`:
   ```tsx
   <div className="flex-1 overflow-y-auto bg-[#1e293b] border border-[#334155] rounded-lg p-1.5 mx-4 mb-4" style={{ maxHeight: 'calc(100vh - 220px)' }}>
     {segments.map(...)}
   </div>
   ```

2. Update segment item classes to match reference:
   - Active: `bg-[#1e3a5f] border-l-[3px] border-l-[#3b82f6] rounded px-3 py-2.5 mb-1`
   - Inactive: `border-l-[3px] border-l-transparent rounded px-3 py-2.5 mb-1 hover:bg-[#1a2744]`

3. Update text colors:
   - Inactive text: `text-[#e2e8f0] text-sm leading-relaxed` (bright enough to read)
   - Active text: `text-[#f8fafc] font-semibold text-sm`
   - Timestamp: `text-[10px] text-[#64748b] font-mono mb-1`
   - Translation (blurred): `text-[12px] text-[#94a3b8] mt-1 cursor-pointer leading-relaxed`
   - Translation (shown): `text-[12px] text-[#7dd3fc] mt-1 cursor-pointer leading-relaxed`

4. Remove the outer `div.flex.flex-col.gap-2.p-4` wrapper — replace with just the container div above.

**Expected rendering:** Segment list is a single bordered card with dark background. Active segment has a blue left border and lighter background. Inactive segments show readable text on dark background with a transparent left border slot.

**Verification:**
- Segments inside a bordered dark container
- Active segment visually highlighted with blue left border
- Translation blur/reveal still works on click

**시각 검증:**
- [ ] `/player/visualdemo1` — segment list bordered container 확인
- [ ] 활성 세그먼트 파란 왼쪽 보더 확인
- [ ] screenshot: `player-segment-list-desktop.png`

---

### Task 5 — TutorPanel: Add Header Title
**File:** `projects/nsq/src/components/TutorPanel.tsx`

**Changes:**

Add a header section above the persona tabs:
```tsx
{/* Header */}
<div className="px-3 pt-3 pb-2 border-b border-[#334155] flex-shrink-0">
  <p className="text-[13px] font-bold text-[#f8fafc] mb-2">🤖 AI Tutor</p>
  <div className="flex gap-1">
    {(['angela', 'mike', 'general'] as Persona[]).map((p) => (
      <button
        key={p}
        onClick={() => dispatch({ type: 'SET_PERSONA', payload: p })}
        className={[
          'flex-1 text-center py-1.5 text-[11px] font-bold rounded cursor-pointer border transition-colors',
          persona === p
            ? 'bg-[#3b82f6] text-white border-transparent'
            : 'bg-transparent text-[#94a3b8] border-[#334155] hover:border-[#475569]',
        ].join(' ')}
      >
        {p === 'angela' ? 'Angela Bot' : p === 'mike' ? 'Mike Bot' : 'General'}
      </button>
    ))}
  </div>
</div>
```

Remove the existing persona tabs `<div className="flex gap-2 px-3 pt-3 pb-2">` block (replaced by the header above).

**Expected rendering:** TutorPanel top shows "🤖 AI Tutor" title, then three tab-style buttons (Angela Bot / Mike Bot / General) in a row with blue active state.

**Verification:**
- Title visible at top of TutorPanel
- Persona tabs are full-width buttons, active one is blue

**시각 검증:**
- [ ] `/player/visualdemo1` — TutorPanel 상단에 "🤖 AI Tutor" 타이틀 + 탭 확인
- [ ] screenshot target: TutorPanel 영역

---

## Verification Matrix

| Requirement | Source artifact | Implementation file | Verification method | Evidence |
|---|---|---|---|---|
| Import bar single-row aligned | nsq-shadowing-v5.html #홈 `.import-bar` | `src/app/page.tsx` | Browser screenshot `/` desktop | pending |
| URL input same height as Import button | nsq-shadowing-v5.html `.url-input` padding 9px | `src/app/page.tsx` | Browser visual check | pending |
| Player: mode badge (몰입/문장) | nsq-shadowing-v5.html `.mode-badge` | `src/app/player/[videoId]/page.tsx` | Browser screenshot `/player/visualdemo1` | pending |
| Player: controls bar visible | nsq-shadowing-v5.html `.player-controls` | `src/app/player/[videoId]/page.tsx` | Browser screenshot desktop | pending |
| Segment list in bordered dark container | nsq-shadowing-v5.html `.seg-list` | `src/components/ImmersionMode.tsx` | Browser screenshot desktop | pending |
| Active segment blue left border | nsq-shadowing-v5.html `.seg-item.active` | `src/components/ImmersionMode.tsx` | Browser visual check | pending |
| TutorPanel "🤖 AI Tutor" title | nsq-shadowing-v5.html `.tutor-title` | `src/components/TutorPanel.tsx` | Browser visual check | pending |

---

## Checklist JSON Mapping

- task-1 → Home: Fix Import Bar (`page.tsx`)
- task-2 → Player: Mode Badge in Header (`player/[videoId]/page.tsx`)
- task-3 → Player: Controls Bar (`player/[videoId]/page.tsx`)
- task-4 → ImmersionMode: Segment Container + Card Styles (`ImmersionMode.tsx`)
- task-5 → TutorPanel: Header Title (`TutorPanel.tsx`)
- task-6 → Visual parity review (browser screenshot + evidence collection)

---

## Out-of-Scope and Intentional Deviations

- **Progress bar scrubbing**: Reference has a static progress bar; we implement display-only (no click-to-seek)
- **Sentence mode**: Visual fixes for sentence mode are not included in this plan
- **Import page**: Not touched
- **Audio duration**: Shows `0:00` until audio metadata loads (acceptable)
- **Speaker badges**: Reference uses custom `.spk` spans; current implementation uses design system `<Badge>` — kept as-is to avoid breaking design system parity
