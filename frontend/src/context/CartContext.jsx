import { createContext, useContext, useState, useCallback } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nk_cart')) || [] } catch { return [] }
  })

  const save = (newItems) => {
    setItems(newItems)
    localStorage.setItem('nk_cart', JSON.stringify(newItems))
  }

  const addItem = useCallback((product, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === product.id)
      const updated = existing
        ? prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + qty } : i)
        : [...prev, { product_id: product.id, product_name: product.name, product_image: product.image_url, price: product.price, quantity: qty, category: product.category }]
      localStorage.setItem('nk_cart', JSON.stringify(updated))
      return updated
    })
  }, [])

  const removeItem = useCallback((productId) => {
    setItems(prev => {
      const updated = prev.filter(i => i.product_id !== productId)
      localStorage.setItem('nk_cart', JSON.stringify(updated))
      return updated
    })
  }, [])

  const updateQty = useCallback((productId, qty) => {
    if (qty < 1) return
    setItems(prev => {
      const updated = prev.map(i => i.product_id === productId ? { ...i, quantity: qty } : i)
      localStorage.setItem('nk_cart', JSON.stringify(updated))
      return updated
    })
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    localStorage.removeItem('nk_cart')
  }, [])

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const count = items.reduce((s, i) => s + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
