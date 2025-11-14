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
    
    const isDoubleElim = tournamentData.bracketType === 'double';
    
    if (isDoubleElim) {
        // Double elimination layout - horizontal layout with grand finals on the right
        const mainContainer = document.createElement('div');
        mainContainer.className = 'd-flex gap-4';
        
        // Left side: Winners and Losers brackets stacked
        const bracketsColumn = document.createElement('div');
        bracketsColumn.className = 'd-flex flex-column gap-4 flex-grow-1';
        
        // Winners Bracket
        const winnersContainer = document.createElement('div');
        winnersContainer.innerHTML = '<h4 class="text-center mb-3">Winners Bracket</h4>';
        const winnersBracket = document.createElement('div');
        winnersBracket.id = 'winnersBracket';
        winnersBracket.className = 'd-flex gap-3';
        winnersContainer.appendChild(winnersBracket);
        
        const rounds = Math.log2(numTeams);
        
        // Create winners rounds
        for (let round = 0; round < rounds; round++) {
            const roundDiv = createRound(round, rounds, numTeams, 'winners');
            winnersBracket.appendChild(roundDiv);
        }
        
        bracketsColumn.appendChild(winnersContainer);
        
        // Losers Bracket
        const losersContainer = document.createElement('div');
        losersContainer.innerHTML = '<h4 class="text-center mb-3">Losers Bracket</h4>';
        const losersBracket = document.createElement('div');
        losersBracket.id = 'losersBracket';
        losersBracket.className = 'd-flex gap-3';
        losersContainer.appendChild(losersBracket);
        
        // Create losers rounds
        const losersRounds = (rounds - 1) * 2;
        for (let round = 0; round < losersRounds; round++) {
            const roundDiv = createLosersRound(round, numTeams);
            losersBracket.appendChild(roundDiv);
        }
        
        bracketsColumn.appendChild(losersContainer);
        mainContainer.appendChild(bracketsColumn);
        
        // Right side: Grand Finals
        const finalsDiv = createGrandFinals();
        mainContainer.appendChild(finalsDiv);
        
        container.appendChild(mainContainer);
    } else {
        // Single elimination layout
        const rounds = Math.log2(numTeams);
        
        // Create rounds
        for (let round = 0; round < rounds; round++) {
            const roundDiv = createRound(round, rounds, numTeams, 'single');
            container.appendChild(roundDiv);
        }
    }
}

// Create a round div
function createRound(roundNum, totalRounds, numTeams, bracketType = 'single') {
    const roundDiv = document.createElement('div');
    roundDiv.className = 'bracket-round';
    roundDiv.setAttribute('data-round', roundNum);
    
    // Round title
    const title = document.createElement('div');
    title.className = 'round-title';
    
    if (roundNum === 0) {
        title.textContent = 'Round 1';
    } else if (roundNum === totalRounds - 1) {
        // Last round is Finals
        const isDoubleElim = bracketType === 'winners';
        title.textContent = isDoubleElim ? 'Upper Finals' : 'Finals';
        // Only add championship class for single elimination finals
        if (!isDoubleElim) {
            roundDiv.className = 'bracket-round championship';
        }
    } else {
        title.textContent = `Round ${roundNum + 1}`;
    }
    
    roundDiv.appendChild(title);
    
    // Calculate number of matches in this round
    const matchesInRound = numTeams / Math.pow(2, roundNum + 1);
    
    // Create matches
    for (let i = 0; i < matchesInRound; i++) {
        const matchKey = bracketType === 'winners' ? `w${roundNum}-${i}` : `${roundNum}-${i}`;
        const match = createMatchWithKey(matchKey, roundNum, i);
        roundDiv.appendChild(match);
    }
    
    return roundDiv;
}

// Create losers bracket round
function createLosersRound(roundNum, numTeams) {
    const roundDiv = document.createElement('div');
    roundDiv.className = 'bracket-round';
    roundDiv.setAttribute('data-losers-round', roundNum);
    
    const title = document.createElement('div');
    title.className = 'round-title';
    
    // Calculate total losers rounds
    const winnersRounds = Math.log2(numTeams);
    const totalLosersRounds = (winnersRounds - 1) * 2;
    
    if (roundNum === totalLosersRounds - 1) {
        title.textContent = 'Losers Final';
        // No championship styling for losers final in double elim
    } else {
        title.textContent = `Losers ${roundNum + 1}`;
    }
    
    roundDiv.appendChild(title);
    
    // Calculate matches
    const initialMatches = numTeams / 4;
    const halvingFactor = Math.floor(roundNum / 2);
    const matchesInRound = initialMatches / Math.pow(2, halvingFactor);
    
    for (let i = 0; i < matchesInRound; i++) {
        const matchKey = `l${roundNum}-${i}`;
        const match = createMatchWithKey(matchKey, roundNum, i);
        roundDiv.appendChild(match);
    }
    
    return roundDiv;
}

