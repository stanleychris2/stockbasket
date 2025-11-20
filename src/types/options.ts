// TypeScript types for options trading data from Massive.com API

export type ContractType = 'call' | 'put';

export interface Greeks {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho?: number;
}

export interface OptionsContract {
    // Contract identification
    ticker: string; // OCC format: O:AAPL251219C00150000
    underlying_ticker: string; // AAPL
    strike_price: number;
    expiration_date: string; // YYYY-MM-DD
    contract_type: ContractType;

    // Pricing
    last_price?: number;
    bid_price?: number;
    ask_price?: number;
    mid_price?: number;

    // Volume & Interest
    volume?: number;
    open_interest?: number;

    // Greeks
    greeks?: Greeks;

    // Volatility
    implied_volatility?: number;

    // Break-even
    break_even_price?: number;

    // Timestamp
    updated?: number; // Unix timestamp
}

export interface UnderlyingAsset {
    ticker: string;
    price: number;
    change?: number;
    change_percent?: number;
    name?: string;
}

export interface OptionsChainSnapshot {
    status: string;
    underlying: UnderlyingAsset;
    contracts: OptionsContract[];
}

export interface OptionsChainResponse {
    success: boolean;
    data?: OptionsChainSnapshot;
    error?: string;
}

export interface OptionsHistoricalQuote {
    timestamp: number; // Unix timestamp
    bid?: number;
    ask?: number;
    last?: number;
    volume?: number;
    implied_volatility?: number;
}

export interface OptionsHistoricalBar {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

export interface OptionsHistoricalResponse {
    success: boolean;
    data?: {
        contract: OptionsContract;
        quotes?: OptionsHistoricalQuote[];
        bars?: OptionsHistoricalBar[];
    };
    error?: string;
}

export interface ContractDetailResponse {
    success: boolean;
    data?: OptionsContract;
    error?: string;
}

// Helper type for organizing options chain by expiration
export interface ExpirationGroup {
    expiration_date: string;
    days_to_expiration: number;
    calls: OptionsContract[];
    puts: OptionsContract[];
}

// Helper type for organizing by strike
export interface StrikeGroup {
    strike: number;
    call?: OptionsContract;
    put?: OptionsContract;
}

// Filter options for chain queries
export interface OptionsChainFilters {
    expiration_date?: string;
    expiration_date_gte?: string;
    expiration_date_lte?: string;
    strike_price?: number;
    strike_price_gte?: number;
    strike_price_lte?: number;
    contract_type?: ContractType;
    min_volume?: number;
    min_open_interest?: number;
}
