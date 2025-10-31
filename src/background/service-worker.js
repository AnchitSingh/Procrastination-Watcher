// src/background/service-worker.js - UPDATED

import { getActiveAlert, getWatcherSettings } from '../utils/storage.js';
import { analyzeActivity } from '../utils/chromeAI.js';

// Initialize alarm on extension install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Procrastination Watcher installed');
  
  // Request notification permission
  if (Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
});

// Listen for alarm
chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log('🔔 Alarm triggered:', alarm.name);
  if (alarm.name === 'checkActivity') {
    await checkUserActivity();
  }
});

// Main activity checker
async function checkUserActivity() {
  console.log('🔍 Starting activity check...');
  
  try {
    const alert = await getActiveAlert();
    
    if (!alert || !alert.enabled) {
      console.log('❌ No active alert, skipping check');
      return;
    }
    
    console.log('✅ Active alert:', alert);
    
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      console.log('❌ No active tab found');
      return;
    }
    
    console.log('📍 Current tab:', tab.url, tab.title);
    
    // Take screenshot
    console.log('📸 Capturing screenshot...');
    const screenshotDataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: 'png'
    });
    console.log('✅ Screenshot captured, size:', screenshotDataUrl.length, 'chars');
    
    // Convert data URL to blob
    const blob = await dataUrlToBlob(screenshotDataUrl);
    console.log('✅ Blob created, size:', blob.size, 'bytes');
    
    // Analyze with AI
    console.log('🧠 Sending to AI for analysis...');
    const analysis = await analyzeActivity({
      userGoal: alert.goal,
      tabUrl: tab.url,
      tabTitle: tab.title,
      screenshot: blob
    });
    
    console.log('📊 Analysis result:', analysis);
    
    // ALWAYS send notification for testing (remove this after debugging)
    const notificationOptions = {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icon.png'),
      title: analysis.onTrack ? '✅ On Track!' : '⚠️ Procrastination Detected',
      message: analysis.onTrack 
        ? `Great job! Keep working on: "${alert.goal}"\n\n${analysis.reason}`
        : `You said you'd: "${alert.goal}"\n\n${analysis.reason}`,
      priority: 2,
      requireInteraction: true  // Keep notification visible until dismissed
    };
    
    console.log('🔔 Creating notification:', notificationOptions);
    
    const notificationId = await chrome.notifications.create(
      `watcher_${Date.now()}`,
      notificationOptions
    );
    
    console.log('✅ Notification created with ID:', notificationId);
    
    // Alternative: Try browser notification API as fallback
    if (!notificationId) {
      console.log('⚠️ Chrome notification failed, trying browser API...');
      self.registration.showNotification(notificationOptions.title, {
        body: notificationOptions.message,
        icon: notificationOptions.iconUrl,
        requireInteraction: true
      });
    }
    
  } catch (error) {
    console.error('❌ Activity check failed:', error);
    
    // Send error notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icon.png'),
      title: '❌ Watcher Error',
      message: `Error: ${error.message}`
    });
  }
}

// Helper: Convert data URL to Blob
async function dataUrlToBlob(dataUrl) {
  const response = await fetch(dataUrl);
  return await response.blob();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Message received:', message);
  
  if (message.type === 'START_WATCHING') {
    const interval = message.interval || 3;
    console.log(`🚀 Starting watcher with ${interval} minute interval`);
    
    // Clear existing alarm
    chrome.alarms.clear('checkActivity', (wasCleared) => {
      console.log('Cleared existing alarm:', wasCleared);
    });
    
    // Create new alarm
    chrome.alarms.create('checkActivity', {
      periodInMinutes: interval
    });
    
    // Verify alarm was created
    chrome.alarms.get('checkActivity', (alarm) => {
      console.log('✅ Alarm created:', alarm);
    });
    
    // Run immediate check
    console.log('⚡ Running immediate check...');
    checkUserActivity();
    
    sendResponse({ success: true });
  }
  
  if (message.type === 'STOP_WATCHING') {
    console.log('⏸️ Stopping watcher');
    chrome.alarms.clear('checkActivity');
    sendResponse({ success: true });
  }
  
  if (message.type === 'TEST_NOTIFICATION') {
    console.log('🧪 Testing notification...');
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icon.png'),
      title: 'Test Notification',
      message: 'If you see this, notifications are working!',
      priority: 2
    });
    sendResponse({ success: true });
  }
  
  return true; // Keep message channel open for async response
});

// Log when service worker starts
console.log('🚀 Procrastination Watcher service worker loaded');
