let names = [], schedule = [], state = {}, performance = {}, teamHistory = {};

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
    teamHistory = {};

    names.forEach(n => {
        state[n] = { lastPlayed: [], games: 0 };
        performance[n] = { wins: 0, games: 0 };
        teamHistory[n] = {};
        names.forEach(m => {
            if (n !== m) teamHistory[n][m] = 0;
        });
    });

    for (let g = 0; g < numGames; g++) {
        let candidates = names.filter(p => {
            const recent = state[p].lastPlayed.slice(-2);
            const gamesInLast3 = state[p].lastPlayed.slice(-3);
            const played2inRow = recent.every(x => x === 'P');
            const rest2in3 = gamesInLast3.filter(x => x === 'R').length > 1;
            return !(played2inRow || rest2in3);
        });

        if (candidates.length < 4) candidates = names;

        let bestCombo = null;
        let minTeamCount = Infinity;

        for (let i = 0; i < 20; i++) {
            const sample = [...candidates].sort(() => Math.random() - 0.5).slice(0, 4);
            const [a, b, c, d] = sample;
            const count = teamHistory[a][b] + teamHistory[c][d];

            if (count < minTeamCount) {
                minTeamCount = count;
                bestCombo = sample;
            }
        }

        const gamePlayers = bestCombo;
        const team1 = gamePlayers.slice(0, 2);
        const team2 = gamePlayers.slice(2, 4);
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

        teamHistory[team1[0]][team1[1]]++;
        teamHistory[team1[1]][team1[0]]++;
        teamHistory[team2[0]][team2[1]]++;
        teamHistory[team2[1]][team2[0]]++;
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

function setWinner(index, value) {
    const val = parseInt(value);
    if (val === 1 || val === 2) schedule[index].winner = val;
}

function calculatePerformance() {
    schedule.forEach(g => {
        if (!g.winner) return;
        const winTeam = g.winner === 1 ? g.team1 : g.team2;
        const all = [...g.team1, ...g.team2];
        all.forEach(p => performance[p].games++);
        winTeam.forEach(p => performance[p].wins++);
    });

    const sorted = Object.entries(performance)
        .map(([name, data]) => {
            const { wins, games } = data;
            const rate = games ? ((wins / games) * 100).toFixed(1) : '0.0';
            return { name, wins, games, rate };
        })
        .sort((a, b) => b.rate - a.rate);

    let html = `
        <h3>🎯 Final Result</h3>
        <table>
            <thead><tr>
                <th>Player</th><th>Wins:Games</th><th>Win %</th>
            </tr></thead>
            <tbody>
    `;
    sorted.forEach(p => {
        html += `<tr>
            <td>${p.name}</td>
            <td>${p.wins}:${p.games}</td>
            <td>${p.rate}%</td>
        </tr>`;
    });
    html += '</tbody></table>';

    document.getElementById('performanceTable').innerHTML = html;
}

