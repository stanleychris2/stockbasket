# Folio

A modern, intuitive stock portfolio tracker built with Next.js 16.

## Features

- **Custom Stock Baskets**: Organize stocks into themed collections
- **Real-time Data**: Live quotes powered by Yahoo Finance
- **Performance Analytics**: Track 1D, 5D returns and historical performance
- **Interactive Charts**: Multi-stock comparison with zoom and custom ranges
- **Returns Heatmap**: Sortable performance matrix across time periods
- **Correlation Analysis**: Measure portfolio diversification
- **Single Stock Views**: Detailed company info, news, and financials

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Data**: Yahoo Finance 2
- **Storage**: Browser localStorage
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/stanleychris2/stockbasket)

Or manually:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Environment Variables

No environment variables required! The app uses browser localStorage and Yahoo Finance's public API.

## Data Storage

Folio uses **localStorage** for personal use. Your baskets are stored locally in your browser:
- ✅ Privacy-first (data never leaves your device)
- ✅ Instant access
- ⚠️ Not synced across devices
- ⚠️ Cleared if you clear browser data

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes (quote, search, chart, stock-details)
│   ├── basket/[id]/   # Basket detail page
│   ├── stock/[symbol] # Single stock view
│   ├── about/         # About page
│   └── page.tsx       # Dashboard (home)
├── components/        # React components
├── hooks/             # Custom hooks (useBaskets)
├── types/             # TypeScript types
└── lib/               # Utilities
```

## License

MIT

## Developer

Built by [Chris Tanley](https://christanley.xyz)

## Disclaimer

Folio is for informational purposes only. Stock data provided by Yahoo Finance. Not financial advice. Always do your own research before making investment decisions.
