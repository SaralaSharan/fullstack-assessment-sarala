'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  stacklineSku: string;
  title: string;
  categoryName: string;
  subCategoryName: string;
  imageUrls: string[];
  featureBullets: string[];
  retailerSku: string;
}

function ProductContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productParam = searchParams.get('product');
  const skuParam = searchParams.get('sku');
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  const handleBack = () => {
    window.history.back();
  };

  const handleAddToCart = () => {
    alert('Product added to cart! (This is a demo - cart functionality coming soon)');
  };

  // update page title based on product state
  useEffect(() => {
    if (loading) {
      document.title = 'Product | StackShop';
    } else if (!product) {
      document.title = '404 - Product Not Found | StackShop';
    } else {
      document.title = `${product.title} | StackShop`;
    }
  }, [loading, product]);

  useEffect(() => {
    // we used to pass the entire product object via the query string which made
    // URLs enormous and breaking when the user refreshed or shared them.  it also
    // opened us up to manipulation (an attacker could craft a URL with arbitrary
    // data).  now we only send the SKU and fetch the canonical record from the
    // server; we still keep the old behaviour as a fallback for existing links.
    const fetchBySku = async (sku: string) => {
      try {
        const res = await fetch(`/api/products/${encodeURIComponent(sku)}`);
        if (!res.ok) throw new Error('product not found');
        const data = await res.json();
        setProduct(data as Product);
      } catch (err) {
        console.error(err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (skuParam) {
      fetchBySku(skuParam);
    } else if (productParam) {
      try {
        const parsedProduct = JSON.parse(productParam);
        setProduct(parsedProduct);
      } catch (error) {
        console.error('Failed to parse product data:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [skuParam, productParam]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </Link>
          <Card className="p-8">
            <p className="text-center text-muted-foreground">Product not found</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* breadcrumb navigation */}
        <nav className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          {product && (
            <>
              <span>/</span>
              <button
                onClick={() => router.push(`/?category=${encodeURIComponent(product.categoryName)}`)}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                {product.categoryName}
              </button>
              <span>/</span>
              <span className="text-foreground font-medium">{product.subCategoryName}</span>
            </>
          )}
        </nav>

        {/* back button */}
        <button
          onClick={handleBack}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            {/* plain container with controlled aspect ratio and no padding */}
          <div className="overflow-hidden">
            <div className="relative w-full aspect-video bg-white group">
              {product.imageUrls[selectedImage] && (
                <Image
                  src={product.imageUrls[selectedImage]}
                  alt={product.title}
                  fill
                  className="object-contain transition-transform duration-200 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              )}
            </div>
          </div>

            {product.imageUrls.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.imageUrls.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedImage(idx);
                      }
                    }}
                    className="relative h-20 rounded-lg overflow-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2 outline-none"
                    style={{
                      border: selectedImage === idx ? '2px solid var(--primary)' : '1px solid transparent',
                    }}
                    aria-label={`Product image ${idx + 1}`}
                    aria-current={selectedImage === idx ? 'true' : 'false'}
                  >
                    <Image
                      src={url}
                      alt={`${product.title} - Image ${idx + 1}`}
                      fill
                      className="object-contain p-2"
                      sizes="100px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex gap-2 mb-2">
                <Badge variant="secondary">{product.categoryName}</Badge>
                <Badge variant="outline">{product.subCategoryName}</Badge>
              </div>
              <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
              <p className="text-sm text-muted-foreground">SKU: {product.retailerSku}</p>
            </div>

            {product.featureBullets.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-lg font-semibold mb-3">Features</h2>
                  <ul className="space-y-2">
                    {product.featureBullets.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <Button
              onClick={handleAddToCart}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 text-base font-semibold"
            >
              Add to Cart
            </Button>
          </div>
        </div>

        {/* Continue shopping button */}
        <div className="mt-8 pt-8 border-t">
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              Continue Shopping
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ProductPage() {
  return <Suspense fallback={<div className="min-h-screen bg-background"><div className="container mx-auto px-4 py-8"><p className="text-center text-muted-foreground">Loading...</p></div></div>}><ProductContent /></Suspense>;
}
