document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const playerNameInput = document.getElementById('player-name');
    const addPlayerBtn = document.getElementById('add-player');
    const playerList = document.getElementById('player-list');
    const playerError = document.getElementById('player-error');
    const totalGamesInput = document.getElementById('total-games');
    const generateScheduleBtn = document.getElementById('generate-schedule');
    
    const setupSection = document.getElementById('setup-section');
    const scheduleSection = document.getElementById('schedule-section');
    const resultsSection = document.getElementById('results-section');
    
    const currentGameNumber = document.getElementById('current-game-number');
    const totalGameCount = document.getElementById('total-game-count');
    const teamA = document.getElementById('team-a');
    const teamB = document.getElementById('team-b');
    const restingPlayersList = document.getElementById('resting-players-list');
    
    const teamAWinBtn = document.getElementById('team-a-win');
    const teamBWinBtn = document.getElementById('team-b-win');
    const nextGameBtn = document.getElementById('next-game');
    
    const resultsBody = document.getElementById('results-body');
    const newScheduleBtn = document.getElementById('new-schedule');
    
    // App State
    let players = [];
    let totalGames = 5;
    let gameSchedule = [];
    let currentGame = 0;
    let playerStats = {};
    
    // Event Listeners
    addPlayerBtn.addEventListener('click', addPlayer);
    playerNameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addPlayer();
        }
    });
    
    generateScheduleBtn.addEventListener('click', generateSchedule);
    teamAWinBtn.addEventListener('click', () => recordWinner('A'));
    teamBWinBtn.addEventListener('click', () => recordWinner('B'));
    nextGameBtn.addEventListener('click', showNextGame);
    newScheduleBtn.addEventListener('click', resetApp);
    
    // Functions
    function addPlayer() {
        const playerName = playerNameInput.value.trim();
        
        if (playerName === '') {
            playerError.textContent = 'Player name cannot be empty';
            return;
        }
        
        if (players.includes(playerName)) {
            playerError.textContent = 'Player already added';
            return;
        }
        
        players.push(playerName);
        playerError.textContent = '';
        playerNameInput.value = '';
        
        updatePlayerList();
    }
    
    function updatePlayerList() {
        playerList.innerHTML = '';
        
        players.forEach(player => {
            const li = document.createElement('li');
            li.textContent = player;
            
            const removeBtn = document.createElement('span');
            removeBtn.textContent = 'X';
            removeBtn.className = 'remove-player';
            removeBtn.addEventListener('click', () => removePlayer(player));
            
            li.appendChild(removeBtn);
            playerList.appendChild(li);
        });
    }
    
    function removePlayer(player) {
        players = players.filter(p => p !== player);
        updatePlayerList();
    }
    
    function generateSchedule() {
        if (players.length < 6) {
            playerError.textContent = 'Add at least 6 players to generate a schedule';
            return;
        }
        
        totalGames = parseInt(totalGamesInput.value);
        if (isNaN(totalGames) || totalGames < 1) {
            playerError.textContent = 'Total games must be a positive number';
            return;
        }
        
        // Initialize player stats
        playerStats = {};
        players.forEach(player => {
            playerStats[player] = { played: 0, wins: 0 };
        });
        
        // Generate game schedule
        gameSchedule = createOptimizedSchedule(players, totalGames);
        
        // Show schedule section
        setupSection.classList.add('hidden');
        scheduleSection.classList.remove('hidden');
        
        // Update total games display
        totalGameCount.textContent = totalGames;
        
        // Show first game
        currentGame = 0;
        showCurrentGame();
    }
    
    function createOptimizedSchedule(playerList, totalGames) {
        const schedule = [];
        const numPlayers = playerList.length;
        
        // Track consecutive games and rest periods for each player
        const consecutiveGames = {};
        const restingHistory = {};
        playerList.forEach(player => {
            consecutiveGames[player] = 0;
            restingHistory[player] = [];
        });
        
        // Track team history to avoid repeated team compositions
        const teamPairHistory = {};
        playerList.forEach(p1 => {
            teamPairHistory[p1] = {};
            playerList.forEach(p2 => {
                if (p1 !== p2) {
                    teamPairHistory[p1][p2] = 0;
                }
            });
        });
        
        for (let gameNum = 0; gameNum < totalGames; gameNum++) {
            // Calculate player scores for this game
            const playerScores = {};
            
            playerList.forEach(player => {
                let score = 0;
                
                // Factor 1: Playing time balance (players with fewer games get priority)
                const gamesPlayed = playerStats[player]?.played || 0;
                score -= gamesPlayed * 10;
                
                // Factor 2: Consecutive games penalty
                if (consecutiveGames[player] >= 2) {
                    score -= 1000; // Strong penalty for 3+ consecutive games
                } else {
                    score += consecutiveGames[player] * 5; // Small bonus for warming up
                }
                
                // Factor 3: Rest penalty - penalize players who have rested too much
                const restingCount = restingHistory[player].filter(g => g >= gameNum - 2 && g <= gameNum).length;
                if (restingCount >= 2) {
                    score -= 800; // Strong penalty for resting 2+ times in last 3 games
                }
                
                playerScores[player] = score;
            });
            
            // Sort players by score (highest first)
            const sortedPlayers = [...playerList].sort((a, b) => playerScores[b] - playerScores[a]);
            
            // Select top 4 eligible players for this game
            const selectedPlayers = [];
            
            // First, make sure we don't violate the consecutive games rule
            for (let i = 0; i < sortedPlayers.length && selectedPlayers.length < 4; i++) {
                const player = sortedPlayers[i];
                if (consecutiveGames[player] < 2) { // Max 2 consecutive games
                    selectedPlayers.push(player);
                }
            }
            
            // If we don't have 4 players yet, we need to make exceptions
            if (selectedPlayers.length < 4) {
                for (let i = 0; i < sortedPlayers.length && selectedPlayers.length < 4; i++) {
                    const player = sortedPlayers[i];
                    if (!selectedPlayers.includes(player)) {
                        selectedPlayers.push(player);
                    }
                }
            }
            
            // Form teams with minimal partner repetition
            const teamA = [];
            const teamB = [];
            const remainingPlayers = [...selectedPlayers];
            
            // Pick first player for team A
            teamA.push(remainingPlayers.shift());
            
            // Find best partner for first player in team A
            let bestPartner = null;
            let lowestScore = Infinity;
            
            for (const p2 of remainingPlayers) {
                const pairScore = teamPairHistory[teamA[0]][p2] || 0;
                if (pairScore < lowestScore) {
                    lowestScore = pairScore;
                    bestPartner = p2;
                }
            }
            
            teamA.push(bestPartner);
            remainingPlayers.splice(remainingPlayers.indexOf(bestPartner), 1);
            
            // Remaining two players go to team B
            teamB.push(...remainingPlayers);
            
            // Create resting players list
            const restingPlayers = playerList.filter(p => !selectedPlayers.includes(p));
            
            // Update team pair history
            teamPairHistory[teamA[0]][teamA[1]]++;
            teamPairHistory[teamA[1]][teamA[0]]++;
            teamPairHistory[teamB[0]][teamB[1]]++;
            teamPairHistory[teamB[1]][teamB[0]]++;
            
            // Add game to schedule
            schedule.push({
                gameNumber: gameNum + 1,
                teamA,
                teamB,
                restingPlayers,
                winner: null
            });
            
            // Update consecutive games counter
            playerList.forEach(player => {
                if (selectedPlayers.includes(player)) {
                    consecutiveGames[player]++;
                } else {
                    consecutiveGames[player] = 0;
                    restingHistory[player].push(gameNum);
                }
            });
        }
        
        return schedule;
    }
    
    function showCurrentGame() {
        const game = gameSchedule[currentGame];
        if (!game) return;
        
        currentGameNumber.textContent = game.gameNumber;
        
        // Display team A
        teamA.innerHTML = '';
        game.teamA.forEach(player => {
            const playerCard = document.createElement('div');
            playerCard.className = 'player-card';
            playerCard.textContent = player;
            teamA.appendChild(playerCard);
        });
        
        // Display team B
        teamB.innerHTML = '';
        game.teamB.forEach(player => {
            const playerCard = document.createElement('div');
            playerCard.className = 'player-card';
            playerCard.textContent = player;
            teamB.appendChild(playerCard);
        });
        
        // Display resting players
        restingPlayersList.innerHTML = '';
        game.restingPlayers.forEach(player => {
            const playerCard = document.createElement('div');
            playerCard.className = 'player-card';
            playerCard.textContent = player;
            restingPlayersList.appendChild(playerCard);
        });
        
        // Reset winner selection
        teamAWinBtn.style.opacity = '1';
        teamBWinBtn.style.opacity = '1';
        nextGameBtn.disabled = true;
        
        // If a winner was already selected
        if (game.winner) {
            if (game.winner === 'A') {
                teamAWinBtn.style.opacity = '0.7';
                teamBWinBtn.style.opacity = '0.3';
            } else {
                teamAWinBtn.style.opacity = '0.3';
                teamBWinBtn.style.opacity = '0.7';
            }
            nextGameBtn.disabled = false;
        }
    }
    
    function recordWinner(team) {
        const game = gameSchedule[currentGame];
        if (!game) return;
        
        game.winner = team;
        
        // Update player stats
        const winningTeam = team === 'A' ? game.teamA : game.teamB;
        const allPlayers = [...game.teamA, ...game.teamB];
        
        allPlayers.forEach(player => {
            if (!playerStats[player]) {
                playerStats[player] = { played: 0, wins: 0 };
            }
            playerStats[player].played++;
            
            if (winningTeam.includes(player)) {
                playerStats[player].wins++;
            }
        });
        
        // Update UI
        if (team === 'A') {
            teamAWinBtn.style.opacity = '0.7';
            teamBWinBtn.style.opacity = '0.3';
        } else {
            teamAWinBtn.style.opacity = '0.3';
            teamBWinBtn.style.opacity = '0.7';
        }
        
        nextGameBtn.disabled = false;
    }
    
    function showNextGame() {
        currentGame++;
        
        if (currentGame < gameSchedule.length) {
            showCurrentGame();
        } else {
            // Show results section
            scheduleSection.classList.add('hidden');
            resultsSection.classList.remove('hidden');
            showResults();
        }
    }
    
    function showResults() {
        resultsBody.innerHTML = '';
        
        // Sort players by win percentage
        const sortedPlayers = [...players].sort((a, b) => {
            const aWinPct = playerStats[a].played > 0 ? (playerStats[a].wins / playerStats[a].played) : 0;
            const bWinPct = playerStats[b].played > 0 ? (playerStats[b].wins / playerStats[b].played) : 0;
            return bWinPct - aWinPct;
        });
        
        sortedPlayers.forEach(player => {
            const stats = playerStats[player];
            const winPercentage = stats.played > 0 ? ((stats.wins / stats.played) * 100).toFixed(1) : '0.0';
            
            const row = document.createElement('tr');
            
            const nameCell = document.createElement('td');
            nameCell.textContent = player;
            
            const playedCell = document.createElement('td');
            playedCell.textContent = stats.played;
            
            const winsCell = document.createElement('td');
            winsCell.textContent = stats.wins;
            
            const winPctCell = document.createElement('td');
            winPctCell.textContent = `${winPercentage}%`;
            
            row.appendChild(nameCell);
            row.appendChild(playedCell);
            row.appendChild(winsCell);
            row.appendChild(winPctCell);
            
            resultsBody.appendChild(row);
        });
    }
    
    function resetApp() {
        // Reset state
        gameSchedule = [];
        currentGame = 0;
        playerStats = {};
        
        // Reset UI
        resultsSection.classList.add('hidden');
        setupSection.classList.remove('hidden');
    }
});
