# RALLY 100 Gameplay Guide

## Objective

The objective is to complete a cooperative rally of **100 volleys**. The left paddle is controlled by an AI teammate, while the right paddle is controlled by the player.

A volley is counted only when the player's right paddle hits and returns the ball toward the left side.

## Rally Rules

- Each successful player return adds one point.
- The active score is saved after every point.
- The best rally is preserved across browser sessions.
- Winning 100 volleys adds one win to the player's total.
- Losing occurs when the ball passes the right paddle.
- A loss resets the active score to zero but preserves the best score and wins.

## Paddle Strategy

### Reading the Ball

Move the paddle toward the ball instead of toward the center. The position where the ball touches the paddle affects its vertical direction:

- Hit near the center for a flatter return.
- Hit near the top for an upward return.
- Hit near the bottom for a downward return.

### Handling Difficulty

The rally becomes faster after each return. Near 100 points, the right paddle also becomes shorter, leaving less room for timing errors. Stable, central paddle movement is usually safer than large repeated moves.

## Desktop Controls

- `Arrow Up` — move the right paddle upward
- `Arrow Down` — move the right paddle downward
- `W` — move upward
- `S` — move downward

## Mobile Controls

Touch or drag anywhere on the canvas to smoothly move the right paddle. The paddle follows the vertical position of the pointer.

## End Screens

### Victory

At 100 points, confetti appears, a four-note victory chime plays, and the victory overlay provides a share button.

### Game Over

When the ball passes the right paddle, the game displays the rally loss, best score, and total wins. Select **PLAY AGAIN** to begin a new rally.

## Persistence

RALLY 100 stores progress in `localStorage` under `rally100_save`. Clearing browser storage removes saved best scores and wins.
