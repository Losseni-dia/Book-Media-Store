// src/modules/home/ProductModal.tsx
import React from "react";
import { ProductResponse } from "../modules/product/type/product";
import styles from "./ProductModal.module.css";

interface ProductModalProps {
  product: ProductResponse;
  onClose: () => void;
  onAddToCart: (product: ProductResponse) => void;
  getImageUrl: (url: string | null) => string | null;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onAddToCart, getImageUrl }) => {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>

        <div className={styles.modalContent}>
          {/* Section Image */}
          <div className={styles.imageSection}>
            {product.imageUrl ? (
              <img src={getImageUrl(product.imageUrl)!} alt={product.name} />
            ) : (
              <div className={styles.placeholder}>BOOKEA</div>
            )}
          </div>

          {/* Section Infos */}
          <div className={styles.infoSection}>
            <span className={`${styles.badge} ${styles[product.type]}`}>
              {product.type.replace("_", " ")}
            </span>
            
            <h2 className={styles.title}>{product.name}</h2>
            <div className={styles.price}>{product.price.toFixed(2)} €</div>

            <p className={styles.description}>
              {product.description || "Aucune description détaillée n'est disponible pour ce produit."}
            </p>

            {/* Détails spécifiques selon le type */}
            <div className={styles.specifics}>
              {product.type === "LIVRE" && (
                <>
                  <div className={styles.specificItem}>Auteur : <span>{product.author || "Non renseigné"}</span></div>
                  <div className={styles.specificItem}>Catégorie : <span>{product.category || "N/A"}</span></div>
                  <div className={styles.specificItem}>Pages : <span>{product.pageCount || "N/A"}</span></div>
                </>
              )}
              {product.type === "MATERIEL_INFORMATIQUE" && (
                <>
                  <div className={styles.specificItem}>Marque : <span>{product.brand || "Non renseignée"}</span></div>
                  <div className={styles.specificItem}>Processeur : <span>{product.processor || "N/A"}</span></div>
                  <div className={styles.specificItem}>RAM : <span>{product.ramSize ? `${product.ramSize} Go` : "N/A"}</span></div>
                </>
              )}
              {product.type === "HIFI" && (
                <>
                  <div className={styles.specificItem}>Modèle : <span>{product.model || "Non renseigné"}</span></div>
                  <div className={styles.specificItem}>Puissance : <span>{product.powerWatts ? `${product.powerWatts}W` : "N/A"}</span></div>
                </>
              )}
              <div className={styles.specificItem} style={{ marginTop: '15px' }}>
                Disponibilité : <span style={{ color: product.stock > 0 ? '#10b981' : '#ef4444' }}>
                  {product.stock > 0 ? `${product.stock} en stock` : "Rupture de stock"}
                </span>
              </div>
            </div>

            <button
              className={styles.addBtn}
              onClick={() => {
                onAddToCart(product);
                // Optionnel : fermer la modale après l'ajout en décommentant la ligne dessous
                // onClose(); 
              }}
              disabled={product.stock === 0}
            >
              {product.stock > 0 ? "Ajouter au panier" : "Épuisé"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;