'use client';

import { useState } from 'react';
import { useBaskets } from '@/hooks/use-baskets';
import { BasketCard } from '@/components/BasketCard';
import { CreateBasketModal } from '@/components/CreateBasketModal';
import { Plus, LayoutGrid } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { baskets, isLoaded, addBasket, removeBasket, addStockToBasket, removeStockFromBasket } = useBaskets();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const router = useRouter();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading baskets...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <LayoutGrid className="h-8 w-8" />
              Stock Baskets
            </h1>
            <p className="text-muted-foreground">
              Track and visualize your custom groups of stocks.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Basket
          </button>
        </div>

        {baskets.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <LayoutGrid className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No baskets created</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm">
              Create your first basket to start tracking a group of stocks together.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
            >
              Create Basket
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {baskets.map((basket) => (
              <BasketCard
                key={basket.id}
                basket={basket}
                onDelete={removeBasket}
                onAddStock={addStockToBasket}
                onRemoveStock={removeStockFromBasket}
                onViewDetails={(id) => router.push(`/basket/${id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <CreateBasketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={addBasket}
      />
    </main>
  );
}
