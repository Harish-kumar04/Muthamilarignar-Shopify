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

  async getStore(): Promise<any> {
    return {
      name: "Muthamilarignar Pathipagam",
      currency: "INR",
      razorpay_enabled: false,
    };
  }

  async getPages(): Promise<any[]> {
    // TODO shopify: query `pages(first: 20)`
    return [];
  }

  async getProducts(_params?: Record<string, string>): Promise<any[]> {
    return [];
  }

  async getProduct(_id: string): Promise<any | null> {
    return null;
  }

  async getCategories(): Promise<any[]> {
    return [];
  }

  async getProductVariants(_productId: string): Promise<any[]> {
    // TODO shopify: read variants from `product { variants(first: 20) }`
    return [];
  }

  async getCollections(): Promise<any[]> {
    // TODO shopify: query `collections(first: 20)`
    return [];
  }

  // ---- Cart & Checkout ----

  async getCart(): Promise<any> {
    // TODO shopify: query `cart(id: $cartId)`
    return { id: null, items: [], total_cents: 0 };
  }

  async addToCart(
    _productId: string,
    _quantity: number,
    _variantId?: string,
  ): Promise<any> {
    // TODO shopify: mutation `cartCreate` / `cartLinesAdd`
    throw new Error(SHOPIFY_STUB_MSG);
  }

  async updateCartItem(_itemId: string, _quantity: number): Promise<any> {
    // TODO shopify: mutation `cartLinesUpdate`
    throw new Error(SHOPIFY_STUB_MSG);
  }

  async removeCartItem(_itemId: string): Promise<any> {
    // TODO shopify: mutation `cartLinesRemove`
    throw new Error(SHOPIFY_STUB_MSG);
  }

  async validateCoupon(_code: string, _orderTotalCents: number): Promise<any> {
    // TODO shopify: mutation `cartDiscountCodesUpdate`
    throw new Error(SHOPIFY_STUB_MSG);
  }

  async getCheckout(_checkoutId: string): Promise<any> {
    // TODO shopify: read `cart.checkoutUrl`
    throw new Error(SHOPIFY_STUB_MSG);
  }

  async createCheckout(_data: any): Promise<any> {
    // TODO shopify: redirect shopper to Shopify hosted `cart.checkoutUrl`
    throw new Error(SHOPIFY_STUB_MSG);
  }

  async initiatePayment(
    _checkoutId: string,
    _provider: string = "shopify",
  ): Promise<any> {
    // TODO shopify: handled by Shopify Checkout
    throw new Error(SHOPIFY_STUB_MSG);
  }

  // ---- Orders, Tracking, Returns & Customer Account ----

  async getInvoice(_orderId: string): Promise<any> {
    // TODO shopify: Shopify order statusUrl / invoice
    throw new Error(SHOPIFY_STUB_MSG);
  }

  async downloadInvoice(
    _orderId: string,
    _format: "html" | "pdf" = "html",
  ): Promise<Blob> {
    // TODO shopify: Shopify order invoice download
    throw new Error(SHOPIFY_STUB_MSG);
  }

  async trackOrder(_orderId: string, _email: string): Promise<any> {
    // TODO shopify: Shopify order status lookup
    throw new Error(SHOPIFY_STUB_MSG);
  }

  async getOrderFulfillments(_orderId: string): Promise<any> {
    // TODO shopify: query `customer { orders { successfulFulfillments } }`
    return [];
  }

  async getOrder(_orderId: string): Promise<any> {
    // TODO shopify: query Shopify Customer Account API order by ID
    throw new Error(SHOPIFY_STUB_MSG);
  }

  async listOrders(_status?: string): Promise<any[]> {
    // TODO shopify: query `customer { orders(first: 20) }`
    return [];
  }

  async getOrderRefunds(_orderId: string): Promise<any[]> {
    // TODO shopify: Shopify order refunds
    return [];
  }

  async getOrderPayments(_orderId: string): Promise<any[]> {
    // TODO shopify: Shopify order transactions
    return [];
  }

  async requestReturn(
    _orderId: string,
    _items: Array<{ product_id: string; quantity: number }>,
    _reason: string,
  ): Promise<any> {
    // TODO shopify: Shopify self-serve returns
    throw new Error(SHOPIFY_STUB_MSG);
  }

  async cancelOrder(_orderId: string): Promise<any> {
    // TODO shopify: Shopify customer order cancellation support
    throw new Error(SHOPIFY_STUB_MSG);
  }

  async getReturns(): Promise<any[]> {
    // TODO shopify: Shopify customer returns list
    return [];
  }

  async getCurrentUser(): Promise<any> {
    // TODO shopify: query `customer { id email firstName lastName phone }`
    return null;
  }

  async getMyCustomerId(): Promise<string | null> {
    // TODO shopify: read authenticated Shopify customer GID
    return null;
  }

  async getConsent(_customerId: string): Promise<Record<string, boolean>> {
    // TODO shopify: read `customer { acceptsMarketing }`
    return {};
  }

  async updateConsent(
    _customerId: string,
    _flags: Record<string, boolean>,
  ): Promise<any> {
    // TODO shopify: mutation `customerUpdate(acceptsMarketing)`
    throw new Error(SHOPIFY_STUB_MSG);
  }

  async withdrawAllConsent(_customerId: string): Promise<any> {
    // TODO shopify: mutation `customerUpdate(acceptsMarketing: false)`
    throw new Error(SHOPIFY_STUB_MSG);
  }

  async exportCustomerData(_customerId: string): Promise<any> {
    // TODO shopify: Shopify privacy data export request
    throw new Error(SHOPIFY_STUB_MSG);
  }

  async eraseCustomerData(_customerId: string): Promise<any> {
    // TODO shopify: Shopify customer erasure request
    throw new Error(SHOPIFY_STUB_MSG);
  }
}

export const storefrontApi = new StorefrontApi();
