import { useEffect, useState } from 'react';
import AdminLayout from '../../../../components/feature/AdminLayout';
import { supabase } from '../../../../lib/supabase';

interface PublicReview {
  id: string;
  full_name: string;
  rating: number;
  comment: string;
  approved: boolean;
  created_at: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('public_reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'pending') query = query.eq('approved', false);
      if (filter === 'approved') query = query.eq('approved', true);

      const { data, error } = await query;
      if (error) throw error;
      setReviews(data || []);
    } catch {
      showToast('Failed to load reviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  const approveReview = async (id: string) => {
    setActionLoading(id + '_approve');
    try {
      const { error } = await supabase
        .from('public_reviews')
        .update({ approved: true })
        .eq('id', id);
      if (error) throw error;
      showToast('Review approved and is now visible on the homepage', 'success');
      fetchReviews();
    } catch {
      showToast('Failed to approve review', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const rejectReview = async (id: string) => {
    setActionLoading(id + '_reject');
    try {
      const { error } = await supabase
        .from('public_reviews')
        .update({ approved: false })
        .eq('id', id);
      if (error) throw error;
      showToast('Review has been hidden', 'success');
      fetchReviews();
    } catch {
      showToast('Failed to update review', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this review?')) return;
    setActionLoading(id + '_delete');
    try {
      const { error } = await supabase
        .from('public_reviews')
        .delete()
        .eq('id', id);
      if (error) throw error;
      showToast('Review deleted', 'success');
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch {
      showToast('Failed to delete review', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = reviews.filter((r) => !r.approved).length;

  return (
    <AdminLayout>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-white text-sm font-medium transition-all ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          <i className={`text-lg ${toast.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'}`}></i>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
            <p className="text-sm text-gray-500 mt-0.5">Approve or reject customer reviews before they appear on the homepage</p>
          </div>
          {filter === 'all' || filter === 'pending' ? (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-sm font-medium px-4 py-2 rounded-lg">
              <i className="ri-time-line"></i>
              {pendingCount} pending approval
            </div>
          ) : null}
        </div>
      </div>

      <div className="p-6">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {(['pending', 'approved', 'all'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap capitalize ${
                filter === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'pending' ? 'Pending' : tab === 'approved' ? 'Approved' : 'All'}
            </button>
          ))}
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-star-line text-3xl text-gray-400"></i>
            </div>
            <p className="text-gray-700 font-semibold text-lg">No reviews found</p>
            <p className="text-gray-400 text-sm mt-1">
              {filter === 'pending' ? 'No reviews waiting for approval' : 'No reviews in this category'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className={`bg-white rounded-xl border p-5 transition-all ${
                  review.approved
                    ? 'border-green-200 bg-green-50/30'
                    : 'border-orange-200 bg-orange-50/20'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Avatar + Info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-11 h-11 bg-black text-white rounded-full flex items-center justify-center font-bold text-base flex-shrink-0">
                      {review.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <span className="font-semibold text-gray-900">{review.full_name}</span>
                        <span
                          className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                            review.approved
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {review.approved ? 'Approved' : 'Pending'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(review.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <i
                            key={i}
                            className={`ri-star-${i < review.rating ? 'fill' : 'line'} text-yellow-400 text-base`}
                          ></i>
                        ))}
                        <span className="text-xs text-gray-500 ml-1">{review.rating}/5</span>
                      </div>

                      {/* Comment */}
                      <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!review.approved ? (
                      <button
                        onClick={() => approveReview(review.id)}
                        disabled={actionLoading === review.id + '_approve'}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                      >
                        {actionLoading === review.id + '_approve' ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <i className="ri-checkbox-circle-line"></i>
                        )}
                        Approve
                      </button>
                    ) : (
                      <button
                        onClick={() => rejectReview(review.id)}
                        disabled={actionLoading === review.id + '_reject'}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                      >
                        {actionLoading === review.id + '_reject' ? (
                          <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <i className="ri-eye-off-line"></i>
                        )}
                        Hide
                      </button>
                    )}
                    <button
                      onClick={() => deleteReview(review.id)}
                      disabled={actionLoading === review.id + '_delete'}
                      className="flex items-center justify-center w-9 h-9 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      title="Delete review"
                    >
                      {actionLoading === review.id + '_delete' ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <i className="ri-delete-bin-line text-base"></i>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
