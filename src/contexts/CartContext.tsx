import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface CartItem {
  id: string;
  book_id: string;
  quantity: number;
  book: {
    title: string;
    price: number;
    image_url: string;
  };
}

interface CartContextType {
  items: CartItem[];
  addToCart: (bookId: string) => Promise<void>;
  removeFromCart: (bookId: string) => Promise<void>;
  updateQuantity: (bookId: string, quantity: number) => Promise<void>;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    loadCart();
    const channel = supabase
      .channel('cart_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'cart_items' 
      }, () => {
        loadCart();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadCart = async () => {
    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        book_id,
        quantity,
        books (
          title,
          price,
          image_url
        )
      `);

    if (error) {
      toast.error('Error loading cart');
      return;
    }

    setItems(cartItems as CartItem[]);
  };

  const addToCart = async (bookId: string) => {
    const { error } = await supabase
      .from('cart_items')
      .upsert({ 
        book_id: bookId,
        quantity: 1,
        user_id: (await supabase.auth.getUser()).data.user?.id
      });

    if (error) {
      toast.error('Error adding to cart');
      return;
    }

    toast.success('Added to cart');
  };

  const removeFromCart = async (bookId: string) => {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('book_id', bookId);

    if (error) {
      toast.error('Error removing from cart');
      return;
    }

    toast.success('Removed from cart');
  };

  const updateQuantity = async (bookId: string, quantity: number) => {
    if (quantity < 1) {
      await removeFromCart(bookId);
      return;
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('book_id', bookId);

    if (error) {
      toast.error('Error updating quantity');
      return;
    }
  };

  const total = items.reduce((sum, item) => {
    return sum + (item.book.price * item.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}