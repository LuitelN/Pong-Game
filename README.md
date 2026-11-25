# RALLY 100

**RALLY 100** is a zero-dependency, cooperative Pong challenge for the browser. Instead of competing against an opponent, you and an AI partner share one goal: keep the rally alive through milestone checkpoints and reach **1000 successful human volleys**.

The game is built with HTML5 Canvas, CSS3, and vanilla JavaScript. It runs directly from a static host and is compatible with GitHub Pages and Vercel.

## How to Play

1. Open the game in a desktop or mobile browser.
2. Control the **pink paddle on the right**.
3. Move it vertically to return the ball.
4. Every successful return by the human paddle adds **1 point** to the rally.
5. Reach **1000 points** to win.
6. If the ball passes the right paddle, the rally ends and the score resets to zero.

### Controls

| Platform         | Controls                                              |
| ---------------- | ----------------------------------------------------- |
| Desktop          | `↑` / `↓`, `W` / `S`; `P` or `Esc` to pause/resume    |
| Mobile and touch | Press and drag anywhere vertically on the game canvas |

The blue paddle on the left is your AI partner. It tracks and returns the ball automatically.

## Gameplay Features

- Cooperative 1000-volley challenge
- Scaling milestone fireworks at 25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, and 1000
- Permanent 1.25% rally speed boost at every checkpoint
- Accessible on-screen Pause/Resume control and P/Escape shortcuts
- Responsive full-screen retro interface
- Dynamic paddle deflection based on hit position
- Increasing ball speed after human returns
- Gradually shrinking right paddle near the 1000-point milestone
- Screen shake, hit flashes, and particle sparks
- Victory confetti and a synthesized retro chime
- Native share support with clipboard fallback
- Delta-time game updates for consistent physics across refresh rates
- Persistent best score and win count using `localStorage`

## Saved Progress

Rally progress is stored locally in the browser under the key `rally100_save`:

```json
{
  "currentScore": 0,
  "bestScore": 0,
  "wins": 0
}
```

- **currentScore** tracks the active rally.
- **bestScore** records the longest completed rally.
- **wins** counts successful 1000-volley victories.

## Run Locally

Because the project is plain static code, no package installation is required.

```bash
cd Pong
python3 -m http.server 4173
```

Then visit `http://localhost:4173`.

On Windows or macOS, you can also open `index.html` directly or serve the folder with any static web server.

## Deployment

### GitHub Pages

1. Push the repository to GitHub.
2. Open **Settings → Pages**.
3. Select the `main` branch and `/ (root)` directory.
4. Save. GitHub will publish the site.

### Vercel

Import the repository in Vercel and deploy it as a static project. No build command or framework settings are required.

## Project Structure

```text
Pong/
├── index.html       # Semantic page markup
├── style.css        # Theme, layout, overlays, and responsive styles
├── game.js          # Canvas, physics, AI, scoring, audio, and persistence
├── docs/            # Additional game documentation
├── assets/          # Optional screenshots or media
└── README.md        # Project overview
```

## Browser Support

RALLY 100 uses broadly supported APIs and works in modern desktop and mobile browsers. Audio begins after a browser-allowed interaction and is safely skipped if unavailable.

## License

This project is a small open-source browser game. Add a license file before redistributing publicly if you require explicit licensing terms.
