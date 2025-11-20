import { NextResponse } from 'next/server';
import type { OptionsHistoricalResponse, OptionsHistoricalQuote } from '@/types/options';

const MASSIVE_API_KEY = process.env.MASSIVE_API_KEY || 't1_Y2yc13wZxWqwFO7ICgK9zSaPPbmHQ';
const MASSIVE_BASE_URL = 'https://api.massive.com/v3';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const optionsTicker = searchParams.get('ticker');
    const from = searchParams.get('from'); // YYYY-MM-DD or timestamp
    const to = searchParams.get('to'); // YYYY-MM-DD or timestamp
    const timeframe = searchParams.get('timeframe') || 'day'; // minute, hour, day

    if (!optionsTicker) {
        return NextResponse.json({
            success: false,
            error: 'Options ticker is required (OCC format: O:AAPL251219C00150000)'
        } as OptionsHistoricalResponse, { status: 400 });
    }

    try {
        const params = new URLSearchParams({
            apiKey: MASSIVE_API_KEY,
            limit: '5000', // Get up to 5000 data points
        });

        // Add time range filters if provided
        if (from) params.append('timestamp.gte', from);
        if (to) params.append('timestamp.lte', to);

        // Use quotes endpoint for tick-level data
        const url = `${MASSIVE_BASE_URL}/quotes/${optionsTicker}?${params.toString()}`;

        console.log(`Fetching historical data for ${optionsTicker}...`);

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
            // Historical data is immutable, cache for 1 hour
            next: { revalidate: 3600 }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Massive.com API error:', response.status, errorText);

            return NextResponse.json({
                success: false,
                error: `API request failed: ${response.status} - ${response.statusText}`
            } as OptionsHistoricalResponse, { status: response.status });
        }

        const data = await response.json();

        // Transform quotes data
        const quotes: OptionsHistoricalQuote[] = (data.results || []).map((quote: any) => ({
            timestamp: quote.sip_timestamp || quote.participant_timestamp,
            bid: quote.bid_price,
            ask: quote.ask_price,
            last: quote.last_price,
            volume: quote.volume,
            implied_volatility: quote.implied_volatility,
        }));

        // Get contract info from first result or make a separate call
        const contract = {
            ticker: optionsTicker,
            underlying_ticker: data.results?.[0]?.underlying_ticker || '',
            strike_price: 0,
            expiration_date: '',
            contract_type: 'call' as const,
        };

        return NextResponse.json({
            success: true,
            data: {
                contract,
                quotes,
            }
        } as OptionsHistoricalResponse);

    } catch (error) {
        console.error('Historical data fetch error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch historical data'
        } as OptionsHistoricalResponse, { status: 500 });
    }
}
