import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    try {
        // Fetch modules in parallel (or using quoteSummary which handles multiple)
        const summaryPromise = yahooFinance.quoteSummary(symbol, {
            modules: [
                'summaryProfile',
                'summaryDetail',
                'price',
                'defaultKeyStatistics',
                'earnings',
                'recommendationTrend',
                'financialData'
            ]
        });

        // Fetch news separately
        const newsPromise = yahooFinance.search(symbol, { newsCount: 10 });

        const [summary, newsResults] = await Promise.all([summaryPromise, newsPromise]);

        // Format news
        const news = newsResults.news || [];

        return NextResponse.json({
            data: {
                ...summary,
                news
            }
        });

    } catch (error) {
        console.error('Stock details error:', error);
        return NextResponse.json({ error: 'Failed to fetch stock details' }, { status: 500 });
    }
}
