// Tournament Administration System

let tournamentData = {
    id: null,
    numTeams: 8,
    teams: [],
    matches: {},
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
    if (confirm('This will randomize all team positions. Continue?')) {
        // Fisher-Yates shuffle
        for (let i = tournamentData.teams.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tournamentData.teams[i], tournamentData.teams[j]] = [tournamentData.teams[j], tournamentData.teams[i]];
        }
        
        // Reset matches
        tournamentData.matches = {};
        
        generateBracket();
        showSaveIndicator('Bracket randomized!', 'success');
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

// Create round
function createRound(roundNum, totalRounds, numTeams) {
    const roundDiv = document.createElement('div');
    roundDiv.className = 'bracket-round';
    
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
    
    const matchesInRound = numTeams / Math.pow(2, roundNum + 1);
    
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
    
    const title = document.createElement('div');
    title.className = 'round-title';
    title.innerHTML = '<i class="fa fa-trophy"></i> Championship';
    
    roundDiv.appendChild(title);
    
    const match = createMatch('final', 0, tournamentData.numTeams);
    roundDiv.appendChild(match);
    
    return roundDiv;
}

// Create match (admin version with assignable slots)
function createMatch(roundNum, matchNum, numTeams) {
    const matchDiv = document.createElement('div');
    matchDiv.className = 'match-admin';
    
    const matchKey = `${roundNum}-${matchNum}`;
    let team1Id = null;
    let team2Id = null;
    let winnerId = null;
    
    // Check stored match data
    if (tournamentData.matches[matchKey]) {
        team1Id = tournamentData.matches[matchKey].team1;
        team2Id = tournamentData.matches[matchKey].team2;
        winnerId = tournamentData.matches[matchKey].winner;
    }
    
    // Create match HTML
    const matchHeader = document.createElement('div');
    matchHeader.className = 'mb-2';
    matchHeader.innerHTML = `<strong>Match ${matchNum + 1}</strong>`;
    matchDiv.appendChild(matchHeader);
    
    // Team 1 slot
    const team1Slot = createBracketSlot(matchKey, 'team1', team1Id, winnerId, matchNum, roundNum);
    matchDiv.appendChild(team1Slot);
    
    // Team 2 slot
    const team2Slot = createBracketSlot(matchKey, 'team2', team2Id, winnerId, matchNum, roundNum);
    matchDiv.appendChild(team2Slot);
    
    // Advance buttons
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'mt-2';
    buttonsDiv.innerHTML = `
        <button class="btn btn-sm btn-success winner-btn" 
                onclick="advanceWinner('${matchKey}', ${team1Id}, 0)"
                ${team1Id === null ? 'disabled' : ''}>
            <i class="fa fa-arrow-up"></i> Advance Team 1
        </button>
        <button class="btn btn-sm btn-success winner-btn" 
                onclick="advanceWinner('${matchKey}', ${team2Id}, 1)"
                ${team2Id === null ? 'disabled' : ''}>
            <i class="fa fa-arrow-up"></i> Advance Team 2
        </button>
    `;
    matchDiv.appendChild(buttonsDiv);
    
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

// Advance winner to next round
function advanceWinner(matchKey, teamId, slot) {
    if (teamId === null) return;
    
    const [round, match] = matchKey.split('-');
    const roundNum = round === 'final' ? 'final' : parseInt(round);
    const matchNum = parseInt(match);
    
    // Store match result
    if (!tournamentData.matches[matchKey]) {
        tournamentData.matches[matchKey] = {};
    }
    tournamentData.matches[matchKey].winner = teamId;
    
    // Calculate next match
    if (roundNum !== 'final') {
        const nextRound = roundNum + 1;
        const nextMatch = Math.floor(matchNum / 2);
        const nextMatchKey = `${nextRound}-${nextMatch}`;
        const nextSlot = matchNum % 2; // 0 for team1, 1 for team2
        
        if (!tournamentData.matches[nextMatchKey]) {
            tournamentData.matches[nextMatchKey] = {};
        }
        
        if (nextSlot === 0) {
            tournamentData.matches[nextMatchKey].team1 = teamId;
        } else {
            tournamentData.matches[nextMatchKey].team2 = teamId;
        }
    }
    
    // Mark eliminated team
    const matchData = tournamentData.matches[matchKey];
    if (matchData.team1 !== undefined && matchData.team1 !== teamId) {
        tournamentData.teams[matchData.team1].eliminated = true;
    }
    if (matchData.team2 !== undefined && matchData.team2 !== teamId) {
        tournamentData.teams[matchData.team2].eliminated = true;
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
