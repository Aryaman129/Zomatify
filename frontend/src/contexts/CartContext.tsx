import React, { createContext, useState, useContext, useEffect } from 'react';
import { CartState, CartItem, MenuItem, MenuItemOption } from '../types';

interface CartContextType extends CartState {
  addItem: (item: MenuItem, quantity: number, specialInstructions?: string, selectedOptions?: MenuItemOption[]) => void;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  updateItemInstructions: (itemId: string, instructions: string) => void;
  clearCart: () => void;
  getItemById: (itemId: string) => CartItem | undefined;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper function to calculate cart totals
const calculateCartTotals = (items: CartItem[]): { totalPrice: number; totalItems: number } => {
  return items.reduce(
    (acc, item) => {
      const itemPrice = item.menuItem.price;
      const optionsPrice = item.selected_options?.reduce((sum, option) => sum + option.price, 0) || 0;
      const totalItemPrice = (itemPrice + optionsPrice) * item.quantity;
      
      return {
        totalPrice: acc.totalPrice + totalItemPrice,
        totalItems: acc.totalItems + item.quantity,
      };
    },
    { totalPrice: 0, totalItems: 0 }
  );
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartState, setCartState] = useState<CartState>(() => {
    // Initialize cart from local storage if available
    const savedCart = localStorage.getItem('zomatifyCart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        return {
          items: parsedCart.items || [],
          ...calculateCartTotals(parsedCart.items || [])
        };
      } catch (error) {
        console.error('Error parsing cart from local storage:', error);
        return { items: [], totalPrice: 0, totalItems: 0 };
      }
    } else {
      return { items: [], totalPrice: 0, totalItems: 0 };
    }
  });

  // Save cart to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('zomatifyCart', JSON.stringify(cartState));
  }, [cartState]);

  const addItem = (
    menuItem: MenuItem, 
    quantity: number, 
    specialInstructions?: string, 
    selectedOptions?: MenuItemOption[]
  ) => {
    setCartState((prevState) => {
      // Check if item already exists in cart
      const existingItemIndex = prevState.items.findIndex(
        (item) => item.menuItem.id === menuItem.id
      );

      let newItems: CartItem[];

      if (existingItemIndex !== -1) {
        // Item exists, update quantity and special instructions
        const existingItem = prevState.items[existingItemIndex];
        const updatedItem = {
          ...existingItem,
          quantity: existingItem.quantity + quantity,
          specialInstructions: specialInstructions || existingItem.specialInstructions,
          selected_options: selectedOptions || existingItem.selected_options
        };

        newItems = [...prevState.items];
        newItems[existingItemIndex] = updatedItem;
      } else {
        // Item doesn't exist, add it
        const newItem: CartItem = {
          id: `${menuItem.id}-${Date.now()}`,
          menuItem,
          quantity,
          specialInstructions,
          selected_options: selectedOptions
        };

        newItems = [...prevState.items, newItem];
      }

      // Calculate new totals
      const { totalPrice, totalItems } = calculateCartTotals(newItems);

      return {
        items: newItems,
        totalPrice,
        totalItems
      };
    });
  };

  const removeItem = (itemId: string) => {
    setCartState((prevState) => {
      const newItems = prevState.items.filter((item) => item.id !== itemId);
      
      // Calculate new totals
      const { totalPrice, totalItems } = calculateCartTotals(newItems);

      return {
        items: newItems,
        totalPrice,
        totalItems
      };
    });
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setCartState((prevState) => {
      const newItems = prevState.items.map((item) => {
        if (item.id === itemId) {
          return { ...item, quantity };
        }
        return item;
      });

      // Calculate new totals
      const { totalPrice, totalItems } = calculateCartTotals(newItems);

      return {
        items: newItems,
        totalPrice,
        totalItems
      };
    });
  };

  const updateItemInstructions = (itemId: string, instructions: string) => {
    setCartState((prevState) => {
      const newItems = prevState.items.map((item) => {
        if (item.id === itemId) {
          return { ...item, specialInstructions: instructions };
        }
        return item;
      });

      return {
        ...prevState,
        items: newItems
      };
    });
  };

  const clearCart = () => {
    setCartState({
      items: [],
      totalPrice: 0,
      totalItems: 0
    });
  };

  const getItemById = (itemId: string) => {
    return cartState.items.find((item) => item.id === itemId);
  };

  return (
    <CartContext.Provider
      value={{
        ...cartState,
        addItem,
        removeItem,
        updateItemQuantity,
        updateItemInstructions,
        clearCart,
        getItemById
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
