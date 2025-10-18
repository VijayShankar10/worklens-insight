// ==========================================
// WORKLENS CONTENT SCRIPT - INTERACTION TRACKER
// ==========================================

let interactions = {
  clicks: 0,
  scrolls: 0,
  keystrokes: 0,
  mouseMovements: 0,
  lastActivity: Date.now(),
  activeTime: 0,
  idleTime: 0
};

let lastMousePosition = { x: 0, y: 0 };
let mouseMoveThreshold = 50; // pixels
let idleCheckInterval;
let activityInterval;

console.log('WorkLens: Content script loaded on', window.location.hostname);

// ==========================================
// INTERACTION LISTENERS
// ==========================================

// Track clicks
document.addEventListener('click', (e) => {
  interactions.clicks++;
  updateLastActivity();
}, { passive: true });

// Track scrolls
let scrollTimeout;
document.addEventListener('scroll', (e) => {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    interactions.scrolls++;
    updateLastActivity();
  }, 100); // Debounce
}, { passive: true });

// Track keystrokes (NOT content, just count)
document.addEventListener('keydown', (e) => {
  interactions.keystrokes++;
  updateLastActivity();
}, { passive: true });

// Track significant mouse movements
document.addEventListener('mousemove', (e) => {
  const distance = Math.sqrt(
    Math.pow(e.clientX - lastMousePosition.x, 2) + 
    Math.pow(e.clientY - lastMousePosition.y, 2)
  );
  
  if (distance > mouseMoveThreshold) {
    interactions.mouseMovements++;
    lastMousePosition = { x: e.clientX, y: e.clientY };
    updateLastActivity();
  }
}, { passive: true });

// ==========================================
// ACTIVITY TRACKING
// ==========================================

function updateLastActivity() {
  interactions.lastActivity = Date.now();
}

function checkIdleTime() {
  const now = Date.now();
  const timeSinceActivity = (now - interactions.lastActivity) / 1000; // seconds
  
  if (timeSinceActivity > 30) { // 30 seconds of no activity = idle
    interactions.idleTime += 1;
  } else {
    interactions.activeTime += 1;
  }
}

// Check idle status every second
idleCheckInterval = setInterval(checkIdleTime, 1000);

// Send interactions to background script every 10 seconds
activityInterval = setInterval(() => {
  if (interactions.clicks > 0 || interactions.scrolls > 0 || interactions.keystrokes > 0) {
    // Calculate engagement score (0-100)
    const engagementScore = calculateEngagementScore();
    
    chrome.runtime.sendMessage({
      type: 'INTERACTIONS_UPDATE',
      data: {
        ...interactions,
        engagementScore,
        url: window.location.href,
        title: document.title
      }
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('Message error:', chrome.runtime.lastError);
      }
    });
    
    console.log('Interactions sent:', interactions);
  }
}, 10000); // Every 10 seconds

// ==========================================
// ENGAGEMENT SCORING
// ==========================================

function calculateEngagementScore() {
  const total = interactions.clicks + 
                interactions.scrolls + 
                interactions.keystrokes + 
                (interactions.mouseMovements / 10);
  
  const activePercentage = interactions.activeTime > 0 
    ? (interactions.activeTime / (interactions.activeTime + interactions.idleTime)) * 100
    : 0;
  
  // Weighted score
  const activityScore = Math.min(total / 10, 50); // Max 50 points from actions
  const timeScore = Math.min(activePercentage / 2, 50); // Max 50 points from active time
  
  return Math.round(activityScore + timeScore);
}

// ==========================================
// CLEANUP
// ==========================================

window.addEventListener('beforeunload', () => {
  clearInterval(idleCheckInterval);
  clearInterval(activityInterval);
  
  // Send final interaction data
  chrome.runtime.sendMessage({
    type: 'INTERACTIONS_FINAL',
    data: {
      ...interactions,
      engagementScore: calculateEngagementScore()
    }
  });
});
