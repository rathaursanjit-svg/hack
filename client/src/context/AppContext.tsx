import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, CartItem, Product, Invoice } from '../types';
import { api, setApiDemoUser } from '../services/api';

interface AppContextType {
  currentUser: User | null;
  demoUsers: User[];
  switchUser: (user: User) => void;
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotalPaise: number;
  cartTaxEstimatePaise: number;
  previewInvoiceId: string | null;
  openInvoicePreview: (invoiceId: string) => void;
  closeInvoicePreview: () => void;
  notification: { message: string; type: 'success' | 'error' | 'info' } | null;
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
  selectedShopId: string;
  setSelectedShopId: (shopId: string) => void;
  refreshUserData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('sri_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [previewInvoiceId, setPreviewInvoiceId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [selectedShopId, setSelectedShopId] = useState<string>('shp_1');

  useEffect(() => {
    localStorage.setItem('sri_cart', JSON.stringify(cart));
  }, [cart]);

  const loadDemoUsers = async () => {
    try {
      const data = await api.getDemoUsers();
      setDemoUsers(data.users);
      
      // Default to first consumer if none selected
      if (!currentUser) {
        const defaultConsumer = data.users.find(u => u.role === 'consumer') || data.users[0];
        if (defaultConsumer) {
          setCurrentUser(defaultConsumer);
          setApiDemoUser(defaultConsumer);
        }
      }
    } catch (err) {
      console.error('Failed to load demo users:', err);
    }
  };

  useEffect(() => {
    loadDemoUsers();
  }, []);

  const switchUser = (user: User) => {
    setCurrentUser(user);
    setApiDemoUser(user);
    showNotification(`Switched demo role to: ${user.name} (${user.role.toUpperCase()})`, 'info');
  };

  const addToCart = (product: Product, quantity = 1) => {
    if (product.stock <= 0) {
      showNotification(`"${product.name}" is currently out of stock.`, 'error');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > product.stock) {
          showNotification(`Cannot add more than available stock (${product.stock}).`, 'error');
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prev, { product, quantity: Math.min(quantity, product.stock) }];
    });
    showNotification(`Added "${product.name}" to cart`, 'success');
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          if (quantity > item.product.stock) {
            showNotification(`Only ${item.product.stock} units available in stock`, 'error');
            return item;
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  // Compute cart totals
  const cartTotalPaise = cart.reduce((sum, item) => sum + item.quantity * item.product.price_paise, 0);
  const cartTaxEstimatePaise = cart.reduce((sum, item) => {
    const total = item.quantity * item.product.price_paise;
    const rate = item.product.tax_rate_percent || 0;
    if (rate === 0) return sum;
    if (item.product.price_includes_tax) {
      const taxable = Math.round(total / (1 + rate / 100));
      return sum + (total - taxable);
    } else {
      return sum + Math.round((total * rate) / 100);
    }
  }, 0);

  const openInvoicePreview = (invoiceId: string) => setPreviewInvoiceId(invoiceId);
  const closeInvoicePreview = () => setPreviewInvoiceId(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(current => (current?.message === message ? null : current));
    }, 4000);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        demoUsers,
        switchUser,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartTotalPaise,
        cartTaxEstimatePaise,
        previewInvoiceId,
        openInvoicePreview,
        closeInvoicePreview,
        notification,
        showNotification,
        selectedShopId,
        setSelectedShopId,
        refreshUserData: loadDemoUsers,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
