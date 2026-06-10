import { useState, useEffect } from 'react';
import AdminLayout from '../../../../components/feature/AdminLayout';
import AdminHeader from '../../../../components/feature/AdminHeader';
import { supabase } from '../../../../lib/supabase';

interface User {
  id: string;
  email: string;
  created_at: string;
  orders: { id: string }[];
}

interface UserCode {
  code: string;
  product_name: string;
  used_at: string;
  product_image?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userCodes, setUserCodes] = useState<UserCode[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const profiles = profilesData || [];

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, user_id');

      if (ordersError) throw ordersError;

      const ordersByUser: Record<string, { id: string }[]> = {};
      (ordersData || []).forEach((order) => {
        if (!ordersByUser[order.user_id]) ordersByUser[order.user_id] = [];
        ordersByUser[order.user_id].push({ id: order.id });
      });

      const usersWithOrders = profiles.map((profile) => ({
        ...profile,
        orders: ordersByUser[profile.id] || [],
      }));

      setUsers(usersWithOrders);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCodes = async (userId: string) => {
    try {
      setLoadingCodes(true);
      const { data, error } = await supabase
        .from('codes')
        .select(`
          code,
          used_at,
          products (
            name_en,
            image_url
          )
        `)
        .eq('used_by', userId)
        .eq('is_used', true)
        .order('used_at', { ascending: false });

      if (error) throw error;
      
      const formattedCodes = (data || []).map(item => ({
        code: item.code,
        product_name: item.products?.name_en || 'N/A',
        product_image: item.products?.image_url || '',
        used_at: item.used_at,
      }));
      
      setUserCodes(formattedCodes);
    } catch (error) {
      console.error('Error fetching user codes:', error);
      setUserCodes([]);
    } finally {
      setLoadingCodes(false);
    }
  };

  const handleViewDetails = async (user: User) => {
    setSelectedUser(user);
    setShowModal(true);
    await fetchUserCodes(user.id);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setUserCodes([]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (email: string) => {
    const parts = email.split('@')[0].split(/[._-]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <AdminLayout>
      <AdminHeader 
        title="Users" 
        subtitle="View and manage registered users"
      />
      <div className="p-6">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">
              All Users
            </h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gray-900 text-white">
              {users.length} {users.length === 1 ? 'User' : 'Users'}
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-user-line text-3xl text-gray-400"></i>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                No Users Found
              </h3>
              <p className="text-sm text-gray-600">
                No users have registered yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Join Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-600 flex items-center justify-center text-white text-sm font-semibold">
                            {getInitials(user.email)}
                          </div>
                          <span className="text-sm text-gray-900 font-medium">
                            {user.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {formatDate(user.created_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                          {user.orders?.length || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewDetails(user)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <i className="ri-eye-line text-lg"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-800 to-gray-600 flex items-center justify-center text-white text-xl font-bold">
                    {getInitials(selectedUser.email)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedUser.email}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Joined {formatDate(selectedUser.created_at)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                  <i className="ri-shopping-bag-line text-gray-600"></i>
                  <span className="text-sm text-gray-600">Total Orders:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {selectedUser.orders?.length || 0}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4">
                  Purchased Codes
                </h4>
                {loadingCodes ? (
                  <div className="py-8 text-center">
                    <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-gray-600">Loading codes...</p>
                  </div>
                ) : userCodes.length === 0 ? (
                  <div className="py-8 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="ri-code-line text-2xl text-gray-400"></i>
                    </div>
                    <p className="text-sm text-gray-600">
                      No codes purchased yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userCodes.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                        <div className="flex items-start gap-4">
                          {item.product_image && (
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              <img 
                                src={item.product_image} 
                                alt={item.product_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-600 mb-1">Code</p>
                                <p className="text-sm font-mono font-semibold text-gray-900 break-all">
                                  {item.code}
                                </p>
                              </div>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                                Used
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-600 gap-2">
                              <span className="truncate">{item.product_name}</span>
                              <span className="whitespace-nowrap">{formatDateTime(item.used_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}