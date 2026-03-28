export type PriceRole = 'guest' | 'customer' | 'wholesale' | 'admin'

export type PriceProduct = {
  price_retail: number | string | null
  price_wholesale: number | string | null
}

export function getEffectivePrice(product: PriceProduct, role: PriceRole) {
  const retail = Number(product.price_retail || 0)
  const wholesale = Number(product.price_wholesale || 0)

  if (role === 'wholesale' || role === 'admin') {
    return wholesale > 0 ? wholesale : retail
  }

  return retail
}