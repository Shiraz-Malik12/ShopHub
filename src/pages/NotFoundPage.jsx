import { Link } from 'react-router-dom'
import { Button } from 'antd'
import StoreLayout from '../components/layout/StoreLayout'

export default function NotFoundPage() {
  return (
    <StoreLayout>
      <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-400">404 error</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-100">Page not found</h1>
        <p className="mt-3 text-slate-400">Sorry, we could not find the page you are looking for.</p>
        <Link to="/products" className="mt-8">
          <Button type="primary" size="large">Back to shop</Button>
        </Link>
      </div>
    </StoreLayout>
  )
}
