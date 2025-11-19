import { Basket } from '@/types';
import { Trash2, TrendingUp } from 'lucide-react';
import { StockSearch } from './StockSearch';

interface BasketCardProps {
    basket: Basket;
    onDelete: (id: string) => void;
    onAddStock: (basketId: string, symbol: string) => void;
    onRemoveStock: (basketId: string, symbol: string) => void;
    onViewDetails: (basketId: string) => void;
}

export function BasketCard({ basket, onDelete, onAddStock, onRemoveStock, onViewDetails }: BasketCardProps) {
    return (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
            <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-semibold leading-none tracking-tight text-lg">{basket.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{basket.description || "No description"}</p>
                    </div>
                    <button
                        onClick={() => onDelete(basket.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete Basket"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>

                <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Stocks ({basket.items.length})</div>
                    <div className="flex flex-wrap gap-2 min-h-[2rem]">
                        {basket.items.length === 0 ? (
                            <span className="text-sm text-muted-foreground italic">Empty basket</span>
                        ) : (
                            basket.items.map((item) => (
                                <div
                                    key={item.symbol}
                                    className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                >
                                    {item.symbol}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemoveStock(basket.id, item.symbol);
                                        }}
                                        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    >
                                        <span className="sr-only">Remove</span>
                                        ×
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="pt-2">
                    <StockSearch
                        onSelect={(symbol) => onAddStock(basket.id, symbol)}
                        className="w-full"
                    />
                </div>

                <div className="pt-4 border-t flex justify-end">
                    <button
                        onClick={() => onViewDetails(basket.id)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 w-full"
                    >
                        <TrendingUp className="mr-2 h-4 w-4" />
                        View Performance
                    </button>
                </div>
            </div>
        </div>
    );
}
