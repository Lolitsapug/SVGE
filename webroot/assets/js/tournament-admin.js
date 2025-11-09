// Tournament Administration System

let tournamentData = {
    id: null,
    numTeams: 8,
    teams: [],
    matches: {},
    losersMatches: {},
    bracketType: "single", // "single" or "double"
    title: "SVGE Mini Tournament",
    description: "Join us for an exciting tournament! Battle it out with other teams to claim victory.",
    date: "November 9 - November 9, 2025",
    status: "ongoing",
    image: "assets/img/bracket.png"
};

let selectedBracketSlot = null;
let currentModalSlot = null;
let teamAssignModal;
let currentTournamentId = null;

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async function() {
    checkAuth();
    
    // Get tournament ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentTournamentId = urlParams.get('id');
    
    if (!currentTournamentId) {
        // Generate new tournament ID
        currentTournamentId = 'tournament_' + Date.now();
    }
    
    tournamentData.id = currentTournamentId;
    
    await loadData();
    updateFormFields();
    generateTeamEditor();
    generateTeamPool();
    generateBracket();
    
    // Initialize modal
    teamAssignModal = new bootstrap.Modal(document.getElementById('teamAssignModal'));
});

// Check if user is authenticated
function checkAuth() {
    const isAuth = sessionStorage.getItem('adminAuth');
    const authTime = sessionStorage.getItem('authTime');
    
    // Check if auth exists and is less than 2 hours old
    if (!isAuth || !authTime || (Date.now() - parseInt(authTime)) > 7200000) {
        window.location.href = 'admin-login.html';
    }
}

// Logout function
function logout() {
    sessionStorage.removeItem('adminAuth');
    sessionStorage.removeItem('authTime');
    window.location.href = 'admin-login.html';
}

// Load tournament data
async function loadData() {
    try {
        const data = await TournamentAPI.getTournament(currentTournamentId);
        if (data) {
            tournamentData = {...tournamentData, ...data};
        } else {
            // Tournament doesn't exist, initialize with defaults
            initializeDefaultData();
        }
    } catch (e) {
        console.error('Error loading data:', e);
        initializeDefaultData();
    }
}

// Initialize default data
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

// Update form fields with current data
function updateFormFields() {
    document.getElementById('tournamentTitle').value = tournamentData.title || '';
    document.getElementById('tournamentDescription').value = tournamentData.description || '';
    document.getElementById('tournamentDate').value = tournamentData.date || '';
    document.getElementById('tournamentStatus').value = tournamentData.status || 'ongoing';
    document.getElementById('tournamentImage').value = tournamentData.image || 'assets/img/bracket.png';
    document.getElementById('numTeams').value = tournamentData.numTeams || 8;
    document.getElementById('bracketType').value = tournamentData.bracketType || 'single';
    
    // Display current tournament ID
    if (document.getElementById('currentTournamentId')) {
        document.getElementById('currentTournamentId').textContent = currentTournamentId || 'Unknown';
    }
}

// Handle team count change
function handleTeamCountChange() {
    const numTeams = parseInt(document.getElementById('numTeams').value);
    
    if (confirm(`Changing team count will reset the bracket. Continue?`)) {
        tournamentData.numTeams = numTeams;
        initializeDefaultData();
        generateTeamEditor();
        generateBracket();
    } else {
        document.getElementById('numTeams').value = tournamentData.numTeams;
    }
}

// Handle bracket type change
function handleBracketTypeChange() {
    const bracketType = document.getElementById('bracketType').value;
    
    if (confirm(`Changing bracket type will reset the bracket. Continue?`)) {
        tournamentData.bracketType = bracketType;
        initializeDefaultData();
        generateBracket();
        
        // Show info about double elimination
        if (bracketType === 'double') {
            alert('Double Elimination: Teams get a second chance! Losers move to the losers bracket.');
        }
    } else {
        document.getElementById('bracketType').value = tournamentData.bracketType;
    }
}

