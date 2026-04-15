# Guess The Number

A browser game built with React and Vite. It combines retro arcade styling with fast, clear gameplay: choose a difficulty, start the round, and chase the secret number while the timer counts down.

## What this project is

This app is a simple number guessing game that runs in the browser. It includes:

- three difficulty levels with different ranges and attempts
- a countdown timer for each round
- a hint system that reveals odd/even and a smaller range
- warm/cold feedback after each guess
- local storage high score tracking
- audio cues and a neon arcade theme

## How to play

1. Enter your name.
2. Select a difficulty level.
3. Click **Start**.
4. Type a guess and submit it.
5. Use the hint button once if you want help.
6. Win by guessing correctly before time or attempts run out.

## Install

From the `guess-the-number` folder:

```bash
npm install
```

## Run locally

```bash
npm run dev
```

Open the local address shown by Vite in your browser.

## Scripts

- `npm run dev` — start the development server
- `npm run build` — build the app for production
- `npm run preview` — preview the production build
- `npm run lint` — run ESLint

## Project structure

- `src/App.jsx` — game logic and interface
- `src/App.css` — visual theme and layout
- `src/main.jsx` — React entry point
- `public/` — static assets and browser metadata

## Notes

- The app stores the best score in local storage.
- Sound effects are optional and can be toggled on/off.
- The timer resets whenever a new game starts.

## Built with

- React
- Vite
- JavaScript
- CSS

Enjoy the game, and feel free to customize the difficulty or the theme to match your own style.
