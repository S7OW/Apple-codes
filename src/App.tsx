import { BrowserRouter, useLocation } from 'react-router-dom';
import { AppRoutes } from './router';
import Navbar from './components/feature/Navbar';
import Footer from './components/feature/Footer';
import AnnouncementBar from './components/feature/AnnouncementBar';
import './i18n';

function AppContent() {
  const location = useLocation();
  const isAdminRoute =
    location.pathname.startsWith('/dashboard/admin') ||
    location.pathname === '/dashboard/login';

  return (
    <div className="flex flex-col min-h-screen">
      {!isAdminRoute && <AnnouncementBar />}
      {!isAdminRoute && <Navbar />}
      <main className={`${isAdminRoute ? '' : 'flex-1'} page-enter`} key={location.pathname}>
        <AppRoutes />
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter basename={__BASE_PATH__}>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
