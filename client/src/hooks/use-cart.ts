import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

interface CartState {
  items: CartItem[];
  discount: number;
  taxRate: number;
}

export function useCart() {
  const queryClient = useQueryClient();

  const { data: cart = { items: [], discount: 0, taxRate: 5 } } = useQuery<CartState>({
    queryKey: ['cart-state'],
    staleTime: Infinity,
    gcTime: Infinity,
    initialData: { items: [], discount: 0, taxRate: 5 },
  });

  // Load taxes implicitly from database
  const { data: taxes } = useQuery<any[]>({
    queryKey: ['/api/taxes'],
    staleTime: Infinity,
  });

  // Load discounts implicitly from database
  const { data: discounts } = useQuery<any[]>({
    queryKey: ['/api/discounts'],
    staleTime: Infinity,
  });

  const setCart = useCallback((updater: (prev: CartState) => CartState) => {
    queryClient.setQueryData<CartState>(['cart-state'], (old = { items: [], discount: 0, taxRate: 5 }) => updater(old));
  }, [queryClient]);

  const setItems = useCallback((updater: (prev: CartItem[]) => CartItem[]) => {
    setCart(prev => ({ ...prev, items: updater(prev.items) }));
  }, [setCart]);

  const setDiscount = useCallback((discount: number) => {
    setCart(prev => ({ ...prev, discount }));
  }, [setCart]);

  const setTaxRate = useCallback((taxRate: number) => {
    setCart(prev => ({ ...prev, taxRate }));
  }, [setCart]);

  // Sync default tax rate once loaded
  useEffect(() => {
    if (taxes && taxes.length > 0) {
      const defaultTax = taxes.find((t: any) => t.isDefault) || taxes[0];
      if (defaultTax) {
        setTaxRate(defaultTax.value / 100); // e.g. 500 -> 5%
      }
    }
  }, [taxes, setTaxRate]);

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
    setItems(() => []);
    setDiscount(0);
  }, [setItems, setDiscount]);

  const subtotal = cart.items.reduce((sum, item) => {
    const extrasTotal = item.selectedExtras.reduce((s, e) => s + e.price, 0);
    return sum + ((item.price + extrasTotal) * item.quantity);
  }, 0);

  const taxAmount = Math.round(subtotal * (cart.taxRate / 100));
  const total = Math.max(0, subtotal + taxAmount - cart.discount);

  return {
    items: cart.items,
    addItem,
    updateQuantity,
    toggleExtra,
    updateNotes,
    removeItem,
    clearCart,
    subtotal,
    taxRate: cart.taxRate,
    setTaxRate,
    taxAmount,
    discount: cart.discount,
    setDiscount,
    total,
    taxes,
    discounts
  };
}
