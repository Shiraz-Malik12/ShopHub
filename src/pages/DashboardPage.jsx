import { Avatar, Button, Tag } from 'antd'
import { CheckCircleFilled, FileTextOutlined, RightOutlined, SettingOutlined, ShopOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import StoreLayout from '../components/layout/StoreLayout'
import { useAuth } from '../context/AuthContext'

// The signed-in user's account page. Future account features (orders,
// addresses, profile editing) will be added here.
export default function DashboardPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const quickLinks = [
    { to: '/products', icon: <ShopOutlined />, title: 'Continue shopping', text: 'Browse the full product catalog' },
    { to: '/orders', icon: <FileTextOutlined />, title: 'My orders', text: 'Track and review your orders' },
    ...(isAdmin
      ? [{ to: '/admin/orders', icon: <SettingOutlined />, title: 'Admin dashboard', text: 'Manage orders, products and categories' }]
      : []),
  ]

  return (
    <StoreLayout>
      <section className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">My account</h1>
          <p className="mt-2 text-slate-400">Welcome back, {user?.name}.</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar size={72} style={{ backgroundColor: '#4f46e5', fontSize: 28 }}>
              {user?.name?.[0]?.toUpperCase()}
            </Avatar>
            <h2 className="mt-4 text-lg font-semibold text-slate-100">{user?.name}</h2>
            <p className="text-sm text-slate-400">{user?.email}</p>
            <div className="mt-3 flex gap-2">
              <Tag color={isAdmin ? 'purple' : 'blue'}>{isAdmin ? 'Admin' : 'Customer'}</Tag>
              {user?.isVerified && (
                <Tag icon={<CheckCircleFilled />} color="success">
                  Verified
                </Tag>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 lg:col-span-2">
          <div className="border-b border-slate-800 px-6 py-4">
            <h2 className="font-semibold text-slate-100">Profile details</h2>
          </div>
          <dl className="divide-y divide-slate-800 px-6">
            <div className="grid grid-cols-3 gap-4 py-4 text-sm">
              <dt className="text-slate-400">Full name</dt>
              <dd className="col-span-2 font-medium text-slate-100">{user?.name}</dd>
            </div>
            <div className="grid grid-cols-3 gap-4 py-4 text-sm">
              <dt className="text-slate-400">Email</dt>
              <dd className="col-span-2 font-medium text-slate-100 break-all">{user?.email}</dd>
            </div>
            <div className="grid grid-cols-3 gap-4 py-4 text-sm">
              <dt className="text-slate-400">Account type</dt>
              <dd className="col-span-2 font-medium text-slate-100">{isAdmin ? 'Administrator' : 'Customer'}</dd>
            </div>
          </dl>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-3">
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="group flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-indigo-500/40 hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-lg text-indigo-400">
                {link.icon}
              </span>
              <span className="flex-1">
                <span className="block font-semibold text-slate-100">{link.title}</span>
                <span className="block text-sm text-slate-400">{link.text}</span>
              </span>
              <RightOutlined className="text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-indigo-400" />
            </Link>
          ))}
        </div>

        {!isAdmin && (
          <div className="lg:col-span-3">
            <Link to="/products">
              <Button type="primary" size="large">Start shopping</Button>
            </Link>
          </div>
        )}
      </div>
    </StoreLayout>
  )
}
