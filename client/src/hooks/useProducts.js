/**
 * hooks/useProducts.js
 * ─────────────────────────────────────────────────────────────────────────────
 * TanStack Query (React Query) hooks for all server-state data fetching.
 * These work alongside Redux (client-state) for clean separation of concerns.
 */
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useSelector }  from "react-redux";
import { selectToken }  from "../store/slices/wishlistUserSlice";
import toast            from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─── Fetch Helpers ────────────────────────────────────────────────────────────
async function apiFetch(path, token = null, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Request failed: ${res.status}`);
  return data;
}

// ─── Query Key Factory ────────────────────────────────────────────────────────
export const queryKeys = {
  products:        (filters) => ["products", filters],
  product:         (slug)    => ["product",  slug],
  featuredProducts:            ["products", "featured"],
  adminProducts:   (page)    => ["admin-products", page],
  orders:                      ["orders", "my"],
  adminOrders:     (filters) => ["admin-orders", filters],
  me:                          ["user", "me"],
};

// ─── Products ─────────────────────────────────────────────────────────────────

/**
 * Debounced product listing with full filter support.
 * @param {Object} filters - { category, search, minPrice, maxPrice, sort, page, limit, featured }
 */
export function useProducts(filters = {}) {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== "" && v !== null)
  ).toString();

  return useQuery({
    queryKey: queryKeys.products(filters),
    queryFn:  () => apiFetch(`/products${params ? `?${params}` : ""}`),
    staleTime: 2 * 60 * 1000,   // 2 min
    placeholderData: (prev) => prev,
  });
}

/** Infinite scroll version of product listing. */
export function useInfiniteProducts(filters = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.products({ ...filters, infinite: true }),
    queryFn:  ({ pageParam = 1 }) => {
      const p = new URLSearchParams({ ...filters, page: pageParam }).toString();
      return apiFetch(`/products?${p}`);
    },
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages
        ? last.pagination.page + 1
        : undefined,
  });
}

/** Single product by slug. */
export function useProduct(slug) {
  return useQuery({
    queryKey: queryKeys.product(slug),
    queryFn:  () => apiFetch(`/products/${slug}`),
    enabled:  !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

/** Featured products for homepage. */
export function useFeaturedProducts() {
  return useQuery({
    queryKey: queryKeys.featuredProducts,
    queryFn:  () => apiFetch("/products?featured=true&limit=8&sort=-createdAt"),
    staleTime: 10 * 60 * 1000,
  });
}

// ─── Admin Products ───────────────────────────────────────────────────────────
export function useAdminProducts(page = 1) {
  const token = useSelector(selectToken);
  return useQuery({
    queryKey: queryKeys.adminProducts(page),
    queryFn:  () => apiFetch(`/products/admin?page=${page}&limit=20&includeInactive=true`, token),
    enabled:  !!token,
  });
}

export function useDeleteProduct() {
  const token        = useSelector(selectToken);
  const queryClient  = useQueryClient();

  return useMutation({
    mutationFn: (productId) =>
      apiFetch(`/products/admin/${productId}`, token, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted.");
    },
    onError: (err) => toast.error(err.message),
  });
}

// ─── Orders ───────────────────────────────────────────────────────────────────

/** Current user's order history. */
export function useMyOrders() {
  const token = useSelector(selectToken);
  return useQuery({
    queryKey: queryKeys.orders,
    queryFn:  () => apiFetch("/orders/my-orders", token),
    enabled:  !!token,
    staleTime: 30 * 1000,
  });
}

/** Admin — all orders with filters. */
export function useAdminOrders(filters = {}) {
  const token  = useSelector(selectToken);
  const params = new URLSearchParams(filters).toString();

  return useQuery({
    queryKey: queryKeys.adminOrders(filters),
    queryFn:  () => apiFetch(`/orders/admin/all${params ? `?${params}` : ""}`, token),
    enabled:  !!token,
    staleTime: 20 * 1000,
    refetchInterval: 60 * 1000, // auto-refresh every 60s
  });
}

export function useUpdateOrderStatus() {
  const token       = useSelector(selectToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, ...body }) =>
      apiFetch(`/orders/${orderId}/status`, token, {
        method: "PATCH",
        body:   JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order status updated! 📦");
    },
    onError: (err) => toast.error(err.message),
  });
}

// ─── Reviews ─────────────────────────────────────────────────────────────────
export function useAddReview(productSlug) {
  const token       = useSelector(selectToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, rating, comment }) =>
      apiFetch(`/products/${productId}/reviews`, token, {
        method: "POST",
        body:   JSON.stringify({ rating, comment }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.product(productSlug) });
      toast.success("Review submitted! 🌿");
    },
    onError: (err) => toast.error(err.message),
  });
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export function useMe() {
  const token = useSelector(selectToken);
  return useQuery({
    queryKey: queryKeys.me,
    queryFn:  () => apiFetch("/auth/me", token),
    enabled:  !!token,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Wishlist server sync ─────────────────────────────────────────────────────
export function useSyncWishlist() {
  const token = useSelector(selectToken);

  return useMutation({
    mutationFn: (productIds) =>
      apiFetch("/auth/wishlist/sync", token, {
        method: "POST",
        body:   JSON.stringify({ productIds }),
      }),
  });
}
