// Tournament Bracket Management System

let tournamentData = {
    numTeams: 8,
    teams: [],
    matches: []
};

let currentEditingTeam = null;
let editTeamModal;
let teamInfoModal;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    editTeamModal = new bootstrap.Modal(document.getElementById('editTeamModal'));
    teamInfoModal = new bootstrap.Modal(document.getElementById('teamInfoModal'));
    
    // Load saved data or initialize new bracket
    loadData();
    generateBracket();
});

// Generate the tournament bracket
function generateBracket() {
    const numTeams = parseInt(document.getElementById('numTeams').value);
    tournamentData.numTeams = numTeams;
    
    // Initialize teams if not already done
    if (tournamentData.teams.length !== numTeams) {
        initializeTeams(numTeams);
    }
    
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

// Initialize teams array
function initializeTeams(numTeams) {
    tournamentData.teams = [];
    for (let i = 0; i < numTeams; i++) {
        tournamentData.teams.push({
            id: i,
            name: `Team ${i + 1}`,
            captain: '',
            eliminated: false
        });
    }
    tournamentData.matches = [];
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
    title.textContent = 'Championship';
    roundDiv.appendChild(title);
    
    const match = document.createElement('div');
    match.className = 'match';
    match.setAttribute('data-match', 'final');
    
    // Two teams (winners from semi-finals)
    for (let i = 0; i < 2; i++) {
        const team = document.createElement('div');
        team.className = 'team';
        team.setAttribute('data-slot', i);
        team.onclick = () => showTeamInfo(match, i);
        
        const teamName = document.createElement('span');
        teamName.className = 'team-name empty';
        teamName.textContent = 'TBD';
        
        const advanceBtn = document.createElement('button');
        advanceBtn.className = 'advance-btn';
        advanceBtn.textContent = 'Win';
        advanceBtn.onclick = (e) => {
            e.stopPropagation();
            declareWinner(match, i);
        };
        
        team.appendChild(teamName);
        team.appendChild(advanceBtn);
        match.appendChild(team);
    }
    
    roundDiv.appendChild(match);
    return roundDiv;
}

// Create a match div
function createMatch(roundNum, matchNum, numTeams) {
    const match = document.createElement('div');
    match.className = 'match';
    match.setAttribute('data-round', roundNum);
    match.setAttribute('data-match', matchNum);
    
    // Calculate team indices for first round
    let team1Index, team2Index;
    
    if (roundNum === 0) {
        team1Index = matchNum * 2;
        team2Index = matchNum * 2 + 1;
        
        // Create team slots
        [team1Index, team2Index].forEach((teamIndex, slot) => {
            const team = document.createElement('div');
            team.className = 'team';
            team.setAttribute('data-team-id', teamIndex);
            team.setAttribute('data-slot', slot);
            team.onclick = () => showTeamInfo(match, slot);
            
            const teamName = document.createElement('span');
            teamName.className = 'team-name';
            teamName.textContent = tournamentData.teams[teamIndex].name;
            
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-team-btn';
            editBtn.textContent = 'Edit';
            editBtn.onclick = (e) => {
                e.stopPropagation();
                openEditModal(teamIndex);
            };
            
            const advanceBtn = document.createElement('button');
            advanceBtn.className = 'advance-btn';
            advanceBtn.textContent = 'Win';
            advanceBtn.onclick = (e) => {
                e.stopPropagation();
                advanceTeam(match, slot);
            };
            
            team.appendChild(teamName);
            team.appendChild(editBtn);
            team.appendChild(advanceBtn);
            match.appendChild(team);
        });
    } else {
        // For later rounds, create empty slots
        for (let i = 0; i < 2; i++) {
            const team = document.createElement('div');
            team.className = 'team';
            team.setAttribute('data-slot', i);
            team.onclick = () => showTeamInfo(match, i);
            
            const teamName = document.createElement('span');
            teamName.className = 'team-name empty';
            teamName.textContent = 'TBD';
            
            const advanceBtn = document.createElement('button');
            advanceBtn.className = 'advance-btn';
            advanceBtn.textContent = 'Win';
            advanceBtn.onclick = (e) => {
                e.stopPropagation();
                advanceTeam(match, i);
            };
            
            team.appendChild(teamName);
            team.appendChild(advanceBtn);
            match.appendChild(team);
        }
    }
    
    return match;
}

// Advance team to next round
function advanceTeam(match, winnerSlot) {
    const teams = match.querySelectorAll('.team');
    const winner = teams[winnerSlot];
    const loser = teams[1 - winnerSlot];
    
    // Mark winner and loser
    winner.classList.add('winner');
    loser.classList.add('loser');
    
    // Get winner team info
    const winnerTeamId = winner.getAttribute('data-team-id');
    const winnerName = winner.querySelector('.team-name').textContent;
    
    // Find next match
    const currentRound = parseInt(match.getAttribute('data-round'));
    const currentMatch = parseInt(match.getAttribute('data-match'));
    const nextRound = currentRound + 1;
    const nextMatch = Math.floor(currentMatch / 2);
    const nextSlot = currentMatch % 2;
    
    // Get next round element
    const rounds = document.querySelectorAll('.bracket-round');
    let nextRoundElement;
    
    if (nextRound < rounds.length - 1) {
        nextRoundElement = document.querySelector(`.bracket-round[data-round="${nextRound}"]`);
    } else {
        nextRoundElement = document.querySelector('.bracket-round.championship');
    }
    
    if (nextRoundElement) {
        const nextMatchElement = nextRoundElement.querySelectorAll('.match')[nextMatch] || 
                                 nextRoundElement.querySelector('.match[data-match="final"]');
        
        if (nextMatchElement) {
            const nextTeamSlot = nextMatchElement.querySelectorAll('.team')[nextSlot];
            if (nextTeamSlot) {
                const nextTeamName = nextTeamSlot.querySelector('.team-name');
                nextTeamName.textContent = winnerName;
                nextTeamName.classList.remove('empty');
                nextTeamSlot.setAttribute('data-team-id', winnerTeamId);
            }
        }
    }
    
    saveData();
}

// Declare tournament winner
function declareWinner(match, winnerSlot) {
    const teams = match.querySelectorAll('.team');
    const winner = teams[winnerSlot];
    const loser = teams[1 - winnerSlot];
    
    winner.classList.add('winner');
    loser.classList.add('loser');
    
    const winnerName = winner.querySelector('.team-name').textContent;
    
    // Show celebration
    setTimeout(() => {
        alert(`🏆 Congratulations to ${winnerName}! 🏆\n\nTournament Champions!`);
    }, 100);
    
    saveData();
}

// Open edit modal for team
function openEditModal(teamId) {
    currentEditingTeam = teamId;
    const team = tournamentData.teams[teamId];
    
    document.getElementById('teamName').value = team.name;
    document.getElementById('captainDiscord').value = team.captain || '';
    
    editTeamModal.show();
}

// Save team edit
function saveTeamEdit() {
    if (currentEditingTeam === null) return;
    
    const newName = document.getElementById('teamName').value.trim();
    const newCaptain = document.getElementById('captainDiscord').value.trim();
    
    if (!newName) {
        alert('Please enter a team name');
        return;
    }
    
    // Update team data
    tournamentData.teams[currentEditingTeam].name = newName;
    tournamentData.teams[currentEditingTeam].captain = newCaptain;
    
    // Update all instances in bracket
    const teamElements = document.querySelectorAll(`[data-team-id="${currentEditingTeam}"]`);
    teamElements.forEach(element => {
        const teamName = element.querySelector('.team-name');
        if (teamName) {
            teamName.textContent = newName;
        }
    });
    
    editTeamModal.hide();
    saveData();
}

// Show team info modal
function showTeamInfo(match, slot) {
    const team = match.querySelectorAll('.team')[slot];
    const teamId = team.getAttribute('data-team-id');
    
    if (!teamId) {
        return; // Team not set yet
    }
    
    const teamData = tournamentData.teams[teamId];
    
    document.getElementById('teamInfoTitle').textContent = teamData.name;
    
    const discordElement = document.getElementById('teamInfoDiscord');
    if (teamData.captain && teamData.captain.trim() !== '') {
        discordElement.textContent = teamData.captain;
        discordElement.style.background = '#5865F2';
        discordElement.style.color = 'white';
    } else {
        discordElement.textContent = 'Not set - use Edit Teams button to add captain info';
        discordElement.style.background = '#6c757d';
        discordElement.style.color = 'white';
    }
    
    teamInfoModal.show();
}

// Edit mode - allows editing all teams
function editMode() {
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-info btn-sm';
    editBtn.innerHTML = '<i class="fa fa-check"></i> Done Editing';
    
    // Create a modal to show all teams for editing
    const modalContent = `
        <div class="modal fade" id="editAllTeamsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Edit All Teams</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="table-responsive">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Team #</th>
                                        <th>Team Name</th>
                                        <th>Captain's Discord</th>
                                    </tr>
                                </thead>
                                <tbody id="editAllTeamsBody">
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveAllTeamEdits()">Save All</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page if not exists
    if (!document.getElementById('editAllTeamsModal')) {
        document.body.insertAdjacentHTML('beforeend', modalContent);
    }
    
    // Populate table
    const tbody = document.getElementById('editAllTeamsBody');
    tbody.innerHTML = '';
    
    tournamentData.teams.forEach((team, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><input type="text" class="form-control form-control-sm" value="${team.name}" data-team-id="${index}" data-field="name"></td>
            <td><input type="text" class="form-control form-control-sm" value="${team.captain || ''}" data-team-id="${index}" data-field="captain" placeholder="username#1234"></td>
        `;
        tbody.appendChild(row);
    });
    
    const modal = new bootstrap.Modal(document.getElementById('editAllTeamsModal'));
    modal.show();
}

