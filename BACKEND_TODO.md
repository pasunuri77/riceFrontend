# Backend TODO — RiceBazaar

Everything below is real, outstanding backend work identified while building the frontend. None of it has been faked or worked around client-side — where a feature needed one of these and didn't have it, the frontend either shows only real data (omitting what it can't get) or doesn't build the feature at all. This list is the reason why.

---

## 🟠 High — Deleting a product with existing orders OR reviews crashes (500) instead of a clean error

`ProductService.delete()` (line 109-115) calls `productRepository.deleteById(id)` unconditionally. **Two separate foreign keys** can block this at the database level, independently of each other:
- `OrderItem.product` (`order_items.product_id`) - blocks if the product has ever been ordered.
- `Review.product` (`reviews.product_id`, `Review.java:21-23`) - blocks if the product has any review, **even though the Reviews feature was removed from the frontend UI** - the table and its data (e.g. from earlier testing) still exist and still enforce this constraint.

Either one throws an unhandled DB constraint-violation exception on delete - surfaces as a raw `500`, which (via the existing frontend safety net for the JwtAuthFilter bug) gets misreported to the admin as "session expired" instead of the real reason. Confirmed live: deleting a product's orders alone did **not** fix its delete - the leftover review rows were still blocking it.

**Fix - check both, return a clean `400`:**
```java
@Transactional
public void delete(String id) {
    if (!productRepository.existsById(id)) {
        throw ApiException.notFound("Product not found");
    }
    if (orderItemRepository.existsByProductId(id)) {
        throw ApiException.badRequest("This product has existing orders and can't be deleted. Set it to Inactive instead.");
    }
    if (reviewRepository.existsByProductId(id)) {
        throw ApiException.badRequest("This product has existing reviews and can't be deleted. Set it to Inactive instead.");
    }
    productRepository.deleteById(id);
}
```
(needs `existsByProductId(String productId)` added to both `OrderItemRepository` and `ReviewRepository` - `ReviewRepository` already exists and is injected elsewhere (`ProductService` already has `reviewRepository` for the review-count lookup in `toResponse()`); just needs `OrderItemRepository` added)

**Immediate unblock without a code change:** ask whoever has DB access to run `DELETE FROM reviews WHERE product_id = '<id>';` for the specific product - that clears the second constraint. Frontend already has an Active/Inactive status toggle on every product as the real long-term alternative to deletion.

---

## 🟢 Low — Unauthenticated requests return a bare 403 instead of a proper 401

`SecurityConfig.java` never configures `httpBasic()`, `formLogin()`, or a custom `AuthenticationEntryPoint`, so Spring Security's default fallback for "no valid authentication" on a protected endpoint is `Http403ForbiddenEntryPoint` - an empty-body `403`. Confirmed live: an anonymous `PATCH /api/users/me` and `GET /api/orders` (no Authorization header at all) both return `403` with `Content-Length: 0`, indistinguishable from a real permissions problem. This made a stale-session issue (user's token no longer valid) look identical to an authorization bug when debugging from the Network tab - genuinely unauthenticated requests should return a clean `401` with a JSON message.

**Fix:** add a custom `AuthenticationEntryPoint` bean (`.exceptionHandling(ex -> ex.authenticationEntryPoint((req, res, e) -> { res.setStatus(401); res.setContentType("application/json"); res.getWriter().write("{\"message\":\"Authentication required\"}"); }))`) so missing/invalid auth reliably surfaces as `401`, matching what `client.js` already expects and handles.

---

## 🟡 Medium — Store logo has nowhere to persist

Admin Settings' "Store Information" tab now has a real, working logo upload (clicking the logo or "Upload Logo" uploads to Cloudinary via the existing `/api/admin/products/upload-image` endpoint and shows the result immediately), but `StoreSettings` (`StoreSettings.java`) has no `logo` column at all - so the uploaded URL only lives in the browser's local state and is lost on reload. The frontend already sends `logo` in every `PATCH /api/admin/settings` call in anticipation of this; Jackson currently just silently drops the unknown field.

