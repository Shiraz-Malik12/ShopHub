import { useEffect, useState } from 'react'
import { App as AntdApp, Avatar, Button, Empty, Form, Input, Popconfirm, Rate, Skeleton } from 'antd'
import { Link, useLocation } from 'react-router-dom'
import * as reviewApi from '../../api/reviewApi'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../utils/formatDate'
import RatingStars from './RatingStars'

const MAX_COMMENT_LENGTH = 1000 // same limit as the server (models/Review.js)
const STAR_LEVELS = [5, 4, 3, 2, 1]

// Average, count and "how many 5★, 4★…" bars.
function ReviewSummary({ summary }) {
  const largest = Math.max(1, ...Object.values(summary.breakdown))
  return (
    <div>
      <div className="flex items-end gap-3">
        <span className="text-5xl font-semibold text-slate-100">{summary.count ? summary.average.toFixed(1) : '–'}</span>
        <span className="pb-1 text-sm text-slate-400">out of 5</span>
      </div>
      <div className="mt-2">
        <RatingStars average={summary.average} count={summary.count} size={16} />
      </div>
      <ul className="mt-5 space-y-2">
        {STAR_LEVELS.map((stars) => {
          const count = summary.breakdown[stars] || 0
          return (
            <li key={stars} className="flex items-center gap-3 text-sm">
              <span className="w-12 shrink-0 text-slate-400">{stars} star</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800" role="img" aria-label={`${stars} star: ${count} reviews`}>
                <div className="h-full rounded-full bg-amber-400" style={{ width: `${(count / largest) * 100}%` }} />
              </div>
              <span className="w-6 shrink-0 text-right text-slate-300">{count}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// The signed-in customer's own review: write it, change it or delete it.
function MyReviewForm({ myReview, saving, deleting, onSave, onDelete }) {
  return (
    <Form
      // Fresh form whenever the saved review changes.
      key={myReview ? `${myReview.rating}-${myReview.comment}` : 'new'}
      layout="vertical"
      requiredMark={false}
      initialValues={{ rating: myReview?.rating, comment: myReview?.comment || '' }}
      onFinish={onSave}
    >
      <Form.Item name="rating" label="Your rating" rules={[{ required: true, message: 'Please choose 1 to 5 stars' }]}>
        <Rate style={{ color: '#fbbf24' }} />
      </Form.Item>
      <Form.Item name="comment" label="Your review (optional)" rules={[{ max: MAX_COMMENT_LENGTH }]}>
        <Input.TextArea rows={3} maxLength={MAX_COMMENT_LENGTH} showCount placeholder="What did you like or dislike?" />
      </Form.Item>
      <div className="flex flex-wrap gap-3">
        <Button type="primary" htmlType="submit" loading={saving}>
          {myReview ? 'Update review' : 'Post review'}
        </Button>
        {myReview && (
          <Popconfirm title="Delete your review?" okText="Delete" okButtonProps={{ danger: true }} onConfirm={onDelete}>
            <Button danger loading={deleting}>Delete</Button>
          </Popconfirm>
        )}
      </div>
    </Form>
  )
}

// The whole "Customer reviews" area of a product page. It loads its own data;
// onSummaryChange tells the page about new totals so the stars at the top
// of the page update too.
export default function ProductReviews({ productId, onSummaryChange }) {
  const { user } = useAuth()
  const location = useLocation()
  const { message } = AntdApp.useApp()
  const [reviews, setReviews] = useState([])
  const [summary, setSummary] = useState(null)
  const [myStatus, setMyStatus] = useState(null) // { canReview, myReview } — signed-in users only
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        const [list, status] = await Promise.all([
          reviewApi.fetchReviews(productId),
          user ? reviewApi.fetchMyReviewStatus(productId) : null,
        ])
        if (ignore) return
        setReviews(list.data.reviews)
        setSummary(list.data.summary)
        setMyStatus(status ? status.data : null)
      } catch {
        if (!ignore) setReviews([])
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [productId, user, reloadKey])

  // Tell the page once fresh totals arrive (after a save or delete).
  useEffect(() => {
    if (summary) onSummaryChange?.(summary)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary])

  async function runAction(action, successText, setBusy) {
    setBusy(true)
    try {
      await action()
      message.success(successText)
      setReloadKey((key) => key + 1)
    } catch (err) {
      message.error(err?.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  function renderWriteArea() {
    if (!user) {
      return (
        <p className="text-sm text-slate-400">
          <Link to="/login" state={{ from: location }} className="font-medium text-indigo-400 hover:text-indigo-300">
            Sign in
          </Link>{' '}
          to write a review.
        </p>
      )
    }
    if (!myStatus?.canReview && !myStatus?.myReview) {
      return <p className="text-sm text-slate-400">Only customers who have received this product can review it.</p>
    }
    return (
      <MyReviewForm
        myReview={myStatus.myReview}
        saving={saving}
        deleting={deleting}
        onSave={(values) => runAction(() => reviewApi.saveMyReview(productId, values), 'Thanks for your review!', setSaving)}
        onDelete={() => runAction(() => reviewApi.deleteMyReview(productId), 'Review deleted', setDeleting)}
      />
    )
  }

  return (
    <section id="reviews" className="mt-12 rounded-xl border border-slate-800 bg-slate-900">
      <h2 className="border-b border-slate-800 px-6 py-4 text-lg font-semibold text-slate-100">Customer reviews</h2>

      {loading ? (
        <div className="p-6">
          <Skeleton active paragraph={{ rows: 4 }} />
        </div>
      ) : (
        <div className="grid gap-8 p-6 lg:grid-cols-3">
          <div className="space-y-6">
            {summary && <ReviewSummary summary={summary} />}
            <div className="border-t border-slate-800 pt-6">
              <h3 className="mb-3 font-medium text-slate-100">
                {myStatus?.myReview ? 'Your review' : 'Write a review'}
              </h3>
              {renderWriteArea()}
            </div>
          </div>

          <div className="lg:col-span-2">
            {reviews.length === 0 ? (
              <Empty description="No reviews yet. Be the first to share what you think." />
            ) : (
              <ul className="divide-y divide-slate-800">
                {reviews.map((review) => (
                  <li key={review._id} className="py-5 first:pt-0">
                    <div className="flex items-start gap-3">
                      <Avatar style={{ backgroundColor: '#334155' }}>{review.author[0]?.toUpperCase()}</Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium text-slate-100">{review.author}</span>
                          <span className="text-xs text-slate-500">{formatDate(review.createdAt)}</span>
                        </div>
                        <Rate disabled value={review.rating} style={{ fontSize: 13, color: '#fbbf24' }} />
                        {/* React escapes this text, so a comment can't inject HTML. */}
                        {review.comment && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{review.comment}</p>}
                        {isAdmin && (
                          <Popconfirm
                            title="Remove this review?"
                            okText="Remove"
                            okButtonProps={{ danger: true }}
                            onConfirm={() =>
                              runAction(() => reviewApi.adminDeleteReview(productId, review._id), 'Review removed', setDeleting)
                            }
                          >
                            <Button type="link" danger size="small" className="mt-1 px-0">
                              Remove (admin)
                            </Button>
                          </Popconfirm>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
