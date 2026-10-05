import { useEffect, useState } from 'react'
import { Button, Empty, Input, Select, Skeleton } from 'antd'
import { ReloadOutlined, SearchOutlined, WarningOutlined } from '@ant-design/icons'
import { useSearchParams } from 'react-router-dom'
import StoreLayout from '../components/layout/StoreLayout'
import ProductCard from '../components/ProductCard'
import * as productApi from '../api/productApi'
import * as categoryApi from '../api/categoryApi'

const SKELETON_CARDS = 8
const SEARCH_DELAY_MS = 400
const DEFAULT_SORT = 'newest'

// Values must match PRODUCT_SORTS in server/src/controllers/productController.js.
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name: A to Z' },
]

// Customer storefront listing. The backend (GET /api/products) decides what
// is visible and does the searching/filtering/sorting — this page only
// sends the customer's choices and shows what comes back.
export default function ProductsPage() {
  // The filters live in the URL (/products?search=phone&sort=price-asc), so
  // a filtered page can be refreshed, shared, or reached with Back/Forward.
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const sort = searchParams.get('sort') || DEFAULT_SORT
  const hasFilters = Boolean(search || category)

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  // What is currently typed in the search box. It only becomes the real
  // `search` filter after the customer pauses typing (see the effect below).
  const [searchText, setSearchText] = useState(search)

  // Adds, changes or removes one filter in the URL, keeping the others.
  function setFilter(key, value) {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )
  }

  function clearFilters() {
    setSearchText('')
    setSearchParams({}, { replace: true })
  }

  // Keep the search box in step with the URL (e.g. after Back or "Clear filters").
  useEffect(() => {
    setSearchText(search)
  }, [search])

  // Debounce: wait until typing stops for a moment before searching, so we
  // send one request for "iphone" instead of six (i, ip, iph, ...).
  useEffect(() => {
    const trimmed = searchText.trim()
    if (trimmed === search) return
    const timer = setTimeout(() => setFilter('search', trimmed), SEARCH_DELAY_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText])

  // Category list for the dropdown. If it fails the page still works —
  // the dropdown is simply empty.
  useEffect(() => {
    categoryApi
      .fetchCategories()
      .then(({ data }) => setCategories(data.categories))
      .catch(() => setCategories([]))
  }, [])

  // Load products whenever a filter changes (or "Try again" is pressed).
  useEffect(() => {
    // `ignore`: if the filters change again before this request finishes,
    // its (now outdated) answer is thrown away instead of shown.
    let ignore = false

    async function loadProducts() {
      setLoading(true)
      setLoadError(null)
      try {
        const params = {}
        if (search) params.search = search
        if (category) params.category = category
        if (sort !== DEFAULT_SORT) params.sort = sort

        const { data } = await productApi.fetchProducts(params)
        if (ignore) return
        setProducts(data.products)
        setHasLoadedOnce(true)
      } catch (err) {
        if (ignore) return
        setLoadError(err?.response?.data?.message || 'Could not load products. Please try again.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadProducts()
    return () => {
      ignore = true
    }
  }, [search, category, sort, reloadKey])

  const countLabel = `${products.length} ${products.length === 1 ? 'product' : 'products'} ${hasFilters ? 'found' : 'available'}`

  return (
    <StoreLayout>
      <section className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">All products</h1>
          <p className="mt-2 text-slate-400">{!hasLoadedOnce || loadError ? 'Browse our full catalog.' : countLabel}</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Input
              size="large"
              allowClear
              prefix={<SearchOutlined className="text-slate-500" />}
              placeholder="Search products..."
              aria-label="Search products"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              maxLength={100}
              className="sm:flex-1"
            />
            <Select
              size="large"
              allowClear
              placeholder="All categories"
              aria-label="Filter by category"
              value={category || undefined}
              onChange={(value) => setFilter('category', value)}
              options={categories.map((item) => ({ value: item._id, label: item.name }))}
              className="sm:w-52"
            />
            <Select
              size="large"
              aria-label="Sort products"
              value={sort}
              onChange={(value) => setFilter('sort', value === DEFAULT_SORT ? '' : value)}
              options={SORT_OPTIONS}
              className="sm:w-52"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {loading && !hasLoadedOnce ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Loading products...">
            {Array.from({ length: SKELETON_CARDS }, (_, index) => (
              <div key={index} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                <div className="aspect-square animate-pulse bg-slate-800" />
                <div className="p-4">
                  <Skeleton active title={false} paragraph={{ rows: 3 }} />
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="mx-auto max-w-md rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
            <WarningOutlined className="text-3xl text-rose-500" />
            <h2 className="mt-4 text-lg font-semibold text-slate-100">Could not load products</h2>
            <p className="mt-1 text-sm text-slate-400">{loadError}</p>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              className="mt-6"
              onClick={() => setReloadKey((key) => key + 1)}
            >
              Try again
            </Button>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 py-16">
            <Empty description={hasFilters ? 'No products match your search.' : 'No products available.'}>
              {hasFilters && <Button onClick={clearFilters}>Clear filters</Button>}
            </Empty>
          </div>
        ) : (
          // While new results load, the old ones stay visible but dimmed —
          // less jumpy than swapping to placeholders on every keystroke.
          <div
            className={`grid gap-6 transition-opacity sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${loading ? 'opacity-50' : ''}`}
          >
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </StoreLayout>
  )
}
