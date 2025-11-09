// Tournament Viewing System (Read-Only)

let tournamentData = {
    id: null,
    numTeams: 8,
    teams: [],
    matches: [],
    title: "SVGE Mini Tournament",
    description: "Join us for an exciting tournament! Battle it out with other teams to claim victory.",
    date: "November 9 - November 9, 2025"
};

let teamInfoModal;
let currentTournamentId = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    teamInfoModal = new bootstrap.Modal(document.getElementById('teamInfoModal'));
    
    // Get tournament ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentTournamentId = urlParams.get('id');
    
    if (!currentTournamentId) {
        // Show error if no tournament ID
        document.getElementById('bracketContainer').innerHTML = '<div class="alert alert-warning">No tournament specified.</div>';
        return;
    }
    
    // Load saved data from API
    await loadData();
    
    // Update tournament info display
    updateTournamentInfo();
    
    // Generate bracket
    generateBracket();
});

// Update tournament information display
function updateTournamentInfo() {
    document.getElementById('tournamentTitle').textContent = tournamentData.title || "SVGE Tournament";
    document.getElementById('tournamentDescription').textContent = tournamentData.description || "Tournament details will be announced soon.";
    document.getElementById('tournamentDate').textContent = tournamentData.date || "TBA";
}

// Generate the tournament bracket (view-only)
function generateBracket() {
    const numTeams = tournamentData.numTeams || 8;
    const container = document.getElementById('bracketContainer');
    container.innerHTML = '';
    
    const rounds = Math.log2(numTeams);
    
    // Create rounds
    for (let round = 0; round < rounds; round++) {
        const roundDiv = createRound(round, rounds, numTeams);
        container.appendChild(roundDiv);
    }
    
    // Add championship round
    const championshipDiv = createChampionshipRound();
    container.appendChild(championshipDiv);
}

// Create a round div
function createRound(roundNum, totalRounds, numTeams) {
    const roundDiv = document.createElement('div');
    roundDiv.className = 'bracket-round';
    roundDiv.setAttribute('data-round', roundNum);
    
    // Round title
    const title = document.createElement('div');
    title.className = 'round-title';
    
    if (roundNum === 0) {
        title.textContent = 'Round 1';
    } else if (roundNum === totalRounds - 1) {
        title.textContent = 'Semi Finals';
    } else {
        title.textContent = `Round ${roundNum + 1}`;
    }
    
    roundDiv.appendChild(title);
    
    // Calculate number of matches in this round
    const matchesInRound = numTeams / Math.pow(2, roundNum + 1);
    
    // Create matches
    for (let i = 0; i < matchesInRound; i++) {
        const match = createMatch(roundNum, i, numTeams);
        roundDiv.appendChild(match);
    }
    
    return roundDiv;
}

// Create championship round
function createChampionshipRound() {
    const roundDiv = document.createElement('div');
    roundDiv.className = 'bracket-round championship';
    roundDiv.setAttribute('data-round', 'final');
    
    const title = document.createElement('div');
    title.className = 'round-title';
    title.innerHTML = '<i class="fa fa-trophy"></i> Championship';
    
    roundDiv.appendChild(title);
    
    const match = createMatch('final', 0, tournamentData.numTeams);
    roundDiv.appendChild(match);
    
    return roundDiv;
}

// Create a match card (view-only)
function createMatch(roundNum, matchNum, numTeams) {
    const matchDiv = document.createElement('div');
    matchDiv.className = 'match';
    matchDiv.setAttribute('data-round', roundNum);
    matchDiv.setAttribute('data-match', matchNum);
    
    // For first round, assign teams
    if (roundNum === 0) {
        const team1Index = matchNum * 2;
        const team2Index = matchNum * 2 + 1;
        
        const team1 = createTeamSlot(team1Index);
        const team2 = createTeamSlot(team2Index);
        
        matchDiv.appendChild(team1);
        matchDiv.appendChild(team2);
        
        // Check if there's a winner set for round 0
        const matchKey = `${roundNum}-${matchNum}`;
        if (tournamentData.matches && tournamentData.matches[matchKey]) {
            const matchData = tournamentData.matches[matchKey];
            if (matchData.winner !== undefined && matchData.winner !== null) {
                markWinner(matchDiv, matchData.winner);
            }
        }
    } else {
        // Empty slots for later rounds
        const team1 = createTeamSlot(null);
        const team2 = createTeamSlot(null);
        
        matchDiv.appendChild(team1);
        matchDiv.appendChild(team2);
        
        // Check if there's a winner set
        const matchKey = `${roundNum}-${matchNum}`;
        if (tournamentData.matches && tournamentData.matches[matchKey]) {
            const matchData = tournamentData.matches[matchKey];
            if (matchData.team1 !== undefined) {
                updateTeamSlot(team1, matchData.team1);
            }
            if (matchData.team2 !== undefined) {
                updateTeamSlot(team2, matchData.team2);
            }
            if (matchData.winner !== undefined && matchData.winner !== null) {
                markWinner(matchDiv, matchData.winner);
            }
        }
    }
    
    return matchDiv;
}