**Add:**
- `StoreSettings.java`: `private String logo;` (nullable String column, same as `phone`/`email`)
- `StoreSettingsRequest.java` / `StoreSettingsResponse.java`: add `logo` field
- `StoreSettingsService.java`: `settings.setLogo(request.getLogo())` in `update()`, `.logo(settings.getLogo())` in `toResponse()`

No new upload endpoint needed - the Cloudinary piece is already done and working, this is purely "give the URL somewhere to live." Once this lands, the logo will persist automatically with zero frontend changes.

---

## 🟡 Medium — Product update/create crashes (500) instead of validating on an over-length `image` URL

Suspected root cause (not yet confirmed from a server log, but strongly indicated): `Product.image` (`Product.java`) has no explicit `@Column(length = ...)`, so Hibernate defaults it to `VARCHAR(255)`. A user pasted a Google `imgres?q=...&imgurl=...` link (300-600+ chars, since it embeds the full original image URL as an encoded query param) into the Admin product form's image field, saved, and got an unhandled `500` back - almost certainly a Postgres "value too long for type character varying(255)" error propagating uncaught.

**Fix:** either widen the column (`@Column(columnDefinition = "text")`, matching how `description` is already handled) or add explicit `@Size(max = 255)` bean validation on `ProductRequest.image` so an over-length value returns a clean `400` instead of crashing. The `description` field already sets `columnDefinition = "text"` for exactly this reason - `image` doesn't have the same treatment.

Frontend side: this also isn't a real image URL to begin with (a Google search-results wrapper page, not the picture) - user has been told to use a direct image URL or the new upload endpoint instead - but the server shouldn't be crashable by bad input either way.

---

## 🔴 URGENT — Product image upload endpoint missing (Cloudinary only wired for avatars)

Cloudinary is already integrated and working (`CloudinaryService.java`) but only reachable via `POST /api/users/me/avatar` (`UserController.java:30`) for a user's own profile picture. There's no equivalent for products, so admin dropping/selecting a local image file for a product has nowhere to send it - the frontend correctly refuses to fake an upload (a local `blob:` URL would break for every other viewer), so it just shows a temporary local-only preview and the product ends up with no real image.

**Add, reusing the existing `CloudinaryService` - no new upload logic needed:**

```java
// ProductController.java
@PostMapping(value = "/api/admin/products/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public Map<String, String> uploadImage(@RequestParam("file") MultipartFile file) {
    String url = cloudinaryService.upload(file);
    return Map.of("url", url);
}
```

