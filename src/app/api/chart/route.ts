import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');
    const symbolParam = searchParams.get('symbol');
    const range = searchParams.get('range') || '1mo';
    const interval = searchParams.get('interval') || '1d';

    // Support both 'symbol' (legacy/single) and 'symbols' (multiple)
    const symbols = symbolsParam
        ? symbolsParam.split(',').map(s => s.trim())
        : symbolParam
            ? [symbolParam]
            : [];

    if (symbols.length === 0) {
        return NextResponse.json({ error: 'Symbols are required' }, { status: 400 });
    }

    try {
        const endDate = new Date();
        let startDate = new Date();

        switch (range) {
            case '1w': startDate.setDate(endDate.getDate() - 7); break;
            case '1mo': startDate.setMonth(endDate.getMonth() - 1); break;
            case '3mo': startDate.setMonth(endDate.getMonth() - 3); break;
            case '6mo': startDate.setMonth(endDate.getMonth() - 6); break;
            case '1y': startDate.setFullYear(endDate.getFullYear() - 1); break;
            case '5y': startDate.setFullYear(endDate.getFullYear() - 5); break;
            default: startDate.setMonth(endDate.getMonth() - 1);
        }

        // Fetch data for all symbols in parallel
        const promises = symbols.map(async (sym) => {
            try {
                const result = await yahooFinance.historical(sym, {
                    period1: startDate,
                    period2: endDate,
                    interval: interval as any,
                });
                return { symbol: sym, data: result };
            } catch (e) {
                console.error(`Failed to fetch for ${sym}`, e);
                return { symbol: sym, data: [] };
            }
        });

        const results = await Promise.all(promises);

        // Merge data by date
        // Structure: [ { date: '...', AAPL: 150, MSFT: 300 }, ... ]
        const dataMap = new Map<string, any>();

        results.forEach(({ symbol, data }) => {
            (data as any[]).forEach((quote) => {
                const dateStr = quote.date.toISOString();
                if (!dataMap.has(dateStr)) {
                    dataMap.set(dateStr, { date: dateStr });
                }
                const entry = dataMap.get(dateStr);
                entry[symbol] = quote.close;
            });
        });

        // Sort by date
        const mergedData = Array.from(dataMap.values()).sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        return NextResponse.json({ data: mergedData, symbols });
    } catch (error) {
        console.error('Chart error:', error);
        return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 });
    }
}
