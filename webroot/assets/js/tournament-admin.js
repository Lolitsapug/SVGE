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
async function checkAuth() {
    // First check client-side flag for quick check
    const isAuth = sessionStorage.getItem('adminAuth');
    const authTime = sessionStorage.getItem('authTime');
    
    // Quick client-side check
    if (!isAuth || !authTime || (Date.now() - parseInt(authTime)) > 7200000) {
        window.location.href = 'admin-login.html';
        return;
    }
    
    // Verify with server (server has the authoritative session)
    const serverAuth = await TournamentAPI.checkAuth();
    if (!serverAuth) {
        sessionStorage.clear();
        window.location.href = 'admin-login.html';
    }
}

// Logout function
function logout() {
    TournamentAPI.logout();
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
        const isAssigned = isTeamAssignedToBracket(team.id);
        
        const teamDiv = document.createElement('div');
        teamDiv.className = `pool-team ${isAssigned ? 'assigned' : ''}`;
        teamDiv.setAttribute('data-team-id', team.id);
        teamDiv.innerHTML = `
            <span class="pool-team-name">${team.name}</span>
            <span class="pool-team-badge">#${team.id + 1}</span>
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
    // Also check losers matches
    if (tournamentData.losersMatches) {
        for (let lm in tournamentData.losersMatches) {
            const m = tournamentData.losersMatches[lm];
            if (m.team1 === teamId || m.team2 === teamId) return true;
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
        
        // Get current team (support winners and losers matches)
        let currentTeamId = null;
        if (tournamentData.matches[matchKey]) {
            currentTeamId = tournamentData.matches[matchKey][slotType];
        } else if (tournamentData.losersMatches && tournamentData.losersMatches[matchKey]) {
            currentTeamId = tournamentData.losersMatches[matchKey][slotType];
        }
        
        // Display current team
        const currentTeamDiv = document.getElementById('modalCurrentTeam');
            if (currentTeamId !== null && currentTeamId !== undefined) {
            const team = getTeamById(currentTeamId);
            if (team) {
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
        const isAssigned = isTeamAssignedToBracket(team.id);
        const isCurrent = currentTeamId === team.id;
        
        const teamItem = document.createElement('div');
        teamItem.className = `team-select-item ${isAssigned && !isCurrent ? 'assigned' : ''} ${isCurrent ? 'selected' : ''}`;
        
        teamItem.innerHTML = `
            <div class="team-select-header">
                <span class="team-select-name">${team.name}</span>
                <span class="team-select-badge">Team #${team.id + 1}</span>
            </div>
            <div class="team-select-details">
                <div><i class="fa fa-user"></i> Discord: ${team.captain || 'Not set'}</div>
                <div><i class="fa fa-gamepad"></i> Game ID: ${team.gameId || 'Not set'}</div>
                ${isAssigned && !isCurrent ? '<div class="text-danger"><i class="fa fa-exclamation-triangle"></i> Already assigned to bracket</div>' : ''}
            </div>
        `;
        
        if (!isAssigned || isCurrent) {
            teamItem.onclick = () => assignTeamFromModal(team.id);
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
    
    // Show where this match advances to (helpful for admin clarity)
    if (!matchKey.startsWith('l')) {
        const keyParts = matchKey.replace(/^w?/, '').split('-');
        const rNum = parseInt(keyParts[0]);
        const mNum = parseInt(keyParts[1]);
        const totalWinnersRounds = Math.log2(tournamentData.numTeams);
        if (!isNaN(rNum) && rNum !== 'final') {
            if (rNum < totalWinnersRounds - 1) {
                const nextRound = rNum + 1;
                const nextMatch = Math.floor(mNum / 2);
                const nextSlot = mNum % 2 === 0 ? 'team1' : 'team2';
                const nextInfo = document.createElement('div');
                nextInfo.className = 'text-muted small next-info mb-2';
                nextInfo.textContent = `Advances to: w${nextRound}-${nextMatch} (${nextSlot})`;
                matchDiv.appendChild(nextInfo);
            } else if (rNum === totalWinnersRounds - 1) {
                const nextInfo = document.createElement('div');
                nextInfo.className = 'text-muted small next-info mb-2';
                nextInfo.textContent = 'Winner advances to Grand Finals (team1)';
                matchDiv.appendChild(nextInfo);
            }
        }
    }
    
    // Get current scores (display 0 as default in inputs, but don't treat as entered unless stored in matchData)
    const score1 = (matchData && matchData.score1 !== undefined && matchData.score1 !== null) ? matchData.score1 : 0;
    const score2 = (matchData && matchData.score2 !== undefined && matchData.score2 !== null) ? matchData.score2 : 0;

    // Team 1 row: slot on left, score input on right
    const team1Row = document.createElement('div');
    team1Row.className = 'd-flex align-items-center justify-content-between mb-2';
    const team1Slot = createBracketSlot(matchKey, 'team1', team1Id, winnerId, matchNum, 0);
    team1Slot.style.flex = '1';
    team1Row.appendChild(team1Slot);

    const scoreWrapper1 = document.createElement('div');
    scoreWrapper1.style.width = '90px';
    scoreWrapper1.className = 'ms-2';
    const team1Obj = (team1Id !== null && team1Id !== undefined) ? getTeamById(team1Id) : null;
    const team1Name = team1Obj ? team1Obj.name : 'Team 1';
    const input1 = document.createElement('input');
    input1.type = 'number';
    input1.className = 'form-control form-control-sm score-input';
    input1.id = `score1_${matchKey}`;
    input1.placeholder = 'Score';
    input1.min = 0;
    input1.value = score1;
    if (team1Id === null) input1.disabled = true;
    input1.setAttribute('onchange', `updateScore('${matchKey}', 'score1', this.value)`);
    scoreWrapper1.appendChild(input1);
    team1Row.appendChild(scoreWrapper1);
    matchDiv.appendChild(team1Row);

    // Team 2 row
    const team2Row = document.createElement('div');
    team2Row.className = 'd-flex align-items-center justify-content-between mb-2';
    const team2Slot = createBracketSlot(matchKey, 'team2', team2Id, winnerId, matchNum, 0);
    team2Slot.style.flex = '1';
    team2Row.appendChild(team2Slot);

    const scoreWrapper2 = document.createElement('div');
    scoreWrapper2.style.width = '90px';
    scoreWrapper2.className = 'ms-2';
    const team2Obj = (team2Id !== null && team2Id !== undefined) ? getTeamById(team2Id) : null;
    const team2Name = team2Obj ? team2Obj.name : 'Team 2';
    const input2 = document.createElement('input');
    input2.type = 'number';
    input2.className = 'form-control form-control-sm score-input';
    input2.id = `score2_${matchKey}`;
    input2.placeholder = 'Score';
    input2.min = 0;
    input2.value = score2;
    if (team2Id === null) input2.disabled = true;
    input2.setAttribute('onchange', `updateScore('${matchKey}', 'score2', this.value)`);
    scoreWrapper2.appendChild(input2);
    team2Row.appendChild(scoreWrapper2);
    matchDiv.appendChild(team2Row);

    // Small helper text
    const helper = document.createElement('div');
    helper.className = 'text-muted small mt-1';
    helper.textContent = 'Higher score wins';
    matchDiv.appendChild(helper);
    
    return matchDiv;
}

// Create bracket slot for team assignment
function createBracketSlot(matchKey, slotType, teamId, winnerId, matchNum, roundNum) {
    const slot = document.createElement('div');
    const isWinner = teamId !== null && teamId !== undefined && teamId === winnerId;
    const teamObj = (teamId !== null && teamId !== undefined) ? getTeamById(teamId) : null;
    if (teamObj) {
        slot.className = `bracket-slot filled ${isWinner ? 'winner' : ''}`;
        slot.innerHTML = `${teamObj.name}`;
    } else {
        slot.className = `bracket-slot`;
        slot.innerHTML = `<em class="text-muted">assign team</em>`;
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
    
    // Store the score (if value is empty or NaN, leave as undefined)
    const parsed = parseInt(value);
    if (!isNaN(parsed)) {
        matchData[scoreField] = parsed;
    } else {
        // If cleared, remove the stored score so it falls back to default display
        delete matchData[scoreField];
    }

    // Determine stored scores (may be undefined)
    let s1 = matchData.score1;
    let s2 = matchData.score2;

    // If both scores are not present, don't auto-resolve (user hasn't entered anything meaningful)
    const s1Missing = s1 === null || s1 === undefined;
    const s2Missing = s2 === null || s2 === undefined;
    if (s1Missing && s2Missing) {
        // Just re-render to update UI state
        generateBracket();
        return;
    }

    // If one score is present and the other missing, treat the missing one as 0 for auto-resolution
    if (s1Missing) {
        s1 = 0;
        matchData.score1 = 0;
    }
    if (s2Missing) {
        s2 = 0;
        matchData.score2 = 0;
    }

    // Now both s1 and s2 are defined numbers — determine winner
    let winnerId = null;
    if (s1 > s2) {
        winnerId = matchData.team1;
    } else if (s2 > s1) {
        winnerId = matchData.team2;
    }

    if (winnerId !== null && winnerId !== undefined) {
        advanceWinner(matchKey, winnerId);
    } else {
        // Tie — clear winner and re-render
        matchData.winner = null;
        generateBracket();
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
                        // avoid duplicate placement if this team is already in losers
                        if (!isTeamInLosers(loserId)) {
                            tournamentData.losersMatches[losersMatchKey].team1 = loserId;
                            tournamentData.losersMatches[losersMatchKey].team1Source = 'w';
                        }
                    } else {
                        if (!isTeamInLosers(loserId)) {
                            tournamentData.losersMatches[losersMatchKey].team2 = loserId;
                            tournamentData.losersMatches[losersMatchKey].team2Source = 'w';
                        }
                    }
                } else {
                    // For later rounds, try to place the loser into a match pairing a 'w' with an 'l'
                    const placed = placeInLosersRound(losersRound, losersMatch, loserId, 'w');
                    if (!placed) {
                        // As a fallback, put into the computed match slot (team2) and mark source
                        if (!isTeamInLosers(loserId)) {
                            tournamentData.losersMatches[losersMatchKey].team2 = loserId;
                            tournamentData.losersMatches[losersMatchKey].team2Source = 'w';
                        }
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
                console.log(`🏆 Losers Final winner (Team ${teamId}) → Grand Finals team2`);
            } else {
                // Winner advances to next losers round
                const nextRound = roundNum + 1;

                // Determine matches in this and next rounds so we can choose mapping strategy
                const matchesInThis = getLosersMatchesCount(roundNum, tournamentData.numTeams);
                const matchesInNext = getLosersMatchesCount(nextRound, tournamentData.numTeams);

                // If next round has the same number of matches, map by identity (matchNum -> same match index)
                // Otherwise, group pairs into the same next-match (floor(matchNum/2)).
                const preferredMatch = (matchesInNext === matchesInThis) ? matchNum : Math.floor(matchNum / 2);

                // Determine preferred slot: when preserving indices, default to team1; otherwise alternate by matchNum
                const preferredSlotKey = (matchesInNext === matchesInThis) ? 'team1' : ((matchNum % 2 === 0) ? 'team1' : 'team2');

                console.log(`📍 Losers advancement: ${matchKey} (Team ${teamId}) | Round ${roundNum} Match ${matchNum}`);
                console.log(`   Matches: This round=${matchesInThis}, Next round=${matchesInNext}`);
                console.log(`   Target: l${nextRound}-${preferredMatch} ${preferredSlotKey}`);

                // Try intelligent placement first (this will try to pair 'l' with existing 'w' where appropriate)
                const placedLoserWinner = placeInLosersRound(nextRound, preferredMatch, teamId, 'l');
                if (!placedLoserWinner) {
                    // Fallback: place into preferred match/slot if free, else try opposite slot, else overwrite
                    const losersMatchKey = `l${nextRound}-${preferredMatch}`;
                    if (!tournamentData.losersMatches[losersMatchKey]) {
                        tournamentData.losersMatches[losersMatchKey] = {};
                    }

                    if (!tournamentData.losersMatches[losersMatchKey][preferredSlotKey]) {
                        tournamentData.losersMatches[losersMatchKey][preferredSlotKey] = teamId;
                        tournamentData.losersMatches[losersMatchKey][`${preferredSlotKey}Source`] = 'l';
                        console.log(`   ✓ Placed in preferred: ${losersMatchKey} ${preferredSlotKey}`);
                    } else {
                        const oppositeSlot = preferredSlotKey === 'team1' ? 'team2' : 'team1';
                        if (!tournamentData.losersMatches[losersMatchKey][oppositeSlot]) {
                            tournamentData.losersMatches[losersMatchKey][oppositeSlot] = teamId;
                            tournamentData.losersMatches[losersMatchKey][`${oppositeSlot}Source`] = 'l';
                            console.log(`   ✓ Placed in opposite slot: ${losersMatchKey} ${oppositeSlot}`);
                        } else {
                            // overwrite as last resort
                            tournamentData.losersMatches[losersMatchKey][preferredSlotKey] = teamId;
                            tournamentData.losersMatches[losersMatchKey][`${preferredSlotKey}Source`] = 'l';
                            console.log(`   ⚠️ OVERWRITE: ${losersMatchKey} ${preferredSlotKey} (was ${tournamentData.losersMatches[losersMatchKey][preferredSlotKey]})`);
                        }
                    }
                } else {
                    console.log(`   ✓ Smart placement succeeded`);
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

// Helper: try to place a loser into the first available slot within a losers round
function placeInLosersRound(losersRound, preferredMatch, teamId, source) {
    if (!tournamentData.losersMatches) tournamentData.losersMatches = {};
    const numTeams = tournamentData.numTeams;
    const initialMatches = Math.max(1, numTeams / 4);

    // Determine number of matches in this losers round using the same formula as createLosersRound
    const matchesInRound = Math.max(1, Math.floor(initialMatches / Math.pow(2, Math.floor(losersRound / 2))));

    const tryMatchKey = (m) => `l${losersRound}-${m}`;

    // Preferred match first, then scan others
    const candidates = [];
    if (preferredMatch >= 0 && preferredMatch < matchesInRound) candidates.push(preferredMatch);
    for (let i = 0; i < matchesInRound; i++) {
        if (i !== preferredMatch) candidates.push(i);
    }

    // Priority placement rules:
    // 1) Prefer to place into a match where the other slot is occupied by the opposite source (pair w with l)
    // 2) Then prefer empty-empty matches
    // 3) Then prefer matches with an empty slot (regardless of source)
    // 4) Fallback: try preferred and other matches, filling team2 then team1

    // First pass: opposite-source pairing
    for (const m of candidates) {
        const key = tryMatchKey(m);
        if (!tournamentData.losersMatches[key]) tournamentData.losersMatches[key] = {};
        const s1 = tournamentData.losersMatches[key].team1Source;
        const s2 = tournamentData.losersMatches[key].team2Source;
        const t1 = tournamentData.losersMatches[key].team1;
        const t2 = tournamentData.losersMatches[key].team2;

    // Note: do not block placement if team is already present in losers (winners advancing from losers
    // will still be present in their current match but must also be placed into the next round).

        if (source === 'w') {
            // look for a match where a loser-winner from losers ('l') is present and opposite slot is empty
            if ((s1 === 'l' && !t2)) {
                tournamentData.losersMatches[key].team2 = teamId;
                tournamentData.losersMatches[key].team2Source = 'w';
                return true;
            }
            if ((s2 === 'l' && !t1)) {
                tournamentData.losersMatches[key].team1 = teamId;
                tournamentData.losersMatches[key].team1Source = 'w';
                return true;
            }
        } else if (source === 'l') {
            // placing a winner from losers bracket; prefer to pair with a 'w'
            if ((s1 === 'w' && !t2)) {
                tournamentData.losersMatches[key].team2 = teamId;
                tournamentData.losersMatches[key].team2Source = 'l';
                return true;
            }
            if ((s2 === 'w' && !t1)) {
                tournamentData.losersMatches[key].team1 = teamId;
                tournamentData.losersMatches[key].team1Source = 'l';
                return true;
            }
        }
    }

    // Second pass: empty-empty matches
    for (const m of candidates) {
        const key = tryMatchKey(m);
        const t1 = tournamentData.losersMatches[key].team1;
        const t2 = tournamentData.losersMatches[key].team2;
        if (!t1 && !t2) {
            // put into team1 by default
            tournamentData.losersMatches[key].team1 = teamId;
            tournamentData.losersMatches[key].team1Source = source;
            return true;
        }
    }

    // Third pass: any match with an empty slot
    for (const m of candidates) {
        const key = tryMatchKey(m);
        const t1 = tournamentData.losersMatches[key].team1;
        const t2 = tournamentData.losersMatches[key].team2;
        if (!t1) {
            tournamentData.losersMatches[key].team1 = teamId;
            tournamentData.losersMatches[key].team1Source = source;
            return true;
        }
        if (!t2) {
            tournamentData.losersMatches[key].team2 = teamId;
            tournamentData.losersMatches[key].team2Source = source;
            return true;
        }
    }

    // Fallback: nothing available
    return false;
}

// Helper: compute matches in a losers round
function getLosersMatchesCount(roundNum, numTeams) {
    const initialMatches = Math.max(1, numTeams / 4);
    const matches = Math.max(1, Math.floor(initialMatches / Math.pow(2, Math.floor(roundNum / 2))));
    return matches;
}

// Helper: check if a team is already present in any losers match
function isTeamInLosers(teamId) {
    if (!tournamentData.losersMatches) return false;
    for (const key in tournamentData.losersMatches) {
        const m = tournamentData.losersMatches[key];
        if (m && (m.team1 === teamId || m.team2 === teamId)) return true;
    }
    return false;
}

// Helper: find team object by its stable id
function getTeamById(id) {
    if (!tournamentData.teams) return null;
    return tournamentData.teams.find(t => t.id === id) || null;
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

// Validate bracket - comprehensive check of all match routing
function validateBracket() {
    const results = [];
    const errors = [];
    const warnings = [];
    
    results.push('<h5>🔍 Bracket Validation Report</h5>');
    results.push(`<p><strong>Bracket Type:</strong> ${tournamentData.bracketType}</p>`);
    results.push(`<p><strong>Teams:</strong> ${tournamentData.numTeams}</p>`);
    results.push('<hr>');
    
    if (tournamentData.bracketType === 'double') {
        // Validate double elimination bracket
        const numTeams = tournamentData.numTeams;
        const totalWinnersRounds = Math.log2(numTeams);
        const totalLosersRounds = (totalWinnersRounds - 1) * 2;
        
        results.push('<h6>Winners Bracket Routing:</h6>');
        
        // Check winners bracket advancement
        for (let round = 0; round < totalWinnersRounds; round++) {
            const matchesInRound = numTeams / Math.pow(2, round + 1);
            results.push(`<div class="ms-3"><strong>Winners Round ${round}:</strong> (${matchesInRound} matches)</div>`);
            
            for (let match = 0; match < matchesInRound; match++) {
                const matchKey = `w${round}-${match}`;
                const matchData = tournamentData.matches[matchKey];
                
                if (!matchData || (!matchData.team1 && !matchData.team2)) {
                    warnings.push(`⚠️ ${matchKey}: No teams assigned`);
                    continue;
                }
                
                if (matchData.winner) {
                    const winnerTeam = getTeamById(matchData.winner);
                    const winnerName = winnerTeam ? winnerTeam.name : `Team ${matchData.winner}`;
                    
                    // Check where winner should go
                    if (round === totalWinnersRounds - 1) {
                        // Should go to Grand Finals team1
                        const finalMatch = tournamentData.matches['final'];
                        if (finalMatch && finalMatch.team1 === matchData.winner) {
                            results.push(`<div class="ms-4 text-success">✓ ${matchKey} winner (${winnerName}) → Grand Finals team1</div>`);
                        } else {
                            errors.push(`❌ ${matchKey} winner (${winnerName}) should be in Grand Finals team1 but isn't`);
                        }
                    } else {
                        // Should advance to next winners round
                        const nextRound = round + 1;
                        const nextMatch = Math.floor(match / 2);
                        const nextSlot = match % 2 === 0 ? 'team1' : 'team2';
                        const nextKey = `w${nextRound}-${nextMatch}`;
                        const nextData = tournamentData.matches[nextKey];
                        
                        if (nextData && nextData[nextSlot] === matchData.winner) {
                            results.push(`<div class="ms-4 text-success">✓ ${matchKey} winner (${winnerName}) → ${nextKey} ${nextSlot}</div>`);
                        } else {
                            errors.push(`❌ ${matchKey} winner (${winnerName}) should be in ${nextKey} ${nextSlot} but is in: ${nextData ? nextData[nextSlot] : 'nothing'}`);
                        }
                    }
                    
                    // Check where loser should go
                    const loserId = matchData.team1 === matchData.winner ? matchData.team2 : matchData.team1;
                    if (loserId !== null && loserId !== undefined) {
                        const loserTeam = getTeamById(loserId);
                        const loserName = loserTeam ? loserTeam.name : `Team ${loserId}`;
                        
                        // Calculate expected losers position
                        const losersRound = round === 0 ? 0 : (round * 2 - 1);
                        const losersMatch = round === 0 ? Math.floor(match / 2) : match;
                        const losersKey = `l${losersRound}-${losersMatch}`;
                        
                        // Check if loser is in losers bracket
                        let foundInLosers = false;
                        for (const lKey in tournamentData.losersMatches) {
                            const lMatch = tournamentData.losersMatches[lKey];
                            if (lMatch.team1 === loserId || lMatch.team2 === loserId) {
                                if (lKey === losersKey) {
                                    results.push(`<div class="ms-4 text-info">→ ${matchKey} loser (${loserName}) → ${lKey} ✓</div>`);
                                } else {
                                    warnings.push(`⚠️ ${matchKey} loser (${loserName}) expected in ${losersKey} but found in ${lKey}`);
                                }
                                foundInLosers = true;
                                break;
                            }
                        }
                        if (!foundInLosers) {
                            warnings.push(`⚠️ ${matchKey} loser (${loserName}) not found in losers bracket`);
                        }
                    }
                }
            }
        }
        
        results.push('<hr>');
        results.push('<h6>Losers Bracket Routing:</h6>');
        
        // Check losers bracket advancement
        for (let round = 0; round < totalLosersRounds; round++) {
            const matchesInRound = getLosersMatchesCount(round, numTeams);
            results.push(`<div class="ms-3"><strong>Losers Round ${round}:</strong> (${matchesInRound} matches)</div>`);
            
            for (let match = 0; match < matchesInRound; match++) {
                const matchKey = `l${round}-${match}`;
                const matchData = tournamentData.losersMatches ? tournamentData.losersMatches[matchKey] : null;
                
                if (!matchData || (!matchData.team1 && !matchData.team2)) {
                    continue; // Skip empty matches
                }
                
                // Show match composition
                const t1 = matchData.team1 ? getTeamById(matchData.team1) : null;
                const t2 = matchData.team2 ? getTeamById(matchData.team2) : null;
                const t1Name = t1 ? t1.name : 'empty';
                const t2Name = t2 ? t2.name : 'empty';
                const t1Src = matchData.team1Source || '?';
                const t2Src = matchData.team2Source || '?';
                
                results.push(`<div class="ms-4">${matchKey}: [${t1Name} (${t1Src})] vs [${t2Name} (${t2Src})]</div>`);
                
                if (matchData.winner) {
                    const winnerTeam = getTeamById(matchData.winner);
                    const winnerName = winnerTeam ? winnerTeam.name : `Team ${matchData.winner}`;
                    
                    // Check where winner should go
                    if (round === totalLosersRounds - 1) {
                        // Should go to Grand Finals team2
                        const finalMatch = tournamentData.matches['final'];
                        if (finalMatch && finalMatch.team2 === matchData.winner) {
                            results.push(`<div class="ms-5 text-success">✓ ${matchKey} winner (${winnerName}) → Grand Finals team2</div>`);
                        } else {
                            errors.push(`❌ ${matchKey} winner (${winnerName}) should be in Grand Finals team2 but isn't`);
                        }
                    } else {
                        // Should advance to next losers round
                        const nextRound = round + 1;
                        const matchesInThis = getLosersMatchesCount(round, numTeams);
                        const matchesInNext = getLosersMatchesCount(nextRound, numTeams);
                        
                        // Expected mapping based on current logic
                        const expectedMatch = (matchesInNext === matchesInThis) ? match : Math.floor(match / 2);
                        const expectedSlot = (matchesInNext === matchesInThis) ? 'team1' : ((match % 2 === 0) ? 'team1' : 'team2');
                        const expectedKey = `l${nextRound}-${expectedMatch}`;
                        
                        // Check if winner is in expected position
                        const nextData = tournamentData.losersMatches ? tournamentData.losersMatches[expectedKey] : null;
                        
                        let foundCorrectly = false;
                        if (nextData) {
                            if (nextData[expectedSlot] === matchData.winner) {
                                results.push(`<div class="ms-5 text-success">✓ ${matchKey} winner (${winnerName}) → ${expectedKey} ${expectedSlot}</div>`);
                                foundCorrectly = true;
                            } else if (nextData.team1 === matchData.winner || nextData.team2 === matchData.winner) {
                                const actualSlot = nextData.team1 === matchData.winner ? 'team1' : 'team2';
                                warnings.push(`⚠️ ${matchKey} winner (${winnerName}) expected in ${expectedKey} ${expectedSlot} but found in ${actualSlot}`);
                                foundCorrectly = true;
                            }
                        }
                        
                        if (!foundCorrectly) {
                            // Search for winner in other losers matches
                            let foundElsewhere = false;
                            for (const lKey in tournamentData.losersMatches) {
                                const lMatch = tournamentData.losersMatches[lKey];
                                if (lMatch.team1 === matchData.winner || lMatch.team2 === matchData.winner) {
                                    const slot = lMatch.team1 === matchData.winner ? 'team1' : 'team2';
                                    errors.push(`❌ ${matchKey} winner (${winnerName}) should be in ${expectedKey} ${expectedSlot} but found in ${lKey} ${slot}`);
                                    foundElsewhere = true;
                                    break;
                                }
                            }
                            if (!foundElsewhere) {
                                warnings.push(`⚠️ ${matchKey} winner (${winnerName}) not found in next round (expected ${expectedKey} ${expectedSlot})`);
                            }
                        }
                    }
                }
            }
        }
        
        // Check Grand Finals
        results.push('<hr>');
        results.push('<h6>Grand Finals:</h6>');
        const finalMatch = tournamentData.matches['final'];
        if (finalMatch) {
            const t1 = finalMatch.team1 ? getTeamById(finalMatch.team1) : null;
            const t2 = finalMatch.team2 ? getTeamById(finalMatch.team2) : null;
            results.push(`<div class="ms-3">Team 1 (from winners): ${t1 ? t1.name : 'empty'}</div>`);
            results.push(`<div class="ms-3">Team 2 (from losers): ${t2 ? t2.name : 'empty'}</div>`);
            if (finalMatch.winner) {
                const winner = getTeamById(finalMatch.winner);
                results.push(`<div class="ms-3 text-success">Champion: ${winner ? winner.name : 'Unknown'}</div>`);
            }
        } else {
            warnings.push('⚠️ Grand Finals match not initialized');
        }
        
    } else {
        // Validate single elimination
        results.push('<h6>Single Elimination Validation:</h6>');
        results.push('<p class="ms-3">Basic single-elimination validation (winners advance floor(match/2), slot match%2)</p>');
        // Add single-elim validation if needed
    }
    
    // Display results
    results.push('<hr>');
    if (errors.length > 0) {
        results.push('<h6 class="text-danger">❌ Errors Found:</h6>');
        results.push('<ul class="text-danger">');
        errors.forEach(err => results.push(`<li>${err}</li>`));
        results.push('</ul>');
    }
    
    if (warnings.length > 0) {
        results.push('<h6 class="text-warning">⚠️ Warnings:</h6>');
        results.push('<ul class="text-warning">');
        warnings.forEach(warn => results.push(`<li>${warn}</li>`));
        results.push('</ul>');
    }
    
    if (errors.length === 0 && warnings.length === 0) {
        results.push('<div class="alert alert-success"><h6 class="mb-0">✅ All checks passed! Bracket routing looks correct.</h6></div>');
    }
    
    // Show modal
    document.getElementById('validationResults').innerHTML = results.join('');
    const validationModal = new bootstrap.Modal(document.getElementById('validationModal'));
    validationModal.show();
}
