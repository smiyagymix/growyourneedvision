import Medusa from "@medusajs/medusa-js"

// Initialize Medusa client
// In production, this URL would be your self-hosted domain
const MEDUSA_BACKEND_URL = import.meta.env.VITE_MEDUSA_BACKEND_URL || "http://localhost:9000"

const medusa = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  maxRetries: 3
})

export interface MoneyAmount {
  id: string
  currency_code: string
  amount: number
  min_quantity: number | null
  max_quantity: number | null
}

export interface ProductOptionValue {
  id: string
  value: string
  option_id: string
  variant_id: string
  metadata: Record<string, unknown> | null
  deleted_at: Date | null
  created_at: Date
  updated_at: Date
}

export interface ProductVariant {
  id: string
  title: string
  prices: MoneyAmount[]
  sku: string | null
  inventory_quantity: number
  options: ProductOptionValue[]
}

export interface Product {
  id: string
  title: string
  description: string
  thumbnail: string | null
  variants: ProductVariant[]
  // prices is not a direct property of Product in Medusa, usually derived from variants
}

export const marketService = {
  /**
   * Fetch all products
   */
  async getProducts() {
    try {
      const { products } = await medusa.products.list()
      return products as unknown as Product[]
    } catch (error: unknown) {
      console.error("Failed to fetch products:", error)
      return []
    }
  },


  /**
   * Fetch a single product by ID
   */
  async getProduct(id: string) {
    try {
      const { product } = await medusa.products.retrieve(id)
      return product
    } catch (error: unknown) {
      console.error(`Error fetching product ${id}:`, error)
      return null
    }
  },

  /**
   * Create a cart
   */
  async createCart() {
    try {
      const { cart } = await medusa.carts.create()
      return cart
    } catch (error: unknown) {
      console.error("Error creating cart:", error)
      return null
    }
  },

  /**
   * Add item to cart
   */
  async addToCart(cartId: string, variantId: string, quantity: number) {
    try {
      const { cart } = await medusa.carts.lineItems.create(cartId, {
        variant_id: variantId,
        quantity
      })
      return cart
    } catch (error: unknown) {
      console.error("Error adding to cart:", error)
      return null
    }
  },

  /**
   * Complete checkout
   */
  async completeCheckout(cartId: string) {
    try {
      const response = await medusa.carts.complete(cartId)
      if (response.type === "cart") {
        return response.data
      }
      return response.data // Order object
    } catch (error: unknown) {
      console.error("Error completing checkout:", error)
      return null
    }
  }
}
