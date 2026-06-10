import { useState, useEffect } from 'react';
import AdminLayout from '../../../../components/feature/AdminLayout';
import AdminHeader from '../../../../components/feature/AdminHeader';
import { supabase } from '../../../../lib/supabase';

interface Order {
  id: string;
  user_id: string;
  status: string;
  total: number;
  created_at: string;
  userEmail?: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, user_id, status, total, created_at')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        return;
      }

      const userIds = [...new Set(ordersData.map((o) => o.user_id).filter(Boolean))];

      const { data: usersData } = await supabase
        .from('Users')
        .select('id, email')
        .in('id', userIds);

      const emailMap: Record<string, string> = {};
      (usersData || []).forEach((u: { id: string; email: string }) => {
        emailMap[u.id] = u.email;
      });

      setOrders(
        ordersData.map((o) => ({
          ...o,
          userEmail: emailMap[o.user_id] || 'N/A',
        }))
      );
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === 'completed').length;
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBorderColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'border-l-4 border-l-green-500',
      pending: 'border-l-4 border-l-yellow-500',
      failed: 'border-l-4 border-l-red-500',
    };
    return colors[status] || 'border-l-4 border-l-gray-300';
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const copyOrderId = (orderId: string) => {
    navigator.clipboard.writeText(orderId);
    setCopiedId(orderId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportToCSV = () => {
    const headers = ['Order ID', 'User Email', 'Total (USD)', 'Status', 'Date'];
    const rows = filteredOrders.map((order) => [
      order.id,
      order.userEmail || 'N/A',
      `$${Number(order.total).toFixed(2)}`,
      order.status,
      formatDate(order.created_at),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <AdminHeader title="Orders" subtitle="View and manage all customer orders" />
      <div className="p-6">
        {/* Summary Stats */}
        <div className="flex items-center gap-4 mb-6">
          <div className="px-5 py-2.5 bg-gray-100 rounded-lg">
            <span className="text-sm font-medium text-gray-600">Total Orders: </span>
            <span className="text-sm font-bold text-gray-900">{totalOrders}</span>
          </div>
          <div className="px-5 py-2.5 bg-green-50 rounded-lg">
            <span className="text-sm font-medium text-green-700">Completed: </span>
            <span className="text-sm font-bold text-green-900">{completedOrders}</span>
          </div>
          <div className="px-5 py-2.5 bg-yellow-50 rounded-lg">
            <span className="text-sm font-medium text-yellow-700">Pending: </span>
            <span className="text-sm font-bold text-yellow-900">{pendingOrders}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">
                All Orders ({filteredOrders.length})
              </h3>
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600">Filter by Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
                <button
                  onClick={exportToCSV}
                  disabled={filteredOrders.length === 0}
                  className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2"
                >
                  <i className="ri-download-line"></i>
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-file-list-line text-3xl text-gray-400"></i>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">No Orders Found</h3>
              <p className="text-sm text-gray-600">
                {statusFilter === 'all'
                  ? 'No orders have been placed yet.'
                  : `No ${statusFilter} orders found.`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">User Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className={`hover:bg-gray-50 transition-colors ${getStatusBorderColor(order.status)}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative inline-block">
                          <button
                            onClick={() => copyOrderId(order.id)}
                            className="text-sm font-mono text-gray-900 hover:text-black transition-colors cursor-pointer"
                          >
                            {order.id}
                          </button>
                          {copiedId === order.id && (
                            <div className="absolute left-0 -top-8 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                              Copied!
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{order.userEmail}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">${Number(order.total).toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{formatDate(order.created_at)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}