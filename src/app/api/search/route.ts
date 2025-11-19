import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ results: [] });
    }

    try {
        const results = await yahooFinance.search(query) as any;
        // Filter for equity only to keep it simple
        const stocks = (results.quotes || [])
            .filter((quote: any) => quote.isYahooFinance && (quote.quoteType === 'EQUITY' || quote.quoteType === 'ETF'))
            .map((quote: any) => ({
                symbol: quote.symbol,
                shortName: quote.shortname || quote.symbol,
                longName: quote.longname || quote.shortname || quote.symbol,
                exchange: quote.exchange,
            }));

        return NextResponse.json({ results: stocks });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ error: 'Failed to search stocks' }, { status: 500 });
    }
}
