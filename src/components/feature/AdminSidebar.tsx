import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = [
    { path: '/dashboard/admin', label: 'Overview', icon: 'ri-dashboard-line' },
    { path: '/dashboard/admin/codes', label: 'Codes', icon: 'ri-key-line' },
    { path: '/dashboard/admin/orders', label: 'Orders', icon: 'ri-file-list-line' },
    { path: '/dashboard/admin/users', label: 'Users', icon: 'ri-user-line' },
    { path: '/dashboard/admin/reviews', label: 'Reviews', icon: 'ri-star-line' },
  ];

  const handleLogout = () => {
    try {
      localStorage.removeItem('admin_session');
      sessionStorage.removeItem('admin_session');
      navigate('/dashboard');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const isActive = (path: string) => {
    if (path === '/dashboard/admin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors cursor-pointer"
      >
        <i className={isMobileOpen ? 'ri-close-line text-xl' : 'ri-menu-line text-xl'}></i>
      </button>

      {/* Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-40 transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="h-16 flex items-center px-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-gray-800 to-black rounded-xl flex items-center justify-center shadow-sm">
                <i className="ri-apple-fill text-white text-xl"></i>
              </div>
              <div>
                <span className="font-bold text-lg text-gray-900 block leading-tight">Apple+ Store</span>
                <span className="text-xs text-gray-500">Admin Panel</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                      isActive(item.path)
                        ? 'bg-black text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <i className={`${item.icon} text-lg`}></i>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Admin Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-black rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                AD
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">Admin</p>
                <p className="text-xs text-gray-500 truncate">Administrator</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-logout-box-line"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}