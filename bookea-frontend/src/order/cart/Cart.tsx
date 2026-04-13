import React from "react";
import { useCart } from "../cart/CartContext";
import { orderService } from "../service/orderService";
import styles from "./Cart.module.css";

const Cart: React.FC = () => {
  const { items, removeFromCart, updateQuantity, totalPrice, clearCart } =
    useCart();
  const API_URL = "http://localhost:8080";

  const handleCheckout = async () => {
    const request = {
      items: items.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
      })),
    };

    try {
      await orderService.placeOrder(request);
      clearCart();
      window.location.href = "/orders/me";
    } catch (error) {
      alert("Erreur lors de la validation de la commande");
    }
  };

  const getImageUrl = (url: string | null) => {
    if (!url) return null;
    return url.startsWith("http") ? url : `${API_URL}${url}`;
  };

  if (items.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyIcon}>🛒</div>
        <h2>Votre panier est vide</h2>
        <p>Parcourez notre collection pour trouver l'excellence.</p>
        <button
          onClick={() => (window.location.href = "/")}
          className={styles.continueBtn}
        >
          Retour à la boutique
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Votre Sélection</h1>

      <div className={styles.grid}>
        <div className={styles.itemsList}>
          {items.map((item) => (
            <div key={item.product.id} className={styles.item}>
              {/* Miniature Image */}
              <div className={styles.imageWrapper}>
                <img
                  /* On ajoute ?? null pour rassurer TypeScript */
                  src={getImageUrl(item.product.imageUrl ?? null) || ""}
                  alt={item.product.name}
                />
              </div>

              <div className={styles.details}>
                <span
                  className={`${styles.badge} ${styles[item.product.type]}`}
                >
                  {item.product.type.replace("_", " ")}
                </span>
                <h3>{item.product.name}</h3>
                <p className={styles.itemPrice}>
                  {item.product.price.toFixed(2)} €
                </p>
              </div>

              <div className={styles.actions}>
                <div className={styles.quantityControl}>
                  <button
                    onClick={() =>
                      updateQuantity(item.product.id, item.quantity - 1)
                    }
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() =>
                      updateQuantity(item.product.id, item.quantity + 1)
                    }
                  >
                    +
                  </button>
                </div>
                <button
                  className={styles.removeBtn}
                  onClick={() => removeFromCart(item.product.id)}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Résumé */}
        <aside className={styles.summaryCard}>
          <h2>Résumé</h2>
          <div className={styles.summaryLine}>
            <span>Sous-total</span>
            <span>{totalPrice.toFixed(2)} €</span>
          </div>
          <div className={styles.summaryLine}>
            <span>Livraison</span>
            <span className={styles.free}>Offerte</span>
          </div>
          <div className={styles.divider}></div>
          <div className={styles.totalLine}>
            <span>Total</span>
            <span className={styles.finalAmount}>
              {totalPrice.toFixed(2)} €
            </span>
          </div>
          <button className={styles.checkoutBtn} onClick={handleCheckout}>
            VALIDER LA COMMANDE
          </button>
        </aside>
      </div>
    </div>
  );
};

export default Cart;
