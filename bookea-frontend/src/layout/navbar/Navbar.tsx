import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../../order/cart/CartContext";
import { useAuth } from "../../modules/auth/context/AuthContext";
import styles from "./Navbar.module.css";

const Navbar: React.FC = () => {
  const { itemCount } = useCart();
  const { isAuthenticated, logout, user } = useAuth(); // On récupère l'utilisateur pour vérifier le rôle
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) =>
    location.pathname === path ? styles.active : "";

  const blogNavClass =
    location.pathname === "/blog" || location.pathname.startsWith("/blog/")
      ? styles.active
      : "";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // On affiche l'admin seulement si l'utilisateur est ADMIN
const isAdmin = user?.role?.includes("ADMIN");

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <Link to="/">
          Bookea<span> Store</span>
        </Link>
      </div>

      <ul className={styles.navLinks}>
        <li><Link to="/" className={isActive("/")}>Accueil</Link></li>
        <li><Link to="/blog" className={blogNavClass}>Blog</Link></li>
        <li><Link to="/orders/me" className={isActive("/orders/me")}>Mes Commandes</Link></li>
        <li>
          <Link to="/" className={isActive("/")}>
            Accueil
          </Link>
        </li>
        <li>
          <Link to="/orders/me" className={isActive("/orders/me")}>
            Mes Commandes
          </Link>
        </li>

        {isAuthenticated && (
          <li>
            <Link to="/profile" className={isActive("/profile")}>
              Mon Profil
            </Link>
          </li>
        )}

        {/* --- MENU DÉROULANT ADMIN --- */}
        {isAdmin && (
          <li className={styles.adminDropdown}>
            <span className={styles.adminTrigger}>
              Espace Admin <span className={styles.chevron}>▾</span>
            </span>
            <ul className={styles.dropdownMenu}>
              <li>
                <Link
                  to="/admin/add-product"
                  className={isActive("/admin/add-product")}
                >
                  📦 Produits
                </Link>
              </li>
              <li>
                <Link to="/admin/orders" className={isActive("/admin/orders")}>
                  📑 Commandes
                </Link>
              </li>
              <li>
                <Link to="/admin/users" className={isActive("/admin/users")}>
                  👥 Utilisateurs
                </Link>
              </li>
              <li>
                <Link to="/admin/blog" className={isActive("/admin/blog")}>
                  📝 Gestion du Blog
                </Link>
              </li>
            </ul>
          </li>
        )}
      </ul>

      <div className={styles.actions}>
        {isAuthenticated ? (
          <button onClick={handleLogout} className={styles.registerButton}>
            Déconnexion
          </button>
        ) : (
          <>
            <Link to="/login" className={styles.authLink}>
              Connexion
            </Link>
            <Link to="/register" className={styles.registerButton}>
              S'inscrire
            </Link>
          </>
        )}

        <Link to="/cart" className={styles.cartButton}>
          <span className={styles.cartIcon}>🛒</span>
          <span className={styles.cartText}>Panier</span>
          {itemCount > 0 && <span className={styles.badge}>{itemCount}</span>}
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
