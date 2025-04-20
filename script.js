let names = [], schedule = [], state = {}, performance = {};
let pastMatchups = new Set(), pastTeammates = {};

function generateSchedule() {
    names = document.getElementById('playerNames').value.split(',').map(x => x.trim()).filter(x => x);
    const numGames = parseInt(document.getElementById('numGames').value);
    if (names.length < 6 || isNaN(numGames)) return alert('Minimum 6 players and valid number of games');

    const totalPairs = (names.length * (names.length - 1)) / 2;
    const ideal = Math.ceil(totalPairs / 2);
    document.getElementById('idealGames').innerHTML = `Ideal games for full pairing: <strong>${ideal}</strong>`;

    schedule = [];
    state = {};
    performance = {};
    pastMatchups = new Set();
    pastTeammates = {};
    names.forEach(n => {
        state[n] = { lastPlayed: [], games: 0 };
        performance[n] = { wins: 0, games: 0 };
        pastTeammates[n] = new Set();
    });

    for (let g = 0; g < numGames; g++) {
        let candidates = names.filter(p => {
            const recent = state[p].lastPlayed.slice(-2);
            const gamesInLast3 = state[p].lastPlayed.slice(-3);
            const played2inRow = recent.every(x => x === 'P');
            const rest2in3 = gamesInLast3.filter(x => x === 'R').length > 1;
            return !(played2inRow || rest2in3);
        });

        if (candidates.length < 4) candidates = [...names];

        candidates = shuffleArray(candidates);
        let selected = pickBestTeams(candidates.slice(0, 6));  // Try with 6, pick best 4
        const gamePlayers = selected.flat();
        const team1 = selected[0];
        const team2 = selected[1];
        const resting = names.filter(n => !gamePlayers.includes(n));

        schedule.push({ team1, team2, resting, winner: null });

        names.forEach(p => {
            if (gamePlayers.includes(p)) {
                state[p].lastPlayed.push('P');
                state[p].games++;
            } else {
                state[p].lastPlayed.push('R');
            }
        });

        // Store past matchup info
        team1.forEach(a => team2.forEach(b => pastMatchups.add([a, b].sort().join('-'))));
        team1.forEach((a, i) => team1.forEach((b, j) => { if (i < j) pastTeammates[a].add(b); pastTeammates[b].add(a); }));
        team2.forEach((a, i) => team2.forEach((b, j) => { if (i < j) pastTeammates[a].add(b); pastTeammates[b].add(a); }));
    }

    const tbody = document.querySelector('#scheduleTable tbody');
    tbody.innerHTML = '';
    schedule.forEach((g, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${g.team1.join(', ')}</td>
            <td>${g.team2.join(', ')}</td>
            <td>${g.resting.join(', ')}</td>
            <td><input type='number' min='1' max='2' onchange='setWinner(${i}, this.value)'></td>
        `;
        tbody.appendChild(tr);
    });
}

function pickBestTeams(players) {
    let bestScore = Infinity;
    let bestSplit = [];

    // All combinations of 4 players out of 6
    for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
            for (let k = j + 1; k < players.length; k++) {
                for (let l = k + 1; l < players.length; l++) {
                    const four = [players[i], players[j], players[k], players[l]];
                    const rest = players.filter(p => !four.includes(p));
                    const team1 = [four[0], four[1]];
                    const team2 = [four[2], four[3]];
                    const score = repeatPenalty(team1, team2);
                    if (score < bestScore) {
                        bestScore = score;
                        bestSplit = [team1, team2];
                    }
                }
            }
        }
    }
    return bestSplit;
}

function repeatPenalty(team1, team2) {
    let penalty = 0;
    for (let a of team1) for (let b of team2) {
        if (pastMatchups.has([a, b].sort().join('-'))) penalty += 5;
    }
    for (let a of team1) for (let b of team1) {
        if (a !== b && pastTeammates[a].has(b)) penalty += 2;
    }
    for (let a of team2) for (let b of team2) {
        if (a !== b && pastTeammates[a].has(b)) penalty += 2;
    }
    return penalty;
}

function shuffleArray(arr) {
    let array = [...arr];
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function setWinner(index, value) {
    const val = parseInt(value);
    if (val === 1 || val === 2) schedule[index].winner = val;
}

function calculatePerformance() {
    performance = {};
    names.forEach(p => performance[p] = { wins: 0, games: 0 });

    schedule.forEach(g => {
        if (!g.winner) return;
        const winTeam = g.winner === 1 ? g.team1 : g.team2;
        const all = [...g.team1, ...g.team2];
        all.forEach(p => performance[p].games++);
        winTeam.forEach(p => performance[p].wins++);
    });

    const sorted = Object.keys(performance).sort((a, b) => {
        const ra = performance[a].games ? performance[a].wins / performance[a].games : 0;
        const rb = performance[b].games ? performance[b].wins / performance[b].games : 0;
        return rb - ra;
    });

    let html = `<h3>🎯 Final Result</h3><table><tr><th>Player</th><th>Wins:Games</th><th>Win%</th></tr>`;
    sorted.forEach(p => {
        const { wins, games } = performance[p];
        const rate = games ? ((wins / games) * 100).toFixed(1) : '0.0';
        html += `<tr><td>${p}</td><td>${wins}:${games}</td><td>${rate}%</td></tr>`;
    });
    html += '</table>';
    document.getElementById('performanceTable').innerHTML = html;
}