(inject `CloudinaryService` into `ProductController` the same way `UserController` does; route falls under `/api/admin/**` so it's already `hasRole("ADMIN")`-gated by the existing `SecurityConfig` rule)

Once this exists, `ImageDropzone.jsx` will be switched from "local preview only" to actually POSTing the dropped file and using the returned URL - that's a small frontend change, ready to go the moment this endpoint responds.

---

## 🔴 URGENT BUG — Pincode serviceability check can never succeed

Found while wiring the frontend up to the new `DeliveryController`/`AdminDeliveryController` endpoints (good work building these - the frontend now calls all of them). There's a regex bug that makes the whole feature non-functional regardless of data:

**File:** `src/main/java/com/rice/service/DeliveryService.java`, both `isServiceable` (line 16) and `addPincodes` (line 30):

```java
if (!normalized.matches("\\\\d{6}")) return false;
```

That Java string literal `"\\\\d{6}"` decodes to the actual regex `\\d{6}` (two literal backslash characters, not a digit-shorthand `\d`). As a regex, that matches a literal backslash followed by six `d` characters - something like `\dddddd` - which no real pincode will ever look like. Net effect: `isServiceable` always returns `false` for every pincode (the frontend's new "We deliver to this area" check will never show as serviceable), and `addPincodes` silently filters out every pincode you try to add via the admin panel (adds nothing, no error, just an empty result).

**Fix** - single backslash in each spot, so the compiled regex is the intended `\d{6}`:
```java
if (!normalized.matches("\\d{6}")) return false;
```
(same fix in `addPincodes`, line 30)

**Also worth a look:** `GET /api/delivery/check` isn't in `SecurityConfig`'s `permitAll()` list, so it currently requires a logged-in user (confirmed live - returns `403` without a token). That's probably fine since address entry in this app always happens post-login, but flagging in case guest checkout is ever added later.

---

## ✅ DONE — Independent stock per bag size

Resolved: `Product` now has real independent columns (`stock1Kg`, `stock5Kg`, `stock10Kg`, `stock50Kg`), set directly and un-derived in `ProductService.apply()`, with the old flat `stock` field kept as an auto-computed total (`computeTotalStock`) for backward-compat sorting/display only. Frontend switched over: the Add/Edit Product form now has three fully independent inputs (no cross-calculation, no shared pool), and both the admin product list and the storefront's "Available: N bags" read the real per-size value directly. Note `stock50Kg` exists on the backend but isn't offered in the frontend's bag-size picker yet (UI only supports 1/5/10kg) - can wire up if 50kg bags are ever sold.

---

## 🔴 URGENT BUG — JwtAuthFilter crashes when a token's account no longer exists

**This one's already causing real crashes** — happened live after switching to the shared Aiven DB, but it'll happen for anyone whenever a logged-in user's account is deleted while their JWT is still valid (also just from token expiry edge cases).

**File:** `src/main/java/com/rice/security/JwtAuthFilter.java`, line 48:

```java
UserDetails userDetails = userDetailsService.loadUserByUsername(email);
```

`AppUserDetailsService.loadUserByUsername` throws `UsernameNotFoundException` when the email has no matching row (`AppUserDetailsService.java:20`). That call isn't wrapped in a try/catch, so the exception escapes the filter uncaught — it bypasses Spring Security's normal 401 handling entirely and depending on the endpoint surfaces as either an unhandled `500` (confirmed via a real stack trace in the server log) or a `403` (confirmed live on `permitAll` endpoints like `GET /api/products`). It should just be a clean `401`.

Real stack trace this produced:
```
org.springframework.security.core.userdetails.UsernameNotFoundException: No user with email admin@ricebazaar.in
    at com.rice.security.AppUserDetailsService.lambda$loadUserByUsername$0(AppUserDetailsService.java:20)
    at com.rice.security.JwtAuthFilter.doFilterInternal(JwtAuthFilter.java:48)
```

**Fix — wrap the lookup the same way the token-extraction line right above it already is:**

```java
String token = authHeader.substring(7);
String email;
try {
    email = jwtService.extractEmail(token);
} catch (Exception e) {
    filterChain.doFilter(request, response);
    return;
}

if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
    UserDetails userDetails;
    try {
        userDetails = userDetailsService.loadUserByUsername(email);
    } catch (UsernameNotFoundException e) {
        filterChain.doFilter(request, response);
        return;
    }
    if (jwtService.isTokenValid(token, userDetails) && userDetails.isAccountNonLocked()) {
        var authToken = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authToken);
    }
}
```

That makes a request from a deleted/nonexistent user's token fall through as unauthenticated (same as no token at all), so Spring Security's own `.anyRequest().authenticated()` rule correctly rejects it with a real `401` — and consistently, on every endpoint, not sometimes-403-sometimes-500.

I've added a frontend workaround (`client.js` now also force-logs-out on a `500` while holding a token) but it can't safely cover the `403` case too, since `403` is legitimately used elsewhere for "logged in but not allowed" — treating every `403` as a dead session would break that. This backend fix is the only way to make it consistent.

---

## ✅ DONE — Order Delivery Tracking (deliveredAt)

Resolved: `Order` now has `deliveredAt`/`estimatedDeliveryDate`/`delayFlag`/`deliveryRemarks`, with `deliveredAt` auto-set the moment `deliveryStatus` transitions to `DELIVERED` (`OrderService.updateDeliveryStatus`), and `PATCH /api/admin/orders/{id}/delivery-info` exists for setting the latter two. Frontend switched over: [Orders.jsx](../src/pages/User/Orders.jsx) (My Orders list), [OrderDetail.jsx](../src/pages/User/OrderDetail.jsx), and [Admin/Orders.jsx](../src/pages/Admin/Orders.jsx) (table column + detail modal) all now show a real "Delivered On" date once an order is delivered, replacing "Estimated Delivery" at that point instead of showing `--`.

**Not yet built on the frontend** (real backend capability, just no UI for it yet): an admin way to actually *set* `estimatedDeliveryDate`/`deliveryRemarks` via that `delivery-info` endpoint, and nowhere shows the `delayFlag` (e.g. a "Delivered Late" badge when `deliveredAt` is after `estimatedDeliveryDate`). Worth building if you want admins to manage delivery estimates instead of the frontend's own guessed 4-day formula.

---

## ✅ DONE — Order Price Snapshot

Resolved: `Order` now stores real `subtotal`/`tax`/`deliveryCharge`/`offerDiscount` alongside `discountAmount`/`amount`, computed and persisted at order-creation time (`OrderService.create()`), and `OrderResponse.ItemResponse.pricePerKg` is exposed too. Frontend switched over: [OrderDetail.jsx](../src/pages/User/OrderDetail.jsx)'s Price Breakdown now shows the real Subtotal/Offer Discount/Coupon Discount/Delivery/Tax lines instead of just the final total.

---

## 🟠 High — Today's Offers (homepage)

Right now "Today's Offers" is driven entirely by whether a product has `"Limited Offer"` in its `badges` list — real data, but no ordering control and no scheduling.

**Add to `Product`:**
- `showInTodaysOffers` (boolean, default false)
- `displayPriority` (int, default 0)
- `offerEndDate` (Instant, nullable)
- `lowStockThreshold` (int, nullable, optional) — lets admin override the low-stock cutoff per product instead of a hardcoded frontend number (currently 100 everywhere, unified but still just a guess)

**New endpoint:**
- `GET /api/products/todays-offers` — public, returns products where `showInTodaysOffers = true` and (`offerEndDate` is null or in the future), ordered by `displayPriority ASC`

**Scheduled job:** hourly, find products where `showInTodaysOffers = true` and `offerEndDate < now`, set `showInTodaysOffers = false`.

**Admin endpoints:** `PATCH /api/admin/products/{id}/offer` to set the three fields above; `PATCH /api/admin/products/reorder` accepting an ordered list of product ids to persist drag-and-drop priority in one call.

---

## 🟡 Medium — Pincode Serviceability

The Checkout "Change Address" pincode Check button currently only validates it's a real 6-digit number — it can't say whether we actually deliver there, because there's no service-area data anywhere in the backend.

**Add one of:**
- A `serviceable_pincodes` table + `GET /api/delivery/check?pincode=XXXXXX` endpoint, or
- A simpler rule exposed via config (e.g. "we deliver anywhere in Telangana")

---

## 🟢 Low / Future — Product Analytics

No tracking exists for product views, add-to-cart, or purchase counts per product — would support an admin analytics view for promoted products.

- `ProductEvent` table: `productId`, `type` (VIEW / ADD_TO_CART / PURCHASE), `createdAt`
- `POST /api/products/{id}/events` for the frontend to log a view/add-to-cart
- Purchase events derived from existing order creation
- `GET /api/admin/products/{id}/analytics` to aggregate counts

---

*Once any of these land, tell me which one — the corresponding frontend UI is already built and waiting to switch from "not shown" to real data. No design/rework needed on my end for most of these.*
