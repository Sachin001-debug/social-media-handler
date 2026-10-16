import { useEffect, useState } from "react";
import { ordersApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const STATUS_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
};

const Orders = () => {
  const { fbAccounts } = useAuth();
  const { showToast } = useToast();
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

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

  return (
    <section className="space-y-6">
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
              className="min-w-56 rounded-lg border border-gray-300 bg-white px-3 py-2"
              value={activeAccountId}
              onChange={(event) => {
                setLoading(true);
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
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-600">
          Connect a Facebook Page to view its Messenger orders.
        </div>
      ) : loading ? (
        <p className="py-8 text-center text-gray-500">Loading orders…</p>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-600">
          No orders have been placed through this Page yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="align-top text-gray-700">
                  <td className="whitespace-nowrap px-4 py-4 font-semibold text-gray-900">
                    {order.order_number}
                  </td>
                  <td className="min-w-48 px-4 py-4">
                    <div className="flex items-center gap-3">
                      {order.fb_image ? (
                        <img
                          className="h-9 w-9 rounded-full object-cover"
                          src={order.fb_image}
                          alt=""
                        />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                          {(order.fb_username || order.client_name || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {order.fb_username}
                        </p>
                        <p>{order.client_name}</p>
                        <p className="text-xs text-gray-500">{order.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {order.item}
                    <p className="text-xs text-gray-500">
                      Quantity: {order.quantity}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    Rs. {Number(order.total).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {order.payment_method === "cash_on_delivery"
                      ? "Cash on delivery"
                      : order.payment_method}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <select
                      aria-label={`Update status for order ${order.order_number}`}
                      className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 capitalize disabled:cursor-wait disabled:opacity-60"
                      value={order.status}
                      disabled={updatingOrderId !== null}
                      onChange={(event) =>
                        handleStatusChange(order, event.target.value)
                      }
                    >
                      {[order.status, ...(STATUS_TRANSITIONS[order.status] || [])]
                        .filter(
                          (status, index, statuses) =>
                            statuses.indexOf(status) === index
                        )
                        .map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default Orders;
