# 🚀 Complete Testing Steps - GenAccess Extension

## 📋 Quick Answer
- **Rules Mode (High Contrast, Dyslexia, ADHD)**: Works WITHOUT backend ✅
- **Generative Mode (AI-powered layout)**: Needs backend running ⚙️

---

## 🎯 OPTION 1: Test Rules Mode (Easiest - No Backend Needed)

This tests the accessibility features that work entirely in the browser.

### Step 1: Reload the Extension
```
1. Open Chrome
2. Go to: chrome://extensions/
3. Find "GenAccess"
4. Click the 🔄 REFRESH button (circular arrow icon)
```

### Step 2: Open a Test Page
```
1. Go to any website (e.g., https://example.com or https://news.ycombinator.com)
2. Press F12 to open DevTools Console
```

### Step 3: Enable the Extension
```
1. Click the GenAccess icon in Chrome toolbar (top-right)
2. Check ✅ "Enable on this browser"
3. Make sure "Rules" mode is selected (default)
4. Choose a profile from dropdown:
   - High Contrast
   - Dyslexia Friendly
   - ADHD Focus
5. Close the popup
6. Press Cmd+R (Mac) or F5 (Windows) to refresh the page
```

### Step 4: Verify It Works
**Console Output (F12):**
```
✅ GenAccess: Content script loaded
✅ GenAccess: Runtime state: {enabled: true, mode: 'rules', ...}
✅ GenAccess: Running enhancements
✅ GenAccess: Applying rule-based adjustments
✅ GenAccess: Rule-based adjustments applied
```

**Visual Changes:**

**High Contrast:**
- ⚫ Black background
- ⚪ White text
- 🔵 Cyan links (#00ffff)
- 📏 30% larger fonts

**Dyslexia Friendly:**
- 🔤 OpenDyslexic font
- 📐 Extra letter spacing
- 📊 Increased line height

**ADHD Focus:**
- 💜 Purple outlines on clickable elements
- 🎯 Focus indicators
- 🌟 Reduced visual clutter

---

## 🎯 OPTION 2: Test Full System (Backend + Extension)

This tests the AI-powered generative features that need the backend API.

### Step 1: Start the Backend (Python FastAPI)

**Open Terminal 1 (for backend):**
```bash
# Navigate to backend directory
cd /Users/shivamsultaniya/Downloads/genaiproject/backend

# Activate virtual environment
source venv/bin/activate

# Start the server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Wait for this message:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Verify backend is running:**
```
Open in browser: http://127.0.0.1:8000/docs
You should see the FastAPI Swagger documentation page
```

### Step 2: Load the Extension

**In Chrome:**
```
1. Go to: chrome://extensions/
2. Enable "Developer Mode" (top-right toggle)
3. Click "Load unpacked"
4. Select folder: /Users/shivamsultaniya/Downloads/genaiproject/extension/dist
5. The extension should appear with no errors
```

### Step 3: Test Rules Mode First
```
Follow "OPTION 1" steps above to verify rules mode works
```

### Step 4: Test Generative Mode
```
1. Click GenAccess icon
2. Check ✅ "Enable on this browser"
3. Select "Generative" mode (dropdown)
4. Close popup
5. Refresh the page (Cmd+R or F5)
```

**Expected Console Output:**
```
✅ GenAccess: Content script loaded
✅ GenAccess: Running generative pipeline
✅ Sending DOM tree to backend for detection...
✅ Applying generative layout transformations...
```

**Note:** The ML models are currently stubs, so generative mode won't show dramatic visual changes yet, but you'll see the API calls in the console and Network tab.

---

## 🔍 Troubleshooting

### ❌ "Cannot use 'import.meta' outside a module"
**Status:** ✅ FIXED
- This should no longer appear
- If it does, make sure you reloaded the extension (Step 1)

### ❌ Extension won't load
```
1. Check manifest.json exists in dist/ folder
2. Make sure all icons exist in dist/icons/
3. Look at the error message in chrome://extensions/
```

### ❌ Rules mode not working (no visual changes)
```
1. Make sure you checked "Enable on this browser"
2. Make sure you selected a profile (High Contrast, etc.)
3. REFRESH THE PAGE after changing settings
4. Check console for errors (F12)
```

### ❌ Backend won't start
```
# Make sure you're in the virtual environment
source venv/bin/activate

# Check if port 8000 is already in use
lsof -ti:8000

# If something is using port 8000, kill it:
kill -9 $(lsof -ti:8000)

# Try starting again
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### ❌ Backend connection errors in console
```
This is normal if you're testing Rules mode without the backend.
Rules mode works entirely client-side.

If you want to test Generative mode, make sure:
1. Backend is running (check http://127.0.0.1:8000/docs)
2. Extension is trying to connect to the right URL
```

---

## 📊 What Each Mode Does

### 🎨 Rules Mode (No Backend Required)
- Font scaling
- High contrast colors
- Dyslexia-friendly fonts
- ADHD focus indicators
- Line spacing adjustments
- Reduced motion
- Voice navigation (hover + speak)
- Text summarization (select + Alt+S)

### 🤖 Generative Mode (Requires Backend)
- AI-powered layout detection (YOLOv8)
- Generative UI restyling (CVAE)
- Intelligent element repositioning
- Adaptive accessibility enhancements
- **Note:** Models are currently stubs, so this will show API calls but minimal visual changes

---

## ✅ Success Checklist

### Rules Mode:
- [ ] Extension loads without errors
- [ ] Console shows "Content script loaded"
- [ ] High Contrast: Black bg, white text, cyan links
- [ ] Dyslexia: Special font applied
- [ ] ADHD: Purple outlines on buttons
- [ ] No "import.meta" errors

### Generative Mode (if testing with backend):
- [ ] Backend running at http://127.0.0.1:8000
- [ ] Extension connects to backend
- [ ] Console shows "Sending DOM tree to backend"
- [ ] Network tab shows API calls to localhost:8000

---

## 🎯 Recommended Testing Order

**For Quick Testing (5 minutes):**
1. Follow OPTION 1 (Rules Mode)
2. Test High Contrast on example.com
3. Done! ✅

**For Full Testing (15 minutes):**
1. Start backend (Terminal 1)
2. Verify backend at http://127.0.0.1:8000/docs
3. Load extension in Chrome
4. Test Rules Mode first
5. Test Generative Mode
6. Check console logs and Network tab

---

## 📞 Need Help?

If something doesn't work:
1. Check the console (F12) for error messages
2. Make sure you've reloaded the extension
3. Make sure you've refreshed the webpage after changing settings
4. Check that the backend is running (if using Generative mode)

## 📚 Additional Documentation
- `FIXED_IMPORT_META_ERROR.md` - Details about the import.meta fix
- `TESTING_GUIDE.md` - Comprehensive testing guide
- `QUICK_START.md` - Quick reference guide
- `LOAD_EXTENSION_GUIDE.md` - Extension loading instructions

---

**Start with OPTION 1 (Rules Mode) - it's the easiest way to verify everything is working!** 🚀
