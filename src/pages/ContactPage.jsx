import { useState } from 'react'
import { App as AntdApp, Button, Form, Input } from 'antd'
import StoreLayout from '../components/layout/StoreLayout'
import { sendMessage } from '../api/messageApi'

// Anyone (guests too) can send the shop a message.
export default function ContactPage() {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const { message } = AntdApp.useApp()

  async function onFinish(values) {
    setLoading(true)
    try {
      await sendMessage(values)
      message.success("Message sent! We'll email you when it's solved.")
      form.resetFields()
    } catch (err) {
      message.error(err?.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <StoreLayout>
      <section className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Contact Us</h1>
          <p className="mt-2 text-slate-400">We&apos;re here to help you with any questions you may have.</p>
        </div>
      </section>

      <div className="mx-auto max-w-xl px-4 py-10">
        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="name"
            label="Name"
            rules={[
              { required: true, message: 'Please enter your name' },
              { max: 100, message: 'Name must be 100 characters or less' },
            ]}
          >
            <Input size="large" placeholder="Your name" autoComplete="name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Enter a valid email address' },
              { max: 80, message: 'Email must be 80 characters or less' },
            ]}
          >
            <Input size="large" placeholder="you@example.com" autoComplete="email" />
          </Form.Item>

          <Form.Item
            name="message"
            label="Message"
            rules={[
              { required: true, message: 'Please enter your message' },
              { max: 1000, message: 'Message must be 1000 characters or less' },
            ]}
          >
            <Input.TextArea placeholder="How can we help?" rows={5} maxLength={1000} showCount />
          </Form.Item>

          <Button type="primary" htmlType="submit" size="large" block loading={loading}>
            Send message
          </Button>
        </Form>
      </div>
    </StoreLayout>
  )
}