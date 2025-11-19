import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import { Stock } from '@/types';

const yahooFinance = new YahooFinance();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');

    if (!symbolsParam) {
        return NextResponse.json({ stocks: [] });
    }

    const symbols = symbolsParam.split(',').map(s => s.trim());

    try {
        // yahooFinance.quote returns a rich object. We just need to map the fields.
        const results = await yahooFinance.quote(symbols) as any;

        const quotes = Array.isArray(results) ? results : [results];

        const stocks: Stock[] = quotes.map((q: any) => ({
            symbol: q.symbol,
            shortName: q.shortName || q.symbol,
            longName: q.longName,
            regularMarketPrice: q.regularMarketPrice || 0,
            regularMarketChange: q.regularMarketChange || 0,
            regularMarketChangePercent: q.regularMarketChangePercent || 0,
            marketCap: q.marketCap,
            trailingPE: q.trailingPE,
            forwardPE: q.forwardPE,
            dividendYield: q.dividendYield,
            // New mappings
            pegRatio: q.pegRatio, // Price/Earnings-to-Growth
            priceToBook: q.priceToBook,
            beta: q.beta, // Volatility relative to market
            fiftyTwoWeekHigh: q.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: q.fiftyTwoWeekLow,
            volume: q.regularMarketVolume,
        }));

        return NextResponse.json({ stocks });
    } catch (error) {
        console.error('Quote error:', error);
        return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 });
    }
}
