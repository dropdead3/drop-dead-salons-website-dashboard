import { useState, useCallback } from 'react';
import { Product } from './useProducts';

export interface CartItem {
  productId: string;
  name: string;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export interface RegisterCartState {
  items: CartItem[];
  clientId: string | null;
  clientName: string | null;
  staffId: string | null;
  paymentMethod: 'card' | 'cash' | 'credit' | 'giftcard';
  discountAmount: number;
  appliedCredit: number;
  taxRate: number;
}

const initialState: RegisterCartState = {
  items: [],
  clientId: null,
  clientName: null,
  staffId: null,
  paymentMethod: 'card',
  discountAmount: 0,
  appliedCredit: 0,
  taxRate: 0.085, // Default 8.5% - should come from location settings
};

export function useRegisterCart() {
  const [cart, setCart] = useState<RegisterCartState>(initialState);

  const addItem = useCallback((product: Product) => {
    setCart((prev) => {
      const existingIndex = prev.items.findIndex(
        (item) => item.productId === product.id
      );

      if (existingIndex >= 0) {
        const newItems = [...prev.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + 1,
        };
        return { ...prev, items: newItems };
      }

      return {
        ...prev,
        items: [
          ...prev.items,
          {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            quantity: 1,
            unitPrice: product.retail_price || 0,
            discount: 0,
          },
        ],
      };
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setCart((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.productId !== productId),
    }));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) return;
    
    setCart((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      ),
    }));
  }, []);

  const updateItemDiscount = useCallback((productId: string, discount: number) => {
    setCart((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.productId === productId ? { ...item, discount } : item
      ),
    }));
  }, []);

  const setClient = useCallback((clientId: string | null, clientName: string | null) => {
    setCart((prev) => ({ ...prev, clientId, clientName }));
  }, []);

  const setStaff = useCallback((staffId: string | null) => {
    setCart((prev) => ({ ...prev, staffId }));
  }, []);

  const setPaymentMethod = useCallback((method: RegisterCartState['paymentMethod']) => {
    setCart((prev) => ({ ...prev, paymentMethod: method }));
  }, []);

  const setAppliedCredit = useCallback((amount: number) => {
    setCart((prev) => ({ ...prev, appliedCredit: amount }));
  }, []);

  const setTaxRate = useCallback((rate: number) => {
    setCart((prev) => ({ ...prev, taxRate: rate }));
  }, []);

  const clearCart = useCallback(() => {
    setCart(initialState);
  }, []);

  // Computed values
  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity - item.discount,
    0
  );
  
  const itemDiscounts = cart.items.reduce((sum, item) => sum + item.discount, 0);
  const taxAmount = subtotal * cart.taxRate;
  const total = subtotal + taxAmount - cart.appliedCredit;
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cart,
    addItem,
    removeItem,
    updateQuantity,
    updateItemDiscount,
    setClient,
    setStaff,
    setPaymentMethod,
    setAppliedCredit,
    setTaxRate,
    clearCart,
    // Computed
    subtotal,
    itemDiscounts,
    taxAmount,
    total,
    itemCount,
  };
}
