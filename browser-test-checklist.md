# Browser Testing Checklist for Production Build

**Preview URL:** http://localhost:4173  
**Status:** Server Running ✅

## Quick Start

1. Open your browser
2. Navigate to: http://localhost:4173
3. Open Developer Tools (F12)
4. Follow the checklist below

---

## 🔍 Visual Inspection Tests

### Initial Load (2 minutes)
- [ ] Page loads without blank screen
- [ ] No JavaScript errors in console
- [ ] All UI components visible:
  - [ ] Header/Title
  - [ ] Audio input section
  - [ ] YouTube input section
  - [ ] Visualization canvas
  - [ ] Control panel
  - [ ] Settings panel

### Console Check
- [ ] Open Console tab (F12)
- [ ] Look for errors (red text)
- [ ] Acceptable: Info/debug messages
- [ ] Not acceptable: Uncaught errors, failed requests

---

## 🎵 Core Functionality Tests

### Test 1: Audio File Upload (5 minutes)
1. [ ] Click "Choose File" or drag audio file
2. [ ] Select a short MP3 file (< 1 minute)
3. [ ] Verify file name appears
4. [ ] Click "Analyze Audio" or similar button
5. [ ] Wait for analysis to complete
6. [ ] Check that audio features are displayed (tempo, energy, mood)
7. [ ] Verify no errors in console

**Expected Result:** Audio analysis completes successfully

### Test 2: Poetry Generation (5 minutes)
1. [ ] After audio analysis, select a persona (e.g., "Hamlet")
2. [ ] Click "Generate Poetry"
3. [ ] Wait for poetry to appear (should be < 10 seconds)
4. [ ] Verify poetry is displayed in Korean or English
5. [ ] Verify poetry length is appropriate (not too short)
6. [ ] Check console for any errors

**Expected Result:** Poetry is generated and displayed

### Test 3: YouTube URL (5 minutes)
1. [ ] Find the YouTube input field
2. [ ] Enter a valid YouTube URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
3. [ ] Click "Extract" or similar button
4. [ ] Wait for video info to load
5. [ ] Verify thumbnail appears
6. [ ] Verify video title appears
7. [ ] Check if audio extraction works
8. [ ] Check console for errors

**Expected Result:** YouTube video info is extracted

**Note:** If you get a 403 error, this is expected. The Lambda backend requires proper AWS authentication. The important thing is that the frontend makes the request correctly.

### Test 4: Visualization (5 minutes)
1. [ ] Play audio (if audio player is visible)
2. [ ] Check that visualization canvas shows animation
3. [ ] Try different visualization modes:
   - [ ] Gradient mode
   - [ ] Equalizer mode
   - [ ] Spotlight mode
4. [ ] Verify animations are smooth (no stuttering)
5. [ ] Check FPS in console (if displayed)

**Expected Result:** Visualizations animate smoothly

---

## 🎨 UI/UX Tests

### Settings Panel (3 minutes)
1. [ ] Open settings panel (gear icon or similar)
2. [ ] Try changing AI provider (if available)
3. [ ] Try changing language (Korean ↔ English)
4. [ ] Try changing persona
5. [ ] Verify changes are applied
6. [ ] Check console for errors

### Responsive Design (3 minutes)
1. [ ] Open DevTools (F12)
2. [ ] Click "Toggle Device Toolbar" (Ctrl+Shift+M)
3. [ ] Test different screen sizes:
   - [ ] Mobile (375x667)
   - [ ] Tablet (768x1024)
   - [ ] Desktop (1920x1080)
4. [ ] Verify layout adjusts properly
5. [ ] Verify no horizontal scrolling
6. [ ] Verify buttons are clickable

---

## ⚠️ Error Handling Tests

### Invalid Input Tests (5 minutes)
1. [ ] Try uploading a non-audio file (e.g., .txt)
   - Expected: Error message displayed
2. [ ] Try entering invalid YouTube URL
   - Expected: Error message displayed
3. [ ] Try uploading very large audio file (> 5 minutes)
   - Expected: Error message about duration limit
4. [ ] Check that error messages are user-friendly

---

## 📊 Performance Tests

### Memory & Performance (5 minutes)
1. [ ] Open DevTools → Performance tab
2. [ ] Start recording
3. [ ] Perform several operations:
   - Upload audio
   - Generate poetry
   - Switch visualization modes
4. [ ] Stop recording
5. [ ] Check for:
   - [ ] FPS stays near 60
   - [ ] No long tasks (> 50ms)
   - [ ] Memory doesn't grow excessively

### Console Warnings (2 minutes)
1. [ ] Review all console messages
2. [ ] Note any warnings (yellow text)
3. [ ] Acceptable warnings:
   - DevTools extensions
   - Third-party library warnings
4. [ ] Not acceptable:
   - React errors
   - Failed network requests (except 403 from Lambda)
   - Uncaught exceptions

---

## ✅ Final Checks

### Before Marking Complete
- [ ] No critical errors in console
- [ ] Core features work (audio, poetry, visualization)
- [ ] UI is responsive and looks correct
- [ ] No obvious bugs or broken features
- [ ] Performance is acceptable (smooth animations)

### Known Issues to Ignore
- ✅ Lambda API 403 errors (expected without AWS credentials)
- ✅ CORS warnings (expected in local testing)
- ✅ DevTools extension warnings

---

## 📝 Test Results

**Date:** ___________  
**Tester:** ___________  
**Browser:** ___________  
**OS:** ___________

### Summary
- Tests Passed: _____ / _____
- Critical Issues: _____
- Minor Issues: _____
- Overall Status: ⬜ PASS / ⬜ FAIL

### Notes
```
[Add any observations, issues, or comments here]
```

---

## 🚀 Next Steps

If all tests pass:
1. ✅ Mark task 2.3 as complete
2. ➡️ Proceed to task 2.4 (Add GitHub Secrets)
3. ➡️ Continue with GitHub Actions workflow setup

If tests fail:
1. ❌ Document issues in test report
2. 🔧 Fix identified issues
3. 🔄 Re-run tests
4. ✅ Mark complete when all tests pass

---

**Quick Access:**
- Preview URL: http://localhost:4173
- Test Report: PRODUCTION_BUILD_TEST_REPORT.md
- Stop Server: Press Ctrl+C in the terminal running `npm run preview`
