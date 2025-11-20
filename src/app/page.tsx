'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, MoreVertical, Trash2 } from 'lucide-react';
import { useBaskets } from '@/hooks/use-baskets';
import { CreateBasketModal } from '@/components/CreateBasketModal';
import { StockSearch } from '@/components/StockSearch';
import { cn } from '@/lib/utils';

export default function Home() {
  const router = useRouter();
  const { baskets, addBasket, removeBasket, addStockToBasket, removeStockFromBasket } = useBaskets();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedBasketId, setExpandedBasketId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Stock Baskets</h1>
            <p className="text-muted-foreground mt-2">Track and visualize your custom groups of stocks.</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            <Plus className="mr-2 h-4 w-4" /> Create Basket
          </button>
        </div>

        {/* Table View */}
        <div className="border rounded-lg bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-secondary/50">
                <th className="text-left p-4 font-medium">Name</th>
                <th className="text-left p-4 font-medium">Description</th>
                <th className="text-center p-4 font-medium">Stocks</th>
                <th className="text-center p-4 font-medium">Created</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {baskets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-12 text-muted-foreground">
                    No baskets yet. Create one to get started.
                  </td>
                </tr>
              ) : (
                baskets.map((basket) => (
                  <>
                    <tr
                      key={basket.id}
                      onClick={() => router.push(`/basket/${basket.id}`)}
                      className="border-b last:border-0 hover:bg-secondary/20 transition-colors cursor-pointer group"
                    >
                      <td className="p-4 font-semibold">{basket.name}</td>
                      <td className="p-4 text-muted-foreground">{basket.description || '-'}</td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <span className="font-medium">{basket.items.length}</span>
                          {basket.items.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedBasketId(expandedBasketId === basket.id ? null : basket.id);
                              }}
                              className="text-xs text-primary hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {expandedBasketId === basket.id ? 'Hide' : 'Show'}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center text-sm text-muted-foreground">
                        {new Date(basket.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 relative">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
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
                            <div className="absolute right-0 top-full mt-1 w-32 bg-popover border rounded-md shadow-lg z-10 animate-in fade-in slide-in-from-top-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeBasket(basket.id);
                                  setMenuOpen(null);
                                }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-destructive/10 text-destructive transition-colors"
                              >
                                <Trash2 className="h-3 w-3" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Row for Stocks */}
                    {expandedBasketId === basket.id && basket.items.length > 0 && (
                      <tr className="bg-secondary/5">
                        <td colSpan={5} className="p-4">
                          <div className="space-y-3">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Holdings</div>

                            {/* Vertical list of holdings */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                              {basket.items.map((item) => (
                                <Link
                                  key={item.symbol}
                                  href={`/stock/${item.symbol}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center justify-between p-2 rounded-md border bg-card hover:bg-secondary/50 transition-colors group"
                                >
                                  <span className="font-medium text-sm group-hover:text-primary transition-colors">{item.symbol}</span>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      removeStockFromBasket(basket.id, item.symbol);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </Link>
                              ))}
                            </div>

                            <div className="pt-2">
                              <StockSearch
                                onSelect={(symbol) => {
                                  addStockToBasket(basket.id, symbol);
                                }}
                                className="max-w-md"
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
