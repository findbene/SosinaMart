import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '@/context/CartContext';
import { Product } from '@/types';

const mockProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Berbere Spice',
    price: 12.99,
    category: 'food',
    image: '/berbere.jpg',
    inStock: true,
  },
  {
    id: 'prod-2',
    name: 'Ethiopian Coffee',
    price: 18.99,
    category: 'food',
    image: '/coffee.jpg',
    inStock: true,
  },
  {
    id: 'prod-3',
    name: 'Jebena Coffee Pot',
    price: 45.00,
    category: 'kitchenware',
    image: '/jebena.jpg',
    inStock: true,
  },
];

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe('Cart Operations Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Adding Items', () => {
    it('should add multiple different products', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProducts[0]);
        result.current.addToCart(mockProducts[1]);
        result.current.addToCart(mockProducts[2]);
      });

      expect(result.current.items).toHaveLength(3);
      expect(result.current.cartCount).toBe(3);
    });

    it('should increment quantity when adding same product twice', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProducts[0]);
        result.current.addToCart(mockProducts[0]);
        result.current.addToCart(mockProducts[0]);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(3);
      expect(result.current.cartCount).toBe(3);
    });

    it('should handle mixed additions correctly', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProducts[0]); // Berbere x1
        result.current.addToCart(mockProducts[1]); // Coffee x1
        result.current.addToCart(mockProducts[0]); // Berbere x2
        result.current.addToCart(mockProducts[2]); // Jebena x1
        result.current.addToCart(mockProducts[0]); // Berbere x3
      });

      expect(result.current.items).toHaveLength(3);
      expect(result.current.cartCount).toBe(5);

      const berbere = result.current.items.find(i => i.id === 'prod-1');
      expect(berbere?.quantity).toBe(3);
    });
  });

  describe('Removing Items', () => {
    it('should remove specific item from cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProducts[0]);
        result.current.addToCart(mockProducts[1]);
        result.current.addToCart(mockProducts[2]);
      });

      expect(result.current.items).toHaveLength(3);

      act(() => {
        result.current.removeFromCart('prod-2');
      });

      expect(result.current.items).toHaveLength(2);
      expect(result.current.items.find(i => i.id === 'prod-2')).toBeUndefined();
    });

    it('should handle removing non-existent item gracefully', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProducts[0]);
      });

      act(() => {
        result.current.removeFromCart('non-existent');
      });

      expect(result.current.items).toHaveLength(1);
    });
  });

  describe('Updating Quantities', () => {
    it('should update item quantity', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProducts[0]);
      });

      act(() => {
        result.current.updateQuantity('prod-1', 5);
      });

      expect(result.current.items[0].quantity).toBe(5);
      expect(result.current.cartCount).toBe(5);
    });

    it('should remove item when quantity set to 0', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProducts[0]);
        result.current.addToCart(mockProducts[1]);
      });

      act(() => {
        result.current.updateQuantity('prod-1', 0);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].id).toBe('prod-2');
    });

    it('should handle negative quantity by removing item', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProducts[0]);
      });

      act(() => {
        result.current.updateQuantity('prod-1', -1);
      });

      expect(result.current.items).toHaveLength(0);
    });
  });

  describe('Cart Totals', () => {
    it('should calculate total correctly for single item', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProducts[0]); // 12.99
      });

      expect(result.current.cartTotal).toBeCloseTo(12.99, 2);
    });

    it('should calculate total correctly for multiple items', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProducts[0]); // 12.99
        result.current.addToCart(mockProducts[1]); // 18.99
        result.current.addToCart(mockProducts[2]); // 45.00
      });

      expect(result.current.cartTotal).toBeCloseTo(76.98, 2);
    });

    it('should calculate total correctly with quantities', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProducts[0]); // 12.99
        result.current.addToCart(mockProducts[0]); // 12.99 x2 = 25.98
        result.current.addToCart(mockProducts[1]); // 18.99
      });

      expect(result.current.cartTotal).toBeCloseTo(44.97, 2);
    });

    it('should update total after quantity change', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProducts[0]); // 12.99
      });

      act(() => {
        result.current.updateQuantity('prod-1', 3); // 12.99 x3 = 38.97
      });

      expect(result.current.cartTotal).toBeCloseTo(38.97, 2);
    });
  });

  describe('Clear Cart', () => {
    it('should remove all items from cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProducts[0]);
        result.current.addToCart(mockProducts[1]);
        result.current.addToCart(mockProducts[2]);
      });

      expect(result.current.items).toHaveLength(3);

      act(() => {
        result.current.clearCart();
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.cartCount).toBe(0);
      expect(result.current.cartTotal).toBe(0);
    });
  });

  describe('isInCart Helper', () => {
    it('should return true for items in cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProducts[0]);
      });

      expect(result.current.isInCart('prod-1')).toBe(true);
    });

    it('should return false for items not in cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProducts[0]);
      });

      expect(result.current.isInCart('prod-2')).toBe(false);
    });

    it('should update when items are removed', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProducts[0]);
      });

      expect(result.current.isInCart('prod-1')).toBe(true);

      act(() => {
        result.current.removeFromCart('prod-1');
      });

      expect(result.current.isInCart('prod-1')).toBe(false);
    });
  });
});
