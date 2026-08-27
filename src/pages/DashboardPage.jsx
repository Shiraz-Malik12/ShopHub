import { useEffect, useState } from 'react'
import { Tag, Spin, Empty } from 'antd'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { fetchCategories } from '../api/categoryApi'

// Placeholder protected page — proves ProtectedRoute + AuthContext work
// end-to-end. Future account/order features will grow from here.
export default function DashboardPage() {
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // GET /api/categories is public (no admin check) — this just proves
    // the customer-facing read path end-to-end. There's no storefront yet
    // to click through to, so it's shown here rather than on its own page.
    fetchCategories()
      .then(({ data }) => setCategories(data.categories))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-slate-100">My account</h1>
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Name</p>
          <p className="text-slate-100">{user?.name}</p>
          <p className="mt-4 text-sm text-slate-400">Email</p>
          <p className="text-slate-100">{user?.email}</p>
        </div>

        <h2 className="mt-10 text-lg font-semibold text-slate-100">Shop by category</h2>
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-6">
          {loading ? (
            <Spin />
          ) : categories.length === 0 ? (
            <Empty description="No categories available yet" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Tag key={category._id} color="indigo" className="px-3 py-1 text-sm">
                  {category.name}
                </Tag>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
