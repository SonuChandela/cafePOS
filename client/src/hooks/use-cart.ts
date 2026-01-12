import { useState, useCallback } from 'react';
import { type MenuItem } from '@shared/schema';

export interface CartItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  extras?: string;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((menuItem: MenuItem) => {
    setItems(current => {
      const existing = current.find(i => i.menuItemId === menuItem.id);
      if (existing) {
        return current.map(i => 
          i.menuItemId === menuItem.id 
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...current, {
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1,
        extras: ''
      }];
    });
  }, []);

  const updateQuantity = useCallback((menuItemId: number, delta: number) => {
    setItems(current => current.map(item => {
      if (item.menuItemId === menuItemId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  }, []);

  const updateExtras = useCallback((menuItemId: number, extras: string) => {
    setItems(current => current.map(item => 
      item.menuItemId === menuItemId ? { ...item, extras } : item
    ));
  }, []);

  const removeItem = useCallback((menuItemId: number) => {
    setItems(current => current.filter(item => item.menuItemId !== menuItemId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return {
    items,
    addItem,
    updateQuantity,
    updateExtras,
    removeItem,
    clearCart,
    total
  };
}