// Create grand finals
function createGrandFinals() {
    const roundDiv = document.createElement('div');
    roundDiv.className = 'bracket-round championship mt-4';
    
    const title = document.createElement('div');
    title.className = 'round-title';
    title.textContent = 'Grand Finals';
    
    roundDiv.appendChild(title);
    
    const match = createMatchWithKey('final', 'final', 0);
    roundDiv.appendChild(match);
    
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

// Create a match card with custom key (for double elimination)
function createMatchWithKey(matchKey, roundNum, matchNum) {
    const matchDiv = document.createElement('div');
    matchDiv.className = 'match';
    matchDiv.setAttribute('data-round', roundNum);
    matchDiv.setAttribute('data-match', matchNum);
    
    const isLosersBracket = matchKey.startsWith('l');
    
    // Check which data structure to use
    const matchData = isLosersBracket ? 
        (tournamentData.losersMatches && tournamentData.losersMatches[matchKey]) : 
        (tournamentData.matches && tournamentData.matches[matchKey]);
    
    // Create team slots
    const team1 = createTeamSlot(null);
    const team2 = createTeamSlot(null);
    
    matchDiv.appendChild(team1);
    matchDiv.appendChild(team2);
    
    // Fill in team data if available
    if (matchData) {
        if (matchData.team1 !== undefined && matchData.team1 !== null) {
            updateTeamSlot(team1, matchData.team1);
        }
        if (matchData.team2 !== undefined && matchData.team2 !== null) {
            updateTeamSlot(team2, matchData.team2);
        }
        if (matchData.winner !== undefined && matchData.winner !== null) {
            markWinner(matchDiv, matchData.winner);
        }
        
        // Display scores if they exist
        if (matchData.score1 !== undefined && matchData.score1 !== null && 
            matchData.score2 !== undefined && matchData.score2 !== null) {
            const scoresDiv = document.createElement('div');
            scoresDiv.className = 'match-scores';
            scoresDiv.innerHTML = `<span class="score">${matchData.score1} - ${matchData.score2}</span>`;
            matchDiv.appendChild(scoresDiv);
        }
    }
    
    return matchDiv;
}

// Create a match card (view-only) - legacy for single elimination
function createMatch(roundNum, matchNum, numTeams) {
    const matchKey = `${roundNum}-${matchNum}`;
    return createMatchWithKey(matchKey, roundNum, matchNum);
}

// Helper: Get team by ID property
function getTeamById(teamId) {
    if (teamId === null || teamId === undefined || !tournamentData.teams) {
        return null;
    }
    return tournamentData.teams.find(t => t.id === teamId);
}

// Create a team slot
function createTeamSlot(teamId) {
    const teamDiv = document.createElement('div');
    teamDiv.className = 'team';
    
    const team = getTeamById(teamId);
    if (teamId !== null && team) {
        teamDiv.textContent = team.name;
        // Use the team's actual ID property
        teamDiv.setAttribute('data-team-id', team.id);
        
        if (team.eliminated) {
            teamDiv.classList.add('eliminated');
        }
        
        // Make clickable to show team info
        teamDiv.style.cursor = 'pointer';
        teamDiv.onclick = () => showTeamInfo(teamId);
    } else {
        teamDiv.textContent = 'TBD';
        teamDiv.classList.add('empty');
    }
    
    return teamDiv;
}

// Update team slot with team data
function updateTeamSlot(teamDiv, teamId) {
    const team = getTeamById(teamId);
    if (teamId !== null && team) {
        teamDiv.textContent = team.name;
        teamDiv.setAttribute('data-team-id', teamId);
        teamDiv.classList.remove('empty');
        
        if (team.eliminated) {
            teamDiv.classList.add('eliminated');
        }
        
        // Make clickable
        teamDiv.style.cursor = 'pointer';
        const teamIndex = tournamentData.teams.findIndex(t => t.id === teamId);
        teamDiv.onclick = () => showTeamInfo(teamIndex >= 0 ? teamIndex : teamId);
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
