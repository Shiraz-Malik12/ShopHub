import { useEffect, useState } from 'react'
import { Alert, App as AntdApp, Button, Empty, Popconfirm, Table, Tag } from 'antd'   // line 2
  // line 14
import AdminLayout from '../../components/layout/AdminLayout'
import PageHeader from '../../components/layout/PageHeader'
import * as messageApi from '../../api/messageApi'
import { formatDate } from '../../utils/formatDate'

// Admin-only: messages customers sent from the Contact us page.
export default function MessagesPage() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [busyId, setBusyId] = useState(null) // which row is being resolved
  const { message } = AntdApp.useApp()

  async function loadMessages() {
    setLoading(true)
    setLoadError(null)
    try {
      const { data } = await messageApi.fetchMessages()
      setMessages(data.data)
    } catch (err) {
      setLoadError(err?.response?.data?.message || 'Could not load messages.')
    } finally {
      setLoading(false)
    }
  }
  async function handleResolve(contact) {
  setBusyId(contact._id)
  try {
    const { data } = await messageApi.resolveMessage(contact._id)
    replaceMessage(data.data)
    message.success(`Message from ${contact.name} resolved`)
  } catch (err) {
    message.error(err?.response?.data?.message || 'Something went wrong. Please try again.')
  } finally {
    setBusyId(null)
  }
}
  function replaceMessage(updated) {
  setMessages((previous) => previous.map((item) => (item._id === updated._id ? updated : item)))
}

  useEffect(() => {
    loadMessages()
  }, [])

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      render: (text) => <span className="whitespace-pre-wrap">{text}</span>,
    },
    { title: 'Sent', dataIndex: 'createdAt', key: 'createdAt', render: (value) => formatDate(value) },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (status === 'resolved' ? <Tag color="green">Resolved</Tag> : <Tag color="orange">Open</Tag>),
    },
    {
  title: 'Action',
  key: 'action',
  render: (_, contact) =>
    contact.status === 'resolved' ? (
      <span className="text-slate-500">Resolved {formatDate(contact.resolvedAt)}</span>
    ) : (
      <Popconfirm
        title="Mark as resolved?"
        description="The customer will get an email saying their problem is solved."
        okText="Resolve"
        cancelText="Cancel"
        onConfirm={() => handleResolve(contact)}
      >
        <Button size="small" type="primary" loading={busyId === contact._id}>
          Resolve
        </Button>
      </Popconfirm>
    ),
},
  ]

  return (
    <AdminLayout>
      <PageHeader title="Messages" description="Questions and problems customers sent from the Contact us page." />

      {loadError ? (
        <Alert
          type="error"
          showIcon
          title="Could not load messages"
          description={loadError}
          action={<Button size="small" onClick={loadMessages}>Retry</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={messages}
            loading={loading}
            pagination={false}
            scroll={{ x: 860 }}
            locale={{ emptyText: <Empty description={loading ? 'Loading messages...' : 'No messages yet'} /> }}
          />
        </div>
      )}
    </AdminLayout>
  )
}