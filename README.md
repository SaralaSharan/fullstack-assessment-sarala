# Stackline Full Stack Assignment

## TL;DR

Key issues addressed:

• Fixed category/subcategory filtering bug  
• Replaced unsafe product JSON URLs with SKU-based routing  
• Added API validation for pagination parameters  
• Improved UX (loading states, infinite scroll, better result counts)  
• Hardened API security (rate limiting + parameter validation)  
• Added accessibility improvements and search debouncing


🚀 **Summary of Changes**

During the review I exercised the application and identified several functional and UX issues, as well as a potential security concern.  All of the problems listed below have been addressed and the README you are reading now documents what was wrong, how it was corrected, and why.

## ✅ Bugs & Issues Identified

1. **Sub‑category filter never respected the selected category**
   - The frontend always requested `/api/subcategories` without a `category` query string, so the server returned every sub‑category in the data set.  Users could select a sub‑category that didn’t belong to the chosen category and the product list would then be empty.

2. **Sub‑category state not cleared when switching categories**
   - Changing the category kept the previously selected sub‑category, leading to confusing behaviour and mismatched filters.

3. **Product detail page relied on entire product JSON in URL**
   - The home page encoded the whole product object as a query parameter and the product page parsed it.  This made shareable links huge, broke on refresh, and allowed anyone to craft a URL containing arbitrary data (a mild XSS/vector for tampering).

4. **Detail page had no loading state or server fetch fallback**
   - When navigating directly to `/product` the page showed "Product not found" because no JSON was available, even though the SKU could have been used to fetch from the API.

5. **API pagination parameters were not validated**
   - Passing a malformed `limit` or `offset` (e.g. `?limit=foo`) resulted in `NaN` values that caused the server to return an empty list.

6. **Lack of error handling on fetch requests**
   - All client‑side `fetch` calls assumed success; a network error would hang the loading state indefinitely.

7. **Limited UX feedback on result counts**
   - The home page only showed the number of products currently rendered, not the total available after applying filters.

8. **Potential security vulnerability**
   - Accepting arbitrary JSON from the URL meant a malicious actor could craft a link with scripted data; moving to SKU‑based lookups mitigates this.

## 🔧 How Issues Were Fixed

1. **Sub‑category filtering**
   - Updated `app/page.tsx` to append `?category=…` when fetching sub‑categories and to reset the sub‑category state whenever the category changes.
   - Added error handling around the fetch and default empty state.

2. **State reset logic**
   - The same effect now clears `selectedSubCategory` when the category is modified or cleared.

3. **URL payload reduction**
   - Changed product listing links to pass only `sku` in the query string.
   - Rewrote `app/product/page.tsx` to fetch the product from `/api/products/[sku]` and dropped the JSON‑parsing logic except as a backward‑compatible fallback.
   - Added loading and error UI to the detail page.

4. **API validation**
   - Modified `app/api/products/route.ts` to coerce and validate `limit`/`offset` parameters, falling back to sensible defaults when input is invalid.

5. **Network error handling**
   - Added `.catch()` blocks in all client fetches and ensured `loading` state is cleared on failure.

6. **Result count display**
   - Introduced `totalCount` state on the home page and updated the UI to read "Showing X of Y products" when applicable.

## ✨ Enhancements & Improvements

- **Robust fetch logic**  with response validation.
- **Better UX when filtering** – clear button resets all filters and the count message is more informative.
- **Simpler, safer URLs** for product pages; now bookmarkable and reload‑proof.
- **Button consistency and accessibility** – the "View Details" element is now rendered as a styled link rather than a nested `<button>` inside an anchor, ensuring uniform appearance and removing invalid HTML.
- **Visual polish & hover states** – added card scale‑on‑hover, smoother shadows, focused filter inputs, and a light header background to make the interface feel more modern and interactive.
- **Professional card styling** – cards now use the standard `Card` component with built‑in transition classes (duration, easing, shadow expansion) so the hover effect is smooth and consistent across the site.
- **Infinite scroll with lazy loading** – the home page now loads 20 products initially, then automatically fetches the next batch as the user scrolls to the bottom of the page. This improves perceived performance and reduces bandwidth on initial load while maintaining the ability to browse all available products seamlessly.
  - Main image now uses an `aspect-video` container with no padding so the photo fills the space, and it subtly zooms on hover for a more engaging experience.