// Generate team editor
function generateTeamEditor() {
    const editor = document.getElementById('teamEditor');
    editor.innerHTML = '';
    
    tournamentData.teams.forEach((team, index) => {
        const teamItem = document.createElement('div');
        teamItem.className = 'team-item';
        teamItem.innerHTML = `
            <h6>Team ${index + 1}</h6>
            <div class="row">
                <div class="col-md-4">
                    <label class="form-label">Team Name</label>
                    <input type="text" class="form-control form-control-sm" 
                           value="${team.name}" 
                           onchange="updateTeamName(${index}, this.value)">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Captain's Discord</label>
                    <input type="text" class="form-control form-control-sm" 
                           value="${team.captain || ''}" 
                           placeholder="username#1234"
                           onchange="updateTeamCaptain(${index}, this.value)">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Captain's Game ID</label>
                    <input type="text" class="form-control form-control-sm" 
                           value="${team.gameId || ''}" 
                           placeholder="gameuser#1234"
                           onchange="updateTeamGameId(${index}, this.value)">
                </div>
            </div>
        `;
        editor.appendChild(teamItem);
    });
}

// Update team name
function updateTeamName(index, value) {
    tournamentData.teams[index].name = value;
    generateBracket();
}

// Update team captain
function updateTeamCaptain(index, value) {
    tournamentData.teams[index].captain = value;
}

// Update team game ID
function updateTeamGameId(index, value) {
    tournamentData.teams[index].gameId = value;
}

// Randomize bracket
function randomizeBracket() {
    if (confirm('This will randomize all team positions and assign them to the first round. Continue?')) {
        // Fisher-Yates shuffle
        for (let i = tournamentData.teams.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tournamentData.teams[i], tournamentData.teams[j]] = [tournamentData.teams[j], tournamentData.teams[i]];
        }
        
        // Reset matches and losers matches
        tournamentData.matches = {};
        if (tournamentData.losersMatches) {
            tournamentData.losersMatches = {};
        }
        
        // Assign teams to first round matches
        const isDoubleElim = tournamentData.bracketType === 'double';
        const numFirstRoundMatches = tournamentData.numTeams / 2;
        
        for (let matchNum = 0; matchNum < numFirstRoundMatches; matchNum++) {
            const team1Index = matchNum * 2;
            const team2Index = matchNum * 2 + 1;
            
            // For double elimination, use 'w0-X' format, otherwise '0-X'
            const matchKey = isDoubleElim ? `w0-${matchNum}` : `0-${matchNum}`;
            
            tournamentData.matches[matchKey] = {
                team1: tournamentData.teams[team1Index].id,
                team2: tournamentData.teams[team2Index].id,
                winner: null,
                score1: null,
                score2: null
            };
        }
        
        generateBracket();
        showSaveIndicator('Teams randomized and assigned to first round!', 'success');
    }
}

// Reset bracket
function resetBracket() {
    if (confirm('This will reset the entire bracket and all progress. Continue?')) {
        initializeDefaultData();
        generateTeamEditor();
        generateTeamPool();
        generateBracket();
        showSaveIndicator('Bracket reset!', 'success');
    }
}

// Generate team pool
function generateTeamPool() {
    const pool = document.getElementById('teamPool');
    if (!pool) {
        console.error('Team pool container not found');
        return;
    }
    
    pool.innerHTML = '';
    
    tournamentData.teams.forEach((team, index) => {
        const isAssigned = isTeamAssignedToBracket(index);
        
        const teamDiv = document.createElement('div');
        teamDiv.className = `pool-team ${isAssigned ? 'assigned' : ''}`;
        teamDiv.setAttribute('data-team-id', index);
        teamDiv.innerHTML = `
            <span class="pool-team-name">${team.name}</span>
            <span class="pool-team-badge">#${index + 1}</span>
        `;
        
        pool.appendChild(teamDiv);
    });
}

// Check if team is assigned to bracket
function isTeamAssignedToBracket(teamId) {
    // Check if team is in any match
    for (let matchKey in tournamentData.matches) {
        const match = tournamentData.matches[matchKey];
        if (match.team1 === teamId || match.team2 === teamId) {
            return true;
        }
    }
    return false;
}

