import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import styles from "./AdminLayout.module.css";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink;

const AdminLayout: React.FC = () => {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandTitle}>Bookea</span>
          <span className={styles.brandSub}>Administration</span>
        </div>
        <nav className={styles.nav}>
          <NavLink to="/admin/orders" className={navLinkClass} end>
            Commandes
          </NavLink>
          <NavLink to="/admin/orders/archived" className={navLinkClass}>
            Commandes archivées
          </NavLink>
          <NavLink to="/admin/add-product" className={navLinkClass}>
            Produits
          </NavLink>
          <NavLink to="/admin/users" className={navLinkClass}>
            Utilisateurs
          </NavLink>
          <NavLink to="/admin/blog" className={navLinkClass}>
            Gestion du Blog
          </NavLink>
        </nav>
        <NavLink to="/" className={styles.backShop}>
          ← Retour à la boutique
        </NavLink>
      </aside>
      <section className={styles.content}>
        <Outlet />
      </section>
    </div>
  );
};

export default AdminLayout;
