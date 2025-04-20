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
        const teamHistory = {}; // Track which players have played together
        playerList.forEach(p1 => {
            teamHistory[p1] = {};
            playerList.forEach(p2 => {
                if (p1 !== p2) {
                    teamHistory[p1][p2] = 0;
                }
            });
        });
        
        // Track player game counts for balancing
        const gameCounts = {};
        playerList.forEach(player => {
            gameCounts[player] = 0;
        });
        
        for (let gameNum = 0; gameNum < totalGames; gameNum++) {
            // Calculate priority scores for each player for this game
            const playerScores = {};
            
            playerList.forEach(player => {
                // Start with base score
                let score = 0;
                
                // Factor 1: Balance playing time
                const gamesPlayed = gameCounts[player] || 0;
                const avgGames = gameNum > 0 ? (gameNum * 4) / numPlayers : 0;
                score -= (gamesPlayed - avgGames) * 15; // Higher priority if played less than average
                
                // Factor 2: Consecutive games rule
                if (consecutiveGames[player] >= 2) {
                    score -= 1000; // Strong penalty for playing 2 consecutive games already
                }
                
                // Factor 3: Rest rule - player shouldn't rest more than once in 3 consecutive games
                const restCount = restingHistory[player].filter(g => g >= gameNum - 2 && g < gameNum).length;
                if (restCount >= 1) { // Already rested once in the last 2 games
                    score += 500; // Boost priority to avoid resting again
                }
                
                playerScores[player] = score;
            });
            
            // Sort players by score (highest priority first)
            const sortedPlayers = [...playerList].sort((a, b) => playerScores[b] - playerScores[a]);
            
            // Select top 4 eligible players to play
            let selectedPlayers = [];
            for (let i = 0; i < sortedPlayers.length && selectedPlayers.length < 4; i++) {
                const player = sortedPlayers[i];
                // Check if player is eligible (hasn't played 2 consecutive games)
                if (consecutiveGames[player] < 2) {
                    selectedPlayers.push(player);
                }
            }
            
            // If we couldn't find 4 eligible players, we need to make exceptions
            if (selectedPlayers.length < 4) {
                for (let i = 0; i < sortedPlayers.length && selectedPlayers.length < 4; i++) {
                    const player = sortedPlayers[i];
                    if (!selectedPlayers.includes(player)) {
                        selectedPlayers.push(player);
                    }
                }
            }
            
            // Optimize team formation to minimize repeat teammates
            // We'll create a matrix of "partnership scores" based on history
            const partnershipScores = [];
            for (let i = 0; i < 4; i++) {
                partnershipScores[i] = [];
                for (let j = 0; j < 4; j++) {
                    if (i === j) {
                        partnershipScores[i][j] = Infinity; // Can't partner with yourself
                    } else {
                        // Higher score = played together more often
                        partnershipScores[i][j] = teamHistory[selectedPlayers[i]][selectedPlayers[j]] || 0;
                    }
                }
            }
            
            // Find optimal team split that minimizes partnership score
            let bestTeamSplit = null;
            let lowestScore = Infinity;
            
            // Try all possible combinations of 2+2 players
            const possibleTeams = [
                [[0, 1], [2, 3]],
                [[0, 2], [1, 3]],
                [[0, 3], [1, 2]]
            ];
            
            possibleTeams.forEach(teamSplit => {
                const [team1Indices, team2Indices] = teamSplit;
                const team1Score = partnershipScores[team1Indices[0]][team1Indices[1]];
                const team2Score = partnershipScores[team2Indices[0]][team2Indices[1]];
                const totalScore = team1Score + team2Score;
                
                if (totalScore < lowestScore) {
                    lowestScore = totalScore;
                    bestTeamSplit = teamSplit;
                }
            });
            
            // Create teams based on best split
            const teamA = bestTeamSplit[0].map(idx => selectedPlayers[idx]);
            const teamB = bestTeamSplit[1].map(idx => selectedPlayers[idx]);
            const restingPlayers = playerList.filter(p => !selectedPlayers.includes(p));
            
            // Update team history
            teamA.forEach(p1 => {
                teamA.forEach(p2 => {
                    if (p1 !== p2) {
                        teamHistory[p1][p2]++;
                        teamHistory[p2][p1]++;
                    }
                });
            });
            
            teamB.forEach(p1 => {
                teamB.forEach(p2 => {
                    if (p1 !== p2) {
                        teamHistory[p1][p2]++;
                        teamHistory[p2][p1]++;
                    }
                });
            });
            
            // Update consecutive games tracking
            playerList.forEach(player => {
                if (selectedPlayers.includes(player)) {
                    consecutiveGames[player]++;
                    gameCounts[player]++;
                } else {
                    consecutiveGames[player] = 0;
                    restingHistory[player].push(gameNum);
                }
            });
            
            // Add game to schedule
            schedule.push({
                gameNumber: gameNum + 1,
                teamA,
                teamB,
                restingPlayers,
                winner: null
            });
        }
        
        // Validate the schedule
        validateSchedule(schedule, playerList);
        
        return schedule;
    }
    
    function validateSchedule(schedule, playerList) {
        console.log("Validating schedule...");
        
        const consecutiveGamesViolations = {};
        const restViolations = {};
        const gameCount = {};
        
        playerList.forEach(player => {
            consecutiveGamesViolations[player] = 0;
            restViolations[player] = 0;
            gameCount[player] = 0;
        });
        
        // Check consecutive games rule
        playerList.forEach(player => {
            let consecutive = 0;
            
            for (let i = 0; i < schedule.length; i++) {
                const game = schedule[i];
                const isPlaying = [...game.teamA, ...game.teamB].includes(player);
                
                if (isPlaying) {
                    consecutive++;
                    gameCount[player]++;
                    if (consecutive > 2) {
                        consecutiveGamesViolations[player]++;
                    }
                } else {
                    consecutive = 0;
                }
            }
        });
        
        // Check rest rule
        playerList.forEach(player => {
            for (let i = 0; i < schedule.length - 2; i++) {
                const resting = [];
                
                for (let j = i; j < i + 3; j++) {
                    if (j < schedule.length && schedule[j].restingPlayers.includes(player)) {
                        resting.push(j);
                    }
                }
                
                if (resting.length > 1) {
                    restViolations[player]++;
                }
            }
        });
        
        // Log validation results
        console.log("Consecutive Games Violations:", consecutiveGamesViolations);
        console.log("Rest Violations:", restViolations);
        console.log("Game Counts:", gameCount);
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
