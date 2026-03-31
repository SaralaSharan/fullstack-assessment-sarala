/**
 * Cart management utilities for local storage persistence
 * Handles all cart operations: add, remove, increase, decrease items
 */

// Type definition for a product in the cart
export interface CartItem {
  stacklineSku: string; // Unique product identifier
  title: string; // Product name
  imageUrl: string; // Product image for display
  price: number; // Product price
  quantity: number; // Number of items in cart
}

// Key used for localStorage
const CART_STORAGE_KEY = 'stackshop_cart';

/**
 * Retrieves all items from the shopping cart
 * @returns Array of cart items from localStorage
 */
export function getCartItems(): CartItem[] {
  try {
    // Only access localStorage in browser environment
    if (typeof window === 'undefined') return [];

    const cartData = localStorage.getItem(CART_STORAGE_KEY);
    const items = cartData ? JSON.parse(cartData) : [];
    
    // Ensure all items have required fields (for backwards compatibility)
    return items.map((item: any) => ({
      stacklineSku: item.stacklineSku,
      title: item.title,
      imageUrl: item.imageUrl,
      price: typeof item.price === 'number' ? item.price : 0,
      quantity: item.quantity,
    }));
  } catch (error) {
    console.error('Failed to get cart items:', error);
    return [];
  }
}

/**
 * Saves cart items to localStorage
 * @param items Array of cart items to persist
 */
export function saveCartItems(items: CartItem[]): void {
  try {
    if (typeof window === 'undefined') return;

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save cart items:', error);
  }
}

/**
 * Adds a new item to cart or increases quantity if already exists
 * @param product Product details to add
 * @param quantity Number of items to add (default: 1)
 */
export function addToCart(
  product: {
    stacklineSku: string;
    title: string;
    imageUrl: string;
    price: number;
  },
  quantity: number = 1
): void {
  const items = getCartItems();

  // Validate price
  const validPrice = typeof product.price === 'number' && product.price > 0 ? product.price : 0;

  // Check if product already in cart
  const existingItem = items.find(item => item.stacklineSku === product.stacklineSku);

  if (existingItem) {
    // Increase quantity if exists
    existingItem.quantity += quantity;
    // Update price if the new one is valid and stored one is 0
    if (validPrice > 0 && existingItem.price === 0) {
      existingItem.price = validPrice;
    }
  } else {
    // Add new item to cart
    items.push({
      stacklineSku: product.stacklineSku,
      title: product.title,
      imageUrl: product.imageUrl,
      price: validPrice,
      quantity,
    });
  }

  saveCartItems(items);
}

/**
 * Increases the quantity of an item in the cart
 * @param stacklineSku Product SKU to increase
 * @returns Updated cart quantity or 0 if item not found
 */
export function increaseCartItem(stacklineSku: string): number {
  const items = getCartItems();
  const item = items.find(i => i.stacklineSku === stacklineSku);

  if (item) {
    item.quantity += 1;
    saveCartItems(items);
    return item.quantity;
  }

  return 0;
}

/**
 * Decreases the quantity of an item in the cart
 * If quantity reaches 0, item is removed from cart
 * @param stacklineSku Product SKU to decrease
 * @returns Updated cart quantity or 0 if item removed/not found
 */
export function decreaseCartItem(stacklineSku: string): number {
  const items = getCartItems();
  const index = items.findIndex(i => i.stacklineSku === stacklineSku);

  if (index === -1) return 0;

  const item = items[index];
  item.quantity -= 1;

  // Remove item completely if quantity reaches 0
  if (item.quantity <= 0) {
    items.splice(index, 1);
  }

  saveCartItems(items);
  return item.quantity > 0 ? item.quantity : 0;
}

/**
 * Removes an item completely from the cart
 * @param stacklineSku Product SKU to remove
 */
export function removeFromCart(stacklineSku: string): void {
  const items = getCartItems();
  const filtered = items.filter(i => i.stacklineSku !== stacklineSku);
  saveCartItems(filtered);
}

/**
 * Gets the quantity of a specific item in cart
 * @param stacklineSku Product SKU to check
 * @returns Quantity in cart or 0 if not found
 */
export function getCartItemQuantity(stacklineSku: string): number {
  const items = getCartItems();
  const item = items.find(i => i.stacklineSku === stacklineSku);
  return item ? item.quantity : 0;
}

/**
 * Gets the total number of items in the cart
 * @returns Total quantity of all items
 */
export function getCartTotal(): number {
  const items = getCartItems();
  return items.reduce((total, item) => total + item.quantity, 0);
}

/**
 * Enriches cart items with product data (e.g., missing prices)
 * This is useful for migrating old cart items that don't have prices
 * @param productData Map of SKU to product data with price information
 */
export function enrichCartItems(productData: Record<string, { price: number }>): void {
  let items = getCartItems();
  let hasChanges = false;

  items = items.map((item) => {
    // If item is missing price and we have product data, add it
    if ((item.price === 0 || !item.price) && productData[item.stacklineSku]) {
      hasChanges = true;
      return {
        ...item,
        price: productData[item.stacklineSku].price,
      };
    }
    return item;
  });

  // Only save if we made changes
  if (hasChanges) {
    saveCartItems(items);
  }
}

/**
 * Clears all items from the cart
 */
export function clearCart(): void {
  saveCartItems([]);
}
