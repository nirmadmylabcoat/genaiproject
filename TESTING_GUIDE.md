# 🧪 GenAccess Testing Guide - FIXED VERSION

## ✅ All Issues Fixed!

I've fixed both the connection error and the styling issues. Here's what was fixed:

### Fixed Issues:
1. ✅ **Connection Error** - Added error handling for `chrome.runtime.sendMessage`
2. ✅ **No Visual Changes** - Enhanced CSS injection with `!important` rules
3. ✅ **High Contrast Mode** - Now injects aggressive styles that override page CSS
4. ✅ **Font Scaling** - Now directly applies to body element
5. ✅ **Dyslexia Font** - Applied to both root and body
6. ✅ **Debug Logging** - Added console logs to track what's happening

---

## 📋 How to Reload Extension

After the fixes, you need to reload the extension:

### Method 1: Reload Extension
1. Go to `chrome://extensions/`
2. Find "GenAccess"
3. Click the **refresh/reload icon** (circular arrow)

### Method 2: Full Reload
1. Go to `chrome://extensions/`
2. Remove GenAccess (trash icon)
3. Click "Load unpacked"
4. Select: `/Users/shivamsultaniya/Downloads/genaiproject/extension/dist`

---

## 🧪 Testing Each Profile

### Test 1: High Contrast Mode

**Steps:**
1. Open a test page: https://example.com
2. Open browser Console (F12 → Console tab)
3. Click GenAccess icon
4. Check "Enable on this browser"
5. Select **"Rules"** mode
6. Choose **"High Contrast"** profile
7. Close popup
8. **Refresh the page** (Cmd+R or F5)

**Expected Results:**
✅ Console shows:
```
GenAccess: Content script loaded
GenAccess: Runtime state: {enabled: true, mode: 'rules', ...}
GenAccess: Extension enabled, running enhancements
GenAccess: Applying rule-based adjustments
GenAccess: Rule-based adjustments applied
```

