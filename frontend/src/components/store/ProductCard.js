import React from "react";
import { Link } from "react-router-dom";
import { Price } from "../ui";
import theme from "../../theme/theme";
import { formatPlanDuration, getStartingPlan, getPlanPricing, isProductInStock, shortPlanName } from "../../utils/pricing";
import ProductImage from "./ProductImage";
import "./store.css";

export function categoryTint(category) {
  const tints = theme.categoryTints;
  const key = String(category || "");
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return tints[hash % tints.length];
}

function productSummary(product) {
  const { price, strike, discountPct } = getPlanPricing(getStartingPlan(product));
  return {
    inStock: isProductInStock(product),
    price,
    strike,
    discountPct,
    isMultiPlan: Array.isArray(product.plans) && product.plans.length > 1,
    href: `/product/${product.id}`,
  };
}

function PlanChips({ plans }) {
  if (!Array.isArray(plans) || plans.length === 0) return null;
  const names = plans.map(formatPlanDuration);
  const shown = plans.slice(0, 3);
  const extra = plans.length - shown.length;
  return (
    <p className="product-card__plans">
      <span className="ui-visually-hidden">{plans.length === 1 ? `Plan: ${names[0]}` : `${plans.length} plans: ${names.join(", ")}`}</span>
      {shown.map((plan, i) => (
        <span key={`${names[i]}-${i}`} className="plan-chip" aria-hidden="true">
          {plans.length === 1 ? names[i] : shortPlanName(plan)}
        </span>
      ))}
      {extra > 0 && (
        <span className="plan-chip" aria-hidden="true">
          +{extra}
        </span>
      )}
    </p>
  );
}

export default function ProductCard({ product }) {
  const { inStock, price, strike, discountPct, isMultiPlan, href } = productSummary(product);
  const maker = product.brand || product.category;

  return (
    <article className={`product-card${inStock ? "" : " product-card--soldout"}`}>
      <div className="product-card__media" style={{ "--tint": categoryTint(product.category) }}>
        <ProductImage src={product.image} name={product.name} />
        {!inStock && <span className="product-card__soldout">Out of stock</span>}
      </div>

      <div className="product-card__body">
        {maker && <p className="product-card__brand">{maker}</p>}
        <h3 className="product-card__name">
          {inStock ? (
            <Link to={href} className="product-card__link">
              {product.name}
            </Link>
          ) : (
            product.name
          )}
        </h3>
        <PlanChips plans={product.plans} />
        <div className="product-card__price">
          <Price amount={price} strike={strike} from={isMultiPlan} size="sm" />
          {inStock && discountPct ? <span className="deal-tag">{discountPct}% off</span> : null}
        </div>
      </div>
    </article>
  );
}

export function ProductRow({ product }) {
  const { inStock, price, discountPct, isMultiPlan, href } = productSummary(product);

  return (
    <div className={`product-row${inStock ? "" : " product-row--soldout"}`}>
      <span className="product-row__thumb" style={{ "--tint": categoryTint(product.category) }}>
        <ProductImage src={product.image} name={product.name} />
      </span>
      <span className="product-row__text">
        <span className="product-row__brand">{product.brand || product.category}</span>
        {inStock ? (
          <Link to={href} className="product-row__name product-card__link">
            {product.name}
          </Link>
        ) : (
          <span className="product-row__name">{product.name}</span>
        )}
        <span className="product-row__price">
          <Price amount={price} from={isMultiPlan} size="sm" />
          {!inStock ? (
            <span className="product-row__soldout">Out of stock</span>
          ) : discountPct ? (
            <span className="deal-tag">{discountPct}% off</span>
          ) : null}
        </span>
      </span>
    </div>
  );
}
