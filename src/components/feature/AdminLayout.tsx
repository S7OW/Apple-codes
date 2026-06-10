import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const adminSession =
      localStorage.getItem('admin_session') ||
      sessionStorage.getItem('admin_session');

    if (!adminSession) {
      navigate('/dashboard/login');
    }
  }, [navigate]);

  const adminSession =
    localStorage.getItem('admin_session') ||
    sessionStorage.getItem('admin_session');

  if (!adminSession) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-800 via-black to-gray-800 z-50"></div>
      <AdminSidebar />
      <div className="flex-1 lg:ml-64 flex flex-col overflow-hidden pt-1">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
