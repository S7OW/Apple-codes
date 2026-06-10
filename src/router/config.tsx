import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

// Lazy load pages
const HomePage = lazy(() => import('../pages/home/page'));
const ProductsPage = lazy(() => import('../pages/products/page'));
const GuidePage = lazy(() => import('../pages/guide/page'));
const ContactPage = lazy(() => import('../pages/contact/page'));
const SignInPage = lazy(() => import('../pages/auth/signin/page'));
const SignUpPage = lazy(() => import('../pages/auth/signup/page'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/forgot-password/page'));
const ResetPasswordPage = lazy(() => import('../pages/auth/reset-password/page'));
const AuthCallbackPage = lazy(() => import('../pages/auth/callback/page'));
const DashboardPage = lazy(() => import('../pages/dashboard/page'));
const DashboardCodesPage = lazy(() => import('../pages/dashboard/codes/page'));
const DashboardFavoritesPage = lazy(() => import('../pages/dashboard/favorites/page'));
const DashboardSettingsPage = lazy(() => import('../pages/dashboard/settings/page'));
const AdminLoginPage = lazy(() => import('../pages/dashboard/login/page'));
const AdminPanelPage = lazy(() => import('../pages/dashboard/admin/page'));
const AdminCodesPage = lazy(() => import('../pages/dashboard/admin/codes/page'));
const AdminOrdersPage = lazy(() => import('../pages/dashboard/admin/orders/page'));
const AdminUsersPage = lazy(() => import('../pages/dashboard/admin/users/page'));
const AdminReviewsPage = lazy(() => import('../pages/dashboard/admin/reviews/page'));
const PaymentSuccessPage = lazy(() => import('../pages/payment/success/page'));
const PaymentCancelPage = lazy(() => import('../pages/payment/cancel/page'));
const NotFoundPage = lazy(() => import('../pages/NotFound'));

const routes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/products', element: <ProductsPage /> },
  { path: '/guide', element: <GuidePage /> },
  { path: '/contact', element: <ContactPage /> },
  { path: '/auth/signin', element: <SignInPage /> },
  { path: '/auth/signup', element: <SignUpPage /> },
  { path: '/auth/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/auth/reset-password', element: <ResetPasswordPage /> },
  { path: '/auth/callback', element: <AuthCallbackPage /> },
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/dashboard/codes', element: <DashboardCodesPage /> },
  { path: '/dashboard/favorites', element: <DashboardFavoritesPage /> },
  { path: '/dashboard/settings', element: <DashboardSettingsPage /> },
  { path: '/dashboard/login', element: <AdminLoginPage /> },
  { path: '/dashboard/admin', element: <AdminPanelPage /> },
  { path: '/dashboard/admin/codes', element: <AdminCodesPage /> },
  { path: '/dashboard/admin/orders', element: <AdminOrdersPage /> },
  { path: '/dashboard/admin/users', element: <AdminUsersPage /> },
  { path: '/dashboard/admin/reviews', element: <AdminReviewsPage /> },
  { path: '/payment/success', element: <PaymentSuccessPage /> },
  { path: '/payment/cancel', element: <PaymentCancelPage /> },
  { path: '*', element: <NotFoundPage /> },
];

export default routes;