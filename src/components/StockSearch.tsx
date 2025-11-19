import { useState, useEffect } from 'react';
import { Search, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StockSearchProps {
    onSelect: (symbol: string) => void;
    className?: string;
}

export function StockSearch({ onSelect, className }: StockSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [debouncedQuery, setDebouncedQuery] = useState(query);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 500);
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        if (!debouncedQuery) {
            setResults([]);
            return;
        }

        const search = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
                const data = await res.json();
                setResults(data.results || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        search();
    }, [debouncedQuery]);

    return (
        <div className={cn("relative w-full max-w-md", className)}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search stocks (e.g. AAPL, TSLA)..."
                    className="w-full rounded-md border border-input bg-background px-9 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {loading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
            </div>

            {results.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
                    {results.map((stock) => (
                        <button
                            key={stock.symbol}
                            onClick={() => {
                                onSelect(stock.symbol);
                                setQuery('');
                                setResults([]);
                            }}
                            className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                        >
                            <div className="flex flex-col items-start">
                                <span className="font-medium">{stock.symbol}</span>
                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{stock.shortName}</span>
                            </div>
                            <Plus className="h-4 w-4 opacity-50" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
