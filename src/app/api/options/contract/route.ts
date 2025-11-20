import { NextResponse } from 'next/server';
import type { ContractDetailResponse, OptionsContract } from '@/types/options';

const MASSIVE_API_KEY = process.env.MASSIVE_API_KEY || 't1_Y2yc13wZxWqwFO7ICgK9zSaPPbmHQ';
const MASSIVE_BASE_URL = 'https://api.massive.com/v3';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const optionsTicker = searchParams.get('ticker');

    if (!optionsTicker) {
        return NextResponse.json({
            success: false,
            error: 'Options ticker is required (OCC format: O:AAPL251219C00150000)'
        } as ContractDetailResponse, { status: 400 });
    }

    try {
        const params = new URLSearchParams({
            apiKey: MASSIVE_API_KEY,
        });

        const url = `${MASSIVE_BASE_URL}/snapshot/option/${optionsTicker}?${params.toString()}`;

        console.log(`Fetching contract details for ${optionsTicker}...`);

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
            // Cache for 1 minute
            next: { revalidate: 60 }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Massive.com API error:', response.status, errorText);

            return NextResponse.json({
                success: false,
                error: `API request failed: ${response.status} - ${response.statusText}`
            } as ContractDetailResponse, { status: response.status });
        }

        const data = await response.json();

        // Transform to our format
        const contract: OptionsContract = {
            ticker: data.ticker || data.details?.ticker,
            underlying_ticker: data.underlying_ticker || data.details?.underlying_ticker,
            strike_price: data.details?.strike_price || data.strike_price,
            expiration_date: data.details?.expiration_date || data.expiration_date,
            contract_type: (data.details?.contract_type || data.contract_type),

            // Pricing
            last_price: data.day?.last_price || data.last_quote?.last_price,
            bid_price: data.day?.bid_price || data.last_quote?.bid,
            ask_price: data.day?.ask_price || data.last_quote?.ask,
            mid_price: data.day?.mid_price,

            // Volume & Interest
            volume: data.day?.volume,
            open_interest: data.open_interest,

            // Greeks
            greeks: data.greeks ? {
                delta: data.greeks.delta,
                gamma: data.greeks.gamma,
                theta: data.greeks.theta,
                vega: data.greeks.vega,
                rho: data.greeks.rho,
            } : undefined,

            // Volatility
            implied_volatility: data.implied_volatility,

            // Break-even
            break_even_price: data.break_even_price,

            // Timestamp
            updated: data.day?.last_updated || Date.now() / 1000,
        };

        return NextResponse.json({
            success: true,
            data: contract
        } as ContractDetailResponse);

    } catch (error) {
        console.error('Contract detail fetch error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch contract details'
        } as ContractDetailResponse, { status: 500 });
    }
}