// Open team assignment modal
function openTeamAssignModal(matchKey, slotType, matchNum, roundNum) {
    try {
        currentModalSlot = { matchKey, slotType };
        
        // Ensure modal is initialized
        if (!teamAssignModal) {
            teamAssignModal = new bootstrap.Modal(document.getElementById('teamAssignModal'));
        }
        
        // Update modal info
        const roundText = roundNum === 'final' ? 'Championship' : `Round ${parseInt(roundNum) + 1}`;
        document.getElementById('modalMatchInfo').textContent = `${roundText} - Match ${matchNum + 1}`;
        document.getElementById('modalSlotInfo').textContent = slotType === 'team1' ? 'Team 1 (Top)' : 'Team 2 (Bottom)';
        
        // Get current team
        let currentTeamId = null;
        if (tournamentData.matches[matchKey]) {
            currentTeamId = tournamentData.matches[matchKey][slotType];
        }
        
        // Display current team
        const currentTeamDiv = document.getElementById('modalCurrentTeam');
        if (currentTeamId !== null && currentTeamId !== undefined && tournamentData.teams[currentTeamId]) {
            const team = tournamentData.teams[currentTeamId];
            currentTeamDiv.className = 'alert alert-success';
            currentTeamDiv.innerHTML = `
                <strong>${team.name}</strong><br>
                <small><i class="fa fa-user"></i> Discord: ${team.captain || 'Not set'}</small><br>
                <small><i class="fa fa-gamepad"></i> Game ID: ${team.gameId || 'Not set'}</small>
            `;
        } else {
            currentTeamDiv.className = 'alert alert-info';
            currentTeamDiv.textContent = 'No team assigned';
        }
        
        // Generate team selection list
        generateTeamSelectionList(currentTeamId);
        
        // Show modal
        teamAssignModal.show();
    } catch (e) {
        console.error('Error opening team assignment modal:', e);
        alert('Error opening team assignment modal. Check console for details.');
    }
}

// Generate team selection list in modal
function generateTeamSelectionList(currentTeamId) {
    const list = document.getElementById('teamSelectionList');
    list.innerHTML = '';
    
    tournamentData.teams.forEach((team, index) => {
        const isAssigned = isTeamAssignedToBracket(index);
        const isCurrent = currentTeamId === index;
        
        const teamItem = document.createElement('div');
        teamItem.className = `team-select-item ${isAssigned && !isCurrent ? 'assigned' : ''} ${isCurrent ? 'selected' : ''}`;
        
        teamItem.innerHTML = `
            <div class="team-select-header">
                <span class="team-select-name">${team.name}</span>
                <span class="team-select-badge">Team #${index + 1}</span>
            </div>
            <div class="team-select-details">
                <div><i class="fa fa-user"></i> Discord: ${team.captain || 'Not set'}</div>
                <div><i class="fa fa-gamepad"></i> Game ID: ${team.gameId || 'Not set'}</div>
                ${isAssigned && !isCurrent ? '<div class="text-danger"><i class="fa fa-exclamation-triangle"></i> Already assigned to bracket</div>' : ''}
            </div>
        `;
        
        if (!isAssigned || isCurrent) {
            teamItem.onclick = () => assignTeamFromModal(index);
        }
        
        list.appendChild(teamItem);
    });
}

// Assign team from modal
function assignTeamFromModal(teamId) {
    try {
        if (!currentModalSlot) {
            console.error('No modal slot selected');
            return;
        }
        
        const { matchKey, slotType } = currentModalSlot;
        
        console.log('Assigning team', teamId, 'to', matchKey, slotType);
        
        // Update match data
        if (!tournamentData.matches[matchKey]) {
            tournamentData.matches[matchKey] = {};
        }
        
        tournamentData.matches[matchKey][slotType] = teamId;
        
        console.log('Updated matches:', tournamentData.matches);
        
        // Close modal
        teamAssignModal.hide();
        currentModalSlot = null;
        
        // Refresh displays after modal is fully hidden
        const modalElement = document.getElementById('teamAssignModal');
        modalElement.addEventListener('hidden.bs.modal', function handler() {
            console.log('Modal hidden, refreshing bracket');
            try {
                generateTeamPool();
                generateBracket();
                showSaveIndicator('Team assigned!', 'success');
            } catch (e) {
                console.error('Error refreshing bracket:', e);
                alert('Error refreshing bracket: ' + e.message);
            }
            modalElement.removeEventListener('hidden.bs.modal', handler);
        }, { once: true });
        
    } catch (e) {
        console.error('Error in assignTeamFromModal:', e);
        alert('Error assigning team: ' + e.message);
    }
}

