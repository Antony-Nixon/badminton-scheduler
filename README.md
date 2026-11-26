# Badminton Game Scheduler

A browser-based badminton doubles scheduler for balancing player participation across multiple games, recording winners, and summarizing player performance.

## What it does

- Accepts a group of players
- Requires at least six players for scheduling
- Generates a multi-game doubles rotation
- Balances game participation and rest periods
- Displays the two teams and resting players for each game
- Records the winning team
- Produces a final performance table with games played, wins, and win percentage
- Works as a lightweight static web app with no backend

## How to use

1. Open `index.html` in a browser, or serve the folder with a local HTTP server.
2. Add at least six unique player names.
3. Choose the number of games.
4. Select **Generate Schedule**.
5. Record the winner after each game.
6. Move through the schedule to view the final performance table.

For local development with Python:

```bash
python -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000).

## Scheduling approach

The current scheduler prioritizes players with fewer games played and penalizes players who have already played consecutive games. It then selects four players for each game, divides them into two teams, and records the remaining players as resting.

This is a practical heuristic rather than a mathematically optimal tournament scheduler. It is intended for casual games and small groups.

## Project structure

```text
index.html   Application layout and controls
script.js    Scheduling, game state, winner recording, and results
style.css    Layout, responsive styles, and visual presentation
```

## Current limitations

- Team composition is heuristic-based
- There is no persistent save or export of a completed schedule
- Refreshing the page resets the current session
- There is no authentication or multi-device synchronization
- The app does not account for player skill ratings or preferred partners
- Results are recorded only in the active browser session

## Roadmap

- Add schedule export and shareable links
- Add local persistence and resume support
- Add configurable court count and match format
- Improve team balancing with partner/opponent history
- Add optional skill ratings and fairness metrics
- Add automated tests for scheduling edge cases
- Add accessible status announcements for game transitions

## License

No license has been selected yet. Until a license is added, the repository remains source-available but does not grant broad reuse rights.

## Author

Built and maintained by Antony Nixon.
