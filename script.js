/**
 * Dog Walking Tracker - Main JavaScript File
 * Author: AI Assistant
 * Date: 2025-01-28
 * Description: Manages the single-page application functionality for tracking dog walks
 */

// ===== GLOBAL STATE ===== //

let appState = {
    dogs: [],
    walks: [],
    currentWalk: null,
    activeTimer: null,
    currentPage: 'dashboard',
    isWalking: false,
    startTime: null,
    elapsedTime: 0,
    walkingDog: null
};

// Sample data for development (will be replaced with localStorage later)
const sampleDogs = [
    {
        id: 1,
        name: "Buddy",
        breed: "Golden Retriever",
        age: 3,
        weight: "65 lbs",
        notes: "Loves fetch and swimming",
        avatar: "🐕"
    },
    {
        id: 2,
        name: "Luna",
        breed: "Border Collie",
        age: 2,
        weight: "45 lbs",
        notes: "Very energetic, needs long walks",
        avatar: "🐶"
    }
];

const sampleWalks = [
    {
        id: 1,
        dogId: 1,
        dogName: "Buddy",
        duration: 1800, // 30 minutes in seconds
        date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        notes: "Great walk in the park, met other dogs"
    },
    {
        id: 2,
        dogId: 2,
        dogName: "Luna",
        duration: 2700, // 45 minutes in seconds
        date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        notes: "High energy walk, lots of running"
    }
];

// ===== UTILITY FUNCTIONS ===== //

/**
 * Format seconds into HH:MM:SS format
 * @param {number} seconds - The number of seconds to format
 * @returns {string} Formatted time string
 */
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format duration in a human-readable way
 * @param {number} seconds - Duration in seconds
 * @returns {string} Human-readable duration
 */
function formatDuration(seconds) {
    if (seconds < 60) {
        return `${seconds}s`;
    } else if (seconds < 3600) {
        return `${Math.floor(seconds / 60)}m`;
    } else {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
}

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString();
    }
}

/**
 * Generate unique ID for new items
 * @returns {number} Unique ID
 */
function generateId() {
    return Date.now() + Math.random();
}

/**
 * Show loading screen
 */
function showLoading() {
    document.getElementById('loading').style.display = 'block';
}

/**
 * Hide loading screen
 */
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

/**
 * Show a specific page and hide others
 * @param {string} pageId - The page to show
 */
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show the requested page
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
        appState.currentPage = pageId;
    }
    
    // Update navigation
    updateNavigation(pageId);
    
    // Refresh page content
    refreshPageContent(pageId);
}

/**
 * Update navigation active state
 * @param {string} activePageId - The currently active page
 */
function updateNavigation(activePageId) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[data-page="${activePageId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

/**
 * Refresh content for the current page
 * @param {string} pageId - The page to refresh
 */
function refreshPageContent(pageId) {
    switch (pageId) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'dogs':
            updateDogsPage();
            break;
        case 'walk':
            updateWalkPage();
            break;
        case 'history':
            updateHistoryPage();
            break;
    }
}

// ===== DATA MANAGEMENT ===== //

/**
 * Load data from localStorage or use sample data
 */
function loadData() {
    try {
        const savedDogs = localStorage.getItem('dogWalker_dogs');
        const savedWalks = localStorage.getItem('dogWalker_walks');
        
        appState.dogs = savedDogs ? JSON.parse(savedDogs) : sampleDogs;
        appState.walks = savedWalks ? JSON.parse(savedWalks) : sampleWalks;
    } catch (error) {
        console.error('Error loading data:', error);
        appState.dogs = sampleDogs;
        appState.walks = sampleWalks;
    }
}

/**
 * Save data to localStorage
 */