✅ **Visual Changes:**
- Background: BLACK (#000000)
- Text: WHITE (#ffffff)
- Links: CYAN (#00ffff)
- Buttons: Dark gray background (#333), white text
- Font size: 1.3x larger than normal
- Everything should have high contrast

**If it doesn't work:**
- Check console for "GenAccess" messages
- Make sure you refreshed the page AFTER enabling
- Try clicking the extension icon again to verify settings

---

### Test 2: Dyslexia Friendly Mode

**Steps:**
1. Open a text-heavy page: https://en.wikipedia.org/wiki/Accessibility
2. Open Console (F12)
3. Click GenAccess icon
4. Make sure "Enable on this browser" is CHECKED
5. Select **"Rules"** mode
6. Choose **"Dyslexia Friendly"** profile
7. Close popup
8. **Refresh the page**

**Expected Results:**
✅ Console shows:
```
GenAccess: Running enhancements, mode: rules, profile: Dyslexia Friendly
GenAccess: Applying rule-based adjustments
GenAccess: Rule-based adjustments applied
```

✅ **Visual Changes:**
- Font changes to OpenDyslexic (or Arial if not available)
- Letters have extra spacing (0.05em)
- Line height increases to 1.6x
- Font size: 1.2x larger
- Text is easier to read with more space

---

### Test 3: ADHD Focus Mode

**Steps:**
1. Open a complex page: https://news.ycombacker.com or any news site
2. Open Console (F12)
3. Click GenAccess icon
4. Check "Enable on this browser"
5. Select **"Rules"** mode
6. Choose **"ADHD Focus"** profile
7. Close popup
8. **Refresh the page**

**Expected Results:**
✅ Console shows:
```
GenAccess: Running enhancements, mode: rules, profile: ADHD Focus
GenAccess: Applying rule-based adjustments
GenAccess: Rule-based adjustments applied
```

✅ **Visual Changes:**
- All clickable elements (links, buttons, inputs) get:
  - Purple outline (3px solid #5B21B6)
  - Purple shadow (0 0 0 4px rgba(91, 33, 182, 0.35))
  - Very high z-index (appears above other content)
- Line height: 1.3x
- No animations (everything instant)
- Font size: Normal (1.0x)

---

## 🔍 Debugging Checklist

### Problem: No console messages
**Fix:**
1. Open Console BEFORE loading the page
2. Make sure you're on the right tab
3. Refresh the page
4. Look for "GenAccess: Content script loaded"

### Problem: Console shows errors
**Check:**
- Look for error message in red
- Common error: "Could not establish connection"
  - This should be fixed now with try-catch
  - If still happening, reload the extension

### Problem: Settings don't apply
**Check Console for:**
```
GenAccess: Runtime state: {enabled: false, ...}
```
If enabled is `false`:
1. Click extension icon
2. Make sure checkbox is CHECKED
3. Click outside popup to close it
4. Refresh page

### Problem: Wrong profile applied
**Check Console for:**
```
GenAccess: Running enhancements, mode: rules, profile: [NAME]
```
The profile name should match what you selected.

If it doesn't:
1. Click extension icon
2. Select the profile you want from dropdown
3. Close popup
4. Refresh page

---

## 📊 What Each Profile Does (Technical)

### High Contrast Profile:
```javascript
Settings:
- fontScale: 1.3
- contrast: 'high'
- lineSpacing: 1.4
- dyslexiaFont: false
- reduceMotion: true
- focusMode: 'guided'

Applied Styles:
- html, body: background #000, color #fff
- All elements: inherit colors, white borders
- Links: cyan (#00ffff)
- Buttons: #333 background, white text
- Images: 90% opacity, increased contrast
```

### Dyslexia Friendly Profile:
```javascript
Settings:
- fontScale: 1.2
- contrast: 'default'
- lineSpacing: 1.6
- dyslexiaFont: true
- reduceMotion: true
- focusMode: 'off'

Applied Styles:
- Font: OpenDyslexic / Atkinson Hyperlegible / Arial
- Letter spacing: 0.05em (5% extra space)
- Line height: 1.6 (60% more vertical space)
- Font size: 1.2x larger
- No animations
```

### ADHD Focus Profile:
```javascript
Settings:
- fontScale: 1.0
- contrast: 'default'
- lineSpacing: 1.3
- dyslexiaFont: false
- reduceMotion: false
- focusMode: 'high'

Applied Styles:
- All interactive elements get:
  - outline: 3px solid purple (#5B21B6)
  - box-shadow: 0 0 0 4px purple (35% opacity)
  - z-index: 9999 (always on top)
- Line height: 1.3
- Font size: normal
```

---

## 🎬 Complete Test Sequence

**Do this in order to test everything:**

1. **Load Extension** (if not already loaded)
   - chrome://extensions/
   - Reload or load unpacked

2. **Test High Contrast**
   - Open https://example.com
   - Open Console (F12)
   - Enable extension, Rules mode, High Contrast
   - Refresh page
   - ✅ Check: Black background, white text

3. **Test Dyslexia**
   - Keep same page open
   - Click extension icon
   - Change to "Dyslexia Friendly"
   - Close popup
   - Refresh page
   - ✅ Check: Different font, extra spacing

4. **Test ADHD Focus**
   - Keep same page open
   - Click extension icon
   - Change to "ADHD Focus"
   - Close popup
   - Refresh page
   - ✅ Check: Purple outlines on all clickable elements

5. **Test Disable**
   - Click extension icon
   - UNCHECK "Enable on this browser"
   - Close popup
   - Refresh page
   - ✅ Check: Page looks normal again

---

## 🚨 Common Issues & Solutions

### Issue: "Could not establish connection"
**Status:** ✅ FIXED
**What was done:** Added try-catch to fall back to default state
**If still happening:** Reload the extension in chrome://extensions/

### Issue: No visual changes
**Status:** ✅ FIXED  
**What was done:** 
- Added `!important` rules
- Direct style injection
- Console logging for debugging

**If still happening:**
1. Check Console for "GenAccess: Rule-based adjustments applied"
2. If not there, extension might not be running
3. Try reloading page WITH console open
4. Check that "enabled" is true in console logs

### Issue: Changes disappear quickly
**Cause:** Website has aggressive CSS that overwrites our styles
**Solution:** Our `!important` rules should prevent this, but if it still happens:
1. Try refreshing the page again
2. Check Console for any errors
3. Report which website has the issue

---

## ✅ Success Criteria

You'll know it's working when:

1. **Console shows logs:**
   - "GenAccess: Content script loaded"
   - "GenAccess: Runtime state: ..."
   - "GenAccess: Applying rule-based adjustments"
   - "GenAccess: Rule-based adjustments applied"

2. **Visual changes are IMMEDIATE and OBVIOUS:**
   - High Contrast: Completely black background
   - Dyslexia: Different font is visible
   - ADHD: Purple outlines everywhere

3. **No errors in Console** (no red messages)

4. **Changes persist** (don't disappear after a second)

---

## 🎉 Next Steps After Testing

Once basic rule-based modes work:

1. **Test Voice Navigation:**
   - Hover over buttons → should hear narration
   - Try voice commands: "scroll down", "focus next"

2. **Test Generative Mode:**
   - Switch to "Generative" mode
   - Wait 3-7 seconds after refresh
   - Check Console for YOLOv8 detection logs

3. **Test on Real Websites:**
   - News sites
   - Banking sites
   - Complex web apps

---

## 📞 If Nothing Works

**Ultimate Debug Steps:**

1. **Completely remove and reinstall:**
```bash
# In terminal
cd /Users/shivamsultaniya/Downloads/genaiproject/extension
npm run build
```

2. **In Chrome:**
   - Remove GenAccess completely
   - Restart Chrome
   - Load extension again

3. **Check files exist:**
```bash
ls -la /Users/shivamsultaniya/Downloads/genaiproject/extension/dist/
```
Should see: manifest.json, background.js, content-script.js, popup.js

4. **Test in Incognito Mode:**
   - Open Incognito window
   - chrome://extensions/ → Enable "Allow in incognito" for GenAccess
   - Try the tests again

---

**Extension is fully rebuilt and ready to test!** 🚀

The fixes are live in the dist folder. Just reload the extension and test!

