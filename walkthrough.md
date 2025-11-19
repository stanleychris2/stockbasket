# Stock Basket App Walkthrough

This application allows you to track baskets of stocks and visualize their performance.

## Features

### 1. Dashboard
- **View Baskets**: See all your created baskets in a grid layout.
- **Create Basket**: Click the "Create Basket" button to start a new collection.
- **Quick Add**: Add stocks directly from the dashboard card.

### 2. Basket Management
- **Create**: Give your basket a name and optional description.
- **Search Stocks**: Use the search bar to find stocks by symbol or name (e.g., "AAPL", "Tesla").
- **Add/Remove**: Add stocks to your basket or remove them with a click.

### 3. Visualization & Metrics
- **Multi-Stock Comparison**: View all stocks in the basket on a single chart.
  - **Percentage Change**: Normalized performance (0% baseline) to compare stocks of different prices.
  - **Linear Interpolation**: Professional financial chart style.
  - **Interactive Tooltip**: Hover to see values for all stocks at any date.
- **Metrics Table**: Compare key metrics:
  - **Price**: Current market price.
  - **Change**: Daily price change (Green/Red).
  - **P/E Ratio**: Trailing Price-to-Earnings ratio.
  - **Market Cap**: Total market capitalization.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4 (Premium Dark Theme)
- **Charts**: Recharts
- **Data**: Yahoo Finance API (via `yahoo-finance2`)
- **Storage**: LocalStorage (Client-side persistence)

## How to Run
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.
