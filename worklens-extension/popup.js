const SUPABASE_URL = 'https://whkwafghefyrgirmywvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indoa3dhZmdoZWZ5cmdpcm15d3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3OTY3ODQsImV4cCI6MjA3NjM3Mjc4NH0.MBN3CAp8Pfl6iL41q7O84OINpiz345Kpi5Jk-q6UnXo';

const statusDiv = document.getElementById('status');
const statusText = document.querySelector('.status-text');
const employeeSelect = document.getElementById('employeeSelect');
const startStopBtn = document.getElementById('startStopBtn');
const dashboardBtn = document.getElementById('dashboardBtn');
const currentActivityDiv = document.getElementById('currentActivity');
const currentDomainSpan = document.getElementById('currentDomain');
const todayStatsDiv = document.getElementById('todayStats');
const totalActivitiesSpan = document.getElementById('totalActivities');
const productivityScoreSpan = document.getElementById('productivityScore');

let isTracking = false;
let selectedEmployeeId = null;

async function init() {
  console.log('Initializing popup...');
  await loadEmployees();
  await loadStatus();
  setupEventListeners();
  startStatusUpdater();
}

async function loadEmployees() {
  try {
    console.log('Fetching employees from Supabase...');
    
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/employees?select=id,name,employee_code&is_active=eq.true&order=name.asc`,
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const employees = await response.json();
    console.log('Employees loaded:', employees);
    
    if (!employees || employees.length === 0) {
      console.warn('No employees found');
      employeeSelect.innerHTML = '<option value="">No employees found</option>';
      return;
    }
    
    employeeSelect.innerHTML = '<option value="">-- Select Employee --</option>';
    
    employees.forEach(emp => {
      const option = document.createElement('option');
      option.value = emp.id;
      option.textContent = `${emp.name} (${emp.employee_code})`;
      employeeSelect.appendChild(option);
    });
    
    console.log(`✓ Loaded ${employees.length} employees`);
    
  } catch (error) {
    console.error('Error loading employees:', error);
    employeeSelect.innerHTML = '<option value="">Error loading employees</option>';
    alert('Failed to load employees. Check console for details.');
  }
}

async function loadStatus() {
  chrome.storage.sync.get(['employeeId', 'isTracking'], (result) => {
    if (result.employeeId) {
      selectedEmployeeId = result.employeeId;
      employeeSelect.value = result.employeeId;
      loadTodayStats(result.employeeId);
    }
    
    isTracking = result.isTracking || false;
    updateUI();
  });
}

async function loadTodayStats(employeeId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/activities?employee_id=eq.${employeeId}&timestamp=gte.${today.toISOString()}&select=category`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );
    
    const activities = await response.json();
    const productive = activities.filter(a => a.category === 'productive').length;
    const total = activities.length;
    const score = total > 0 ? Math.round((productive / total) * 100) : 0;
    
    totalActivitiesSpan.textContent = total;
    productivityScoreSpan.textContent = `${score}%`;
    todayStatsDiv.style.display = 'block';
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

function setupEventListeners() {
  startStopBtn.addEventListener('click', toggleTracking);
  dashboardBtn.addEventListener('click', openDashboard);
  
  employeeSelect.addEventListener('change', (e) => {
    selectedEmployeeId = e.target.value;
    if (selectedEmployeeId) {
      chrome.runtime.sendMessage({ action: 'setEmployee', employeeId: selectedEmployeeId });
      loadTodayStats(selectedEmployeeId);
    }
  });
}

function toggleTracking() {
  if (!selectedEmployeeId) {
    alert('⚠️ Please select an employee first!');
    return;
  }
  
  isTracking = !isTracking;
  
  chrome.runtime.sendMessage(
    { action: 'toggleTracking', isTracking },
    (response) => {
      if (response && response.success) {
        chrome.storage.sync.set({ isTracking }, () => {
          updateUI();
          if (isTracking) {
            alert('✓ Tracking started! Browse normally.');
          }
        });
      }
    }
  );
}

function updateUI() {
  if (isTracking) {
    statusDiv.className = 'status active';
    statusText.textContent = 'Tracking Active';
    startStopBtn.textContent = 'Stop Tracking';
    startStopBtn.className = 'btn btn-primary stop';
    currentActivityDiv.style.display = 'block';
  } else {
    statusDiv.className = 'status inactive';
    statusText.textContent = 'Not Tracking';
    startStopBtn.textContent = 'Start Tracking';
    startStopBtn.className = 'btn btn-primary';
    currentActivityDiv.style.display = 'none';
  }
}

function startStatusUpdater() {
  setInterval(() => {
    if (isTracking) {
      chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
        if (response && response.currentDomain) {
          currentDomainSpan.textContent = response.currentDomain;
        }
      });
    }
  }, 2000);
}

function openDashboard() {
  chrome.tabs.create({ url: 'https://worklens-productivity-analytics.vercel.app/dashboard' });
}

document.addEventListener('DOMContentLoaded', init);
init();
