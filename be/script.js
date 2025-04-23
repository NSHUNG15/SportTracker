// Định nghĩa địa điểm cho từng môn thể thao
const locations = {
    all: "",
    Football: "Sân bóng đá Làng Hòa Mỹ - K120 Nguyễn Huy Tưởng, Hòa An, Liên Chiểu, Đà Nẵng.",
    Badminton: "Sân cầu lông Win Win Badminton – 642 Tôn Đức Thắng, Hòa Khánh Nam, Liên Chiểu, Đà Nẵng.",
    Chess: "ANGEL COFFEE số 87-Quang Trung, Hải Châu, Đà Nẵng.",
    Athletics: "Sân vận động Thanh Khê – Đinh Núp, Thanh Khê Đông, Thanh Khê, Đà Nẵng."
};

// API Communication Functions
async function fetchMatches() {
    try {
        const response = await fetch('/matches');
        return await response.json();
    } catch (error) {
        console.error('Error fetching matches:', error);
        return { matches: [] };
    }
}

async function saveMatches(matches) {
    try {
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

async function loadVenues() {
    try {
        const response = await fetch('/venues');
        const data = await response.json();
        const venueSelect = document.getElementById('venue');
        venueSelect.innerHTML = '<option value="">Select a venue</option>';
        
        data.venues.forEach(venue => {
            const option = document.createElement('option');
            option.value = venue._id;
            option.textContent = `${venue.name}`;
            venueSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading venues:', error);
        showToast('Error loading venues', 'error');
    }
}

// Utility Functions
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

function getScoreDisplay(score, penaltyScore) {
  if (!score || score === '') return '<span class="badge badge-outline">Upcoming</span>';
  return penaltyScore ? `${score} (Pen ${penaltyScore})` : score;
}

function getSportIcon(sport) {
    switch(sport.toLowerCase()) {
        case 'football': return '⚽';
        case 'badminton': return '🏸';
        case 'chess': return '♟️';
        default: return '🎮';
    }
}

function formatDateShort(date) {
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
}

function formatTime(date) {
    const options = { hour: '2-digit', minute: '2-digit' };
    return date.toLocaleTimeString(undefined, options);
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

function getRoundPriority(round) {
    const roundOrder = {
        'Chung Kết': 1000000,
        'Tranh Hạng 3': 99999,
        'Bán Kết 1': 10, 'Bán Kết 2': 11, 'Bán Kết': 12,
        'Tứ Kết 1': 5, 'Tứ Kết 2': 6, 'Tứ Kết 3': 7, 'Tứ Kết 4': 8, 'Tứ Kết': 9,
        'Vòng 1/8': 4,
        'Vòng Bảng 3': 3, 
        'Vòng Bảng 2': 2, 
        'Vòng Bảng 1': 1
    };
    return roundOrder[round] !== undefined ? roundOrder[round] : -1;
}

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

async function updateRoundOptions() {
    const data = await fetchMatches();
    const roundSelector = document.getElementById('round-selector');
    if (!roundSelector) return;
    
    if (!data.matches || data.matches.length === 0) {
        roundSelector.innerHTML = '<option value="all">Tất cả các vòng</option>';
        return;
    }

    const rounds = [...new Set(data.matches.map(match => match.round))].sort();
    roundSelector.innerHTML = '<option value="all">Tất cả các vòng</option>';

    rounds.forEach(round => {
        const option = document.createElement('option');
        option.value = round;
        option.textContent = round;
        roundSelector.appendChild(option);
    });
}

function login() {
    const password = document.getElementById('admin-password')?.value;
    if (password === 'bansukien2025!@#') {
        document.getElementById('login-form')?.classList.add('hidden');
        document.getElementById('admin-controls')?.classList.remove('hidden');
        document.getElementById('nav-links')?.classList.remove('hidden');
        loadAdminMatches('all').then(() => {
            updateEventTypeFilter('all'); 
        });
        loadVenues();
        updateEventTypes();
    } else {
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
        const roundText = match.round;
        if (!matchesByRound[roundText]) matchesByRound[roundText] = [];
        matchesByRound[roundText].push(match);
    });

    if (Object.keys(matchesByRound).length === 0) {
        noMatchesElement.classList.remove('hidden');
        return;
    }
    noMatchesElement.classList.add('hidden');

    const sortedRounds = Object.keys(matchesByRound).sort((a, b) => getRoundPriority(b) - getRoundPriority(a));
    
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
            
            const venueDisplay = match.venue ? `${match.venue.name}` : 'TBD';
            const groupDisplay = match.group ? `<p class="text-lg text-gray-800">Group: ${match.group}</p>` : '';
            const teamDisplay = match.sport === 'Athletics' ? match.team1 : `${match.team1} vs ${match.team2}`;
            
            card.innerHTML = `
                <div class="card-body p-6">
                    <div class="flex justify-between items-center mb-3">
                        <span class="badge text-lg ${statusClass}">${statusText}</span>
                        <span class="text-2xl" title="${match.sport}">${getSportIcon(match.sport)}</span>
                    </div>
                    <h2 class="card-title text-xl">${teamDisplay}</h2>
                    <p class="text-lg text-gray-800">${match.eventType}</p>
                    <div class="flex justify-between items-center mt-4">
                        <div>
                            <p class="text-lg font-medium text-gray-800">${formatTime(matchTime)}</p>
                            <p class="text-lg text-gray-800">${venueDisplay}</p>
                            ${groupDisplay}
                        </div>
                    </div>
                </div>
            `;
            matchList.appendChild(card);
        });

        roundSection.appendChild(matchList);
        roundsContainer.appendChild(roundSection);
    });
}

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
    const roundText = match.round;
    if (!matchesByRound[roundText]) matchesByRound[roundText] = [];
    matchesByRound[roundText].push(match);
  });

  if (Object.keys(matchesByRound).length === 0) {
    noResultsElement.classList.remove('hidden');
    return;
  }
  noResultsElement.classList.add('hidden');

  const sortedRounds = Object.keys(matchesByRound).sort((a, b) => getRoundPriority(b) - getRoundPriority(a));
  
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
            <span class="badge badge-success text-lg p-3">${match.team1} WIN</span>
          </div>`;
        } else if (scores[0] < scores[1]) {
          resultBadge = `<div class="absolute top-0 right-0 m-2">
            <span class="badge badge-success p-3 text-lg">${match.team2} WIN</span>
          </div>`;
        } else if (match.penaltyScore) {
          const penScores = match.penaltyScore.split('-').map(s => parseInt(s.trim()));
          if (penScores[0] > penScores[1]) {
            resultBadge = `<div class="absolute top-0 right-0 m-2">
              <span class="badge badge-success text-lg p-3">${match.team1} WIN (Pen ${match.penaltyScore})</span>
            </div>`;
          } else if (penScores[1] > penScores[0]) {
            resultBadge = `<div class="absolute top-0 right-0 m-2">
              <span class="badge badge-success text-lg p-3">${match.team2} WIN (Pen ${match.penaltyScore})</span>
            </div>`;
          } else {
            resultBadge = `<div class="absolute top-0 right-0 m-2">
              <span class="badge badge-error text-lg p-3">Invalid penalty score</span>
            </div>`;
          }
        } else {
          resultBadge = `<div class="absolute top-0 right-0 m-2">
            <span class="badge badge-info text-lg p-3">Draw</span>
          </div>`;
        }
      }

      const cardsDisplay = match.sport === 'Football' ? ` 
        <p class="text-lg">Yellow: ${match.yellowCards.team1}-${match.yellowCards.team2}</p>
        <p class="text-lg">Red: ${match.redCards.team1}-${match.redCards.team2}</p>
      ` : '';
      
      const venueDisplay = match.venue ? `${match.venue.name}` : 'TBD';
      const groupDisplay = match.group ? `<p class="text-lg">Group: ${match.group}</p>` : '';
      const teamDisplay = match.sport === 'Athletics' ? 
        `<p class="font-semibold text-xl">${match.team1}</p>` :
        `
          <div class="text-center flex-1">
            <p class="font-semibold text-xl">${match.team1}</p>
          </div>
          <div class="text-center px-4">
            <p class="text-2xl font-bold">${getScoreDisplay(match.score, match.penaltyScore)}</p>
          </div>
          <div class="text-center flex-1">
            <p class="font-semibold text-xl">${match.team2}</p>
          </div>
        `;
      
      card.innerHTML = `
        <div class="card-body p-6 relative">
          ${resultBadge}
          <div class="flex justify-between items-center mb-3 mt-5">
            <span class="badge badge-outline text-lg">${formatDate(match.time)}</span>
            <span class="text-2xl" title="${match.sport}">${getSportIcon(match.sport)}</span>
          </div>
          <div class="flex justify-between items-center my-4">
            ${teamDisplay}
          </div>
          <p class="text-lg text-gray-800">${match.eventType}</p>
          ${cardsDisplay}
          <p class="text-lg text-gray-800">${venueDisplay}</p>
          ${groupDisplay}
        </div>
      `;
      resultsList.appendChild(card);
    });

    roundSection.appendChild(resultsList);
    roundsContainer.appendChild(roundSection);
  });

  updateTabStyles(sport);
  updateEventTypeFilter(sport);
}

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
    
    for (let card of cards) {
        const text = card.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            card.classList.remove('hidden');
            foundAny = true;
        } else {
            card.classList.add('hidden');
        }
    }
    
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
    
    for (let card of cards) {
        const text = card.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            card.classList.remove('hidden');
            foundAny = true;
        } else {
            card.classList.add('hidden');
        }
    }
    
    const noResultsElement = document.getElementById('no-results');
    if (noResultsElement) {
        noResultsElement.classList.toggle('hidden', foundAny);
    }
}

// Updated Filter Functions
function filterMatches(sport, eventType = 'all') {
    const locationElement = document.getElementById('location');
    if (locationElement) {
        locationElement.textContent = locations[sport] || "Select a sport to view location";
    }

    updateTabStyles(sport);
    loadMatches(sport, eventType);
}

function filterResults(sport, eventType = 'all') {
    const locationElement = document.getElementById('location');
    if (locationElement) {
        locationElement.textContent = locations[sport] || "Select a sport to view location";
    }

    updateTabStyles(sport);
    loadResults(sport, eventType);
}

// Event Types
const eventTypes = {
    Football: ['Đội nam'],
    Badminton: ['Đơn nam', 'Đơn nữ'],
    Athletics: ['Chạy nhanh nam', 'Chạy bền nam 1500m', 'Chạy bền nữ 800m'],
    Chess: ['Cờ vua', 'Cờ tướng']
};

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

    const scoreField = document.getElementById('score-field');
    const penaltyField = document.getElementById('penalty-field');
    const durationField = document.getElementById('duration-field');
    const cardsField = document.getElementById('cards-field');
    const groupField = document.getElementById('group-field');
    const team2Field = document.getElementById('team2-field');

    if (sport === 'Athletics') {
        scoreField.classList.add('hidden');
        penaltyField.classList.add('hidden');
        durationField.classList.remove('hidden');
        cardsField.classList.add('hidden');
        groupField.classList.add('hidden');
        team2Field.classList.add('hidden');
    } else if (sport === 'Football') {
        scoreField.classList.remove('hidden');
        penaltyField.classList.remove('hidden');
        durationField.classList.add('hidden');
        cardsField.classList.remove('hidden');
        groupField.classList.remove('hidden');
        team2Field.classList.remove('hidden');
    } else {
        scoreField.classList.remove('hidden');
        penaltyField.classList.add('hidden');
        durationField.classList.add('hidden');
        cardsField.classList.add('hidden');
        groupField.classList.add('hidden');
        team2Field.classList.remove('hidden');
    }
}

function updateEventTypeFilter(sport) {
    const eventTypeFilter = document.getElementById('event-type-filter');
    if (!eventTypeFilter) return;

    eventTypeFilter.innerHTML = '<option value="all">All Event Types</option>';

    if (sport === 'all') {
        Object.values(eventTypes).flat().forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            eventTypeFilter.appendChild(option);
        });
    } else {
        eventTypes[sport]?.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            eventTypeFilter.appendChild(option);
        });
    }
}

// Add event listener for form reset
document.getElementById('match-form')?.addEventListener('reset', () => {
    // Clear the matchId from the form's dataset
    delete document.getElementById('match-form').dataset.matchId;
    // Reset form fields
    document.getElementById('match-form').reset();
    // Update event types to ensure correct field visibility
    updateEventTypes();
});

document.getElementById('match-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const sport = document.getElementById('sport').value;
    const eventType = document.getElementById('eventType').value;
    const team1 = document.getElementById('team1').value.trim();
    const team2 = sport === 'Athletics' ? '' : document.getElementById('team2').value.trim();
    const score = document.getElementById('score').value.trim();
    const penaltyScore = sport === 'Football' ? document.getElementById('penaltyScore').value.trim() : '';
    const duration = document.getElementById('duration').value.trim();
    const yellowCards1 = parseInt(document.getElementById('yellowCards1').value) || 0;
    const yellowCards2 = parseInt(document.getElementById('yellowCards2').value) || 0;
    const redCards1 = parseInt(document.getElementById('redCards1').value) || 0;
    const redCards2 = parseInt(document.getElementById('redCards2').value) || 0;
    const venue = document.getElementById('venue').value;
    const time = document.getElementById('time').value;
    const round = document.getElementById('round').value.trim();
    const group = sport === 'Football' ? document.getElementById('group').value || null : null;

    // Kiểm tra các trường bắt buộc, bỏ qua team2 cho Athletics
    if (!sport || !eventType || !team1 || !time || !round) {
        showToast('Please fill in all required fields correctly. Round must be one of: Vòng Bảng 1, Vòng Bảng 2, Vòng Bảng 3, Vòng 1/8, Tứ Kết, Bán Kết, Tranh Hạng 3, Chung Kết', 'warning');
        return;
    }

    if (sport !== 'Athletics' && !team2) {
        showToast('Team/Player 2 is required for non-Athletics events', 'warning');
        return;
    }

    // Validate penalty score for football knockout matches
    if (sport === 'Football' && score && ['Vòng 1/8', 'Tứ Kết', 'Bán Kết', 'Chung Kết'].includes(round)) {
        const scores = score.split('-').map(s => parseInt(s.trim()));
        if (scores[0] === scores[1] && !penaltyScore) {
            showToast('Penalty score is required for draw matches in knockout rounds', 'warning');
            return;
        }
    }

    const match = {
        sport,
        eventType,
        team1,
        team2,
        score: sport === 'Athletics' ? '' : score,
        penaltyScore,
        duration: sport === 'Athletics' ? duration : '',
        yellowCards: { team1: yellowCards1, team2: yellowCards2 },
        redCards: { team1: redCards1, team2: redCards2 },
        time: new Date(time).toISOString(),
        round,
        status: (sport === 'Athletics' ? duration : score) ? 'Completed' : 'Upcoming',
        venue: venue || null,
        group
    };

    // Update group teams if necessary
    if (sport === 'Football' && group) {
        try {
            const response = await fetch('/groups');
            const data = await response.json();
            const existingGroup = data.groups.find(g => g.name === group);
            const teams = existingGroup ? [...new Set([...existingGroup.teams, team1, team2])] : [team1, team2];
            const groupResponse = await fetch('/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: group, teams })
            });
            const groupResult = await groupResponse.json();
            if (!groupResult.success) {
                showToast('Error updating group', 'error');
                return;
            }
        } catch (err) {
            console.error('Error updating group:', err);
            showToast('Error updating group', 'error');
            return;
        }
    }

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
            updateEventTypes();
        } else {
            showToast(`Error: ${result.error || 'Failed to save match'}`, 'error');
        }
    } catch (error) {
        console.error('Error saving match:', error);
        showToast(`Error saving match: ${error.message}`, 'error');
    }
});

function editMatch(matchId) {
    fetch(`/match/${matchId}`)
        .then(response => response.json())
        .then(match => {
            document.getElementById('sport').value = match.sport;
            updateEventTypes();
            document.getElementById('eventType').value = match.eventType;
            document.getElementById('team1').value = match.team1;
            document.getElementById('team2').value = match.team2 || '';
            document.getElementById('score').value = match.score || '';
            document.getElementById('penaltyScore').value = match.penaltyScore || '';
            document.getElementById('duration').value = match.duration || '';
            document.getElementById('yellowCards1').value = match.yellowCards.team1;
            document.getElementById('yellowCards2').value = match.yellowCards.team2;
            document.getElementById('redCards1').value = match.redCards.team1;
            document.getElementById('redCards2').value = match.redCards.team2;
            document.getElementById('venue').value = match.venue?._id || '';
            document.getElementById('group').value = match.group || '';

            if (match.time) {
                const date = new Date(match.time);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const formattedTime = `${year}-${month}-${day}T${hours}:${minutes}`;
                document.getElementById('time').value = formattedTime;
            } else {
                document.getElementById('time').value = '';
            }

            document.getElementById('round').value = match.round;
            document.getElementById('match-form').dataset.matchId = match._id;

            // Cuộn mượt mà đến phần form
            const matchForm = document.getElementById('match-form');
            matchForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        })
        .catch(error => {
            console.error('Error fetching match:', error);
            showToast(`Error: ${error.message}`, 'error');
        });
}

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
  
  filteredMatches.sort((a, b) => getRoundPriority(b.round) - getRoundPriority(a.round) || new Date(b.time) - new Date(a.time));

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
    
    let resultDisplay = '';
    if (match.sport === 'Athletics') {
      resultDisplay = match.duration ? `<span class="font-bold">${match.duration}</span>` : '<span class="badge badge-outline">Upcoming</span>';
    } else if (match.score) {
      const scores = match.score.split('-').map(s => parseInt(s.trim()));
      if (scores[0] > scores[1]) {
        resultDisplay = `<span class="font-bold">${match.score} (${match.team1} WIN)</span>`;
      } else if (scores[0] < scores[1]) {
        resultDisplay = `<span class="font-bold">${match.score} (${match.team2} WIN)</span>`;
      } else if (match.penaltyScore) {
        const penScores = match.penaltyScore.split('-').map(s => parseInt(s.trim()));
        if (penScores[0] > penScores[1]) {
          resultDisplay = `<span class="font-bold">${match.score} (Pen ${match.penaltyScore}, ${match.team1} WIN)</span>`;
        } else if (penScores[1] > penScores[0]) {
          resultDisplay = `<span class="font-bold">${match.score} (Pen ${match.penaltyScore}, ${match.team2} WIN)</span>`;
        } else {
          resultDisplay = `<span class="font-bold">${match.score} (Invalid Pen)</span>`;
        }
      } else {
        resultDisplay = `<span class="font-bold">${match.score} (Draw)</span>`;
      }
    } else {
      resultDisplay = '<span class="badge badge-outline">Upcoming</span>';
    }
    
    const cardsDisplay = match.sport === 'Football' ? `
      <p class="text-lg">Yellow: ${match.yellowCards.team1}-${match.yellowCards.team2}</p>
      <p class="text-lg">Red: ${match.redCards.team1}-${match.redCards.team2}</p>
    ` : '';
    
    const venueDisplay = match.venue ? `${match.venue.name}` : 'No venue assigned';
    const groupDisplay = match.group ? `<p class="text-gray-800">Group: ${match.group}</p>` : '';
    const teamDisplay = match.sport === 'Athletics' ? match.team1 : `${match.team1} vs ${match.team2}`;
    
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
        <h3 class="font-medium text-gray-800">${teamDisplay}</h3>
        <div class="flex justify-between items-center mt-2 text-lg">
          <div>
            <p class="text-gray-800">${formatDate(match.time)}</p>
            ${cardsDisplay}
            <p class="text-gray-800">${venueDisplay}</p>
            <p class="text-gray-800">${match.round}</p>
            ${groupDisplay}
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
window.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing app...");
    
    if (document.getElementById('login-form')) {
        console.log("Loading venues for admin page");
        loadVenues();
    }

    if (document.getElementById('rounds-container') && document.querySelector('h1.text-4xl')?.textContent.includes('Schedule')) {
        console.log("Loading matches for schedule page");
        filterMatches('all');
    } else if (document.getElementById('results-container') || 
               (document.getElementById('rounds-container') && document.querySelector('h1.text-4xl')?.textContent.includes('Results'))) {
        console.log("Loading results page");
        filterResults('all');
    }
});