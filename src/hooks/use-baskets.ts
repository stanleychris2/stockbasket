import { useState, useEffect } from 'react';
import posthog from 'posthog-js';
import { Basket, BasketItem } from '@/types';

const STORAGE_KEY = 'stockbasket_baskets';

export function useBaskets() {
    const [baskets, setBaskets] = useState<Basket[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setBaskets(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse baskets', e);
            }
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(baskets));
        }
    }, [baskets, isLoaded]);

    const addBasket = (name: string, description?: string) => {
        const newBasket: Basket = {
            id: crypto.randomUUID(),
            name,
            description,
            items: [],
            createdAt: new Date().toISOString(),
        };
        setBaskets((prev) => [...prev, newBasket]);

        // Track basket creation event
        posthog.capture('basket_created', {
            basket_id: newBasket.id,
            basket_name: name,
            has_description: !!description,
        });

        return newBasket;
    };

    const removeBasket = (id: string) => {
        setBaskets((prev) => prev.filter((b) => b.id !== id));
    };

    const addStockToBasket = (basketId: string, symbol: string) => {
        setBaskets((prev) =>
            prev.map((b) => {
                if (b.id === basketId) {
                    if (b.items.some((item) => item.symbol === symbol)) return b; // Already exists
                    const newItem: BasketItem = {
                        symbol,
                        addedAt: new Date().toISOString(),
                    };

                    // Track stock added event
                    posthog.capture('stock_added', {
                        basket_id: basketId,
                        basket_name: b.name,
                        stock_symbol: symbol,
                        basket_stock_count: b.items.length + 1,
                    });

                    return { ...b, items: [...b.items, newItem] };
                }
                return b;
            })
        );
    };

    const removeStockFromBasket = (basketId: string, symbol: string) => {
        setBaskets((prev) =>
            prev.map((b) => {
                if (b.id === basketId) {
                    return { ...b, items: b.items.filter((item) => item.symbol !== symbol) };
                }
                return b;
            })
        );
    };

    return {
        baskets,
        isLoaded,
        addBasket,
        removeBasket,
        addStockToBasket,
        removeStockFromBasket,
    };
}
