// Common functions
async function fetchMatches() {
    try {
        // Use relative URL instead of hardcoded localhost URL
        const response = await fetch('/matches');
        return await response.json();
    } catch (error) {
        console.error('Error fetching matches:', error);
        return { matches: [] };
    }
}

async function saveMatches(matches) {
    try {
        // Use relative URL instead of hardcoded localhost URL
        const response = await fetch('/matches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(matches)
        });
        return await response.json();
    } catch (error) {
        console.error('Error saving matches:', error);
        return { success: false };
    }
}

// Keep other utility functions the same
function formatDate(dateString) {
    const options = { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    };
    return new Date(dateString).toLocaleString(undefined, options);
}

function getScoreDisplay(score) {
    if (!score || score === '') return '<span class="badge badge-outline">Upcoming</span>';
    return score;
}

function getSportIcon(sport) {
    switch(sport.toLowerCase()) {
        case 'football':
            return '⚽';
        case 'badminton':
            return '🏸';
        case 'chess':
            return '♟️';
        default:
            return '🎮';
    }
}

// Keep other helper functions the same
function formatDateShort(date) {
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
}

function formatTime(date) {
    const options = { hour: '2-digit', minute: '2-digit' };
    return date.toLocaleTimeString(undefined, options);
}

// Update admin functions to use correct API paths
function editMatch(matchId) {
    if (!matchId) {
        showToast('Invalid match ID provided', 'error');
        return;
    }

    // Use relative URL instead of hardcoded localhost URL
    fetch(`/match/${matchId}`)
        .then(response => {
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Match not found');
                }
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(match => {
            if (!match || !match._id) {
                throw new Error('Invalid match data received');
            }

            // Fill form data
            document.getElementById('sport').value = match.sport || '';
            document.getElementById('team1').value = match.team1 || '';
            document.getElementById('team2').value = match.team2 || '';
            document.getElementById('score').value = match.score || '';
            // Convert time to datetime-local format (YYYY-MM-DDTHH:MM)
            document.getElementById('time').value = match.time ? new Date(match.time).toISOString().slice(0, 16) : '';
            document.getElementById('round').value = match.round ? match.round.replace('Round ', '') : '';
            document.getElementById('match-form').dataset.matchId = match._id; // Save ID in dataset

            // Scroll to form and highlight
            const form = document.getElementById('match-form');
            form.scrollIntoView({ behavior: 'smooth' });
            const formCard = form.closest('.card');
            formCard.classList.add('border-2', 'border-primary');
            setTimeout(() => formCard.classList.remove('border-2', 'border-primary'), 1500);
        })
        .catch(error => {
            console.error('Error fetching match:', error);
            showToast(`Error: ${error.message}`, 'error');
        });
}

// Update form submission
document.getElementById('match-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get form data
    const sport = document.getElementById('sport').value;
    const team1 = document.getElementById('team1').value.trim();
    const team2 = document.getElementById('team2').value.trim();
    const score = document.getElementById('score').value.trim();
    const time = document.getElementById('time').value; // ISO format (YYYY-MM-DDTHH:MM)
    const round = `Round ${document.getElementById('round').value.trim()}`;

    // Validate form
    if (!sport || !team1 || !team2 || !time || isNaN(round.replace('Round ', ''))) {
        showToast('Please fill in all required fields correctly', 'warning');
        return;
    }

    const match = {
        sport,
        team1,
        team2,
        score,
        time: new Date(time).toISOString(), // Convert to full ISO format
        round,
        status: score ? 'Completed' : 'Upcoming' // Automatically update status
    };

    const matchId = document.getElementById('match-form').dataset.matchId;

    try {
        let response;
        if (matchId) {
            // Update match
            response = await fetch(`/match/${matchId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(match)
            });
        } else {
            // Add new match
            response = await fetch('/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(match)
            });
        }

        const result = await response.json();
        if (result.success) {
            showToast(matchId ? 'Match updated successfully' : 'New match added successfully', 'success');
            loadAdminMatches(getActiveTab()); // Reload list
            document.getElementById('match-form').reset(); // Clear form
            delete document.getElementById('match-form').dataset.matchId; // Remove matchId from dataset
        } else {
            showToast(`Error: ${result.error || 'Failed to save match'}`, 'error');
        }
    } catch (error) {
        console.error('Error saving match:', error);
        showToast(`Error saving match: ${error.message}`, 'error');
    }
});

async function loadAdminMatches(filter = 'all') {
    const data = await fetchMatches();
    const matchList = document.getElementById('admin-match-list');
    const noMatchesElement = document.getElementById('no-admin-matches');
    
    if (!matchList) return;
    matchList.innerHTML = '';

    // Check if data exists
    if (!data.matches || data.matches.length === 0) {
        if (noMatchesElement) noMatchesElement.classList.remove('hidden');
        console.log('No matches data available for admin');
        return;
    }

    // Filter by sport
    let filteredMatches = [...data.matches];
    if (filter !== 'all') {
        filteredMatches = filteredMatches.filter(match => match.sport === filter);
    }
    
    // Sort by date (newest first)
    filteredMatches.sort((a, b) => new Date(b.time) - new Date(a.time));

    if (filteredMatches.length === 0) {
        if (noMatchesElement) noMatchesElement.classList.remove('hidden');
        return;
    }
    
    if (noMatchesElement) noMatchesElement.classList.add('hidden');

    filteredMatches.forEach((match, index) => {
        const card = document.createElement('div');
        card.className = 'transition-colors duration-200 bg-white border border-gray-200 card hover:border-gray-300';
        
        const hasScore = match.score && match.score !== '';
        const statusClass = hasScore ? 'badge-success' : 'badge-warning';
        const statusText = hasScore ? 'Completed' : 'Upcoming';
        
        card.innerHTML = `
            <div class="card-body p-4">
                <div class="flex justify-between items-center mb-2">
                    <div>
                        <span class="badge ${statusClass} mr-2">${statusText}</span>
                        <span class="badge badge-outline">${match.sport}</span>
                    </div>
                    <div class="dropdown dropdown-end">
                        <div tabindex="0" class="btn btn-ghost btn-xs">⋮</div>
                        <ul tabindex="0" class="p-2 shadow menu dropdown-content z-[1] bg-base-100 rounded-box w-32">
                            <li><a onclick="editMatch('${match._id}')">Edit</a></li>
                            <li><a onclick="deleteMatch('${match._id}')" class="text-error">Delete</a></li>
                        </ul>
                    </div>
                </div>
                
                <h3 class="font-medium text-gray-800">${match.team1} vs ${match.team2}</h3>
                <div class="flex justify-between items-center mt-2 text-sm">
                    <p class="text-gray-600">${formatDate(match.time)}</p>
                    <p class="font-semibold">${getScoreDisplay(match.score)}</p>
                </div>
            </div>
        `;
        matchList.appendChild(card);
    });

    updateTabStyles(filter);
}

// Updated delete match function
function deleteMatch(matchId) {
    if (confirm('Are you sure you want to delete this match?')) {
        fetch(`/match/${matchId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                loadAdminMatches(getActiveTab());
                showToast('Match deleted successfully', 'success');
            } else {
                showToast('Error deleting match', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error deleting match', 'error');
        });
    }
}

// Keep other utility functions
function filterAdminMatches(sport) {
    loadAdminMatches(sport);
}

function searchAdminMatches() {
    const searchTerm = document.getElementById('admin-search')?.value.toLowerCase();
    if (!searchTerm) {
        loadAdminMatches(getActiveTab());
        return;
    }
    
    performSearch('admin-match-list', searchTerm);
}

function performSearch(listId, searchTerm) {
    const list = document.getElementById(listId);
    if (!list) return;
    
    const items = list.children;
    let foundAny = false;
    
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const text = item.textContent.toLowerCase();
        
        if (text.includes(searchTerm)) {
            item.classList.remove('hidden');
            foundAny = true;
        } else {
            item.classList.add('hidden');
        }
    }
    
    // Show/hide no results message
    const noResultsId = listId === 'match-list' ? 'no-matches' : 
                        listId === 'results-list' ? 'no-results' : 'no-admin-matches';
    const noResultsElement = document.getElementById(noResultsId);
    
    if (noResultsElement) {
        if (foundAny) {
            noResultsElement.classList.add('hidden');
        } else {
            noResultsElement.classList.remove('hidden');
        }
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast toast-top toast-center';
    toast.innerHTML = `
        <div class="alert alert-${type}">
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}


async function updateRoundOptions() {
    const data = await fetchMatches();
    const roundSelector = document.getElementById('round-selector');

    if (!roundSelector) return;
    
    // Kiểm tra nếu không có dữ liệu
    if (!data.matches || data.matches.length === 0) {
        roundSelector.innerHTML = '<option value="all">All Rounds</option>';
        return;
    }

    // Lấy danh sách các vòng đấu duy nhất
    const rounds = [...new Set(data.matches.map(match => match.round))].sort();

    // Xóa các tùy chọn hiện tại
    roundSelector.innerHTML = '<option value="all">All Rounds</option>';

    // Thêm các tùy chọn mới
    rounds.forEach(round => {
        const option = document.createElement('option');
        option.value = round.replace('Round ', ''); // Chỉ lấy số vòng
        option.textContent = round;
        roundSelector.appendChild(option);
    });
}

// Fix login/logout functions (keep as they are)
function login() {
    const password = document.getElementById('admin-password')?.value;
    if (password === 'admin123') {
        document.getElementById('login-form')?.classList.add('hidden');
        document.getElementById('admin-controls')?.classList.remove('hidden');
        document.getElementById('nav-links')?.classList.remove('hidden');
        loadAdminMatches();
    } else {
        // Show error toast
        const toast = document.createElement('div');
        toast.className = 'toast toast-top toast-center';
        toast.innerHTML = `
            <div class="alert alert-error">
                <span>Incorrect password. Please try again.</span>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

function logout() {
    document.getElementById('login-form')?.classList.remove('hidden');
    document.getElementById('admin-controls')?.classList.add('hidden');
    document.getElementById('nav-links')?.classList.add('hidden');
    document.getElementById('admin-password').value = '';
}


// Functions for the Schedule page
async function loadMatches(filter = 'all') {
    const data = await fetchMatches();
    const roundsContainer = document.getElementById('rounds-container');
    const noMatchesElement = document.getElementById('no-matches');
    
    if (!roundsContainer) return;
    roundsContainer.innerHTML = '';

    if (!data.matches || data.matches.length === 0) {
        if (noMatchesElement) noMatchesElement.classList.remove('hidden');
        console.log('No matches data available');
        return;
    }

    // Filter upcoming matches (no score)
    let filteredMatches = data.matches.filter(match => !match.score || match.score === '');
    if (filter !== 'all') {
        filteredMatches = filteredMatches.filter(match => match.sport === filter);
    }
    
    // Group matches by round
    const matchesByRound = {};
    filteredMatches.forEach(match => {
        if (!matchesByRound[match.round]) {
            matchesByRound[match.round] = [];
        }
        matchesByRound[match.round].push(match);
    });

    if (Object.keys(matchesByRound).length === 0) {
        if (noMatchesElement) noMatchesElement.classList.remove('hidden');
        return;
    }
    
    if (noMatchesElement) noMatchesElement.classList.add('hidden');

    // Sort rounds
    const sortedRounds = Object.keys(matchesByRound).sort();

    // Display matches by round
    sortedRounds.forEach(round => {
        // Create round title
        const roundSection = document.createElement('div');
        roundSection.className = 'mb-8';
        
        const roundTitle = document.createElement('h1');
        roundTitle.className = 'mb-4 text-2xl font-bold text-indigo-900';
        roundTitle.textContent = round;
        roundSection.appendChild(roundTitle);

        // Create container for matches
        const matchList = document.createElement('div');
        matchList.className = 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3';
        
        // Sort matches by time within each round
        matchesByRound[round].sort((a, b) => new Date(a.time) - new Date(b.time));

        // Create cards for each match
        matchesByRound[round].forEach(match => {
            const card = document.createElement('div');
            card.className = 'transition-shadow duration-300 bg-white shadow-lg card hover:shadow-xl';
            
            const matchTime = new Date(match.time);
            const isToday = new Date().toDateString() === matchTime.toDateString();
            const statusClass = isToday ? 'badge-secondary' : 'badge-primary';
            const statusText = isToday ? 'Today' : formatDateShort(matchTime);
            
            card.innerHTML = `
                <div class="card-body p-6">
                    <div class="flex justify-between items-center mb-3">
                        <span class="badge ${statusClass}">${statusText}</span>
                        <span class="text-2xl" title="${match.sport}">${getSportIcon(match.sport)}</span>
                    </div>
                    <h2 class="card-title text-lg">${match.team1} vs ${match.team2}</h2>
                    <div class="flex justify-between items-center mt-4">
                        <div>
                            <p class="text-sm font-medium text-gray-600">${formatTime(matchTime)}</p>
                        </div>
                    <button class="btn btn-sm btn-outline btn-primary">Details</button>
                    </div>
                </div>
            `;
            matchList.appendChild(card);
        });

        roundSection.appendChild(matchList);
        roundsContainer.appendChild(roundSection);
    });

    updateTabStyles(filter);
}

// Functions for the Results page
async function loadResults(filter = 'all') {
    const data = await fetchMatches();
    const roundsContainer = document.getElementById('results-container');
    const noResultsElement = document.getElementById('no-results');
    
    if (!roundsContainer) return;
    roundsContainer.innerHTML = '';

    if (!data.matches || data.matches.length === 0) {
        if (noResultsElement) noResultsElement.classList.remove('hidden');
        console.log('No matches data available for results');
        return;
    }

    // Filter completed matches (with score)
    let completedMatches = data.matches.filter(match => match.score && match.score !== '');
    if (filter !== 'all') {
        completedMatches = completedMatches.filter(match => match.sport === filter);
    }
    
    // Group matches by round
    const matchesByRound = {};
    completedMatches.forEach(match => {
        if (!matchesByRound[match.round]) {
            matchesByRound[match.round] = [];
        }
        matchesByRound[match.round].push(match);
    });

    if (Object.keys(matchesByRound).length === 0) {
        if (noResultsElement) noResultsElement.classList.remove('hidden');
        return;
    }
    
    if (noResultsElement) noResultsElement.classList.add('hidden');

    // Sort rounds
    const sortedRounds = Object.keys(matchesByRound).sort();

    // Display results by round
    sortedRounds.forEach(round => {
        // Create round title
        const roundSection = document.createElement('div');
        roundSection.className = 'mb-8';
        
        const roundTitle = document.createElement('h1');
        roundTitle.className = 'mb-4 text-2xl font-bold text-indigo-900';
        roundTitle.textContent = round;
        roundSection.appendChild(roundTitle);

        // Create container for results
        const resultsList = document.createElement('div');
        resultsList.className = 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3';
        
        // Sort matches by time (newest first)
        matchesByRound[round].sort((a, b) => new Date(b.time) - new Date(a.time));

        // Create cards for each result
        matchesByRound[round].forEach(match => {
            const card = document.createElement('div');
            card.className = 'transition-shadow duration-300 bg-white shadow-lg card hover:shadow-xl';
            
            const scores = match.score.split('-').map(s => parseInt(s.trim()));
            let resultBadge = '';
            
            if (scores.length === 2) {
                if (scores[0] > scores[1]) {
                    resultBadge = `<div class="absolute top-0 right-0 m-2">
                        <span class="badge badge-success p-3">${match.team1} won</span>
                    </div>`;
                } else if (scores[0] < scores[1]) {
                    resultBadge = `<div class="absolute top-0 right-0 m-2">
                        <span class="badge badge-success p-3">${match.team2} won</span>
                    </div>`;
                } else {
                    resultBadge = `<div class="absolute top-0 right-0 m-2">
                        <span class="badge badge-info p-3">Draw</span>
                    </div>`;
                }
            }
            
            card.innerHTML = `
                <div class="card-body p-6 relative">
                    ${resultBadge}
                    <div class="flex justify-between items-center mb-3">
                        <span class="badge badge-outline">${formatDate(match.time)}</span>
                        <span class="text-2xl" title="${match.sport}">${getSportIcon(match.sport)}</span>
                    </div>
                    <div class="flex justify-between items-center my-4">
                        <div class="text-center flex-1">
                            <p class="font-semibold text-lg">${match.team1}</p>
                        </div>
                        <div class="text-center px-4">
                            <p class="text-2xl font-bold">${match.score}</p>
                        </div>
                        <div class="text-center flex-1">
                            <p class="font-semibold text-lg">${match.team2}</p>
                        </div>
                    </div>
                </div>
            `;
            resultsList.appendChild(card);
        });

        roundSection.appendChild(resultsList);
        roundsContainer.appendChild(roundSection);
    });

    updateTabStyles(filter);
}

// Search functions
function searchMatches() {
    const searchTerm = document.getElementById('search-matches')?.value.toLowerCase();
    if (!searchTerm) {
        loadMatches(getActiveTab());
        return;
    }
    
    const roundsContainer = document.getElementById('rounds-container');
    if (!roundsContainer) return;
    
    const cards = roundsContainer.getElementsByClassName('card');
    let foundAny = false;
    
    // Hide/show matches based on search term
    for (let card of cards) {
        const text = card.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            card.classList.remove('hidden');
            foundAny = true;
        } else {
            card.classList.add('hidden');
        }
    }
    
    // Show/hide no matches message
    const noMatchesElement = document.getElementById('no-matches');
    if (noMatchesElement) {
        noMatchesElement.classList.toggle('hidden', foundAny);
    }
}

function searchResults() {
    const searchTerm = document.getElementById('search-results')?.value.toLowerCase();
    if (!searchTerm) {
        loadResults(getActiveTab());
        return;
    }
    
    const resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) return;
    
    const cards = resultsContainer.getElementsByClassName('card');
    let foundAny = false;
    
    // Hide/show results based on search term
    for (let card of cards) {
        const text = card.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            card.classList.remove('hidden');
            foundAny = true;
        } else {
            card.classList.add('hidden');
        }
    }
    
    // Show/hide no results message
    const noResultsElement = document.getElementById('no-results');
    if (noResultsElement) {
        noResultsElement.classList.toggle('hidden', foundAny);
    }
}

// Filter functions
function filterMatches(sport) {
    loadMatches(sport);
}

function filterResults(sport) {
    loadResults(sport);
}

// Helper function to update tab styles
function updateTabStyles(activeFilter) {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.classList.remove('tab-active');
        const tabText = tab.textContent.toLowerCase();
        const filterText = activeFilter.toLowerCase();
        
        if ((tabText === 'all' && filterText === 'all') || 
            (tabText === 'football' && filterText === 'football') ||
            (tabText === 'badminton' && filterText === 'badminton') || 
            (tabText === 'chess' && filterText === 'chess')) {
            tab.classList.add('tab-active');
        }
    });
}

// Get currently active tab filter
function getActiveTab() {
    const activeTab = document.querySelector('.tab.tab-active');
    if (!activeTab) return 'all';
    
    const text = activeTab.textContent.toLowerCase();
    if (text === 'football') return 'Football';
    if (text === 'badminton') return 'Badminton';
    if (text === 'chess') return 'Chess';
    return 'all';
}

// Initialize app on page load
window.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing app...");
    
    if (document.getElementById('rounds-container') && document.querySelector('h1.text-4xl').textContent.includes('Schedule')) {
        console.log("Loading matches for schedule page");
        loadMatches();
    } else if (document.getElementById('results-container') || 
              (document.getElementById('rounds-container') && document.querySelector('h1.text-4xl').textContent.includes('Results'))) {
        console.log("Loading results page");
        loadResults();
    }
});
