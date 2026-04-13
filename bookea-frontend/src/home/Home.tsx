import React, { useEffect, useState } from "react";
import { useCart } from "../order/cart/CartContext";
import { ProductResponse } from "../modules/product/type/product";
import { productService } from "../modules/product/services/productService";
import styles from "./Home.module.css";
import ProductModal from "./ProductModal";

const Home: React.FC = () => {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  
  // États des Filtres
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [minPrice, setMinPrice] = useState<number>(0);     // 💡 NOUVEAU : Prix Min
  const [maxPrice, setMaxPrice] = useState<number>(1000);  // Prix Max
  
  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null);
  
  const { addToCart } = useCart();
  const API_URL = "http://localhost:8080";

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productService.getAllProducts();
        setProducts(data);

        // On adapte le prix max automatiquement en fonction du catalogue
        if (data.length > 0) {
          const highestPrice = Math.max(...data.map(p => p.price));
          setMaxPrice(Math.ceil(highestPrice));
        }
      } catch (error) {
        console.error("Erreur:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const getImageUrl = (url: string | null) => {
    if (!url) return null;
    return url.startsWith("http") ? url : `${API_URL}${url}`;
  };

  if (loading) return <div className={styles.loader}>Chargement...</div>;

  // 💡 NOUVEAU LOGIQUE : Le prix doit être >= minPrice ET <= maxPrice
  const filteredProducts = products.filter(product => {
    const matchCategory = activeFilter === "ALL" || product.type === activeFilter;
    const matchPrice = product.price >= minPrice && product.price <= maxPrice;
    return matchCategory && matchPrice;
  });

  return (
    <div className={styles.homeContainer}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>L'excellence au quotidien.</h1>
          <p>La sélection premium Bookea Store.</p>
        </div>
      </header>

      <section className={styles.productSection}>
        
        {/* Barre de filtres (Catégories) */}
        <div className={styles.filterContainer} style={{ marginBottom: "1.5rem" }}>
          <button 
            className={`${styles.filterBtn} ${activeFilter === "ALL" ? styles.activeFilter : ""}`}
            onClick={() => setActiveFilter("ALL")}
          >
            Tous
          </button>
          <button 
            className={`${styles.filterBtn} ${activeFilter === "LIVRE" ? styles.activeFilter : ""}`}
            onClick={() => setActiveFilter("LIVRE")}
          >
            Livres
          </button>
          <button 
            className={`${styles.filterBtn} ${activeFilter === "MATERIEL_INFORMATIQUE" ? styles.activeFilter : ""}`}
            onClick={() => setActiveFilter("MATERIEL_INFORMATIQUE")}
          >
            Informatique
          </button>
          <button 
            className={`${styles.filterBtn} ${activeFilter === "HIFI" ? styles.activeFilter : ""}`}
            onClick={() => setActiveFilter("HIFI")}
          >
            Hi-Fi
          </button>
        </div>

        {/* 💡 NOUVEAU : Barre de filtre (Fourchette de Prix Min/Max) */}
        <div className={styles.priceFilterContainer}>
          
          {/* Bloc MIN */}
          <div className={styles.priceInputGroup}>
            <span className={styles.priceLabel}>Min</span>
            <input 
              type="number" 
              className={styles.priceInput}
              value={minPrice} 
              onChange={(e) => setMinPrice(Number(e.target.value))}
              min="0"
            />
            <span>€</span>
          </div>

          <span className={styles.priceSeparator}>à</span>

          {/* Bloc MAX */}
          <div className={styles.priceInputGroup}>
            <span className={styles.priceLabel}>Max</span>
            <input 
              type="number" 
              className={styles.priceInput}
              value={maxPrice} 
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              min="0"
            />
            <span>€</span>
          </div>

        </div>

        <div className={styles.grid}>
          {filteredProducts.map((product) => (
            <div 
              key={product.id} 
              className={styles.card}
            >
              <div className={styles.imageWrapper}>
                {product.imageUrl ? (
                  <img
                    src={getImageUrl(product.imageUrl)!}
                    alt={product.name}
                  />
                ) : (
                  <div className={styles.placeholder}>BOOKEA</div>
                )}
                <span className={`${styles.badge} ${styles[product.type]}`}>
                  {product.type.replace("_", " ")}
                </span>
              </div>

              <div className={styles.content}>
                <h3 className={styles.productName}>{product.name}</h3>
                <div className={styles.cardFooter}>
                  <span className={styles.price}>
                    {product.price.toFixed(2)} €
                  </span>
                  
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      className={styles.addBtn}
                      style={{ backgroundColor: "#f2f2f2", color: "#1d1d1f" }}
                      onClick={() => setSelectedProduct(product)}
                    >
                      DÉTAILS
                    </button>
                    
                    <button
                      className={styles.addBtn}
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0}
                    >
                      {product.stock > 0 ? "AJOUTER" : "ÉPUISÉ"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Message si aucun produit */}
        {filteredProducts.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem", color: "#86868b", fontWeight: "600" }}>
            Aucun produit ne correspond à ces critères de recherche.
          </div>
        )}
      </section>

      {/* Modale */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
          getImageUrl={getImageUrl}
        />
      )}
    </div>
  );
};

export default Home;