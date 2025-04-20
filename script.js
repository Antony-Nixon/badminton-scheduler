let names = [], schedule = [], playerState = {}, playerPerformance = {};

function calculateIdealGames(n) {
  const totalPairs = n * (n - 1) / 2;
  return Math.ceil(totalPairs / 2);
}

function generateSchedule() {
  names = document.getElementById('playerNames').value
    .split(',').map(n=>n.trim()).filter(n=>n);
  const totalGames = parseInt(document.getElementById('numGames').value) || 8;
  if (names.length < 6) return alert('Need at least 6 players');

  // init state
  playerState = {};
  playerPerformance = {};
  names.forEach(n => {
    playerState[n] = {gameStreak:0, restStreak:0};
    playerPerformance[n] = {wins:0, games:0};
  });

  // show ideal count
  document.getElementById('idealGames').innerHTML =
    `🔢 Ideal games for full pairing: <strong>${calculateIdealGames(names.length)}</strong>`;

  // build schedule
  schedule = [];
  function valid(p){ return playerState[p].gameStreak<2 && playerState[p].restStreak<2; }
  function updateState(playersIn) {
    names.forEach(n=>{
      if(playersIn.includes(n)){
        playerState[n].gameStreak++;
        playerState[n].restStreak=0;
      } else {
        playerState[n].restStreak++;
        playerState[n].gameStreak=0;
      }
    });
  }

  for(let g=1; g<=totalGames; g++){
    let avail = names.filter(valid);
    if(avail.length<4) avail = names.slice();
    // shuffle
    for(let i=avail.length-1;i>0;i--){
      let j=Math.floor(Math.random()*(i+1));
      [avail[i],avail[j]]=[avail[j],avail[i]];
    }
    let play = avail.slice(0,4);
    let t1 = play.slice(0,2), t2 = play.slice(2,4);
    let rest = names.filter(n=>!play.includes(n));
    schedule.push({game:g, team1:t1, team2:t2, resting:rest, winner:null});
    updateState(play);
  }

  // render
  let tbody = document.querySelector('#scheduleTable tbody');
  tbody.innerHTML = '';
  schedule.forEach((r,i)=>{
    let tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.game}</td>
      <td>${r.team1.join(', ')}</td>
      <td>${r.team2.join(', ')}</td>
      <td>${r.resting.join(', ')}</td>
      <td>
        <input type="number" min="1" max="2"
               onchange="setWinner(${i}, this.value)">
      </td>`;
    tbody.appendChild(tr);
  });
}

function setWinner(idx,val){
  schedule[idx].winner = parseInt(val);
}

function calculatePerformance(){
  // tally
  schedule.forEach(g=>{
    if(!g.winner) return;
    let winTeam = (g.winner===1?g.team1:g.team2);
    let all = [...g.team1,...g.team2];
    all.forEach(p=>playerPerformance[p].games++);
    winTeam.forEach(p=>playerPerformance[p].wins++);
  });

  // sort by wins desc, then games
  let sorted = names.slice().sort((a,b)=>{
    let pa=playerPerformance[a], pb=playerPerformance[b];
    return (pb.wins-pa.wins)||(pb.games-pa.games);
  });

  // build table
  let html = '<h3>🏆 Player Performance</h3><table><tr><th>Player</th><th>Games</th><th>Wins</th><th>Win %</th></tr>';
  sorted.forEach(p=>{
    let s=playerPerformance[p];
    let rate = s.games?((s.wins/s.games*100).toFixed(1)+'%'):'N/A';
    html+=`<tr><td>${p}</td><td>${s.games}</td><td>${s.wins}</td><td>${rate}</td></tr>`;
  });
  html+='</table>';
  document.getElementById('performanceTable').innerHTML = html;
}