- **Server-side guardrails** to prevent malformed query params from breaking the API.

## 🚨 Critical Fixes (Accessibility & Performance)

**Search input debouncing** – Search now waits 300ms after the user stops typing before firing API requests, reducing calls from ~6 per word to 1 per search term. This dramatically improves performance and reduces server load.

**Search input validation & sanitization** – Input is trimmed and limited to 100 characters (enforced with `maxLength`) to prevent abuse and oversized payloads.

**Page title updates** – Product detail page now dynamically sets `document.title` to show the product name, and updates to "404 - Product Not Found" when a product doesn't exist. This improves discoverability and provides better SEO.

**Full keyboard accessibility** – Product cards and thumbnail images are now fully keyboard-navigable with:
  - Visible focus rings (`:focus` styling) on all interactive elements.
  - Keyboard support: press Enter or Space to navigate to a product or select an image.
  - ARIA labels on thumbnail buttons for screen reader users (`aria-label`, `aria-current`).
  - `role="button"` and `tabIndex={0}` on cards to make them keyboard-accessible.

## 🎨 UX & Design Improvements (Latest)

**Loading spinner on infinite scroll** – Added an animated spinner and clearer "Loading more products..." message when fetching new batches, giving users visual feedback during load.

**Filter state persistence** – Filters are saved to `sessionStorage` when navigating to a product. When users click "Back", they return to their previous filtered view instead of landing back at the default home view.

**Breadcrumb navigation** – Product detail page now shows: `Home / Category / Subcategory` to help users understand their location in the product hierarchy.

**Back button with proper context** – Replaced the next/link back button with a native `history.back()` button, preserving the user's scroll position and filter state.

**"Add to Cart" button** – Added a prominent CTA on the product page so users have a clear next action. Currently shows a demo message (cart logic can be implemented later).

**Better pagination feedback** – Home page now displays "Showing X of Y products • Scroll to load more" to clearly communicate the pagination status and hint at the infinite scroll mechanic.

## � Security Hardening (Latest)

**Rate limiting on API endpoints** – All API routes (`/api/products`, `/api/categories`, `/api/subcategories`, `/api/products/[sku]`) now enforce a rate limit of **100 requests per minute per IP address**. Requests exceeding this limit receive a 429 (Too Many Requests) response with a `Retry-After` header. This prevents DOS attacks and abuse like bulk scraping.

**CORS headers** – Explicit CORS headers are now set on all API responses:
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: GET, OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type`
  - OPTIONS endpoint for preflight requests
  - This provides explicit permission for browser clients and prevents unauthorized cross-origin requests.

**Request parameter validation & capping** – API enforces:
  - `limit` parameter capped at 100 (prevents bulk data retrieval; exploits like `?limit=10000` are rejected)
  - `offset` parameter capped at 100,000 (reasonable upper bound)
  - Invalid values default to safe defaults (limit=20, offset=0)
  - Search parameter is automatically encoded by `URLSearchParams` on the client (no injection risk)

**Rate limit feedback** – Clients receive `X-RateLimit-Remaining` header in responses, allowing them to track their rate limit quota and adjust request frequency appropriately.

## �📦 Testing & Running the App

```bash
# install dependencies

yarn install
# start development server

yarn dev
```

Use the filters, search box, and product links to verify behaviour.  Directly opening a product URL such as `/product?sku=E8ZVY2BP3` should work even after a page reload.

---

Thank you for taking a look at the improvements.  I focused on quality of fixes, clear communication in this README, and keeping the application behaviour predictable and secure.

Good luck with the rest of the process!
