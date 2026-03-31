/**
 * Product recommendation engine
 * Suggests related products based on category and subcategory matching
 */

import { Product } from '@/lib/products';
import productsData from '@/sample-products.json';

/**
 * Gets recommended products for a given product
 * Recommendations are based on:
 * 1. Same category and subcategory (highest relevance)
 * 2. Same category (medium relevance)
 * 3. Limits results to 5 products, excluding the current product
 *
 * @param currentProductSku - SKU of the current product
 * @param limit - Maximum number of recommendations to return (default: 5)
 * @returns Array of recommended products
 */
export function getProductRecommendations(
  currentProductSku: string,
  limit: number = 5
): Product[] {
  const products = productsData as Product[];
  const currentProduct = products.find(p => p.stacklineSku === currentProductSku);

  if (!currentProduct) {
    return [];
  }

  // Score products based on relevance
  const scoredProducts = products
    .filter(product => product.stacklineSku !== currentProductSku) // Exclude current product
    .map(product => {
      let score = 0;

      // Same subcategory (highest relevance) - 100 points
      if (
        product.subCategoryName.toLowerCase() ===
        currentProduct.subCategoryName.toLowerCase()
      ) {
        score += 100;
      }
      // Same category (medium relevance) - 50 points
      else if (
        product.categoryName.toLowerCase() ===
        currentProduct.categoryName.toLowerCase()
      ) {
        score += 50;
      }

      return { product, score };
    })
    .filter(item => item.score > 0) // Only include products with positive scores
    .sort((a, b) => b.score - a.score) // Sort by score descending
    .slice(0, limit) // Limit to specified number
    .map(item => item.product);

  return scoredProducts;
}

/**
 * Gets a recommendation message based on product category
 * Suggests why this product is recommended
 *
 * @param productCategory - Category of the recommended product
 * @param currentProductCategory - Category of the current product
 * @returns Recommendation message
 */
export function getRecommendationReason(
  productCategory: string,
  currentProductCategory: string
): string {
  if (productCategory === currentProductCategory) {
    return 'Similar product';
  }
  return 'From same category';
}
