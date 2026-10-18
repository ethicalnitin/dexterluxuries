import React from "react";
import { Link } from "react-router-dom";
import { Badge, Price } from "../ui";
import { getStartingPlan, getPlanPricing, isProductInStock } from "../../utils/pricing";
import ProductImage from "./ProductImage";
import "./store.css";

/**
 * Catalog card. The whole card is clickable through the product-name link
 * (stretched over the card), so there's one link per card for keyboard and
 * screen-reader users. Sold-out products render without a link.
 *
 * `rank` (optional) shows a "#1" marker, used by the weekly top picks.
 */
export default function ProductCard({ product, rank = null }) {
  const inStock = isProductInStock(product);
  const { price, strike, discountPct } = getPlanPricing(getStartingPlan(product));
  const isMultiPlan = Array.isArray(product.plans) && product.plans.length > 1;
  const href = `/product/${product.id}`;

  return (
    <article className={`product-card${inStock ? "" : " product-card--soldout"}`}>
      <div className="product-card__media">
        <ProductImage src={product.image} name={product.name} />
        <div className="product-card__flags">
          {rank && <span className="product-card__rank">#{rank}</span>}
          {!inStock ? (
            <Badge variant="danger">Out of stock</Badge>
          ) : discountPct ? (
            <Badge variant="success">-{discountPct}%</Badge>
          ) : null}
        </div>
      </div>

      <div className="product-card__body">
        {product.category && <span className="product-card__category">{product.category}</span>}
        <h3 className="product-card__name">
          {inStock ? (
            <Link to={href} className="product-card__link">
              {product.name}
            </Link>
          ) : (
            product.name
          )}
        </h3>
        <div className="product-card__footer">
          <Price amount={price} strike={strike} from={isMultiPlan} size="sm" />
          {inStock && <span className="product-card__cta" aria-hidden="true">View →</span>}
        </div>
      </div>
    </article>
  );
}
