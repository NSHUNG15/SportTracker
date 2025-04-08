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


// Cập nhật loadMatches để hiển thị sân và địa điểm
async function loadMatches(sport = 'all', eventType = 'all') {
    const data = await fetchMatches();
    const roundsContainer = document.getElementById('rounds-container');
    const noMatchesElement = document.getElementById('no-matches');
    
    roundsContainer.innerHTML = '';
    if (!data.matches || data.matches.length === 0) {
        noMatchesElement.classList.remove('hidden');
        return;
    }

    let filteredMatches = data.matches.filter(match => !match.score && !match.duration);
    if (sport !== 'all') {
        filteredMatches = filteredMatches.filter(match => match.sport === sport);
    }
    if (eventType !== 'all') {
        filteredMatches = filteredMatches.filter(match => match.eventType === eventType);
    }
    
    const matchesByRound = {};
    filteredMatches.forEach(match => {
        if (!matchesByRound[match.round]) matchesByRound[match.round] = [];
        matchesByRound[match.round].push(match);
    });

    if (Object.keys(matchesByRound).length === 0) {
        noMatchesElement.classList.remove('hidden');
        return;
    }
    noMatchesElement.classList.add('hidden');

    const sortedRounds = Object.keys(matchesByRound).sort();
    sortedRounds.forEach(round => {
        const roundSection = document.createElement('div');
        roundSection.className = 'mb-8';
        
        const roundTitle = document.createElement('h1');
        roundTitle.className = 'mb-4 text-2xl font-bold text-indigo-900';
        roundTitle.textContent = round;
        roundSection.appendChild(roundTitle);

        const matchList = document.createElement('div');
        matchList.className = 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3';
        
        matchesByRound[round].sort((a, b) => new Date(a.time) - new Date(b.time));
        matchesByRound[round].forEach(match => {
            const card = document.createElement('div');
            card.className = 'transition-shadow duration-300 bg-white shadow-lg card hover:shadow-xl';
            
            const matchTime = new Date(match.time);
            const isToday = new Date().toDateString() === matchTime.toDateString();
            const statusClass = isToday ? 'badge-secondary' : 'badge-primary';
            const statusText = isToday ? 'Today' : formatDateShort(matchTime);
            
            const venueDisplay = match.venue ? `${match.venue.name} - ${match.venue.location}` : 'TBD';
            
            card.innerHTML = `
                <div class="card-body p-6">
                    <div class="flex justify-between items-center mb-3">
                        <span class="badge ${statusClass}">${statusText}</span>
                        <span class="text-2xl" title="${match.sport}">${getSportIcon(match.sport)}</span>
                    </div>
                    <h2 class="card-title text-lg">${match.team1} vs ${match.team2}</h2>
                    <p class="text-sm text-gray-600">${match.eventType}</p>
                    <div class="flex justify-between items-center mt-4">
                        <div>
                            <p class="text-sm font-medium text-gray-600">${formatTime(matchTime)}</p>
                            <p class="text-sm text-gray-500">${venueDisplay}</p>
                        </div>
                    </div>
                </div>
            `;
            matchList.appendChild(card);
        });

        roundSection.appendChild(matchList);
        roundsContainer.appendChild(roundSection);
    });

    updateTabStyles(sport);
    updateEventTypeFilter(sport); // Cập nhật dropdown eventType
}
// Cập nhật loadResults để hiển thị sân và địa điểm
async function loadResults(sport = 'all', eventType = 'all') {
    const data = await fetchMatches();
    const roundsContainer = document.getElementById('results-container');
    const noResultsElement = document.getElementById('no-results');
    
    roundsContainer.innerHTML = '';
    if (!data.matches || data.matches.length === 0) {
        noResultsElement.classList.remove('hidden');
        return;
    }

    let completedMatches = data.matches.filter(match => match.score || match.duration);
    if (sport !== 'all') {
        completedMatches = completedMatches.filter(match => match.sport === sport);
    }
    if (eventType !== 'all') {
        completedMatches = completedMatches.filter(match => match.eventType === eventType);
    }
    
    const matchesByRound = {};
    completedMatches.forEach(match => {
        if (!matchesByRound[match.round]) matchesByRound[match.round] = [];
        matchesByRound[match.round].push(match);
    });

    if (Object.keys(matchesByRound).length === 0) {
        noResultsElement.classList.remove('hidden');
        return;
    }
    noResultsElement.classList.add('hidden');

    const sortedRounds = Object.keys(matchesByRound).sort();
    sortedRounds.forEach(round => {
        const roundSection = document.createElement('div');
        roundSection.className = 'mb-8';
        
        const roundTitle = document.createElement('h1');
        roundTitle.className = 'mb-4 text-2xl font-bold text-indigo-900';
        roundTitle.textContent = round;
        roundSection.appendChild(roundTitle);

        const resultsList = document.createElement('div');
        resultsList.className = 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3';
        
        matchesByRound[round].sort((a, b) => new Date(b.time) - new Date(a.time));
        matchesByRound[round].forEach(match => {
            const card = document.createElement('div');
            card.className = 'transition-shadow duration-300 bg-white shadow-lg card hover:shadow-xl';
            
            let resultBadge = '';
            if (match.sport === 'Athletics') {
                resultBadge = `<div class="absolute top-0 right-0 m-2">
                    <span class="badge badge-success p-3">${match.team1} - ${match.duration}</span>
                </div>`;
            } else if (match.score) {
                const scores = match.score.split('-').map(s => parseInt(s.trim()));
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

            const cardsDisplay = match.sport === 'Football' ? `
                <p class="text-sm">Yellow: ${match.yellowCards.team1}-${match.yellowCards.team2}</p>
                <p class="text-sm">Red: ${match.redCards.team1}-${match.redCards.team2}</p>
            ` : '';
            
            const venueDisplay = match.venue ? `${match.venue.name} - ${match.venue.location}` : 'TBD';
            
            card.innerHTML = `
                <div class="card-body p-6 relative">
                    ${resultBadge}
                    <div class="flex justify-between items-center mb-3 mt-5">
                        <span class="badge badge-outline">${formatDate(match.time)}</span>
                        <span class="text-2xl" title="${match.sport}">${getSportIcon(match.sport)}</span>
                    </div>
                    <div class="flex justify-between items-center my-4">
                        <div class="text-center flex-1">
                            <p class="font-semibold text-lg">${match.team1}</p>
                        </div>
                        <div class="text-center px-4">
                            <p class="text-2xl font-bold">${match.sport === 'Athletics' ? match.duration : match.score}</p>
                        </div>
                        <div class="text-center flex-1">
                            <p class="font-semibold text-lg">${match.team2}</p>
                        </div>
                    </div>
                    <p class="text-sm text-gray-600">${match.eventType}</p>
                    ${cardsDisplay}
                    <p class="text-sm text-gray-500">${venueDisplay}</p>
                </div>
            `;
            resultsList.appendChild(card);
        });

        roundSection.appendChild(resultsList);
        roundsContainer.appendChild(roundSection);
    });

    updateTabStyles(sport);
    updateEventTypeFilter(sport); // Cập nhật dropdown eventType
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
function filterMatches(sport, eventType = 'all') {
    loadMatches(sport, eventType);
}

function filterResults(sport, eventType = 'all') {
    loadResults(sport, eventType);
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
            (tabText === 'chess' && filterText === 'chess') ||
            (tabText === 'athletics' && filterText === 'athletics')) {
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
    if (text === 'athletics') return 'Athletics';
    return 'all';
}

// Danh sách hình thức thi đấu theo môn thể thao
const eventTypes = {
  Football: ['Đội nam'],
  Badminton: ['Đơn nam', 'Đơn nữ'],
  Athletics: ['Chạy nhanh nam', 'Chạy bền nam 1500m', 'Chạy bền nữ 800m'],
  Chess: ['Cờ vua', 'Cờ tướng']
};

// Hàm cập nhật dropdown eventType
function updateEventTypes() {
  const sport = document.getElementById('sport').value;
  const eventTypeSelect = document.getElementById('eventType');
  eventTypeSelect.innerHTML = '';
  
  eventTypes[sport].forEach(type => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = type;
    eventTypeSelect.appendChild(option);
  });

  // Ẩn/hiện trường score hoặc duration
  const scoreField = document.getElementById('score-field');
  const durationField = document.getElementById('duration-field');
  const cardsField = document.getElementById('cards-field');
  if (sport === 'Athletics') {
    scoreField.classList.add('hidden');
    durationField.classList.remove('hidden');
    cardsField.classList.add('hidden');
  } else if (sport === 'Football') {
    scoreField.classList.remove('hidden');
    durationField.classList.add('hidden');
    cardsField.classList.remove('hidden');
  } else {
    scoreField.classList.remove('hidden');
    durationField.classList.add('hidden');
    cardsField.classList.add('hidden');
  }
}
function updateEventTypeFilter(sport) {
    const eventTypeFilter = document.getElementById('event-type-filter');
    if (!eventTypeFilter) return;

    eventTypeFilter.innerHTML = '<option value="all">All Event Types</option>';

    if (sport === 'all') {
        // Hiển thị tất cả eventType từ tất cả môn thể thao
        Object.values(eventTypes).flat().forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            eventTypeFilter.appendChild(option);
        });
    } else {
        // Chỉ hiển thị eventType của môn thể thao được chọn
        eventTypes[sport]?.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            eventTypeFilter.appendChild(option);
        });
    }
}

