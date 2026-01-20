# CNN Fear & Greed Index Dashboard

A modern, responsive dashboard for the CNN Fear & Greed Index, featuring a hybrid data strategy (Local JSON + Daily API Header), compact header layout, and 7 sub-indicators.

🚀 **Live Demo**: [https://tomasisz.github.io/fear-greed-chart/](https://tomasisz.github.io/fear-greed-chart/)

![Dashboard Preview](https://github.com/tomasisz/fear-greed-chart/blob/main/public/preview.png?raw=true)
_(Note: You might want to upload a screenshot to your repo later for this image to show up)_

## Features

- **Hybrid Data Loading**: Instantly loads historical data from local JSON (2021-Present) and merges with daily updates from CNN API.
- **Top Header Info**: Compact, single-line display for the main Fear & Greed Score and "Next Update" countdown.
- **7 Sub-Indicators**: Detailed charts for Market Momentum, Price Strength, VIX, etc., displayed in a responsive 2-column grid.
- **Tech Stack**: React, TypeScript, Vite, Lightweight Charts (v5).
- **i18n**: Supports English, Simplified Chinese, and Traditional Chinese.

## Local Development

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start dev server**:
   ```bash
   npm run dev
   ```

## Data Updates

This project uses a static JSON file for historical data to ensure fast loading and bypass CORS restrictions on GitHub Pages.

**To update data daily:**

1. Run the update script:

   ```bash
   npm run update-data
   ```

   _This fetches the latest data from CNN (proxied via Node.js script) and updates `src/data/fear_and_greed_historical.json`._

2. Commit and push:
   ```bash
   git add .
   git commit -m "chore: daily data update"
   git push
   ```
   _The GitHub Actions workflow (deploy.yml) will automatically deploy the updated site._
