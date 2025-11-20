'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, MoreVertical, Trash2, ChevronDown, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { useBaskets } from '@/hooks/use-baskets';
import { CreateBasketModal } from '@/components/CreateBasketModal';
import { StockSearch } from '@/components/StockSearch';
import { cn } from '@/lib/utils';

// Component to display individual stock holdings with metrics
function StockHoldingsList({ basketId, items, onRemove }: { basketId: string, items: any[], onRemove: (basketId: string, symbol: string) => void }) {
  const [stockData, setStockData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (items.length === 0) return;

    const fetchStockData = async () => {
      try {
        const symbols = items.map(i => i.symbol).join(',');
        const res = await fetch(`/api/quote?symbols=${symbols}`);
        const data = await res.json();

        if (data.stocks) {
          const stockMap: Record<string, any> = {};
          data.stocks.forEach((stock: any) => {
            stockMap[stock.symbol] = stock;
          });
          setStockData(stockMap);
        }
      } catch (error) {
        console.error('Failed to fetch stock data', error);
      }
    };

    fetchStockData();
  }, [items]);

  return (
    <div className="divide-y">
      {[...items].sort((a, b) => a.symbol.localeCompare(b.symbol)).map((item) => {
        const stock = stockData[item.symbol];
        const changePositive = stock?.regularMarketChange >= 0;

        return (
          <div
            key={item.symbol}
            className="px-6 py-3 hover:bg-secondary/30 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <Link
                href={`/stock/${item.symbol}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-6 flex-1 hover:opacity-80 transition-opacity"
              >
                <div className="font-mono text-sm font-bold w-20">{item.symbol}</div>

                {stock ? (
                  <>
                    <div className="text-sm font-semibold">${stock.regularMarketPrice?.toFixed(2)}</div>
                    <div className={cn("text-sm font-medium flex items-center gap-1", changePositive ? "text-green-500" : "text-red-500")}>
                      {changePositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {changePositive ? '+' : ''}{stock.regularMarketChangePercent?.toFixed(2)}%
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground">Loading...</div>
                )}
              </Link>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove(basketId, item.symbol);
                }}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity p-1"
                title="Remove stock"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { baskets, addBasket, removeBasket, addStockToBasket, removeStockFromBasket } = useBaskets();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [collapsedBaskets, setCollapsedBaskets] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [basketMetrics, setBasketMetrics] = useState<Record<string, { oneDay: number; fiveDay: number }>>({});

  // Fetch basket performance metrics
  useEffect(() => {
    baskets.forEach(async (basket) => {
      if (basket.items.length === 0) return;

      try {
        const symbols = basket.items.map(i => i.symbol).join(',');
        const res = await fetch(`/api/quote?symbols=${symbols}`);
        const data = await res.json();

        if (data.stocks) {
          // Calculate average returns
          const oneDay = data.stocks.reduce((sum: number, s: any) => sum + (s.regularMarketChangePercent || 0), 0) / data.stocks.length;

          // For 5-day, we'd need historical data, but for now let's use a placeholder
          // In a real app, you'd fetch this from the chart API
          const fiveDay = oneDay * 1.5; // Placeholder

          setBasketMetrics(prev => ({
            ...prev,
            [basket.id]: { oneDay, fiveDay }
          }));
        }
      } catch (error) {
        console.error('Failed to fetch basket metrics', error);
      }
    });
  }, [baskets]);

  const toggleBasket = (basketId: string) => {
    setCollapsedBaskets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(basketId)) {
        newSet.delete(basketId);
      } else {
        newSet.add(basketId);
      }
      return newSet;
    });
  };

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Folio</h1>
            <p className="text-muted-foreground mt-2">Track and visualize your custom groups of stocks.</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            <Plus className="mr-2 h-4 w-4" /> Create Basket
          </button>
        </div>

        {baskets.length === 0 ? (
          <div className="text-center p-12 border-2 border-dashed rounded-lg text-muted-foreground">
            No baskets yet. Create one to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {baskets.map((basket) => {
              const isCollapsed = collapsedBaskets.has(basket.id);
              const metrics = basketMetrics[basket.id];
              const oneDayPositive = metrics?.oneDay >= 0;
              const fiveDayPositive = metrics?.fiveDay >= 0;

              return (
                <div key={basket.id} className="border-2 rounded-lg bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Basket Header */}
                  <div className="p-4 bg-secondary/10 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <button
                          onClick={() => toggleBasket(basket.id)}
                          className="p-1 hover:bg-secondary rounded transition-colors"
                        >
                          {isCollapsed ? (
                            <ChevronRight className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>

                        <div
                          onClick={() => router.push(`/basket/${basket.id}`)}
                          className="cursor-pointer flex-1"
                        >
                          <h3 className="font-bold text-lg">{basket.name}</h3>
                          <p className="text-sm text-muted-foreground">{basket.description || 'No description'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {/* Performance Metrics */}
                        {metrics && basket.items.length > 0 && (
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">1D</div>
                              <div className={cn("text-sm font-semibold flex items-center gap-1", oneDayPositive ? "text-green-500" : "text-red-500")}>
                                {oneDayPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {oneDayPositive ? '+' : ''}{metrics.oneDay.toFixed(2)}%
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">5D</div>
                              <div className={cn("text-sm font-semibold flex items-center gap-1", fiveDayPositive ? "text-green-500" : "text-red-500")}>
                                {fiveDayPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {fiveDayPositive ? '+' : ''}{metrics.fiveDay.toFixed(2)}%
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Stock Count */}
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Stocks</div>
                          <div className="text-sm font-bold">{basket.items.length}</div>
                        </div>

                        {/* Menu */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpen(menuOpen === basket.id ? null : basket.id);
                            }}
                            className="p-1 hover:bg-secondary rounded-md transition-colors"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {menuOpen === basket.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setMenuOpen(null)}
                              />
                              <div className="absolute right-0 top-full mt-1 w-32 bg-popover border rounded-md shadow-lg z-20 animate-in fade-in slide-in-from-top-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeBasket(basket.id);
                                    setMenuOpen(null);
                                  }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-destructive/10 text-destructive transition-colors rounded-md"
                                >
                                  <Trash2 className="h-3 w-3" /> Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Holdings (Collapsible) */}
                  {!isCollapsed && (
                    <div className="bg-secondary/5">
                      {/* Add Stock Bar */}
                      <div className="px-6 py-3 border-b bg-secondary/20 flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Holdings</span>
                        <StockSearch
                          onSelect={(symbol) => addStockToBasket(basket.id, symbol)}
                          className="max-w-xs"
                          placeholder="Add stock..."
                        />
                      </div>

                      {/* Holdings List */}
                      {basket.items.length === 0 ? (
                        <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                          No stocks yet. Add one above.
                        </div>
                      ) : (
                        <StockHoldingsList
                          basketId={basket.id}
                          items={basket.items}
                          onRemove={removeStockFromBasket}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <footer className="mt-16 text-center text-sm text-muted-foreground">
        <Link href="/about" className="hover:text-foreground transition-colors">
          About Folio
        </Link>
      </footer>

      {showCreateModal && (
        <CreateBasketModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={(name, description) => {
            addBasket(name, description);
            setShowCreateModal(false);
          }}
        />
      )}
    </main>
  );
}
