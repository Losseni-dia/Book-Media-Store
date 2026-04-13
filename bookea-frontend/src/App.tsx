import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";

import Navbar from "./layout/navbar/Navbar";
import Footer from "./layout/footer/Footer";
import { ScrollToTop } from "./layout/ScrollToTop";
import { CartProvider } from "./order/cart/CartContext";
import { AuthProvider } from "./modules/auth/context/AuthContext";

import Home from "./home/Home";
import Cart from "./order/cart/Cart";
import MyOrders from "./order/page/my-orders/MyOrders";
import AdminDashboard from "./order/page/admin/AdminDashboard";
import AdminArchived from "./order/page/admin/archive/AdminArchived";
import OrderForm from "./order/page/order-form/OrderForm";

import { BlogPage } from "./modules/blog/pages/BlogPage";
import { AdminBlogPage } from "./modules/blog/pages/AdminBlogPage";
import { BlogDetailPage } from "./modules/blog/pages/BlogDetailPage";

import { LoginPage } from "./modules/auth";
import { RegisterPage } from "./modules/user/pages";
import { UserProfilePage } from "./modules/user";
import LiveChat from "./mini chat/LiveChat";
import AdminUsersPage from "./modules/admin/pages/AdminUserPage";
import AdminProductPage from "./modules/product/pages/AdminProductPage";
import Legal from "./legal/Legal";
import About from "./About/About";
import AdminLayout from "./layout/admin/AdminLayout";
import AdminRoute from "./layout/admin/AdminRoute";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <ScrollToTop />
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* --- BOUTIQUE / HOME --- */}
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/legal" element={<Legal />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/orders/me" element={<MyOrders />} />
                <Route path="/orders/new" element={<OrderForm />} />
                <Route path="/orders/edit/:id" element={<OrderForm />} />

                {/* --- BLOG --- */}
                <Route path="/blog" element={<BlogPage />} />
                <Route
                  path="/blog/admin"
                  element={<Navigate to="/admin/blog" replace />}
                />
                <Route path="/blog/:id" element={<BlogDetailPage />} />

                {/* --- AUTH & PROFIL --- */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/profile" element={<UserProfilePage />} />
                <Route path="/chat" element={<LiveChat />} />

                {/* --- ADMIN (layout + rôle ADMIN) --- */}
                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route
                      index
                      element={<Navigate to="/admin/orders" replace />}
                    />
                    <Route path="orders" element={<AdminDashboard />} />
                    <Route
                      path="orders/archived"
                      element={<AdminArchived />}
                    />
                    <Route path="users" element={<AdminUsersPage />} />
                    <Route path="add-product" element={<AdminProductPage />} />
                    <Route path="blog" element={<AdminBlogPage />} />
                  </Route>
                </Route>

                {/* --- GESTION DES ERREURS --- */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
