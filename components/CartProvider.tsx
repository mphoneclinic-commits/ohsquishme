'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react'

export type CartItem = {
  id: string
  name: string
  price: number
  image_url: string | null
  quantity: number
}

type AddCartItemInput = {
  id: string
  name: string
  price: number
  image_url: string | null
  quantity?: number
}

type CartContextType = {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addItem: (item: AddCartItemInput) => void
  setItemQuantity: (id: string, quantity: number) => void
  increaseQty: (id: string) => void
  decreaseQty: (id: string) => void
  removeItem: (id: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const STORAGE_KEY = 'taba-cart'

export default function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[]
        if (Array.isArray(parsed)) {
          setItems(parsed)
        }
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage', error)
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch (error) {
      console.error('Failed to save cart to localStorage', error)
    }
  }, [items, hydrated])

  function addItem(item: AddCartItemInput) {
    const qtyToAdd = Math.max(1, Number(item.quantity ?? 1))

    setItems((current) => {
      const existing = current.find((x) => x.id === item.id)

      if (existing) {
        return current.map((x) =>
          x.id === item.id
            ? { ...x, quantity: x.quantity + qtyToAdd }
            : x
        )
      }

      return [
        ...current,
        {
          id: item.id,
          name: item.name,
          price: item.price,
          image_url: item.image_url,
          quantity: qtyToAdd,
        },
      ]
    })
  }

  function setItemQuantity(id: string, quantity: number) {
    const nextQty = Math.max(0, Math.floor(Number(quantity) || 0))

    setItems((current) => {
      if (nextQty === 0) {
        return current.filter((item) => item.id !== id)
      }

      return current.map((item) =>
        item.id === id ? { ...item, quantity: nextQty } : item
      )
    })
  }

  function increaseQty(id: string) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    )
  }

  function decreaseQty(id: string) {
    setItems((current) =>
      current
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id))
  }

  function clearCart() {
    setItems([])
  }

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  )

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  )

  const value: CartContextType = {
    items,
    itemCount,
    subtotal,
    addItem,
    setItemQuantity,
    increaseQty,
    decreaseQty,
    removeItem,
    clearCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used inside CartProvider')
  }

  return context
}