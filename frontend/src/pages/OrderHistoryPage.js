import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LuArrowRight, LuReceipt, LuRefreshCw } from "react-icons/lu";
import { useAuth } from "./AuthContext";
import { listOrders } from "../api/orders";
import { Badge, Button, PageHeader, Section, StatusMessage } from "../components/ui";
import { formatDateTime, itemsSummary, statusInfo } from "../utils/orders";
import { formatINR } from "../utils/pricing";
import "./OrderHistoryPage.css";

export default function OrderHistoryPage() {
  const { authRequest } = useAuth();
  const [orders, setOrders] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState("");

  const loadFirstPage = useCallback(() => {
    setState("loading");
    listOrders(authRequest)
      .then((data) => {
        setOrders(data.orders || []);
        setNextCursor(data.nextCursor || null);
        setState("ready");
      })
      .catch((err) => {
        setError(err.message);
        setState("error");
      });
  }, [authRequest]);

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = async () => {
    setLoadingMore(true);
    setMoreError("");
    try {
      const data = await listOrders(authRequest, nextCursor);
      setOrders((current) => [...current, ...(data.orders || [])]);
      setNextCursor(data.nextCursor || null);
    } catch (err) {
      setMoreError(err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  let body;
  if (state === "loading") {
    body = <StatusMessage loading title="Loading your orders…" />;
  } else if (state === "error") {
    body = (
      <StatusMessage
        icon={<LuRefreshCw />}
        title="We couldn't load your orders"
        text={error}
        action={
          <Button variant="secondary" icon={<LuRefreshCw />} onClick={loadFirstPage}>
            Try again
          </Button>
        }
      />
    );
  } else if (orders.length === 0) {
    body = (
      <StatusMessage
        icon={<LuReceipt />}
        title="No orders yet"
        text="When you place an order, it'll appear here with its payment and delivery status."
        action={
          <Button to="/" variant="primary" iconRight={<LuArrowRight />}>
            Browse products
          </Button>
        }
      />
    );
  } else {
    body = (
      <>
        <ul className="order-list">
          {orders.map((order) => {
            const info = statusInfo(order.status);
            return (
              <li key={order.id} className="order-row">
                <div className="order-row__main">
                  <Link to={`/orders/${order.id}`} className="order-row__ref">
                    {order.orderRef}
                  </Link>
                  <span className="order-row__items">{itemsSummary(order.items)}</span>
                  <span className="order-row__meta">
                    {formatDateTime(order.createdAt)} · {order.itemCount === 1 ? "1 item" : `${order.itemCount} items`}
                  </span>
                </div>
                <Badge variant={info.variant} className="order-row__status">
                  {info.label}
                </Badge>
                <span className="order-row__total ui-num">₹{formatINR(order.totalInr)}</span>
                {order.status === "pending_payment" || order.status === "payment_failed" ? (
                  <Button to={`/orders/${order.id}`} variant="primary" size="sm" className="order-row__action">
                    Pay now
                  </Button>
                ) : (
                  <Button to={`/orders/${order.id}`} variant="secondary" size="sm" className="order-row__action" aria-label={`View order ${order.orderRef}`}>
                    View
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
        {nextCursor && (
          <div className="order-list__more">
            <Button variant="secondary" loading={loadingMore} onClick={loadMore}>
              Load more orders
            </Button>
            {moreError && <p className="ui-field-error">{moreError}</p>}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="order-history">
      <PageHeader title="Your orders" description="Payment and delivery status for everything you've ordered." />
      <Section>{body}</Section>
    </div>
  );
}
