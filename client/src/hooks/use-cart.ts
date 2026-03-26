import { useState, useCallback } from 'react';
import { type MenuItemWithVariations } from '@shared/schema';

export interface CartExtra {
  name: string;
  price: number;
}

export interface CartItem {
  menuItemId: number;
  name: string;
  price: number; // base price + variation price
  quantity: number;
  variationName?: string;
  selectedExtras: CartExtra[];
  notes?: string;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0); // in cents
  const [taxRate, setTaxRate] = useState(5); // percentage

  const addItem = useCallback((menuItem: MenuItemWithVariations, variation?: { name: string; price: number }) => {
    setItems(current => {
      const price = variation ? variation.price : menuItem.price;
      const variationName = variation?.name;
      
      const existing = current.find(i => 
        i.menuItemId === menuItem.id && i.variationName === variationName
      );

      if (existing) {
        return current.map(i => 
          (i.menuItemId === menuItem.id && i.variationName === variationName)
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }

      return [...current, {
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: price,
        quantity: 1,
        variationName,
        selectedExtras: [],
        notes: ''
      }];
    });
  }, []);

  const updateQuantity = useCallback((menuItemId: number, delta: number, variationName?: string) => {
    setItems(current => current.map(item => {
      if (item.menuItemId === menuItemId && item.variationName === variationName) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  }, []);

  const toggleExtra = useCallback((menuItemId: number, extra: CartExtra, variationName?: string) => {
    setItems(current => current.map(item => {
      if (item.menuItemId === menuItemId && item.variationName === variationName) {
        const exists = item.selectedExtras.find(e => e.name === extra.name);
        if (exists) {
          return { ...item, selectedExtras: item.selectedExtras.filter(e => e.name !== extra.name) };
        }
        return { ...item, selectedExtras: [...item.selectedExtras, extra] };
      }
      return item;
    }));
  }, []);

  const updateNotes = useCallback((menuItemId: number, notes: string, variationName?: string) => {
    setItems(current => current.map(item => 
      (item.menuItemId === menuItemId && item.variationName === variationName) ? { ...item, notes } : item
    ));
  }, []);

  const removeItem = useCallback((menuItemId: number, variationName?: string) => {
    setItems(current => current.filter(item => !(item.menuItemId === menuItemId && item.variationName === variationName)));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setDiscount(0);
  }, []);

  const subtotal = items.reduce((sum, item) => {
    const extrasTotal = item.selectedExtras.reduce((s, e) => s + e.price, 0);
    return sum + ((item.price + extrasTotal) * item.quantity);
  }, 0);

  const taxAmount = Math.round(subtotal * (taxRate / 100));
  const total = Math.max(0, subtotal + taxAmount - discount);

  return {
    items,
    addItem,
    updateQuantity,
    toggleExtra,
    updateNotes,
    removeItem,
    clearCart,
    subtotal,
    taxRate,
    setTaxRate,
    taxAmount,
    discount,
    setDiscount,
    total
  };
}
