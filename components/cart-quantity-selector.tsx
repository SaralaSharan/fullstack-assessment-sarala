'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import {
  getCartItemQuantity,
  increaseCartItem,
  decreaseCartItem,
  addToCart,
} from '@/lib/cart';

interface CartQuantitySelectorProps {
  // Product information
  stacklineSku: string;
  title: string;
  imageUrl: string;
  price: number; // Product price
  // Styling options
  variant?: 'default' | 'full-width';
}

/**
 * CartQuantitySelector Component
 *
 * Dual-state interactive component for cart management:
 * - Shows "Add to Cart" button when product not in cart
 * - Shows quantity controls (- icon quantity +) when in cart
 *
 * Features:
 * - Local storage persistence via cart utilities
 * - Smooth transitions between states
 * - Accessibility support with ARIA labels
 * - Automatic removal at zero quantity
 */
export function CartQuantitySelector({
  stacklineSku,
  title,
  imageUrl,
  price,
  variant = 'default',
}: CartQuantitySelectorProps) {
  // Track current quantity in cart
  const [quantity, setQuantity] = useState(0);
  // Prevent hydration mismatch on initial load
  const [isMounted, setIsMounted] = useState(false);

  // Initialize quantity from localStorage (client-side only)
  useEffect(() => {
    setQuantity(getCartItemQuantity(stacklineSku));
    setIsMounted(true);
  }, [stacklineSku]);

  // Handle adding item to cart
  const handleAddToCart = () => {
    // Validate price is a number
    const validPrice = typeof price === 'number' ? price : 0;
    
    addToCart(
      {
        stacklineSku,
        title,
        imageUrl,
        price: validPrice,
      },
      1
    );
    setQuantity(1);
  };

  // Handle increasing quantity
  const handleIncrease = () => {
    const newQuantity = increaseCartItem(stacklineSku);
    setQuantity(newQuantity);
  };

  // Handle decreasing quantity
  const handleDecrease = () => {
    const newQuantity = decreaseCartItem(stacklineSku);
    setQuantity(newQuantity);
  };

  // Prevent showing wrong state during hydration
  if (!isMounted) {
    return (
      <Button
        disabled
        className="w-full"
        size={variant === 'full-width' ? 'lg' : 'default'}
      >
        Loading...
      </Button>
    );
  }

  // Show quantity controls when item is in cart
  if (quantity > 0) {
    return (
      <div
        className={`flex items-center gap-2 ${
          variant === 'full-width' ? 'w-full' : ''
        }`}
        role="group"
        aria-label="Cart quantity controls"
      >
        {/* Decrease button */}
        <Button
          variant="outline"
          size="icon"
          onClick={handleDecrease}
          aria-label={`Decrease ${title} quantity`}
          className="flex-shrink-0 h-10 w-10 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
          title="Decrease quantity"
        >
          <Minus className="h-4 w-4" />
        </Button>

        {/* Quantity display with cart icon */}
        <div
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-primary/5 rounded-md border border-primary/20"
          aria-live="polite"
          aria-label={`${quantity} ${quantity === 1 ? 'item' : 'items'} in cart`}
        >
          <ShoppingCart className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm text-primary">{quantity}</span>
        </div>

        {/* Increase button */}
        <Button
          variant="outline"
          size="icon"
          onClick={handleIncrease}
          aria-label={`Increase ${title} quantity`}
          className="flex-shrink-0 h-10 w-10 hover:bg-green-50 hover:border-green-300 hover:text-green-600 transition-colors"
          title="Increase quantity"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Show "Add to Cart" button when not in cart
  return (
    <Button
      onClick={handleAddToCart}
      className={`bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-200 ${
        variant === 'full-width' ? 'w-full h-11 text-base' : ''
      }`}
      size={variant === 'full-width' ? 'lg' : 'default'}
      aria-label={`Add ${title} to cart`}
    >
      <ShoppingCart className="mr-2 h-4 w-4" />
      Add to Cart
    </Button>
  );
}
