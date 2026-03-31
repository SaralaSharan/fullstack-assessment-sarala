'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trash2, ShoppingCart } from 'lucide-react';
import {
  getCartItems,
  removeFromCart,
  increaseCartItem,
  decreaseCartItem,
} from '@/lib/cart';

/**
 * Cart Page Component
 *
 * Features:
 * - Display all products in cart with images
 * - Quantity adjustment controls for each item
 * - Remove item functionality
 * - Cart summary with total items
 * - Empty state handling
 * - Responsive design
 */
export default function CartPage() {
  // State management
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Load cart items from localStorage
  useEffect(() => {
    setCartItems(getCartItems());
    setIsMounted(true);
  }, []);

  // Handle quantity increase
  const handleIncreaseQuantity = (stacklineSku: string) => {
    increaseCartItem(stacklineSku);
    setCartItems(getCartItems());
  };

  // Handle quantity decrease
  const handleDecreaseQuantity = (stacklineSku: string) => {
    decreaseCartItem(stacklineSku);
    setCartItems(getCartItems());
  };

  // Handle item removal
  const handleRemoveItem = (stacklineSku: string) => {
    removeFromCart(stacklineSku);
    setCartItems(getCartItems());
  };

  // Calculate total items
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  // Calculate subtotal (sum of price * quantity for all items)
  // Use 0 as fallback for items without price (legacy cart items)
  const subtotal = cartItems.reduce((sum, item) => sum + ((item.price ?? 0) * item.quantity), 0);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Loading cart...</p>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Shopping
              </Button>
            </Link>
            <h1 className="text-4xl font-bold">Shopping Cart</h1>
          </div>

          {/* Empty state */}
          <Card className="border-0 shadow-sm bg-blue-50/50">
            <CardContent className="pt-12 text-center">
              <div className="mb-6 flex justify-center">
                <div className="rounded-full bg-blue-100 p-4">
                  <ShoppingCart className="h-12 w-12 text-blue-600" />
                </div>
              </div>
              <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">
                Looks like you haven't added any items yet. Start shopping to fill your cart!
              </p>
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link href="/">
                  Start Shopping
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continue Shopping
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-2">Shopping Cart</h1>
          <p className="text-muted-foreground">
            {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items Section */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card
                key={item.stacklineSku}
                className="overflow-hidden hover:shadow-md transition-shadow"
              >
                <CardContent className="p-0">
                  <div className="flex gap-4 p-6">
                    {/* Product Image */}
                    <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-muted">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold mb-2 line-clamp-2 hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-1">
                        SKU: {item.stacklineSku}
                      </p>
                      
                      {/* Price Information */}
                      <div className="flex items-center gap-4 mb-3">
                        <div className="text-lg font-bold text-primary">
                          ${(item.price ?? 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Subtotal: ${((item.price ?? 0) * item.quantity).toFixed(2)}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3 mt-4">
                        <Badge variant="outline" className="text-xs">
                          Qty: {item.quantity}
                        </Badge>
                        <div className="flex items-center gap-2">
                          {/* Decrease Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDecreaseQuantity(item.stacklineSku)}
                            aria-label={`Decrease ${item.title} quantity`}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                          >
                            −
                          </Button>

                          {/* Quantity Display */}
                          <span className="w-8 text-center font-semibold text-sm">
                            {item.quantity}
                          </span>

                          {/* Increase Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleIncreaseQuantity(item.stacklineSku)}
                            aria-label={`Increase ${item.title} quantity`}
                            className="h-8 w-8 p-0 hover:bg-green-50 hover:border-green-300 hover:text-green-600"
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <div className="flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.stacklineSku)}
                        aria-label={`Remove ${item.title} from cart`}
                        className="text-destructive hover:bg-red-50 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Cart Summary Section */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary Details */}
                <div className="space-y-3 pb-4 border-b">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items:</span>
                    <span className="font-semibold">{totalItems}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Products:</span>
                    <span className="font-semibold">{cartItems.length}</span>
                  </div>
                  {/* Subtotal */}
                  <div className="flex justify-between text-base font-semibold pt-2">
                    <span>Subtotal:</span>
                    <span className="text-primary">${subtotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    asChild
                    className="w-full bg-primary hover:bg-primary/90 h-11 text-base font-semibold"
                  >
                    <Link href="/">
                      Continue Shopping
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-10"
                    disabled
                  >
                    Proceed to Checkout (Coming Soon)
                  </Button>
                </div>

                {/* Info Text */}
                <div className="text-xs text-muted-foreground text-center mt-4 pt-4 border-t">
                  <p>No shipping or tax calculated yet</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
