import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

// Placeholder protected page — proves ProtectedRoute + AuthContext work
// end-to-end. Future account/order features will grow from here.
export default function DashboardPage() {
  const { user } = useAuth()

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
      </main>
    </div>
  )
}
