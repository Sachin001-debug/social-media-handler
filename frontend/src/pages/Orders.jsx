import { useEffect, useMemo, useState } from "react";
import { ordersApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  processing: "bg-indigo-50 text-indigo-700 border-indigo-200",
  shipped: "bg-purple-50 text-purple-700 border-purple-200",
  delivered: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const PAYMENT_STYLES = {
  paid: "bg-green-50 text-green-700 ring-green-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  failed: "bg-red-50 text-red-700 ring-red-200",
};

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { day: "—", time: "" };
  return {
    day: date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    time: date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

const StatCard = ({ label, value, accent }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
      {label}
    </p>
    <p className={`mt-1 text-2xl font-semibold ${accent}`}>{value}</p>
  </div>
);

const EmptyState = ({ title, text }) => (
  <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
    <p className="text-base font-medium text-gray-900">{title}</p>
    <p className="mt-1 text-sm text-gray-500">{text}</p>
  </div>
);

const SkeletonRows = () => (
  <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex animate-pulse items-center gap-4 p-4">
        <div className="h-9 w-9 rounded-full bg-gray-200" />
        <div className="h-4 w-24 rounded bg-gray-200" />
        <div className="h-4 flex-1 rounded bg-gray-100" />
        <div className="h-4 w-20 rounded bg-gray-200" />
      </div>
    ))}
  </div>
);

const Orders = () => {
  const { fbAccounts } = useAuth();
  const { showToast } = useToast();
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const activeAccountId = fbAccounts.some(
    (account) => String(account.id) === selectedAccountId
  )
    ? selectedAccountId
    : String(fbAccounts[0]?.id || "");

  useEffect(() => {
    if (!activeAccountId) return undefined;

    let active = true;

    ordersApi
      .list(activeAccountId)
      .then((data) => {
        if (active) setOrders(data.orders || []);
      })
      .catch((error) => {
        if (active) {
          setOrders([]);
          showToast(error.message, "danger");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeAccountId, showToast]);

  const handleStatusChange = async (order, status) => {
    setUpdatingOrderId(order.id);
    try {
      const data = await ordersApi.updateStatus(order.id, status);
      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder.id === order.id ? data.order : currentOrder
        )
      );
      showToast("Order status updated", "success");
    } catch (error) {
      showToast(error.message, "danger");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // ---- summary numbers ----
  const stats = useMemo(() => {
    const active = orders.filter((o) => o.status !== "cancelled");
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      paid: orders.filter((o) => o.payment_status === "paid").length,
      revenue: orders
        .filter((o) => o.payment_status === "paid")
        .reduce((sum, o) => sum + Number(o.total || 0), 0),
      activeCount: active.length,
    };
  }, [orders]);

  // ---- filter + search ----
  const visibleOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (!term) return true;
      return [order.order_number, order.client_name, order.fb_username, order.phone]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term));
    });
  }, [orders, statusFilter, search]);

  const countFor = (status) => orders.filter((o) => o.status === status).length;

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
          <p className="mt-1 text-sm text-gray-500">
            Orders are shown only for the selected Facebook Page.
          </p>
        </div>
        {fbAccounts.length > 0 && (
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Facebook Page
            <select
              className="min-w-56 rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={activeAccountId}
              onChange={(event) => {
                setLoading(true);
                setStatusFilter("all");
                setSearch("");
                setSelectedAccountId(event.target.value);
              }}
            >
              {fbAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name || account.fbUserId}
                </option>
              ))}
            </select>
          </label>
        )}
      </header>

      {fbAccounts.length === 0 ? (
        <EmptyState
          title="No Facebook Page connected"
          text="Connect a Facebook Page to view its Messenger orders."
        />
      ) : loading ? (
        <SkeletonRows />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          text="Orders placed through this Page will appear here."
        />
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total orders" value={stats.total} accent="text-gray-900" />
            <StatCard label="Pending" value={stats.pending} accent="text-amber-600" />
            <StatCard label="Paid" value={stats.paid} accent="text-green-600" />
            <StatCard
              label="Paid revenue"
              value={`Rs. ${stats.revenue.toLocaleString()}`}
              accent="text-blue-600"
            />
          </div>

          {/* Toolbar: filter chips + search */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {["all", ...ORDER_STATUSES].map((status) => {
                const selected = statusFilter === status;
                const count = status === "all" ? orders.length : countFor(status);
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition ${
                      selected
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {status} <span className="opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search order, name, phone…"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:w-72"
            />
          </div>

          {/* Table */}
          {visibleOrders.length === 0 ? (
            <EmptyState
              title="No matching orders"
              text="Try a different status or search term."
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Order</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3">Payment</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visibleOrders.map((order) => {
                      const date = formatDate(order.createdAt);
                      return (
                        <tr
                          key={order.id}
                          className="align-middle text-gray-700 transition hover:bg-gray-50"
                        >
                          {/* Order number */}
                          <td className="whitespace-nowrap px-4 py-4">
                            <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs font-semibold text-gray-900">
                              #{order.order_number}
                            </span>
                          </td>

                          {/* Customer */}
                          <td className="min-w-52 px-4 py-4">
                            <div className="flex items-center gap-3">
                              {order.fb_image ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
                                  src={order.fb_image}
                                  alt=""
                                />
                              ) : (
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                                  {(order.fb_username || order.client_name || "?")
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              )}
                              <div className="min-w-0">
                                <p className="truncate font-medium text-gray-900">
                                  {order.fb_username || order.client_name}
                                </p>
                                <p className="truncate text-xs text-gray-500">
                                  {order.client_name}
                                </p>
                                <p className="text-xs text-gray-400">{order.phone}</p>
                              </div>
                            </div>
                          </td>

                          {/* Item */}
                          <td className="min-w-48 px-4 py-4">
                            <p className="font-medium text-gray-900">{order.item}</p>
                            <p className="text-xs text-gray-500">
                              Qty: {order.quantity}
                            </p>
                          </td>

                          {/* Total */}
                          <td className="whitespace-nowrap px-4 py-4 text-right font-semibold text-gray-900">
                            Rs. {Number(order.total).toLocaleString()}
                          </td>

                          {/* Payment method + status together */}
                          <td className="whitespace-nowrap px-4 py-4">
                            <p className="mb-1 text-xs text-gray-500">
                              {order.payment_method === "cash_on_delivery"
                                ? "Cash on delivery"
                                : "Online"}
                            </p>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${
                                PAYMENT_STYLES[order.payment_status] ||
                                "bg-gray-50 text-gray-600 ring-gray-200"
                              }`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              {order.payment_status}
                            </span>
                          </td>

                          {/* Order status (editable) */}
                          <td className="whitespace-nowrap px-4 py-4">
                            <select
                              aria-label={`Update status for order ${order.order_number}`}
                              className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-wait disabled:opacity-60 ${
                                STATUS_STYLES[order.status] ||
                                "border-gray-300 bg-white text-gray-700"
                              }`}
                              value={order.status}
                              disabled={updatingOrderId !== null}
                              onChange={(event) =>
                                handleStatusChange(order, event.target.value)
                              }
                            >
                              {ORDER_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Date */}
                          <td className="whitespace-nowrap px-4 py-4">
                            <p className="text-gray-900">{date.day}</p>
                            <p className="text-xs text-gray-500">{date.time}</p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 text-xs text-gray-500">
                Showing {visibleOrders.length} of {orders.length} orders
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default Orders;