// Create a team slot
function createTeamSlot(teamIndex) {
    const teamDiv = document.createElement('div');
    teamDiv.className = 'team';
    
    if (teamIndex !== null && tournamentData.teams[teamIndex]) {
        const team = tournamentData.teams[teamIndex];
        teamDiv.textContent = team.name;
        // Use the team's actual ID property, not the array index
        teamDiv.setAttribute('data-team-id', team.id);
        
        if (team.eliminated) {
            teamDiv.classList.add('eliminated');
        }
        
        // Make clickable to show team info
        teamDiv.style.cursor = 'pointer';
        teamDiv.onclick = () => showTeamInfo(teamIndex);
    } else {
        teamDiv.textContent = 'TBD';
        teamDiv.classList.add('empty');
    }
    
    return teamDiv;
}

// Update team slot with team data
function updateTeamSlot(teamDiv, teamId) {
    if (teamId !== null && tournamentData.teams[teamId]) {
        const team = tournamentData.teams[teamId];
        teamDiv.textContent = team.name;
        teamDiv.setAttribute('data-team-id', teamId);
        teamDiv.classList.remove('empty');
        
        if (team.eliminated) {
            teamDiv.classList.add('eliminated');
        }
        
        // Make clickable
        teamDiv.style.cursor = 'pointer';
        teamDiv.onclick = () => showTeamInfo(teamId);
    }
}

// Mark winner in match
function markWinner(matchDiv, winnerTeamId) {
    const teams = matchDiv.querySelectorAll('.team');
    teams.forEach((team) => {
        const teamId = team.getAttribute('data-team-id');
        if (teamId) {
            const teamIdNum = parseInt(teamId);
            if (teamIdNum === winnerTeamId) {
                team.classList.add('winner');
            } else {
                team.classList.add('eliminated');
            }
        }
    });
}

// Show team information (view-only)
function showTeamInfo(teamId) {
    if (teamId === null || teamId === undefined) {
        return;
    }
    
    const teamData = tournamentData.teams[teamId];
    if (!teamData) {
        return;
    }
    
    document.getElementById('teamInfoTitle').textContent = teamData.name;
    
    const discordElement = document.getElementById('teamInfoDiscord');
    if (teamData.captain && teamData.captain.trim() !== '') {
        discordElement.textContent = teamData.captain;
        discordElement.style.background = '#5865F2';
        discordElement.style.color = 'white';
        discordElement.style.padding = '8px 12px';
        discordElement.style.borderRadius = '5px';
        discordElement.style.display = 'inline-block';
    } else {
        discordElement.textContent = 'Not set';
        discordElement.style.background = '#6c757d';
        discordElement.style.color = 'white';
        discordElement.style.padding = '8px 12px';
        discordElement.style.borderRadius = '5px';
        discordElement.style.display = 'inline-block';
    }
    
    const gameIdElement = document.getElementById('teamInfoGameId');
    if (teamData.gameId && teamData.gameId.trim() !== '') {
        gameIdElement.textContent = teamData.gameId;
        gameIdElement.style.background = '#28a745';
        gameIdElement.style.color = 'white';
        gameIdElement.style.padding = '8px 12px';
        gameIdElement.style.borderRadius = '5px';
        gameIdElement.style.display = 'inline-block';
    } else {
        gameIdElement.textContent = 'Not set';
        gameIdElement.style.background = '#6c757d';
        gameIdElement.style.color = 'white';
        gameIdElement.style.padding = '8px 12px';
        gameIdElement.style.borderRadius = '5px';
        gameIdElement.style.display = 'inline-block';
    }
    
    teamInfoModal.show();
}

// Load tournament data from API
async function loadData() {
    try {
        const data = await TournamentAPI.getTournament(currentTournamentId);
        if (data) {
            tournamentData = {...tournamentData, ...data};
        } else {
            // Tournament not found
            document.getElementById('bracketContainer').innerHTML = '<div class="alert alert-danger">Tournament not found.</div>';
        }
    } catch (e) {
        console.error('Error loading tournament data:', e);
        document.getElementById('bracketContainer').innerHTML = '<div class="alert alert-danger">Error loading tournament data. Please try again later.</div>';
    }
}

// Initialize default tournament data
function initializeDefaultData() {
    tournamentData.teams = [];
    for (let i = 0; i < tournamentData.numTeams; i++) {
        tournamentData.teams.push({
            id: i,
            name: `Team ${i + 1}`,
            captain: '',
            gameId: '',
            eliminated: false
        });
    }
    tournamentData.matches = {};
}
