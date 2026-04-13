import React, { useEffect, useState } from "react";
import { ProductResponse } from "../type/product";
import { productService } from "../services/productService";
import styles from "./ProductList.module.css";

interface ProductListProps {
  onEdit: (product: ProductResponse) => void;
}

const ProductList: React.FC<ProductListProps> = ({ onEdit }) => {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = "http://localhost:8080";

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAllProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const getImageUrl = (url: string | null | undefined) => {
    if (!url) return null;
    return url.startsWith("http") ? url : `${API_URL}${url}`;
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Supprimer ce produit définitivement ?")) {
      try {
        await productService.deleteProduct(id);
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } catch (err: any) {
        alert("Erreur : " + err.message);
      }
    }
  };

  if (loading)
    return <div className={styles.loader}>Chargement de l'inventaire...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h2>Inventaire</h2>
          <span>{products.length} produits en ligne</span>
        </div>
        <button onClick={fetchProducts} className={styles.refreshBtn}>
          Mettre à jour
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Produit</th>
              <th>Catégorie</th>
              <th>Prix</th>
              <th>Stock</th>
              <th className={styles.textRight}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                {/* Cellule Produit avec Image */}
                <td className={styles.productCell}>
                  <div className={styles.imgThumb}>
                    <img
                      src={getImageUrl(product.imageUrl) || ""}
                      alt={product.name}
                    />
                  </div>
                  <div className={styles.productMeta}>
                    <span className={styles.productName}>{product.name}</span>
                    <span className={styles.productId}>#{product.id}</span>
                  </div>
                </td>

                <td>
                  <span className={`${styles.badge} ${styles[product.type]}`}>
                    {product.type.replace("_", " ")}
                  </span>
                </td>

                <td className={styles.priceCol}>
                  {product.price.toFixed(2)} €
                </td>

                <td>
                  <div
                    className={
                      product.stock > 5 ? styles.stockOk : styles.stockLow
                    }
                  >
                    {product.stock} unités
                  </div>
                </td>

                <td className={styles.actions}>
                  <button
                    className={styles.editBtn}
                    onClick={() => onEdit(product)}
                  >
                    Modifier
                  </button>
                  <button
                    className={styles.delBtn}
                    onClick={() => handleDelete(product.id)}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductList;
