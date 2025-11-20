import { NextResponse } from 'next/server';
import type { OptionsChainResponse, OptionsContract, ContractType } from '@/types/options';

const MASSIVE_API_KEY = process.env.MASSIVE_API_KEY || 't1_Y2yc13wZxWqwFO7ICgK9zSaPPbmHQ';
const MASSIVE_BASE_URL = 'https://api.massive.com/v3';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');

    if (!ticker) {
        return NextResponse.json({
            success: false,
            error: 'Ticker symbol is required'
        } as OptionsChainResponse, { status: 400 });
    }

    try {
        // Build query parameters for Massive.com API
        const params = new URLSearchParams({
            apiKey: MASSIVE_API_KEY,
        });

        // Optional filters
        const expiration = searchParams.get('expiration');
        const expirationGte = searchParams.get('expiration_gte');
        const expirationLte = searchParams.get('expiration_lte');
        const strikePrice = searchParams.get('strike_price');
        const strikePriceGte = searchParams.get('strike_price_gte');
        const strikePriceLte = searchParams.get('strike_price_lte');
        const contractType = searchParams.get('contract_type') as ContractType | null;

        if (expiration) params.append('expiration_date', expiration);
        if (expirationGte) params.append('expiration_date.gte', expirationGte);
        if (expirationLte) params.append('expiration_date.lte', expirationLte);
        if (strikePrice) params.append('strike_price', strikePrice);
        if (strikePriceGte) params.append('strike_price.gte', strikePriceGte);
        if (strikePriceLte) params.append('strike_price.lte', strikePriceLte);
        if (contractType) params.append('contract_type', contractType);

        const url = `${MASSIVE_BASE_URL}/snapshot/options/${ticker.toUpperCase()}?${params.toString()}`;

        console.log(`Fetching options chain for ${ticker} from Massive.com...`);

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
            // Cache for 1 minute (options data updates frequently)
            next: { revalidate: 60 }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Massive.com API error:', response.status, errorText);

            return NextResponse.json({
                success: false,
                error: `API request failed: ${response.status} - ${response.statusText}`
            } as OptionsChainResponse, { status: response.status });
        }

        const data = await response.json();

        // Transform Massive.com response to our format
        const contracts: OptionsContract[] = (data.results || []).map((contract: any) => {
            const details = contract.details || {};
            const dayData = contract.day || {};
            const greeksData = contract.greeks || {};

            return {
                ticker: details.ticker,
                underlying_ticker: ticker.toUpperCase(),
                strike_price: details.strike_price,
                expiration_date: details.expiration_date,
                contract_type: details.contract_type as ContractType,

                // Pricing from day data
                last_price: dayData.close || contract.last_trade?.price,
                bid_price: dayData.bid_price,
                ask_price: dayData.ask_price,
                mid_price: dayData.mid_price,

                // Volume & Interest
                volume: dayData.volume,
                open_interest: contract.open_interest,

                // Greeks (may be empty for delayed data)
                greeks: (greeksData.delta !== undefined || greeksData.gamma !== undefined) ? {
                    delta: greeksData.delta || 0,
                    gamma: greeksData.gamma || 0,
                    theta: greeksData.theta || 0,
                    vega: greeksData.vega || 0,
                    rho: greeksData.rho,
                } : undefined,

                // Volatility
                implied_volatility: contract.implied_volatility,

                // Break-even
                break_even_price: contract.break_even_price,

                // Timestamp
                updated: dayData.last_updated ? dayData.last_updated / 1000000 : Date.now(),
            };
        });

        const underlying = {
            ticker: ticker.toUpperCase(),
            price: data.underlying_asset?.price || 0,
            change: data.underlying_asset?.change_to_break_even,
            change_percent: data.underlying_asset?.change_percent,
            name: data.underlying_asset?.name,
        };

        return NextResponse.json({
            success: true,
            data: {
                status: data.status || 'OK',
                underlying,
                contracts,
            }
        } as OptionsChainResponse);

    } catch (error) {
        console.error('Options chain fetch error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch options chain'
        } as OptionsChainResponse, { status: 500 });
    }
}
