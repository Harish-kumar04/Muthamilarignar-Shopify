/**
 * Storefront client stubs — TODO shopify: replace every method with
 * Shopify Storefront GraphQL API / Customer Account API queries & mutations.
 */
import {
  captureAttribution,
  getStoredAttribution,
  getStoredFirstAttribution,
  type Attribution,
} from "./attribution";
import { getCartSessionId } from "./cart-session";

export {
  captureAttribution,
  getStoredAttribution,
  getStoredFirstAttribution,
  getCartSessionId,
};
export type { Attribution };

const SHOPIFY_STUB_MSG = "TODO shopify: Shopify Storefront API integration pending";

export class StorefrontApi {
  // ---- Public catalog, store, pages, categories ----

  async getStore(_tenant: string): Promise<any> {
    // TODO shopify: query `shop { name description brand { logo { image { url } } } }`
    const { FALLBACK_STORE } = await import("./catalog-fallback");
    return FALLBACK_STORE;
  }

  async getPages(_tenant: string): Promise<any[]> {
    // TODO shopify: query `pages(first: 20)`
    return [];
  }

  async getProducts(_tenant: string, _params?: Record<string, string>): Promise<any[]> {
    // TODO shopify: query `products(first: 50)`
    return [];
  }

  async getProduct(_tenant: string, _id: string): Promise<any | null> {
    // TODO shopify: query `product(handle: ...)` or `product(id: ...)`
    return null;
  }

  async getCategories(_tenant: string): Promise<any[]> {
    // TODO shopify: query `collections(first: 20)`
    const { FALLBACK_CATEGORIES } = await import("./catalog-fallback");
    return FALLBACK_CATEGORIES;
  }

  async getProductVariants(_tenant: string, _productId: string): Promise<any[]> {
    // TODO shopify: read variants from `product { variants(first: 20) }`
    return [];
  }

  async getCollections(_tenant: string): Promise<any[]> {
    // TODO shopify: query `collections(first: 20)`
    return [];
  }

  // ---- Cart & Checkout ----

  async getCart(_tenant: string): Promise<any> {
    // TODO shopify: query `cart(id: $cartId)`
    return { id: null, items: [], total_cents: 0 };
  }

  async addToCart(
    _tenant: string,
    _productId: string,
    _quantity: number,
    _variantId?: string,
  ): Promise<any> {
    // TODO shopify: mutation `cartCreate` / `cartLinesAdd`
    throw new Error(SHOPIFY_STUB_MSG);
  }

  async updateCartItem(_tenant: string, _itemId: string, _quantity: number): Promise<any> {
    // TODO shopify: mutation `cartLinesUpdate`
    throw new Error(SHOPIFY_STUB_MSG);
  }

  async removeCartItem(_tenant: string, _itemId: string): Promise<any> {
    // TODO shopify: mutation `cartLinesRemove`
    throw new Error(SHOPIFY_STUB_MSG);
  }

  async validateCoupon(_tenant: string, _code: string, _orderTotalCents: number): Promise<any> {
    // TODO shopify: mutation `cartDiscountCodesUpdate`
    throw new Error(SHOPIFY_STUB_MSG);
  }

  async getCheckout(_tenant: string, _checkoutId: string): Promise<any> {
    // TODO shopify: read `cart.checkoutUrl`
    throw new Error(SHOPIFY_STUB_MSG);
  }

  async createCheckout(_tenant: string, _data: any): Promise<any> {
    // TODO shopify: redirect shopper to Shopify hosted `cart.checkoutUrl`
    throw new Error(SHOPIFY_STUB_MSG);
  }

  async initiatePayment(
    _tenant: string,
    _checkoutId: string,
    _provider: string = "shopify",
  ): Promise<any> {
    // TODO shopify: handled by Shopify Checkout
    throw new Error(SHOPIFY_STUB_MSG);
  }

  // ---- Orders, Tracking, Returns & Customer Account ----

  async getInvoice(_tenant: string, _orderId: string): Promise<any> {
    // TODO shopify: Shopify order statusUrl / invoice
    throw new Error(SHOPIFY_STUB_MSG);
  }

  async downloadInvoice(
    _tenant: string,
    _orderId: string,
    _format: "html" | "pdf" = "html",
  ): Promise<Blob> {
    // TODO shopify: Shopify order invoice download
    throw new Error(SHOPIFY_STUB_MSG);
  }

  async trackOrder(_tenant: string, _orderId: string, _email: string): Promise<any> {
    // TODO shopify: Shopify order status lookup
    throw new Error(SHOPIFY_STUB_MSG);
  }

  async getOrderFulfillments(_tenant: string, _orderId: string): Promise<any> {
    // TODO shopify: query `customer { orders { successfulFulfillments } }`
    return [];
  }

  async getOrder(_tenant: string, _orderId: string): Promise<any> {
    // TODO shopify: query Shopify Customer Account API order by ID
    throw new Error(SHOPIFY_STUB_MSG);
  }

  async listOrders(_tenant: string, _status?: string): Promise<any[]> {
    // TODO shopify: query `customer { orders(first: 20) }`
    return [];
  }

  async getOrderRefunds(_tenant: string, _orderId: string): Promise<any[]> {
    // TODO shopify: Shopify order refunds
    return [];
  }

  async getOrderPayments(_tenant: string, _orderId: string): Promise<any[]> {
    // TODO shopify: Shopify order transactions
    return [];
  }

  async requestReturn(
    _tenant: string,
    _orderId: string,
    _items: Array<{ product_id: string; quantity: number }>,
    _reason: string,
  ): Promise<any> {
    // TODO shopify: Shopify self-serve returns
    throw new Error(SHOPIFY_STUB_MSG);
  }

  async cancelOrder(_tenant: string, _orderId: string): Promise<any> {
    // TODO shopify: Shopify customer order cancellation support
    throw new Error(SHOPIFY_STUB_MSG);
  }

  async getReturns(_tenant: string): Promise<any[]> {
    // TODO shopify: Shopify customer returns list
    return [];
  }

  async getCurrentUser(): Promise<any> {
    // TODO shopify: query `customer { id email firstName lastName phone }`
    return null;
  }

  async getMyCustomerId(_tenant: string): Promise<string | null> {
    // TODO shopify: read authenticated Shopify customer GID
    return null;
  }

  async getConsent(_tenant: string, _customerId: string): Promise<Record<string, boolean>> {
    // TODO shopify: read `customer { acceptsMarketing }`
    return {};
  }

  async updateConsent(
    _tenant: string,
    _customerId: string,
    _flags: Record<string, boolean>,
  ): Promise<any> {
    // TODO shopify: mutation `customerUpdate(acceptsMarketing)`
    throw new Error(SHOPIFY_STUB_MSG);
  }

  async withdrawAllConsent(_tenant: string, _customerId: string): Promise<any> {
    // TODO shopify: mutation `customerUpdate(acceptsMarketing: false)`
    throw new Error(SHOPIFY_STUB_MSG);
  }

  async exportCustomerData(_tenant: string, _customerId: string): Promise<any> {
    // TODO shopify: Shopify privacy data export request
    throw new Error(SHOPIFY_STUB_MSG);
  }

  async eraseCustomerData(_tenant: string, _customerId: string): Promise<any> {
    // TODO shopify: Shopify customer erasure request
    throw new Error(SHOPIFY_STUB_MSG);
  }
}

export const storefrontApi = new StorefrontApi();
