// Initialize Example Tournament
(function() {
    // Check if example tournament already exists
    const existingData = localStorage.getItem('tournament_example-tournament');
    
    if (!existingData) {
        // Create example tournament data
        const exampleTournament = {
            id: 'example-tournament',
            numTeams: 8,
            teams: [
                { id: 1, name: 'Team Alpha', captain: 'CaptainAlpha', gameId: 'Alpha#1234', eliminated: false },
                { id: 2, name: 'Team Bravo', captain: 'CaptainBravo', gameId: 'Bravo#5678', eliminated: false },
                { id: 3, name: 'Team Charlie', captain: 'CaptainCharlie', gameId: 'Charlie#9012', eliminated: false },
                { id: 4, name: 'Team Delta', captain: 'CaptainDelta', gameId: 'Delta#3456', eliminated: false },
                { id: 5, name: 'Team Echo', captain: 'CaptainEcho', gameId: 'Echo#7890', eliminated: false },
                { id: 6, name: 'Team Foxtrot', captain: 'CaptainFoxtrot', gameId: 'Foxtrot#1111', eliminated: false },
                { id: 7, name: 'Team Golf', captain: 'CaptainGolf', gameId: 'Golf#2222', eliminated: false },
                { id: 8, name: 'Team Hotel', captain: 'CaptainHotel', gameId: 'Hotel#3333', eliminated: false }
            ],
            matches: {
                '0-0': { team1: 1, team2: 2, winner: null },
                '0-1': { team1: 3, team2: 4, winner: null },
                '0-2': { team1: 5, team2: 6, winner: null },
                '0-3': { team1: 7, team2: 8, winner: null },
                '1-0': { team1: null, team2: null, winner: null },
                '1-1': { team1: null, team2: null, winner: null },
                'final-0': { team1: null, team2: null, winner: null }
            },
            title: 'Example Tournament',
            description: 'This is an example tournament to demonstrate the bracket system. You can edit this tournament or create your own from the admin panel.',
            date: 'Nov 9 - Nov 16, 2025',
            status: 'ongoing',
            image: 'assets/img/bracket.png'
        };
        
        // Save tournament data
        localStorage.setItem('tournament_example-tournament', JSON.stringify(exampleTournament));
        
        // Add to tournament list
        let tournamentList = [];
        const savedList = localStorage.getItem('tournamentList');
        if (savedList) {
            tournamentList = JSON.parse(savedList);
        }
        
        // Check if already in list
        if (!tournamentList.find(t => t.id === 'example-tournament')) {
            tournamentList.push({
                id: 'example-tournament',
                title: 'Example Tournament',
                date: 'Nov 9 - Nov 16, 2025',
                status: 'ongoing',
                image: 'assets/img/bracket.png'
            });
            localStorage.setItem('tournamentList', JSON.stringify(tournamentList));
        }
        
        console.log('Example tournament initialized!');
    }
})();
