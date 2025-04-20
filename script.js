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
        console.log("Generate Schedule button clicked");
        
        if (players.length < 6) {
            playerError.textContent = 'Add at least 6 players to generate a schedule';
            return;
        }
        
        totalGames = parseInt(totalGamesInput.value);
        if (isNaN(totalGames) || totalGames < 1) {
            playerError.textContent = 'Total games must be a positive number';
            return;
        }
        
        console.log(`Creating schedule for ${players.length} players and ${totalGames} games`);
        
        // Initialize player stats
        playerStats = {};
        players.forEach(player => {
            playerStats[player] = { played: 0, wins: 0 };
        });
        
        // Simple scheduling algorithm
        gameSchedule = [];
        
        // Track consecutive games for each player
        const consecutiveGames = {};
        players.forEach(player => {
            consecutiveGames[player] = 0;
        });
        
        // Track games played
        const gamesPlayed = {};
        players.forEach(player => {
            gamesPlayed[player] = 0;
        });
        
        for (let gameNum = 0; gameNum < totalGames; gameNum++) {
            console.log(`Planning game ${gameNum + 1}`);
            
            // Calculate player scores for selection
            const playerScores = {};
            players.forEach(player => {
                // Base score is inverse of games played (to balance)
                let score = -gamesPlayed[player] * 10;
                
                // Heavy penalty for 2+ consecutive games
                if (consecutiveGames[player] >= 2) {
                    score -= 1000;
                }
                
                playerScores[player] = score;
            });
            
            // Sort players by score (highest priority first)
            const sortedPlayers = [...players].sort((a, b) => playerScores[b] - playerScores[a]);
            
            // Select top 4 players for this game
            const gamePlayers = sortedPlayers.slice(0, 4);
            const restingPlayers = sortedPlayers.slice(4);
            
            console.log("Selected players:", gamePlayers);
            console.log("Resting players:", restingPlayers);
            
            // Split into teams (first 2, last 2)
            const teamA = gamePlayers.slice(0, 2);
            const teamB = gamePlayers.slice(2, 4);
            
            // Add game to schedule
            gameSchedule.push({
                gameNumber: gameNum + 1,
                teamA: teamA,
                teamB: teamB,
                restingPlayers: restingPlayers,
                winner: null
            });
            
            // Update consecutive games counter and games played
            players.forEach(player => {
                if (gamePlayers.includes(player)) {
                    consecutiveGames[player]++;
                    gamesPlayed[player]++;
                } else {
                    consecutiveGames[player] = 0;
                }
            });
        }
        
        console.log("Final schedule:", gameSchedule);
        
        // Show schedule section
        setupSection.classList.add('hidden');
        scheduleSection.classList.remove('hidden');
        
        // Update total games display
        totalGameCount.textContent = totalGames;
        
        // Show first game
        currentGame = 0;
        showCurrentGame();
    }
    
    function showCurrentGame() {
        console.log(`Showing game ${currentGame + 1}`);
        const game = gameSchedule[currentGame];
        if (!game) {
            console.error("No game data found");
            return;
        }
        
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
