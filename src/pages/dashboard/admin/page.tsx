import { useEffect, useState } from 'react';
import AdminLayout from '../../../components/feature/AdminLayout';
import { supabase } from '../../../lib/supabase';

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  availableCodes: number;
  usedCodes: number;
}

interface RecentOrder {
  id: string;
  user_email: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface LowStockProduct {
  id: string;
  name: string;
  available_codes: number;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalOrders: 0,
    availableCodes: 0,
    usedCodes: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch total revenue from completed orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('total_amount, status')
        .eq('status', 'completed');

      const totalRevenue = ordersData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

      // Fetch total orders count
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // Fetch available codes count
      const { count: availableCodesCount } = await supabase
        .from('codes')
        .select('*', { count: 'exact', head: true })
        .eq('is_used', false);

      // Fetch used codes count
      const { count: usedCodesCount } = await supabase
        .from('codes')
        .select('*', { count: 'exact', head: true })
        .eq('is_used', true);

      // Fetch recent 5 orders
      const { data: recentOrdersData } = await supabase
        .from('orders')
        .select('id, user_email, total_amount, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch products with low stock (less than 5 available codes)
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name_en');

      const lowStock: LowStockProduct[] = [];
      if (productsData) {
        for (const product of productsData) {
          const { count } = await supabase
            .from('codes')
            .select('*', { count: 'exact', head: true })
            .eq('product_id', product.id)
            .eq('is_used', false);

          if (count !== null && count < 5) {
            lowStock.push({
              id: product.id,
              name: product.name_en,
              available_codes: count,
            });
          }
        }
      }

      setStats({
        totalRevenue,
        totalOrders: ordersCount || 0,
        availableCodes: availableCodesCount || 0,
        usedCodes: usedCodesCount || 0,
      });
      setRecentOrders(recentOrdersData || []);
      setLowStockProducts(lowStock);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: 'ri-money-dollar-circle-line',
      color: 'bg-green-500',
      trend: '+12.5%',
      trendUp: true,
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: 'ri-shopping-cart-line',
      color: 'bg-orange-500',
      trend: '+8.2%',
      trendUp: true,
    },
    {
      title: 'Available Codes',
      value: stats.availableCodes,
      icon: 'ri-key-2-line',
      color: 'bg-green-600',
      trend: stats.availableCodes > 20 ? 'Healthy' : 'Low',
      trendUp: stats.availableCodes > 20,
    },
    {
      title: 'Used Codes',
      value: stats.usedCodes,
      icon: 'ri-checkbox-circle-line',
      color: 'bg-red-500',
      trend: `${stats.usedCodes + stats.availableCodes > 0 ? ((stats.usedCodes / (stats.usedCodes + stats.availableCodes)) * 100).toFixed(1) : 0}%`,
      trendUp: false,
    },
  ];

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <AdminLayout>
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-600 mt-1">Dashboard statistics and insights</p>
      </div>

      <div className="p-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center text-white text-2xl`}>
                  <i className={card.icon}></i>
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${card.trendUp ? 'text-green-600' : 'text-gray-600'}`}>
                  {card.trendUp && <i className="ri-arrow-up-line"></i>}
                  {card.trend}
                </div>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{card.title}</h3>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? '...' : card.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <a
                href="/dashboard/admin/codes"
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white">
                    <i className="ri-key-2-line text-lg"></i>
                  </div>
                  <span className="font-medium text-gray-900">Manage Codes</span>
                </div>
                <i className="ri-arrow-right-s-line text-gray-400"></i>
              </a>
              <a
                href="/dashboard/admin/orders"
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white">
                    <i className="ri-shopping-cart-line text-lg"></i>
                  </div>
                  <span className="font-medium text-gray-900">View Orders</span>
                </div>
                <i className="ri-arrow-right-s-line text-gray-400"></i>
              </a>
              <a
                href="/dashboard/admin/reviews"
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white">
                    <i className="ri-star-line text-lg"></i>
                  </div>
                  <span className="font-medium text-gray-900">Manage Reviews</span>
                </div>
                <i className="ri-arrow-right-s-line text-gray-400"></i>
              </a>
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <i className="ri-alert-line text-xl text-orange-500"></i>
              <h3 className="text-lg font-semibold text-gray-900">Low Stock Alert</h3>
            </div>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : lowStockProducts.length === 0 ? (
              <div className="text-center py-8">
                <i className="ri-checkbox-circle-line text-4xl text-green-500 mb-2"></i>
                <p className="text-gray-600">All products have sufficient stock</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <i className="ri-error-warning-line text-xl text-orange-600"></i>
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">
                          Only {product.available_codes} code{product.available_codes !== 1 ? 's' : ''} remaining
                        </p>
                      </div>
                    </div>
                    <a
                      href="/dashboard/admin/codes"
                      className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Add Codes
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <i className="ri-shopping-cart-line text-4xl text-gray-300 mb-2"></i>
              <p className="text-gray-600">No orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Order ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Customer</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-mono text-gray-900">
                        #{order.id.slice(0, 8)}...
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">{order.user_email}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                        ${order.total_amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(order.created_at)}
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