// Save all team edits from bulk edit
function saveAllTeamEdits() {
    const inputs = document.querySelectorAll('#editAllTeamsBody input');
    
    inputs.forEach(input => {
        const teamId = parseInt(input.getAttribute('data-team-id'));
        const field = input.getAttribute('data-field');
        const value = input.value.trim();
        
        if (field === 'name' && value) {
            tournamentData.teams[teamId].name = value;
        } else if (field === 'captain') {
            tournamentData.teams[teamId].captain = value;
        }
    });
    
    // Refresh bracket to show new names
    generateBracket();
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('editAllTeamsModal'));
    modal.hide();
    
    saveData();
}

// Save tournament data to localStorage
function saveData() {
    localStorage.setItem('svge_tournament_data', JSON.stringify(tournamentData));
    
    // Also save bracket state
    const bracketState = {
        winners: [],
        losers: []
    };
    
    document.querySelectorAll('.team.winner').forEach(team => {
        const teamId = team.getAttribute('data-team-id');
        const matchEl = team.closest('.match');
        const round = matchEl.getAttribute('data-round');
        const match = matchEl.getAttribute('data-match');
        const slot = team.getAttribute('data-slot');
        
        bracketState.winners.push({ teamId, round, match, slot });
    });
    
    localStorage.setItem('svge_bracket_state', JSON.stringify(bracketState));
    
    // Show saved notification
    showNotification('Progress saved!');
}

// Load tournament data from localStorage
function loadData() {
    const savedData = localStorage.getItem('svge_tournament_data');
    if (savedData) {
        tournamentData = JSON.parse(savedData);
        document.getElementById('numTeams').value = tournamentData.numTeams;
    }
}

// Reset the entire bracket
function resetBracket() {
    if (confirm('Are you sure you want to reset the entire tournament bracket? This cannot be undone.')) {
        localStorage.removeItem('svge_tournament_data');
        localStorage.removeItem('svge_bracket_state');
        initializeTeams(tournamentData.numTeams);
        generateBracket();
        showNotification('Bracket reset!');
    }
}

// Show notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 2 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