// Hàm tải danh sách địa điểm
async function loadVenues() {
  try {
    const response = await fetch('/venues');
    const data = await response.json();
    const venueSelect = document.getElementById('venue');
    venueSelect.innerHTML = '<option value="">Select a venue</option>';
    
    data.venues.forEach(venue => {
      const option = document.createElement('option');
      option.value = venue._id;
      option.textContent = `${venue.name} - ${venue.location}`;
      venueSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading venues:', error);
    showToast('Error loading venues', 'error');
  }
}

// Cập nhật form submission
document.getElementById('match-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const sport = document.getElementById('sport').value;
  const eventType = document.getElementById('eventType').value;
  const team1 = document.getElementById('team1').value.trim();
  const team2 = document.getElementById('team2').value.trim();
  const score = document.getElementById('score').value.trim();
  const duration = document.getElementById('duration').value.trim();
  const yellowCards1 = parseInt(document.getElementById('yellowCards1').value) || 0;
  const yellowCards2 = parseInt(document.getElementById('yellowCards2').value) || 0;
  const redCards1 = parseInt(document.getElementById('redCards1').value) || 0;
  const redCards2 = parseInt(document.getElementById('redCards2').value) || 0;
  const venue = document.getElementById('venue').value;
  const time = document.getElementById('time').value;
  const round = `Round ${document.getElementById('round').value.trim()}`;

  if (!sport || !eventType || !team1 || !team2 || !time || isNaN(round.replace('Round ', ''))) {
    showToast('Please fill in all required fields correctly', 'warning');
    return;
  }

  const match = {
    sport,
    eventType,
    team1,
    team2,
    score: sport === 'Athletics' ? '' : score,
    duration: sport === 'Athletics' ? duration : '',
    yellowCards: { team1: yellowCards1, team2: yellowCards2 },
    redCards: { team1: redCards1, team2: redCards2 },
    time: new Date(time).toISOString(),
    round,
    status: (sport === 'Athletics' ? duration : score) ? 'Completed' : 'Upcoming',
    venue: venue || null
  };

  const matchId = document.getElementById('match-form').dataset.matchId;

  try {
    let response;
    if (matchId) {
      response = await fetch(`/match/${matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(match)
      });
    } else {
      response = await fetch('/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(match)
      });
    }

    const result = await response.json();
    if (result.success) {
      showToast(matchId ? 'Match updated successfully' : 'New match added successfully', 'success');
      loadAdminMatches(getActiveTab());
      document.getElementById('match-form').reset();
      delete document.getElementById('match-form').dataset.matchId;
    } else {
      showToast(`Error: ${result.error || 'Failed to save match'}`, 'error');
    }
  } catch (error) {
    console.error('Error saving match:', error);
    showToast(`Error saving match: ${error.message}`, 'error');
  }
});

// Cập nhật editMatch để điền dữ liệu mới
function editMatch(matchId) {
  fetch(`/match/${matchId}`)
    .then(response => response.json())
    .then(match => {
      document.getElementById('sport').value = match.sport;
      updateEventTypes();
      document.getElementById('eventType').value = match.eventType;
      document.getElementById('team1').value = match.team1;
      document.getElementById('team2').value = match.team2;
      document.getElementById('score').value = match.score || '';
      document.getElementById('duration').value = match.duration || '';
      document.getElementById('yellowCards1').value = match.yellowCards.team1;
      document.getElementById('yellowCards2').value = match.yellowCards.team2;
      document.getElementById('redCards1').value = match.redCards.team1;
      document.getElementById('redCards2').value = match.redCards.team2;
      document.getElementById('venue').value = match.venue?._id || '';
      document.getElementById('time').value = match.time ? new Date(match.time).toISOString().slice(0, 16) : '';
      document.getElementById('round').value = match.round.replace('Round ', '');
      document.getElementById('match-form').dataset.matchId = match._id;
    })
    .catch(error => {
      console.error('Error fetching match:', error);
      showToast(`Error: ${error.message}`, 'error');
    });
}

// Cập nhật loadAdminMatches để hiển thị sân và địa điểm
async function loadAdminMatches(sport = 'all', eventType = 'all') {
    const data = await fetchMatches();
    const matchList = document.getElementById('admin-match-list');
    const noMatchesElement = document.getElementById('no-admin-matches');
    
    matchList.innerHTML = '';
    if (!data.matches || data.matches.length === 0) {
        noMatchesElement.classList.remove('hidden');
        return;
    }

    let filteredMatches = [...data.matches];
    if (sport !== 'all') {
        filteredMatches = filteredMatches.filter(match => match.sport === sport);
    }
    if (eventType !== 'all') {
        filteredMatches = filteredMatches.filter(match => match.eventType === eventType);
    }
    filteredMatches.sort((a, b) => new Date(b.time) - new Date(a.time));

    if (filteredMatches.length === 0) {
        noMatchesElement.classList.remove('hidden');
        return;
    }
    noMatchesElement.classList.add('hidden');

    filteredMatches.forEach(match => {
        const card = document.createElement('div');
        card.className = 'transition-colors duration-200 bg-white border border-gray-200 card hover:border-gray-300';
        
        const hasResult = match.score || match.duration;
        const statusClass = hasResult ? 'badge-success' : 'badge-warning';
        const statusText = hasResult ? 'Completed' : 'Upcoming';
        
        const resultDisplay = match.sport === 'Athletics' ? 
            (match.duration ? `<span class="font-bold">${match.duration}</span>` : '<span class="badge badge-outline">Upcoming</span>') : 
            (match.score ? `<span class="font-bold ">${match.score}</span>` : '<span class="badge badge-outline">Upcoming</span>');
        
        const cardsDisplay = match.sport === 'Football' ? `
            <p class="text-sm">Yellow: ${match.yellowCards.team1}-${match.yellowCards.team2}</p>
            <p class="text-sm">Red: ${match.redCards.team1}-${match.redCards.team2}</p>
        ` : '';
        
        const venueDisplay = match.venue ? 
            `${match.venue.name} - ${match.venue.location}` : 
            'No venue assigned';
        
        card.innerHTML = `
            <div class="card-body p-4">
                <div class="flex justify-between items-center mb-2">
                    <div>
                        <span class="badge ${statusClass} mr-2">${statusText}</span>
                        <span class="badge badge-outline">${match.sport} - ${match.eventType}</span>
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
                    <div>
                        <p class="text-gray-600">${formatDate(match.time)}</p>
                        ${cardsDisplay}
                        <p class="text-gray-600">${venueDisplay}</p>
                    </div>
                    <p class="font-bold text-right text-red-800 text-xl">${resultDisplay}</p>
                </div>
            </div>
        `;
        matchList.appendChild(card);
    });

    updateTabStyles(sport);
    updateEventTypeFilter(sport);
}

// Khởi tạo khi tải trang
// Trong phần khởi tạo
window.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing app...");
    
    // Nếu trang hiện tại là trang admin (có login form), gọi loadVenues
    if (document.getElementById('login-form')) {
        console.log("Loading venues for admin page");
        loadVenues(); // Gọi hàm loadVenues để tải danh sách địa điểm
    }

    // Các phần khởi tạo khác
    if (document.getElementById('rounds-container') && document.querySelector('h1.text-4xl').textContent.includes('Schedule')) {
        console.log("Loading matches for schedule page");
        loadMatches();
        updateEventTypeFilter('all');
    } else if (document.getElementById('results-container') || 
              (document.getElementById('rounds-container') && document.querySelector('h1.text-4xl').textContent.includes('Results'))) {
        console.log("Loading results page");
        loadResults();
        updateEventTypeFilter('all');
    }
});