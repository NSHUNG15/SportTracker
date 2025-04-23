document.addEventListener('DOMContentLoaded', () => {
    // Add Generate Knockout Matches button to admin panel
    const adminControls = document.getElementById('admin-controls');
    if (adminControls) {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'mb-6 text-center';
        buttonContainer.innerHTML = `
            <button id="generate-knockout" class="btn btn-accent">Generate Knockout Matches</button>
        `;
        const matchManagement = adminControls.querySelector('div.mb-10.text-center');
        if (matchManagement) {
            matchManagement.insertAdjacentElement('afterend', buttonContainer);
        }

        document.getElementById('generate-knockout')?.addEventListener('click', generateKnockoutMatches);
    }
});

async function generateKnockoutMatches() {
    try {
        // Fetch all matches
        const data = await fetchMatches();
        if (!data.matches || data.matches.length === 0) {
            showToast('No matches found', 'error');
            return;
        }

        // Filter completed Round of 16 football matches
        const round16Matches = data.matches.filter(match => 
            match.sport === 'Football' && 
            match.round === 'Vòng 1/8' && 
            match.status === 'Completed' && 
            match.score
        );

        if (round16Matches.length < 8) {
            showToast(`Only ${round16Matches.length}/8 Round of 16 matches completed. Need 8 to generate knockout rounds.`, 'warning');
            return;
        }

        // Determine winners
        const winners = round16Matches.map(match => {
            const scores = match.score.split('-').map(s => parseInt(s.trim()));
            if (scores[0] > scores[1]) {
                return match.team1;
            } else if (scores[1] > scores[0]) {
                return match.team2;
            } else if (match.penaltyScore) {
                const penScores = match.penaltyScore.split('-').map(s => parseInt(s.trim()));
                return penScores[0] > penScores[1] ? match.team1 : match.team2;
            }
            return null;
        }).filter(winner => winner);

        if (winners.length !== 8) {
            showToast('Could not determine 8 winners from Round of 16', 'error');
            return;
        }

        // Fetch venues
        const venueResponse = await fetch('/venues');
        const venueData = await venueResponse.json();
        const footballVenues = venueData.venues.filter(v => v.sport === 'Football');
        const stadium1 = footballVenues.find(v => v.name.toLowerCase().includes('stadium 1')) || footballVenues[0];
        const stadium2 = footballVenues.find(v => v.name.toLowerCase().includes('stadium 2')) || footballVenues[1] || stadium1;

        if (!stadium1) {
            showToast('No football venues found', 'error');
            return;
        }

        // Define match schedules
        const knockoutMatches = [
            // Quarter-finals: May 6, 2025
            {
                round: 'Tứ Kết 1',
                team1: winners[0],
                team2: winners[1],
                time: new Date('2025-05-06T20:30:00').toISOString(),
                venue: stadium1._id,
            },
            {
                round: 'Tứ Kết 2',
                team1: winners[2],
                team2: winners[3],
                time: new Date('2025-05-06T20:30:00').toISOString(),
                venue: stadium2._id,
            },
            {
                round: 'Tứ Kết 3',
                team1: winners[4],
                team2: winners[5],
                time: new Date('2025-05-06T21:30:00').toISOString(),
                venue: stadium1._id,
            },
            {
                round: 'Tứ Kết 4',
                team1: winners[6],
                team2: winners[7],
                time: new Date('2025-05-06T21:30:00').toISOString(),
                venue: stadium2._id,
            },
            // Semi-finals: May 8, 2025
            {
                round: 'Bán Kết 1',
                team1: 'Winner Tứ Kết 1',
                team2: 'Winner Tứ Kết 4',
                time: new Date('2025-05-08T20:30:00').toISOString(),
                venue: stadium1._id,
            },
            {
                round: 'Bán Kết 2',
                team1: 'Winner Tứ Kết 2',
                team2: 'Winner Tứ Kết 3',
                time: new Date('2025-05-08T21:30:00').toISOString(),
                venue: stadium1._id,
            },
            // Third Place Playoff: May 10, 2025
            {
                round: 'Tranh Hạng 3',
                team1: 'Loser Bán Kết 1',
                team2: 'Loser Bán Kết 2',
                time: new Date('2025-05-10T17:30:00').toISOString(),
                venue: stadium1._id,
            },
            // Final: May 10, 2025
            {
                round: 'Chung Kết',
                team1: 'Winner Bán Kết 1',
                team2: 'Winner Bán Kết 2',
                time: new Date('2025-05-10T18:30:00').toISOString(),
                venue: stadium1._id,
            }
        ];

        // Save matches to database
        for (const match of knockoutMatches) {
            const matchData = {
                sport: 'Football',
                eventType: 'Đội nam',
                team1: match.team1,
                team2: match.team2,
                score: '',
                penaltyScore: '',
                duration: '',
                yellowCards: { team1: 0, team2: 0 },
                redCards: { team1: 0, team2: 0 },
                time: match.time,
                round: match.round,
                status: 'Upcoming',
                venue: match.venue,
                group: null
            };

            const response = await fetch('/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(matchData)
            });

            const result = await response.json();
            if (!result.success) {
                showToast(`Error saving ${match.round}: ${result.error}`, 'error');
                return;
            }
        }

        // Refresh match list
        await loadAdminMatches('Football');
        showToast('Knockout matches generated successfully', 'success');
    } catch (error) {
        console.error('Error generating knockout matches:', error);
        showToast('Error generating knockout matches', 'error');
    }
}