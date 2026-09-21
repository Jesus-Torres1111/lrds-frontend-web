import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productoId: number;
  nombre: string;
  precio: number;
  cantidad: number;
  notasPreparacion: string;
  imagenUrl?: string;
}

interface CartState {
  empresaId: number | null;
  sedeId: number | null;
  items: CartItem[];
  isCartOpen: boolean;
  
  toggleCart: () => void;
  setIds: (empresaId: number, sedeId: number) => void;
  addItem: (item: CartItem) => void;
  removeItem: (productoId: number, notasPreparacion: string) => void;
  updateQuantity: (productoId: number, notasPreparacion: string, delta: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      empresaId: null,
      sedeId: null,
      items: [],
      isCartOpen: false,

      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

      setIds: (empresaId, sedeId) => set({ empresaId, sedeId }),

      addItem: (newItem) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (i) => i.productoId === newItem.productoId && i.notasPreparacion === newItem.notasPreparacion
          );

          if (existingItemIndex >= 0) {
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex].cantidad += newItem.cantidad;
            return { items: updatedItems, isCartOpen: true };
          } else {
            return { items: [...state.items, newItem], isCartOpen: true };
          }
        });
      },

      removeItem: (productoId, notasPreparacion) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productoId === productoId && i.notasPreparacion === notasPreparacion)
          ),
        }));
      },

      updateQuantity: (productoId, notasPreparacion, delta) => {
        set((state) => {
          const updatedItems = state.items.map((i) => {
            if (i.productoId === productoId && i.notasPreparacion === notasPreparacion) {
              return { ...i, cantidad: Math.max(1, i.cantidad + delta) };
            }
            return i;
          });
          return { items: updatedItems };
        });
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        return get().items.reduce((total, item) => total + (item.precio * item.cantidad), 0);
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.cantidad, 0);
      }
    }),
    {
      name: 'rutadelsabor-cart-storage',
      partialize: (state) => ({ items: state.items, empresaId: state.empresaId, sedeId: state.sedeId })
    }
  )
);