// Clear team from modal
function clearTeamFromModal() {
    try {
        if (!currentModalSlot) return;
        
        const { matchKey, slotType } = currentModalSlot;
        
        if (tournamentData.matches[matchKey]) {
            delete tournamentData.matches[matchKey][slotType];
            
            // Clear winner if this team was the winner
            if (tournamentData.matches[matchKey].winner !== undefined) {
                delete tournamentData.matches[matchKey].winner;
            }
        }
        
        // Close modal
        teamAssignModal.hide();
        currentModalSlot = null;
        
        // Refresh displays after modal is fully hidden
        const modalElement = document.getElementById('teamAssignModal');
        modalElement.addEventListener('hidden.bs.modal', function handler() {
            try {
                generateTeamPool();
                generateBracket();
                showSaveIndicator('Team cleared!', 'success');
            } catch (e) {
                console.error('Error refreshing bracket:', e);
            }
            modalElement.removeEventListener('hidden.bs.modal', handler);
        }, { once: true });
        
    } catch (e) {
        console.error('Error in clearTeamFromModal:', e);
        alert('Error clearing team: ' + e.message);
    }
}

// Generate bracket (admin version with winner selection)
function generateBracket() {
    const container = document.getElementById('bracketContainer');
    if (!container) {
        console.error('Bracket container not found');
        return;
    }
    
    const numTeams = tournamentData.numTeams;
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
        
        // Create losers rounds (more complex structure)
        const losersRounds = (rounds - 1) * 2; // Losers bracket has more rounds
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
        
        // Create rounds (finals is the last round, no separate championship)
        for (let round = 0; round < rounds; round++) {
            const roundDiv = createRound(round, rounds, numTeams, 'single');
            container.appendChild(roundDiv);
        }
    }
}

