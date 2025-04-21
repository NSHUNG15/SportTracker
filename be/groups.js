async function loadGroupStandings() {
    const groupSelect = document.getElementById('group-select');
    const standingsTable = document.getElementById('standings-table');
    const noStandings = document.getElementById('no-standings');
    const groupName = groupSelect.value;

    try {
        const response = await fetch(`/group-standings/${groupName}`);
        const data = await response.json();

        if (data.error || !data.standings || data.standings.length === 0) {
            standingsTable.innerHTML = '';
            noStandings.classList.remove('hidden');
            return;
        }

        noStandings.classList.add('hidden');
        standingsTable.innerHTML = '';

        data.standings.forEach(standing => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="p-4">${standing.team}</td>
                <td class="p-4">${standing.played}</td>
                <td class="p-4">${standing.won}</td>
                <td class="p-4">${standing.drawn}</td>
                <td class="p-4">${standing.lost}</td>
                <td class="p-4">${standing.goalsFor}</td>
                <td class="p-4">${standing.goalsAgainst}</td>
                <td class="p-4">${standing.goalDifference}</td>
                <td class="p-4">${standing.points}</td>
                <td class="p-4">${standing.yellowCards}</td>
                <td class="p-4">${standing.redCards}</td>
            `;
            standingsTable.appendChild(row);
        });
    } catch (err) {
        console.error('Error loading standings:', err);
        standingsTable.innerHTML = '';
        noStandings.classList.remove('hidden');
    }
}

// Load standings for the default group (Group A) on page load
document.addEventListener('DOMContentLoaded', loadGroupStandings);