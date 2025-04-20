let names = [], schedule = [], state = {}, performance = {};
let teamHistory = {}, oppHistory = {};

function generateSchedule() {
  // Read inputs
  names = document.getElementById('playerNames')
            .value.split(',').map(x=>x.trim()).filter(x=>x);
  const numGames = parseInt(document.getElementById('numGames').value);
  if (names.length < 6 || isNaN(numGames))
    return alert('Enter ≥6 players and valid game count');

  // Initialize all trackers
  state = {}; performance = {};
  teamHistory = {}; oppHistory = {};
  names.forEach(a => {
    state[a] = { lastPlayed: [] };
    performance[a] = { wins:0, games:0 };
    teamHistory[a] = {};
    oppHistory[a] = {};
    names.forEach(b => {
      if (a!==b) {
        teamHistory[a][b] = 0;
        oppHistory[a][b] = 0;
      }
    });
  });

  // Compute ideal pairing count
  const totalPairs = names.length*(names.length-1)/2;
  const ideal = Math.ceil(totalPairs/2);
  document.getElementById('idealGames')
          .innerHTML = `Ideal games for full pairing: <strong>${ideal}</strong>`;

  // Build schedule
  schedule = [];
  for (let g=0; g<numGames; g++) {
    // Filter candidates respecting play/rest streaks
    let cand = names.filter(p => {
      const L = state[p].lastPlayed;
      const last2 = L.slice(-2), last3 = L.slice(-3);
      const played2 = last2.every(s=>'P'===s);
      const rested2in3 = last3.filter(s=>'R'===s).length>1;
      return !(played2||rested2in3);
    });
    if (cand.length<4) cand = names.slice();

    // Pick best 4 to minimize team+opp repeats
    let best = null, bestScore = Infinity;
    for (let i=0; i<50; i++) {
      // sample 4 distinct
      let pool = cand.slice().sort(()=>Math.random()-0.5).slice(0,4);
      let [a,b,c,d] = pool;

      // score = team repeats + opponent repeats
      let score = teamHistory[a][b] + teamHistory[b][a]
                + teamHistory[c][d] + teamHistory[d][c]
                + oppHistory[a][c] + oppHistory[c][a]
                + oppHistory[a][d] + oppHistory[d][a]
                + oppHistory[b][c] + oppHistory[c][b]
                + oppHistory[b][d] + oppHistory[d][b];

      if (score<bestScore) {
        bestScore = score;
        best = pool;
        if (!score) break; // perfect
      }
    }

    // Assign teams & resting
    const team1 = best.slice(0,2), team2 = best.slice(2,4);
    const resting = names.filter(n=>!best.includes(n));

    schedule.push({ team1, team2, resting, winner:null });

    // Update play/rest state
    names.forEach(p=>{
      state[p].lastPlayed.push(best.includes(p)?'P':'R');
    });

    // Update history matrices
    // teammates
    [team1,team2].forEach(t=>{
      const [x,y]=t;
      teamHistory[x][y]++; teamHistory[y][x]++;
    });
    // opponents
    team1.forEach(x=> team2.forEach(y=>{
      oppHistory[x][y]++; oppHistory[y][x]++;
    }));
  }

  // render schedule table
  const tbody = document.querySelector('#scheduleTable tbody');
  tbody.innerHTML = '';
  schedule.forEach((g,i)=>{
    let tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i+1}</td>
      <td>${g.team1.join(', ')}</td>
      <td>${g.team2.join(', ')}</td>
      <td>${g.resting.join(', ')}</td>
      <td><input type="number" min="1" max="2"
                 onchange="setWinner(${i},this.value)"></td>`;
    tbody.appendChild(tr);
  });
}

function setWinner(idx,v) {
  const n=parseInt(v);
  if (n===1||n===2) schedule[idx].winner=n;
}

function calculatePerformance() {
  // tally games & wins
  schedule.forEach(g=>{
    if (!g.winner) return;
    const winT = g.winner===1?g.team1:g.team2;
    const allP = [...g.team1, ...g.team2];
    allP.forEach(p=>performance[p].games++);
    winT.forEach(p=>performance[p].wins++);
  });

  // sort by win%
  const out = Object.keys(performance)
    .map(p=>{
      const {wins,games}=performance[p];
      const pct = games?((wins/games)*100).toFixed(1):'0.0';
      return {p,wins,games,pct};
    })
    .sort((a,b)=>b.pct - a.pct);

  // render
  let html = `<h3>🎯 Final Result</h3>
    <table><thead><tr>
      <th>Player</th>
      <th>Wins:Games</th>
      <th>Win %</th>
    </tr></thead><tbody>`;
  out.forEach(r=>{
    html+=`<tr>
      <td>${r.p}</td>
      <td>${r.wins}:${r.games}</td>
      <td>${r.pct}%</td>
    </tr>`;
  });
  html += '</tbody></table>';
  document.getElementById('performanceTable').innerHTML = html;
}