// Create round
function createRound(roundNum, totalRounds, numTeams, bracketType = 'single') {
    const roundDiv = document.createElement('div');
    roundDiv.className = 'bracket-round';
    
    const title = document.createElement('div');
    title.className = 'round-title';
    
    if (roundNum === 0) {
        title.textContent = 'Round 1';
    } else if (roundNum === totalRounds - 1) {
        // Last round is Finals
        // For double elim, call it "Upper Finals", for single elim just "Finals"
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
    
    const matchesInRound = numTeams / Math.pow(2, roundNum + 1);
    
    for (let i = 0; i < matchesInRound; i++) {
        const matchKey = bracketType === 'winners' ? `w${roundNum}-${i}` : `${roundNum}-${i}`;
        const match = createMatchWithKey(matchKey, roundNum, i, numTeams);
        roundDiv.appendChild(match);
    }
    
    return roundDiv;
}

// Create losers bracket round
function createLosersRound(roundNum, numTeams) {
    const roundDiv = document.createElement('div');
    roundDiv.className = 'bracket-round';
    
    const title = document.createElement('div');
    title.className = 'round-title';
    
    // Calculate total losers rounds to check if this is the last one
    const winnersRounds = Math.log2(numTeams);
    const totalLosersRounds = (winnersRounds - 1) * 2;
    
    if (roundNum === totalLosersRounds - 1) {
        // Last losers round is "Losers Final" (no championship styling)
        title.textContent = 'Losers Final';
    } else {
        title.textContent = `Losers ${roundNum + 1}`;
    }
    
    roundDiv.appendChild(title);
    
    // Losers bracket structure:
    // The pattern alternates: same count, then halve, repeat
    // For 8 teams: L0(2), L1(2), L2(1), L3(1)
    // For 16 teams: L0(4), L1(4), L2(2), L3(2), L4(1), L5(1)
    // For 32 teams: L0(8), L1(8), L2(4), L3(4), L4(2), L5(2), L6(1), L7(1)
    //
    // Formula: matches = (numTeams / 4) / 2^floor(roundNum/2)
    
    let matchesInRound;
    const initialMatches = numTeams / 4; // Starting matches in L0
    const halvingFactor = Math.floor(roundNum / 2); // How many times to halve
    matchesInRound = initialMatches / Math.pow(2, halvingFactor);
    
    for (let i = 0; i < matchesInRound; i++) {
        const matchKey = `l${roundNum}-${i}`;
        const match = createMatchWithKey(matchKey, roundNum, i, numTeams);
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
    
    const match = createMatchWithKey('final', 'final', 0, tournamentData.numTeams);
    roundDiv.appendChild(match);
    
    return roundDiv;
}

// Create championship round
function createChampionshipRound() {
    const roundDiv = document.createElement('div');
    roundDiv.className = 'bracket-round championship';
    
    const title = document.createElement('div');
    title.className = 'round-title';
    title.textContent = 'Championship';
    
    roundDiv.appendChild(title);
    
    const match = createMatch('final', 0, tournamentData.numTeams);
    roundDiv.appendChild(match);
    
    return roundDiv;
}

// Create match with custom key (for double elimination)
function createMatchWithKey(matchKey, roundNum, matchNum, numTeams) {
    const matchDiv = document.createElement('div');
    matchDiv.className = 'match-admin';
    
    let team1Id = null;
    let team2Id = null;
    let winnerId = null;
    
    // Check stored match data
    if (tournamentData.matches[matchKey]) {
        team1Id = tournamentData.matches[matchKey].team1;
        team2Id = tournamentData.matches[matchKey].team2;
        winnerId = tournamentData.matches[matchKey].winner;
    }
    
    // For losers bracket, check losersMatches
    if (matchKey.startsWith('l') && tournamentData.losersMatches && tournamentData.losersMatches[matchKey]) {
        team1Id = tournamentData.losersMatches[matchKey].team1;
        team2Id = tournamentData.losersMatches[matchKey].team2;
        winnerId = tournamentData.losersMatches[matchKey].winner;
    }
    
    return createMatchContent(matchDiv, matchKey, team1Id, team2Id, winnerId, matchNum);
}

// Create match (admin version with assignable slots) - legacy for single elimination
function createMatch(roundNum, matchNum, numTeams) {
    const matchKey = `${roundNum}-${matchNum}`;
    return createMatchWithKey(matchKey, roundNum, matchNum, numTeams);
}

// Create match content (shared logic)
function createMatchContent(matchDiv, matchKey, team1Id, team2Id, winnerId, matchNum) {
    // Determine which data structure to use
    const isLosersBracket = matchKey.startsWith('l');
    const matchData = isLosersBracket ? 
        (tournamentData.losersMatches && tournamentData.losersMatches[matchKey]) : 
        (tournamentData.matches && tournamentData.matches[matchKey]);
    
    // Create match HTML
    const matchHeader = document.createElement('div');
    matchHeader.className = 'mb-2';
    matchHeader.innerHTML = `<strong>Match ${matchNum + 1}</strong>`;
    matchDiv.appendChild(matchHeader);
    
    // Team 1 slot
    const team1Slot = createBracketSlot(matchKey, 'team1', team1Id, winnerId, matchNum, 0);
    matchDiv.appendChild(team1Slot);
    
    // Team 2 slot
    const team2Slot = createBracketSlot(matchKey, 'team2', team2Id, winnerId, matchNum, 0);
    matchDiv.appendChild(team2Slot);
    
    // Get current scores
    const score1 = matchData?.score1 || '';
    const score2 = matchData?.score2 || '';
    
    // Score inputs - positioned to match team slots above
    const scoresDiv = document.createElement('div');
    scoresDiv.className = 'mt-2 score-inputs';
    
    // Get team names for labels
    const team1Name = team1Id !== null && tournamentData.teams[team1Id] ? tournamentData.teams[team1Id].name : 'Team 1';
    const team2Name = team2Id !== null && tournamentData.teams[team2Id] ? tournamentData.teams[team2Id].name : 'Team 2';
    
    scoresDiv.innerHTML = `
        <div class="row g-2">
            <div class="col-6">
                <label class="form-label small mb-1">${team1Name}</label>
                <input type="number" class="form-control form-control-sm score-input" 
                       id="score1_${matchKey}" 
                       placeholder="Score" 
                       min="0"
                       value="${score1}"
                       ${team1Id === null ? 'disabled' : ''}
                       onchange="updateScore('${matchKey}', 'score1', this.value)">
            </div>
            <div class="col-6">
                <label class="form-label small mb-1">${team2Name}</label>
                <input type="number" class="form-control form-control-sm score-input" 
                       id="score2_${matchKey}" 
                       placeholder="Score" 
                       min="0"
                       value="${score2}"
                       ${team2Id === null ? 'disabled' : ''}
                       onchange="updateScore('${matchKey}', 'score2', this.value)">
            </div>
        </div>
        <div class="text-center mt-1">
            <small class="text-muted">Higher score wins</small>
        </div>
    `;
    matchDiv.appendChild(scoresDiv);
    
    return matchDiv;
}

// Create bracket slot for team assignment
function createBracketSlot(matchKey, slotType, teamId, winnerId, matchNum, roundNum) {
    const slot = document.createElement('div');
    const isWinner = teamId !== null && teamId !== undefined && teamId === winnerId;
    
    if (teamId !== null && teamId !== undefined && tournamentData.teams[teamId]) {
        slot.className = `bracket-slot filled ${isWinner ? 'winner' : ''}`;
        slot.innerHTML = `${tournamentData.teams[teamId].name}`;
    } else {
        slot.className = `bracket-slot`;
        slot.innerHTML = `<em class="text-muted">Click to assign team</em>`;
    }
    
    slot.onclick = () => openTeamAssignModal(matchKey, slotType, matchNum, roundNum);
    
    return slot;
}

// Update score and determine winner
function updateScore(matchKey, scoreField, value) {
    // Determine which data structure to use
    const isLosersBracket = matchKey.startsWith('l');
    let matchData;
    
    if (isLosersBracket) {
        if (!tournamentData.losersMatches) tournamentData.losersMatches = {};
        if (!tournamentData.losersMatches[matchKey]) tournamentData.losersMatches[matchKey] = {};
        matchData = tournamentData.losersMatches[matchKey];
    } else {
        if (!tournamentData.matches[matchKey]) tournamentData.matches[matchKey] = {};
        matchData = tournamentData.matches[matchKey];
    }
    
    // Store the score
    matchData[scoreField] = parseInt(value);
    
    // Check if both scores are entered
    const score1 = matchData.score1;
    const score2 = matchData.score2;
    
    if (score1 !== null && score1 !== undefined && score2 !== null && score2 !== undefined) {
        // Determine winner based on scores
        let winnerId = null;
        
        if (score1 > score2) {
            winnerId = matchData.team1;
        } else if (score2 > score1) {
            winnerId = matchData.team2;
        }
        // If scores are equal, no winner is set
        
        if (winnerId !== null && winnerId !== undefined) {
            advanceWinner(matchKey, winnerId);
        } else {
            // Clear winner if tied
            matchData.winner = null;
            generateBracket();
        }
    }
}

// Advance winner to next round
function advanceWinner(matchKey, teamId, slot) {
    if (teamId === null) return;
    
    const isDoubleElim = tournamentData.bracketType === 'double';
    const isLosersBracket = matchKey.startsWith('l');
    const isWinnersBracket = matchKey.startsWith('w');
    
    // Determine match data location
    let matchData;
    if (isLosersBracket) {
        if (!tournamentData.losersMatches) tournamentData.losersMatches = {};
        if (!tournamentData.losersMatches[matchKey]) tournamentData.losersMatches[matchKey] = {};
        matchData = tournamentData.losersMatches[matchKey];
    } else {
        if (!tournamentData.matches[matchKey]) tournamentData.matches[matchKey] = {};
        matchData = tournamentData.matches[matchKey];
    }
    
    // Store match result
    matchData.winner = teamId;
    
    // Find loser
    let loserId = null;
    if (matchData.team1 !== undefined && matchData.team1 !== teamId) {
        loserId = matchData.team1;
    } else if (matchData.team2 !== undefined && matchData.team2 !== teamId) {
        loserId = matchData.team2;
    }
    
    if (matchKey === 'final') {
        // Final match - no advancement
        generateBracket();
        showSaveIndicator('Champion determined!', 'success');
        return;
    }
    
    // Parse match info
    const matchPrefix = matchKey.match(/^[wl]?/)[0];
    const numbers = matchKey.replace(/^[wl]/, '').split('-');
    const roundNum = numbers[0] === 'final' ? 'final' : parseInt(numbers[0]);
    const matchNum = parseInt(numbers[1]);
    
    if (isDoubleElim) {
        // Calculate total rounds
        const totalWinnersRounds = Math.log2(tournamentData.numTeams);
        const totalLosersRounds = (totalWinnersRounds - 1) * 2;
        
        // Double elimination logic
        if (isWinnersBracket || (!isLosersBracket && !isWinnersBracket)) {
            // Winners bracket - winner advances in winners, loser goes to losers
            
            // Check if this is the last winners bracket round
            if (roundNum === totalWinnersRounds - 1) {
                // Winner goes to grand finals
                if (!tournamentData.matches['final']) {
                    tournamentData.matches['final'] = {};
                }
                tournamentData.matches['final'].team1 = teamId;
            } else {
                // Winner advances to next winners round
                const nextRound = roundNum + 1;
                const nextMatch = Math.floor(matchNum / 2);
                const nextMatchKey = `w${nextRound}-${nextMatch}`;
                const nextSlot = matchNum % 2;
                
                if (!tournamentData.matches[nextMatchKey]) {
                    tournamentData.matches[nextMatchKey] = {};
                }
                
                if (nextSlot === 0) {
                    tournamentData.matches[nextMatchKey].team1 = teamId;
                } else {
                    tournamentData.matches[nextMatchKey].team2 = teamId;
                }
            }
            
            // Move loser to losers bracket
            if (loserId !== null && loserId !== undefined) {
                if (!tournamentData.losersMatches) tournamentData.losersMatches = {};
                
                // Calculate losers bracket position
                // In double elimination, losers from winners bracket drop down:
                // Winners Round 0 → Losers Round 0 (first losers round)
                // Winners Round 1 → Losers Round 1 (plays against winners of Losers R0)
                // Winners Round 2 → Losers Round 3 (plays against winners of Losers R2)
                // Pattern: Winners Round N → Losers Round (N == 0 ? 0 : (N * 2 - 1))
                const losersRound = roundNum === 0 ? 0 : (roundNum * 2 - 1);
                
                // Calculate which match in that losers round
                // For round 0: two winners matches feed one losers match
                // For later rounds: each winners match feeds one losers match
                const losersMatch = roundNum === 0 ? Math.floor(matchNum / 2) : matchNum;
                const losersMatchKey = `l${losersRound}-${losersMatch}`;
                
                if (!tournamentData.losersMatches[losersMatchKey]) {
                    tournamentData.losersMatches[losersMatchKey] = {};
                }
                
                // Assign to team slot
                if (roundNum === 0) {
                    // For first losers round, alternate slots based on match number
                    // Winners match 0 loser → Losers match 0 team1
                    // Winners match 1 loser → Losers match 0 team2
                    if (matchNum % 2 === 0) {
                        tournamentData.losersMatches[losersMatchKey].team1 = loserId;
                    } else {
                        tournamentData.losersMatches[losersMatchKey].team2 = loserId;
                    }
                } else {
                    // For later rounds, they play against winners from previous losers round
                    // Assign to the first available slot (team2 usually, as team1 comes from losers bracket)
                    if (!tournamentData.losersMatches[losersMatchKey].team2) {
                        tournamentData.losersMatches[losersMatchKey].team2 = loserId;
                    } else if (!tournamentData.losersMatches[losersMatchKey].team1) {
                        tournamentData.losersMatches[losersMatchKey].team1 = loserId;
                    }
                }
            }
        } else if (isLosersBracket) {
            // Losers bracket - winner advances in losers, loser is eliminated
            
            // Check if this is the last losers bracket round
            if (roundNum === totalLosersRounds - 1) {
                // Winner goes to grand finals as team2
                if (!tournamentData.matches['final']) {
                    tournamentData.matches['final'] = {};
                }
                tournamentData.matches['final'].team2 = teamId;
            } else {
                // Winner advances to next losers round
                const nextRound = roundNum + 1;
                const nextMatch = Math.floor(matchNum / 2);
                const losersMatchKey = `l${nextRound}-${nextMatch}`;
                const nextSlot = matchNum % 2;
                
                if (!tournamentData.losersMatches[losersMatchKey]) {
                    tournamentData.losersMatches[losersMatchKey] = {};
                }
                
                if (nextSlot === 0) {
                    tournamentData.losersMatches[losersMatchKey].team1 = teamId;
                } else {
                    tournamentData.losersMatches[losersMatchKey].team2 = teamId;
                }
            }
            
            // Loser is eliminated
            if (loserId !== null && tournamentData.teams[loserId]) {
                tournamentData.teams[loserId].eliminated = true;
            }
        }
        
        // Advance winner, but don't eliminate loser in winners bracket
        if (!isLosersBracket) {
            // Only mark as eliminated if already lost once (in losers bracket)
        } else {
            // In losers bracket, loser is eliminated
            if (loserId !== null && tournamentData.teams[loserId]) {
                tournamentData.teams[loserId].eliminated = true;
            }
        }
    } else {
        // Single elimination logic
        if (roundNum !== 'final') {
            const nextRound = roundNum + 1;
            const nextMatch = Math.floor(matchNum / 2);
            const nextMatchKey = `${nextRound}-${nextMatch}`;
            const nextSlot = matchNum % 2;
            
            if (!tournamentData.matches[nextMatchKey]) {
                tournamentData.matches[nextMatchKey] = {};
            }
            
            if (nextSlot === 0) {
                tournamentData.matches[nextMatchKey].team1 = teamId;
            } else {
                tournamentData.matches[nextMatchKey].team2 = teamId;
            }
        }
        
        // Mark eliminated team (single elim only)
        if (loserId !== null && tournamentData.teams[loserId]) {
            tournamentData.teams[loserId].eliminated = true;
        }
    }
    
    generateBracket();
    showSaveIndicator('Winner advanced!', 'success');
}

// Save all changes
async function saveAllChanges() {
    // Update tournament info from form fields
    tournamentData.title = document.getElementById('tournamentTitle').value;
    tournamentData.description = document.getElementById('tournamentDescription').value;
    tournamentData.date = document.getElementById('tournamentDate').value;
    tournamentData.status = document.getElementById('tournamentStatus').value;
    tournamentData.image = document.getElementById('tournamentImage').value;
    tournamentData.bracketType = document.getElementById('bracketType').value;
    
    try {
        // Check if tournament exists
        const existing = await TournamentAPI.getTournament(currentTournamentId);
        
        if (existing) {
            // Update existing tournament
            await TournamentAPI.updateTournament(currentTournamentId, tournamentData);
        } else {
            // Create new tournament
            await TournamentAPI.createTournament(tournamentData);
        }
        
        showSaveIndicator('All changes saved successfully!', 'success');
    } catch (e) {
        console.error('Error saving:', e);
        showSaveIndicator('Error saving changes: ' + e.message, 'error');
    }
}

// Show save indicator
function showSaveIndicator(message, type) {
    const indicator = document.getElementById('saveIndicator');
    indicator.textContent = message;
    indicator.className = `save-indicator ${type}`;
    
    setTimeout(() => {
        indicator.className = 'save-indicator';
    }, 3000);
}
