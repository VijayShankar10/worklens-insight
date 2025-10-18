const SUPABASE_URL = 'https://whkwafghefyrgirmywvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indoa3dhZmdoZWZ5cmdpcm15d3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3OTY3ODQsImV4cCI6MjA3NjM3Mjc4NH0.MBN3CAp8Pfl6iL41q7O84OINpiz345Kpi5Jk-q6UnXo';
// Works with both local and production
const DASHBOARD_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:8080' 
  : 'https://worklens-productivity-analytics.vercel.app/';


// State management
let currentTab = null;
let startTime = null;
let employeeId = null;
let isTracking = false;
let isIdle = false;
let currentInteractions = {
  clicks: 0,
  scrolls: 0,
  keystrokes: 0,
  mouseMovements: 0,
  activeTime: 0,
  idleTime: 0,
  engagementScore: 0
};


// Clean up page titles - remove numbers in parentheses, extra spaces, etc.
function cleanTitle(title) {
  if (!title) return 'Untitled Page';
  
  return title
    .replace(/^\(\d+\)\s*/, '') // Remove (11139) at start
    .replace(/\s*-\s*YouTube$/, '') // Remove " - YouTube" suffix
    .replace(/\s*\|\s*.*$/, '') // Remove everything after |
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim()
    .substring(0, 200); // Limit to 200 characters
}

// Load settings from storage
chrome.storage.sync.get(['employeeId', 'isTracking'], (result) => {
  employeeId = result.employeeId;
  isTracking = result.isTracking || false;
  console.log('WorkLens initialized:', { employeeId, isTracking });
});

// Idle detection
chrome.idle.setDetectionInterval(15);

chrome.idle.onStateChanged.addListener((state) => {
  console.log('Idle state changed:', state);
  
  if (state === 'idle' || state === 'locked') {
    if (currentTab && !isIdle) {
      logActivity(currentTab, true);
      isIdle = true;
    }
  } else if (state === 'active') {
    isIdle = false;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        startTracking(tabs[0]);
      }
    });
  }
});

// Track tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (!isTracking || isIdle) return;
  
  if (currentTab) {
    await logActivity(currentTab, false);
  }
  
  const tab = await chrome.tabs.get(activeInfo.tabId);
  startTracking(tab);
});

// Track URL changes
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!isTracking || isIdle) return;
  
  if (changeInfo.status === 'complete' && tab.active) {
    if (currentTab) {
      await logActivity(currentTab, false);
    }
    startTracking(tab);
  }
});

// Track window focus
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (!isTracking) return;
  
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    if (currentTab && !isIdle) {
      await logActivity(currentTab, true);
      currentTab = null;
    }
  } else {
    const [tab] = await chrome.tabs.query({ active: true, windowId });
    if (tab) {
      startTracking(tab);
    }
  }
});

function startTracking(tab) {
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    return;
  }
  
  try {
    const url = new URL(tab.url);
    currentTab = {
      url: tab.url,
      title: tab.title || url.hostname,
      domain: url.hostname,
    };
    startTime = Date.now();
    console.log('Started tracking:', currentTab.domain);
  } catch (error) {
    console.error('Invalid URL:', tab.url);
  }
}

async function logActivity(tab, wasInterrupted = false) {
  if (!employeeId || !startTime) return;
  
  const duration = Math.floor((Date.now() - startTime) / 1000);
  
  if (duration < 5) {
    console.log('Activity too short, skipping:', duration);
    resetInteractions();
    return;
  }
  
  const category = await getDomainCategory(tab.domain);
  
  const activity = {
    employee_id: employeeId,
    url: tab.url.substring(0, 500),
    domain: tab.domain,
    title: cleanTitle(tab.title),
    category: category,
    duration: duration,
    timestamp: new Date().toISOString(),
    // NEW: Add interaction metrics
    clicks: currentInteractions.clicks,
    scrolls: currentInteractions.scrolls,
    keystrokes: currentInteractions.keystrokes,
    mouse_movements: currentInteractions.mouseMovements,
    active_time: currentInteractions.activeTime,
    idle_time: currentInteractions.idleTime,
    engagement_score: currentInteractions.engagementScore
  };
  
  if (wasInterrupted) {
    activity.title = `[Interrupted] ${activity.title}`;
  }
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(activity)
    });
    
    if (response.ok) {
      console.log('✓ Activity logged:', {
        domain: activity.domain,
        duration: `${duration}s`,
        category,
        engagement: `${activity.engagement_score}%`,
        clicks: activity.clicks,
        keystrokes: activity.keystrokes
      });
      
      resetInteractions();
    } else {
      console.error('Failed to log activity:', response.status);
    }
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

function resetInteractions() {
  currentInteractions = {
    clicks: 0,
    scrolls: 0,
    keystrokes: 0,
    mouseMovements: 0,
    activeTime: 0,
    idleTime: 0,
    engagementScore: 0
  };
}

async function getDomainCategory(domain) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/domains?domain=eq.${domain}&select=category`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );
    
    const data = await response.json();
    return data.length > 0 ? data[0].category : 'neutral';
  } catch (error) {
    console.error('Error fetching domain category:', error);
    return 'neutral';
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.type === 'INTERACTIONS_UPDATE') {
    // Update current interactions
    currentInteractions = {
      clicks: request.data.clicks,
      scrolls: request.data.scrolls,
      keystrokes: request.data.keystrokes,
      mouseMovements: request.data.mouseMovements,
      activeTime: request.data.activeTime,
      idleTime: request.data.idleTime,
      engagementScore: request.data.engagementScore
    };
    
    console.log('Interactions updated:', currentInteractions);
    sendResponse({ success: true });
  }
  
  if (request.type === 'INTERACTIONS_FINAL') {
    // Final interaction data before tab closes
    currentInteractions = request.data;
    sendResponse({ success: true });
  }

  if (request.action === 'setEmployee') {
    employeeId = request.employeeId;
    chrome.storage.sync.set({ employeeId });
    sendResponse({ success: true });
  }
  
  if (request.action === 'toggleTracking') {
    isTracking = request.isTracking;
    chrome.storage.sync.set({ isTracking });
    
    if (!isTracking && currentTab) {
      logActivity(currentTab, false);
      currentTab = null;
      startTime = null;
    }
    
    sendResponse({ success: true, isTracking });
  }
  
  if (request.action === 'getStatus') {
    sendResponse({
      isTracking,
      employeeId,
      currentDomain: currentTab?.domain || null,
      isIdle
    });
  }
  
  return true;
});

console.log('WorkLens Extension loaded!');
