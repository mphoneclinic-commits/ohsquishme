export function getCart() {
  if (typeof window === 'undefined') return []
  return JSON.parse(localStorage.getItem('cart') || '[]')
}

export function addToCart(item: any) {
  const cart = getCart()
  cart.push(item)
  localStorage.setItem('cart', JSON.stringify(cart))
}