function saveData() {
    try {
        localStorage.setItem('dogWalker_dogs', JSON.stringify(appState.dogs));
        localStorage.setItem('dogWalker_walks', JSON.stringify(appState.walks));
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

/**
 * Add a new dog
 * @param {Object} dogData - Dog information
 */
function addDog(dogData) {
    const newDog = {
        id: generateId(),
        ...dogData,
        avatar: dogData.avatar || '🐕'
    };
    
    appState.dogs.push(newDog);
    saveData();
    updateDogsPage();
    updateWalkPage(); // Update dog selection dropdown
}

/**
 * Add a new walk record
 * @param {Object} walkData - Walk information
 */
function addWalk(walkData) {
    const newWalk = {
        id: generateId(),
        date: new Date().toISOString(),
        ...walkData
    };
    
    appState.walks.push(newWalk);
    saveData();
    updateDashboard();
    updateHistoryPage();
}

// ===== DASHBOARD FUNCTIONS ===== //

/**
 * Update dashboard statistics and content
 */
function updateDashboard() {
    const totalWalks = appState.walks.length;
    const thisWeek = getWalksThisWeek();
    const avgDuration = getAverageDuration();
    
    document.getElementById('total-walks').textContent = totalWalks;
    document.getElementById('this-week').textContent = thisWeek;
    document.getElementById('avg-duration').textContent = formatDuration(avgDuration);
    
    updateRecentWalks();
}

/**
 * Get number of walks this week
 * @returns {number} Number of walks this week
 */
function getWalksThisWeek() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return appState.walks.filter(walk => 
        new Date(walk.date) > oneWeekAgo
    ).length;
}

/**
 * Calculate average walk duration
 * @returns {number} Average duration in seconds
 */
function getAverageDuration() {
    if (appState.walks.length === 0) return 0;
    
    const totalDuration = appState.walks.reduce((sum, walk) => sum + walk.duration, 0);
    return Math.floor(totalDuration / appState.walks.length);
}

/**
 * Update recent walks display
 */
function updateRecentWalks() {
    const container = document.getElementById('recent-walks');
    const recentWalks = appState.walks
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    if (recentWalks.length === 0) {
        container.innerHTML = '<p class="empty-state">No walks yet. Start your first walk!</p>';
        return;
    }
    
    container.innerHTML = recentWalks.map(walk => `
        <div class="walk-item">
            <div class="walk-info">
                <strong>${walk.dogName}</strong>
                <span class="walk-duration">${formatDuration(walk.duration)}</span>
            </div>
            <div class="walk-date">${formatDate(walk.date)}</div>
        </div>
    `).join('');
}

// ===== DOGS PAGE FUNCTIONS ===== //

/**
 * Update dogs page content
 */
function updateDogsPage() {
    const container = document.getElementById('dogs-list');
    
    if (appState.dogs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🐕</div>
                <h3>No dogs added yet</h3>
                <p>Add your first dog to start tracking walks</p>
                <button class="btn btn-primary" data-action="add-dog">Add Your First Dog</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = appState.dogs.map(dog => `
        <div class="dog-card">
            <div class="dog-avatar">${dog.avatar}</div>
            <div class="dog-info">
                <h3>${dog.name}</h3>
                <p class="dog-breed">${dog.breed}</p>
                <p class="dog-details">Age: ${dog.age} | Weight: ${dog.weight}</p>
                ${dog.notes ? `<p class="dog-notes">${dog.notes}</p>` : ''}
            </div>
            <div class="dog-actions">
                <button class="btn btn-primary" data-action="start-walk" data-dog-id="${dog.id}">
                    Walk ${dog.name}
                </button>
            </div>
        </div>
    `).join('');
}

// ===== WALK TIMER FUNCTIONS ===== //

/**
 * Update walk page content
 */
function updateWalkPage() {
    updateDogSelection();
    updateTimerDisplay();
}

/**
 * Update dog selection dropdown
 */
function updateDogSelection() {
    const select = document.getElementById('walk-dog-select');
    
    select.innerHTML = '<option value="">Select a dog...</option>' +
        appState.dogs.map(dog => 
            `<option value="${dog.id}">${dog.name} (${dog.breed})</option>`
        ).join('');
}

/**
 * Start a walk
 * @param {number} dogId - ID of the dog to walk
 */
function startWalk(dogId = null) {
    const selectedDogId = dogId || document.getElementById('walk-dog-select').value;
    
    if (!selectedDogId) {
        alert('Please select a dog first!');
        return;
    }
    
    const dog = appState.dogs.find(d => d.id == selectedDogId);
    if (!dog) {
        alert('Dog not found!');
        return;
    }
    
    appState.isWalking = true;
    appState.walkingDog = dog;
    appState.startTime = Date.now();
    appState.elapsedTime = 0;
    
    // Update UI
    document.getElementById('start-walk-btn').style.display = 'none';
    document.getElementById('pause-walk-btn').style.display = 'inline-flex';
    document.getElementById('stop-walk-btn').style.display = 'inline-flex';
    document.getElementById('timer-status').textContent = `Walking with ${dog.name}`;
    
    // Start timer
    appState.activeTimer = setInterval(updateTimer, 1000);
    
    // Switch to walk page if not already there
    if (appState.currentPage !== 'walk') {
        showPage('walk');
    }
}

/**
 * Pause/resume a walk
 */
function toggleWalk() {
    if (appState.activeTimer) {
        // Pause
        clearInterval(appState.activeTimer);
        appState.activeTimer = null;
        document.getElementById('pause-walk-btn').innerHTML = 
            '<span class="btn-icon">▶️</span> Resume';
        document.getElementById('timer-status').textContent = 'Walk paused';
    } else {
        // Resume
        appState.startTime = Date.now() - (appState.elapsedTime * 1000);
        appState.activeTimer = setInterval(updateTimer, 1000);
        document.getElementById('pause-walk-btn').innerHTML = 
            '<span class="btn-icon">⏸️</span> Pause';
        document.getElementById('timer-status').textContent = 
            `Walking with ${appState.walkingDog.name}`;
    }
}

/**
 * Stop a walk and save it
 */
function stopWalk() {
    if (!appState.isWalking) return;
    
    // Stop timer
    if (appState.activeTimer) {
        clearInterval(appState.activeTimer);
        appState.activeTimer = null;
    }
    
    // Calculate final duration
    const duration = appState.elapsedTime;
    const notes = document.getElementById('walk-notes-input').value.trim();
    
    // Save walk
    addWalk({
        dogId: appState.walkingDog.id,
        dogName: appState.walkingDog.name,
        duration: duration,
        notes: notes
    });
    
    // Reset state
    appState.isWalking = false;
    appState.walkingDog = null;
    appState.startTime = null;
    appState.elapsedTime = 0;
    
    // Reset UI
    document.getElementById('start-walk-btn').style.display = 'inline-flex';
    document.getElementById('pause-walk-btn').style.display = 'none';
    document.getElementById('stop-walk-btn').style.display = 'none';
    document.getElementById('walk-timer').textContent = '00:00:00';
    document.getElementById('timer-status').textContent = 'Ready to start';
    document.getElementById('walk-notes-input').value = '';
    document.getElementById('pause-walk-btn').innerHTML = 
        '<span class="btn-icon">⏸️</span> Pause';
    
    // Show completion message
    alert(`Walk completed! Duration: ${formatDuration(duration)}`);
    
    // Switch to dashboard
    showPage('dashboard');
}

/**
 * Update timer display
 */
function updateTimer() {
    if (!appState.isWalking || !appState.startTime) return;
    
    appState.elapsedTime = Math.floor((Date.now() - appState.startTime) / 1000);
    document.getElementById('walk-timer').textContent = formatTime(appState.elapsedTime);
}

/**
 * Update timer display without a walk in progress
 */
function updateTimerDisplay() {
    if (!appState.isWalking) {
        document.getElementById('walk-timer').textContent = '00:00:00';
        document.getElementById('timer-status').textContent = 'Ready to start';
    }
}

// ===== HISTORY PAGE FUNCTIONS ===== //

/**
 * Update history page content
 */
function updateHistoryPage() {
    const container = document.getElementById('history-list');
    const filterSelect = document.getElementById('history-filter');
    
    // Update filter options
    updateHistoryFilter();
    
    // Get filtered walks
    const filteredWalks = getFilteredWalks();
    
    if (filteredWalks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3>No walks recorded yet</h3>
                <p>Start your first walk to see it here</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredWalks.map(walk => `
        <div class="history-item">
            <div class="walk-main-info">
                <div class="walk-dog-name">${walk.dogName}</div>
                <div class="walk-duration">${formatDuration(walk.duration)}</div>
            </div>
            <div class="walk-date">${formatDate(walk.date)}</div>
            ${walk.notes ? `<div class="walk-notes">${walk.notes}</div>` : ''}
        </div>
    `).join('');
}

/**
 * Update history filter dropdown
 */
function updateHistoryFilter() {
    const select = document.getElementById('history-filter');
    const currentValue = select.value;
    
    select.innerHTML = '<option value="all">All Dogs</option>' +
        appState.dogs.map(dog => 
            `<option value="${dog.id}">${dog.name}</option>`
        ).join('');
    
    // Restore previous selection if valid
    if (currentValue && document.querySelector(`option[value="${currentValue}"]`)) {
        select.value = currentValue;
    }
}

/**
 * Get filtered walks based on current filter settings
 * @returns {Array} Filtered walks
 */
function getFilteredWalks() {
    const filterValue = document.getElementById('history-filter').value;
    const searchValue = document.getElementById('history-search').value.toLowerCase();
    
    let filteredWalks = appState.walks;
    
    // Filter by dog
    if (filterValue && filterValue !== 'all') {
        filteredWalks = filteredWalks.filter(walk => walk.dogId == filterValue);
    }
    
    // Filter by search term
    if (searchValue) {
        filteredWalks = filteredWalks.filter(walk => 
            walk.dogName.toLowerCase().includes(searchValue) ||
            (walk.notes && walk.notes.toLowerCase().includes(searchValue))
        );
    }
    
    // Sort by date (newest first)
    return filteredWalks.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// ===== EVENT HANDLERS ===== //

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            showPage(page);
        });
    });
    
    // Walk timer controls
    document.getElementById('start-walk-btn').addEventListener('click', () => startWalk());
    document.getElementById('pause-walk-btn').addEventListener('click', toggleWalk);
    document.getElementById('stop-walk-btn').addEventListener('click', stopWalk);
    
    // History page controls
    document.getElementById('history-filter').addEventListener('change', updateHistoryPage);
    document.getElementById('history-search').addEventListener('input', updateHistoryPage);
    
    // Action buttons (using event delegation for dynamic content)
    document.addEventListener('click', (e) => {
        const action = e.target.getAttribute('data-action');
        const dogId = e.target.getAttribute('data-dog-id');
        
        switch (action) {
            case 'start-walk':
                if (dogId) {
                    startWalk(parseInt(dogId));
                } else {
                    showPage('walk');
                }
                break;
            case 'add-dog':
                // TODO: Implement add dog modal in future tasks
                alert('Add dog functionality will be implemented in the next task!');
                break;
        }
    });
}

// ===== INITIALIZATION ===== //

/**
 * Initialize the application
 */
function initializeApp() {
    console.log('Initializing Dog Walking Tracker...');
    
    // Show loading
    showLoading();
    
    // Simulate loading delay (remove in production)
    setTimeout(() => {
        // Load data
        loadData();
        
        // Initialize event listeners
        initializeEventListeners();
        
        // Show initial page
        showPage('dashboard');
        
        // Hide loading
        hideLoading();
        
        console.log('App initialized successfully!');
    }, 1000);
}

// ===== START THE APP ===== //

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Export functions for debugging (development only)
if (typeof window !== 'undefined') {
    window.dogWalkerApp = {
        appState,
        showPage,
        startWalk,
        stopWalk,
        addDog,
        loadData,
        saveData
    };
} 