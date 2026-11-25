# RALLY 100 Gameplay Guide

## Objective

The objective is to complete a cooperative rally of **1000 volleys**. The left paddle is controlled by an AI teammate, while the right paddle is controlled by the player.

A volley is counted only when the player's right paddle hits and returns the ball toward the left side.

## Rally Rules

- Each successful player return adds one point.
- The active score is saved after every point.
- The best rally is preserved across browser sessions.
- Winning 1000 volleys adds one win to the player's total.
- Checkpoints at 25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, and 1000 trigger fireworks and a permanent 1.25% speed increase.
- Losing occurs when the ball passes the right paddle.
- A loss resets the active score to zero but preserves the best score and wins.

## Paddle Strategy

### Reading the Ball

Move the paddle toward the ball instead of toward the center. The position where the ball touches the paddle affects its vertical direction:

- Hit near the center for a flatter return.
- Hit near the top for an upward return.
- Hit near the bottom for a downward return.

### Handling Difficulty

The rally becomes faster after each return. Every checkpoint also adds a 1.25% speed multiplier and progressively larger fireworks. The right paddle becomes shorter as the rally grows, leaving less room for timing errors. Stable, central paddle movement is usually safer than large repeated moves.

## Desktop Controls

- `Arrow Up` — move the right paddle upward
- `Arrow Down` — move the right paddle downward
- `W` — move upward
- `S` — move downward
- `P` or `Escape` — pause/resume
- On-screen **Ⅱ PAUSE / ▶ RESUME** button — pause/resume

## Mobile Controls

Touch or drag anywhere on the canvas to smoothly move the right paddle. The paddle follows the vertical position of the pointer.

## End Screens

### Victory

At every checkpoint, scaled fireworks and a synthesized chime appear. At 1000, the game shows the 1000 VICTORY celebration and share overlay.

### Game Over

When the ball passes the right paddle, the game displays the rally loss, best score, and total wins. Select **PLAY AGAIN** to begin a new rally.

## Persistence

RALLY 100 stores progress in `localStorage` under `rally100_save`. Clearing browser storage removes saved best scores and wins.
