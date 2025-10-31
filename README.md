# 👀 Procrastination Watcher

> Context-aware productivity monitoring powered by Chrome's Built-in AI. Stay focused without compromising your privacy.

![Prompt API](https://img.shields.io/badge/Chrome-Prompt%20API-4285F4?style=flat&logo=google-chrome&logoColor=white)
![Privacy First](https://img.shields.io/badge/Privacy-100%25%20On--Device-green)



[Demo Video](#)

---

## The Problem

Traditional productivity tools are **context-blind**:
- Website blockers ban entire domains (blocking YouTube blocks tutorials too)
- Keyword filters can't tell "React tutorial" from "cat videos" on the same site
- Time trackers require manual categorization
- Cloud-based AI tools require uploading your browsing data

**Procrastination Watcher solves this** using Chrome's multimodal AI to *see* what you're viewing and understand if it aligns with your stated goal—entirely on-device.

---

## Features

- **Context-Aware Detection** - Analyzes screenshots to understand actual content, not just URLs
- **Privacy-First** - All processing happens on-device via Chrome's Gemini Nano. Zero server uploads
- **Multimodal Analysis** - Combines screenshot + URL + page title for intelligent decisions
- **Customizable Intervals** - Check every 2, 3, 5, or 10 minutes
- **Gentle Nudges** - Non-aggressive notifications when you drift off-task
- **Natural Language Goals** - Just describe what you're working on in plain English

---

## Getting Started


### Installation

#### Option 1: Pre-build extension for ready to use

Download the latest release from [Releases](https://github.com/AnchitSingh/Procrastination-Watcher/releases) and install in Chrome:
1. Extract the zip file
2. Go to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extracted folder


#### Option 2: Build from Source

```
# Clone repository
git clone https://github.com/AnchitSingh/Procrastination-Watcher.git
cd Procrastination-Watcher

# Install dependencies
npm install

# Build extension
npm run build

# Load in Chrome:
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the `dist` folder
```

---

## Usage

### 1. Set Your Goal

Click the extension icon and describe what you're working on:

```
"Study English grammar"
"Build React portfolio site"
"Research machine learning papers"
```

### 2. Choose Check Interval

Select how often to monitor (1-10 minutes). Shorter intervals = more responsive, but uses more resources.

### 3. Start Watching

The extension will:
- Capture screenshots of your active tab at set intervals
- Analyze screenshots + URL + title using on-device AI
- Send notifications if you're off-track

### 4. Stay Focused

When distracted, you'll receive a gentle notification like:

```
⚠️ Procrastination Detected
You said you'd: "Study English grammar"

Distraction. Cats are fun, but not grammar!
```

---

## Technical Architecture

### Stack

- **Frontend:** React 18 + Vite
- **Extension:** Chrome Manifest V3 (Service Worker)
- **AI:** Chrome Prompt API with Gemini Nano
- **APIs:** `tabs.captureVisibleTab`, `notifications`, `alarms`, `storage`

### How It Works

```
// 1. Capture screenshot every N minutes
const screenshot = await chrome.tabs.captureVisibleTab();
const blob = await dataUrlToBlob(screenshot);

// 2. Analyze with multimodal AI
const analysis = await analyzeActivity({
  userGoal: "Study React",
  tabUrl: tab.url,
  tabTitle: tab.title,
  screenshot: blob  // ← Multimodal input
});

// 3. Result
{
  onTrack: false,
  confidence: 90,
  reason: "YouTube cat videos are not React learning"
}

// 4. Send notification if distracted
if (!analysis.onTrack) {
  chrome.notifications.create({...});
}
```


---




## Roadmap

- [ ] Activity dashboard with stats (on-track %, distraction patterns)
- [ ] Break mode (scheduled distraction-allowed periods)
- [ ] Whitelist/blacklist for sites
- [ ] Confidence threshold customization
- [ ] Weekly reports and insights
- [ ] Multi-goal switching (Study/Work/Research modes)

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


---

<p align="center">
  <strong>👀 Procrastination Watcher</strong>
</p>

<p align="center">
  <i>Stay focused. Stay private. Stay in control.</i>
</p>

<p align="center">
  Built with ❤️ for the Chrome Built-in AI Challenge 2025
</p>
