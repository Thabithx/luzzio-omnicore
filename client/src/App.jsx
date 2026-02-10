import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import ScrollToTop from './components/ScrollToTop';
import * as metaPixel from './utils/metaPixel';
import { useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Lazy load pages
const Home = lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const ProductList = lazy(() => import('./pages/ProductList').then(module => ({ default: module.ProductList })));
const ProductDetail = lazy(() => import('./pages/ProductDetail').then(module => ({ default: module.ProductDetail })));
const Cart = lazy(() => import('./pages/Cart').then(module => ({ default: module.Cart })));
const Checkout = lazy(() => import('./pages/Checkout').then(module => ({ default: module.Checkout })));
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Register = lazy(() => import('./pages/Register').then(module => ({ default: module.Register })));
const Profile = lazy(() => import('./pages/Profile').then(module => ({ default: module.Profile })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess').then(module => ({ default: module.PaymentSuccess })));

// Policy Pages
const ExchangePolicy = lazy(() => import('./pages/ExchangePolicy').then(module => ({ default: module.ExchangePolicy })));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(module => ({ default: module.PrivacyPolicy })));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy').then(module => ({ default: module.RefundPolicy })));
const ShippingPolicy = lazy(() => import('./pages/ShippingPolicy').then(module => ({ default: module.ShippingPolicy })));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions').then(module => ({ default: module.TermsAndConditions })));
const ReturnPolicy = lazy(() => import('./pages/ReturnPolicy').then(module => ({ default: module.ReturnPolicy })));

// User Pages
const Contact = lazy(() => import('./pages/Contact').then(module => ({ default: module.Contact })));
const FAQ = lazy(() => import('./pages/FAQ').then(module => ({ default: module.FAQ })));

// Admin Pages
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminFAQ = lazy(() => import('./pages/admin/AdminFAQ'));
const AdminContact = lazy(() => import('./pages/admin/AdminContact'));
const AdminDraftOrders = lazy(() => import('./pages/admin/AdminDraftOrders'));

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="text-[10px] font-bold uppercase tracking-[0.5em] animate-pulse">Luzzio</div>
  </div>
);

import api from './services/api';

function PixelTracker() {
  const location = useLocation();
  const { user } = useAuth();

  React.useEffect(() => {
    metaPixel.init(user);
  }, [user]);

  React.useEffect(() => {
    metaPixel.pageview();

    // Log visit to internal analytics
    const logInternalVisit = async () => {
      try {
        await api.post('/analytics/log-visit', { path: location.pathname });
      } catch (err) {
        // Fail silently
      }
    };
    logInternalVisit();
  }, [location]);

  return null;
}

function App() {
  return (
    <Router>
      <PixelTracker />
      <ScrollToTop />
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Storefront Routes */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/products" element={<Layout><ProductList /></Layout>} />
          <Route path="/products/:id" element={<Layout><ProductDetail /></Layout>} />
          <Route path="/cart" element={<Layout><Cart /></Layout>} />
          <Route path="/checkout" element={<Layout><Checkout /></Layout>} />
          <Route path="/login" element={<Layout><Login /></Layout>} />
          <Route path="/register" element={<Layout><Register /></Layout>} />
          <Route path="/profile" element={<Layout><Profile /></Layout>} />
          <Route path="/forgot-password" element={<Layout><ForgotPassword /></Layout>} />
          <Route path="/reset-password" element={<Layout><ResetPassword /></Layout>} />
          <Route path="/payment-success" element={<Layout><PaymentSuccess /></Layout>} />

          {/* Policy Routes */}
          <Route path="/exchange-policy" element={<Layout><ExchangePolicy /></Layout>} />
          <Route path="/privacy-policy" element={<Layout><PrivacyPolicy /></Layout>} />
          <Route path="/refund-policy" element={<Layout><RefundPolicy /></Layout>} />
          <Route path="/shipping-policy" element={<Layout><ShippingPolicy /></Layout>} />
          <Route path="/terms-and-conditions" element={<Layout><TermsAndConditions /></Layout>} />
          <Route path="/return-policy" element={<Layout><ReturnPolicy /></Layout>} />

          {/* User Pages */}
          <Route path="/contact" element={<Layout><Contact /></Layout>} />
          <Route path="/faq" element={<Layout><FAQ /></Layout>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout><Dashboard /></AdminLayout>} />
          <Route path="/admin/products" element={<AdminLayout><AdminProducts /></AdminLayout>} />
          <Route path="/admin/categories" element={<AdminLayout><AdminCategories /></AdminLayout>} />
          <Route path="/admin/orders" element={<AdminLayout><AdminOrders /></AdminLayout>} />
          <Route path="/admin/orders/drafts" element={<AdminLayout><AdminDraftOrders /></AdminLayout>} />
          <Route path="/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
          <Route path="/admin/faq" element={<AdminLayout><AdminFAQ /></AdminLayout>} />
          <Route path="/admin/contact" element={<AdminLayout><AdminContact /></AdminLayout>} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
