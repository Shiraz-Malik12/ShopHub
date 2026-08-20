import { Link } from 'react-router-dom'
import { Button } from 'antd'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-center">
      <h1 className="text-6xl font-bold text-indigo-400">404</h1>
      <p className="mt-2 text-slate-400">Page not found</p>
      <Link to="/" className="mt-6">
        <Button type="primary">Go home</Button>
      </Link>
    </div>
  )
}
