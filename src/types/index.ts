export interface Stock {
    symbol: string;
    shortName: string;
    longName?: string;
    regularMarketPrice: number;
    regularMarketChange: number;
    regularMarketChangePercent: number;
    marketCap?: number;
    trailingPE?: number;
    forwardPE?: number;
    dividendYield?: number;
    // New advanced metrics
    pegRatio?: number;
    priceToBook?: number;
    beta?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
    volume?: number;
}

export interface BasketItem {
    symbol: string;
    quantity?: number; // Optional: for portfolio value tracking
    addedAt: string;
}

export interface Basket {
    id: string;
    name: string;
    description?: string;
    items: BasketItem[];
    createdAt: string;
}

export interface StockQuoteResponse {
    stocks: Stock[];
    totalValue?: number; // If quantities are used
}

export interface ChartDataPoint {
    date: string;
    value: number;
}

export interface StockChartData {
    symbol: string;
    data: ChartDataPoint[];
}
