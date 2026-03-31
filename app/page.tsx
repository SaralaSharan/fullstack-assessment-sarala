"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, ArrowUp, ShoppingCart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { CartQuantitySelector } from "@/components/cart-quantity-selector";
import { getCartTotal } from "@/lib/cart";

interface Product {
  stacklineSku: string;
  title: string;
  categoryName: string;
  subCategoryName: string;
  imageUrls: string[];
  retailPrice: number; // Product price
}

function HomeContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    undefined
  );
  const [selectedSubCategory, setSelectedSubCategory] = useState<
    string | undefined
  >(undefined);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [paramsLoaded, setParamsLoaded] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  // Cart badge counter for header
  const [cartTotal, setCartTotal] = useState(0);

  // show back to top button when scrolled
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update cart total when storage changes
  useEffect(() => {
    // Initial load
    setCartTotal(getCartTotal());

    // Listen for storage changes (cart updates from other components)
    const handleStorageChange = () => {
      setCartTotal(getCartTotal());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // set initial filters from URL params
  useEffect(() => {
    const category = searchParams.get('category');
    const subCategory = searchParams.get('subCategory');
    const searchParam = searchParams.get('search');

    if (category) setSelectedCategory(category);
    if (subCategory) setSelectedSubCategory(subCategory);
    if (searchParam) {
      setSearch(searchParam);
      setSearchInput(searchParam);
    }
    setParamsLoaded(true);
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories));
  }, []);

  // restore filters from sessionStorage on mount if no URL params
  useEffect(() => {
    if (paramsLoaded && !searchParams.get('category') && !searchParams.get('subCategory') && !searchParams.get('search')) {
      const savedSearch = sessionStorage.getItem('filterSearch');
      const savedCategory = sessionStorage.getItem('filterCategory');
      const savedSubCategory = sessionStorage.getItem('filterSubCategory');

      if (savedSearch) {
        setSearchInput(savedSearch);
        setSearch(savedSearch);
      }
      if (savedCategory) setSelectedCategory(savedCategory);
      if (savedSubCategory) setSelectedSubCategory(savedSubCategory);
    }
  }, [paramsLoaded, searchParams]);

  useEffect(() => {
    // whenever the category changes we need to reload the sub‑category list from
    // the server and also clear any previously selected sub‑category.  the
    // original implementation requested `/api/subcategories` without a
    // `category` query param, so the service returned *all* subcategories
    // regardless of the parent category.  this made it impossible to filter
    // correctly and could leave a stale sub‑category selected when the user
    // switched categories.
    if (selectedCategory) {
      // clear any previous subcategory immediately so that stale values
      // aren't used during the fetch
      setSelectedSubCategory(undefined);

      fetch(
        `/api/subcategories?category=${encodeURIComponent(
          selectedCategory
        )}`
      )
        .then((res) => {
          if (!res.ok) throw new Error('failed to load subcategories');
          return res.json();
        })
        .then((data) => {
          setSubCategories(data.subCategories);
        })
        .catch((err) => {
          console.error(err);
          setSubCategories([]);
        });
    } else {
      setSubCategories([]);
      setSelectedSubCategory(undefined);
    }
  }, [selectedCategory]);

  const router = useRouter();

  // debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    // trim and limit length to prevent abuse
    const sanitized = value.trim().slice(0, 100);
    setSearchInput(value);

    // clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // set new timeout for debounced search (300ms)
    searchTimeoutRef.current = setTimeout(() => {
      setSearch(sanitized);
    }, 300);
  }, []);

  // cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // replace the products list; otherwise append to it.
  const fetchProducts = async (
    fetchOffset: number,
    initialLoad: boolean = true
  ) => {
    if (initialLoad) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (selectedCategory) params.append("category", selectedCategory);
    if (selectedSubCategory) params.append("subCategory", selectedSubCategory);
    params.append("limit", "20");
    params.append("offset", String(fetchOffset));

    try {
      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) throw new Error('product request failed');
      const data = await res.json();

      setTotalCount(data.total ?? data.products.length);

      if (initialLoad) {
        setProducts(data.products);
        setOffset(20);
        setHasMore(data.products.length === 20 && (data.total ?? 0) > 20);
      } else {
        setProducts((prev) => [...prev, ...data.products]);
        // update offset for next load
        setOffset((prev) => prev + 20);
        // check if there are more products to load
        setHasMore(
          data.products.length === 20 &&
            fetchOffset + 20 < (data.total ?? 0)
        );
      }
    } catch (err) {
      console.error(err);
      if (initialLoad) {
        setProducts([]);
        setTotalCount(0);
      }
    } finally {
      if (initialLoad) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  // when filters change, reset and fetch from the beginning
  useEffect(() => {
    if (paramsLoaded) {
      setOffset(0);
      setProducts([]);
      setHasMore(true);
      fetchProducts(0, true);
    }
  }, [search, selectedCategory, selectedSubCategory, paramsLoaded]);

  // intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      // if sentinel is visible and we have more products to load
      if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
        fetchProducts(offset, false);
      }
    });

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
    };
  }, [hasMore, loadingMore, loading, offset]);


  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-4xl font-bold">StackShop</h1>
            {/* Cart Button with Badge */}
            <Link href="/cart">
              <Button
                variant="outline"
                className="relative h-10 w-10 p-0 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                aria-label={`Cart with ${cartTotal} ${cartTotal === 1 ? 'item' : 'items'}`}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartTotal > 0 && (
                  <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center">
                    {cartTotal > 99 ? '99+' : cartTotal}
                  </span>
                )}
              </Button>
            </Link>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                maxLength={100}
                className="pl-10 pr-10 hover:ring-2 hover:ring-primary focus:ring-2 focus:ring-primary"
              />
              {searchInput && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <Select
              value={selectedCategory}
              onValueChange={(value) => setSelectedCategory(value || undefined)}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedCategory && subCategories.length > 0 && (
              <Select
                value={selectedSubCategory}
                onValueChange={(value) =>
                  setSelectedSubCategory(value || undefined)
                }
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Subcategories" />
                </SelectTrigger>
                <SelectContent>
                  {subCategories.map((subCat) => (
                    <SelectItem key={subCat} value={subCat}>
                      {subCat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {(search || selectedCategory || selectedSubCategory) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setSearchInput("");
                  setSelectedCategory(undefined);
                  setSelectedSubCategory(undefined);
                }}
                className="transition-colors hover:bg-destructive hover:text-destructive-foreground"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search terms or filters to find what you&apos;re looking for.
              </p>
              {(search || selectedCategory || selectedSubCategory) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setSearchInput("");
                    setSelectedCategory(undefined);
                    setSelectedSubCategory(undefined);
                  }}
                >
                  Clear all filters
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Active filters display */}
            {(search || selectedCategory || selectedSubCategory) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {search && (
                  <Badge variant="default" className="flex items-center gap-1">
                    Search: {search}
                    <button
                      onClick={() => {
                        setSearch("");
                        setSearchInput("");
                      }}
                      className="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5"
                      aria-label="Remove search filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedCategory && (
                  <Badge variant="default" className="flex items-center gap-1">
                    Category: {selectedCategory}
                    <button
                      onClick={() => setSelectedCategory(undefined)}
                      className="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5"
                      aria-label="Remove category filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedSubCategory && (
                  <Badge variant="default" className="flex items-center gap-1">
                    Subcategory: {selectedSubCategory}
                    <button
                      onClick={() => setSelectedSubCategory(undefined)}
                      className="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5"
                      aria-label="Remove subcategory filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}

            <p className="text-sm text-muted-foreground mb-4">
              Showing {products.length} of {totalCount > 0 ? totalCount : products.length} products
              {hasMore && ' • Scroll to load more'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                  <Card
                    key={product.stacklineSku}
                    className="h-full flex flex-col justify-between hover:scale-[1.02] hover:shadow-lg transition-all duration-200 ease-in-out cursor-pointer focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg outline-none border-0 shadow-sm"
                    onClick={() => {
                      // save current filter state before navigating
                      sessionStorage.setItem('filterSearch', search);
                      sessionStorage.setItem('filterCategory', selectedCategory || '');
                      sessionStorage.setItem('filterSubCategory', selectedSubCategory || '');
                      router.push(
                        `/product?sku=${encodeURIComponent(
                          product.stacklineSku
                        )}`
                      );
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        router.push(
                          `/product?sku=${encodeURIComponent(
                            product.stacklineSku
                          )}`
                        );
                      }
                    }}
                    tabIndex={0}
                    role="button"
                  >
                  <CardHeader className="p-0">
                    <div className="relative h-48 w-full overflow-hidden rounded-t-lg bg-muted">
                      {product.imageUrls[0] && (
                        <Image
                          src={product.imageUrls[0]}
                          alt={product.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <CardTitle className="text-base line-clamp-2 mb-2">
                      {product.title}
                    </CardTitle>
                    <CardDescription className="flex gap-2 flex-wrap mb-3">
                      <Badge variant="secondary">{product.categoryName}</Badge>
                      <Badge variant="outline">{product.subCategoryName}</Badge>
                    </CardDescription>
                    {/* Price Display */}
                    <div className="text-lg font-bold text-primary">
                      ${product.retailPrice.toFixed(2)}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4">
                    {/* Cart Quantity Selector - only handles cart operations */}
                    <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                    <CartQuantitySelector
                      stacklineSku={product.stacklineSku}
                      title={product.title}
                      imageUrl={product.imageUrls[0] || '/placeholder.png'}
                      price={product.retailPrice}
                      variant="full-width"
                    />
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
            {/* sentinel element for intersection observer */}
            <div ref={sentinelRef} className="py-8 text-center">
              {loadingMore && (
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-muted-foreground text-sm">Loading more products...</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Back to top button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors duration-200 focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Back to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export default function Home() {
  return <Suspense fallback={<div className="min-h-screen bg-background"><div className="container mx-auto px-4 py-8"><p className="text-center text-muted-foreground">Loading...</p></div></div>}><HomeContent /></Suspense>;
}
