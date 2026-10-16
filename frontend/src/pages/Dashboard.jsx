import React, { useEffect, useMemo, useState } from "react";
import { authApi, facebookApi, instagramApi, ordersApi } from "../api/client";
import {
  FaUserCircle,
  FaFacebookF,
  FaInstagram,
  FaLink,
  FaInbox,
  FaCheckCircle,
  FaShoppingBag,
  FaClock,
  FaMoneyBillWave,
} from "react-icons/fa";

const AccountAvatar = ({ src, alt, fallbackIcon, className }) => {
  const [failed, setFailed] = useState(false);

  // reset if a new picture URL arrives
  useEffect(() => setFailed(false), [src]);

  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full ${className}`}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        fallbackIcon
      )}
    </span>
  );
};

const TONES = {
  blue: {
    icon: "bg-blue-50 text-blue-600 ring-blue-100",
    bar: "from-blue-500 to-sky-400",
    hover: "hover:border-blue-200 hover:shadow-blue-500/10",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600 ring-amber-100",
    bar: "from-amber-400 to-orange-400",
    hover: "hover:border-amber-200 hover:shadow-amber-500/10",
  },
  green: {
    icon: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    bar: "from-emerald-500 to-teal-400",
    hover: "hover:border-emerald-200 hover:shadow-emerald-500/10",
  },
  violet: {
    icon: "bg-violet-50 text-violet-600 ring-violet-100",
    bar: "from-violet-500 to-fuchsia-400",
    hover: "hover:border-violet-200 hover:shadow-violet-500/10",
  },
};

const StatCard = ({ label, value, hint, icon, tone = "blue", loading }) => {
  const t = TONES[tone];
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-xl ${t.hover}`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${t.bar} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          {loading ? (
            <div className="mt-3 h-8 w-20 animate-pulse rounded bg-slate-200" />
          ) : (
            <p className="mt-2 truncate text-3xl font-bold tracking-tight text-slate-900">
              {value}
            </p>
          )}
        </div>
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition-transform duration-300 group-hover:scale-110 ${t.icon}`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-500">{hint}</p>
    </div>
  );
};

const Dashboard = () => {
  const [user, setUser] = useState("");
  const [fbAccounts, setFbAccounts] = useState([]);
  const [instaAccounts, setInstaAccounts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await authApi.me();
      if (res?.user) setUser(res.user.name);
    } catch (err) {
      console.error("User fetch error:", err);
    }
  };

  const fetchFbAccounts = async () => {
    try {
      const res = await facebookApi.accounts();
      if (res?.fbAccounts) setFbAccounts(res.fbAccounts);
    } catch (err) {
      console.error("Facebook accounts error:", err);
    }
  };

  const fetchInstagramAccounts = async () => {
    try {
      const res = await instagramApi.accounts();
      if (res?.accounts) setInstaAccounts(res.accounts);
    } catch (err) {
      console.error("Instagram accounts error:", err);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchFbAccounts();
    fetchInstagramAccounts();
  }, []);

  // load orders for every connected Facebook Page, then combine them
  useEffect(() => {
    if (fbAccounts.length === 0) {
      setOrders([]);
      setOrdersLoading(false);
      return undefined;
    }

    let active = true;
    setOrdersLoading(true);

    Promise.allSettled(fbAccounts.map((account) => ordersApi.list(account.id)))
      .then((results) => {
        if (!active) return;
        const all = results
          .filter((r) => r.status === "fulfilled")
          .flatMap((r) => r.value?.orders || []);
        setOrders(all);
      })
      .finally(() => {
        if (active) setOrdersLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fbAccounts]);

  const orderStats = useMemo(() => {
    const paid = orders.filter((o) => o.payment_status === "paid");
    return {
      received: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      paid: paid.length,
      revenue: paid.reduce((sum, o) => sum + Number(o.total || 0), 0),
    };
  }, [orders]);

  const totalAccounts = fbAccounts.length + instaAccounts.length;

  return (
    <div className="space-y-8">
  
{/* Welcome Section */}
<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
  <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
    {/* Left: avatar + greeting */}
    <div className="flex items-center gap-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xl font-semibold text-white">
        {user ? user.charAt(0).toUpperCase() : <FaUserCircle className="h-7 w-7" />}
      </div>

      <div className="min-w-0">
        <p className="text-sm text-slate-500">
          {new Date().getHours() < 12
            ? "Good morning"
            : new Date().getHours() < 18
              ? "Good afternoon"
              : "Good evening"}
        </p>
        <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900">
          {user || "User"}
        </h1>
      </div>
    </div>

    {/* Right: connected summary */}
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <FaLink className="h-4 w-4 text-blue-600" />
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Connected
        </p>
        <p className="text-sm font-semibold text-slate-900">
          {totalAccounts} account{totalAccounts === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  </div>

  <p className="mt-5 max-w-xl border-t border-slate-100 pt-4 text-sm leading-relaxed text-slate-500">
    Manage your user account(s) from here. Social media handling has never
    been easier.
  </p>
</div>
      {/* Orders overview */}
      <div>
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Orders overview
          </h2>
          <p className="text-xs text-slate-500">
            Across all connected Facebook Pages
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Orders received"
            value={orderStats.received}
            hint="All orders placed in chat"
            icon={<FaShoppingBag className="h-5 w-5" />}
            tone="blue"
            loading={ordersLoading}
          />
          <StatCard
            label="Pending orders"
            value={orderStats.pending}
            hint="Waiting to be confirmed"
            icon={<FaClock className="h-5 w-5" />}
            tone="amber"
            loading={ordersLoading}
          />
          <StatCard
            label="Paid orders"
            value={orderStats.paid}
            hint="Payment received"
            icon={<FaCheckCircle className="h-5 w-5" />}
            tone="green"
            loading={ordersLoading}
          />
          <StatCard
            label="Total revenue"
            value={`Rs. ${orderStats.revenue.toLocaleString()}`}
            hint="From paid orders only"
            icon={<FaMoneyBillWave className="h-5 w-5" />}
            tone="violet"
            loading={ordersLoading}
          />
        </div>
      </div>

      {/* Connected accounts summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1877F2] ring-1 ring-inset ring-blue-100">
              <FaFacebookF className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-500">
                Facebook Pages
              </p>
              <p className="text-xs text-slate-400">Connected</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {fbAccounts.length}
          </p>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600 text-white shadow-sm">
              <FaInstagram className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-500">
                Instagram Accounts
              </p>
              <p className="text-xs text-slate-400">Connected</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {instaAccounts.length}
          </p>
        </div>
      </div>

      {/* Facebook List */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#1877F2]">
            <FaFacebookF className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-slate-900">
              Connected Facebook Pages
            </h2>
            <p className="text-xs text-slate-500">
              {fbAccounts.length} page{fbAccounts.length === 1 ? "" : "s"}{" "}
              linked
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {fbAccounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-100">
                <FaInbox className="h-6 w-6" />
              </span>
              <p className="mt-3 text-sm font-medium text-slate-700">
                No Facebook Pages connected
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Connect a page to start managing it from here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {fbAccounts.map((page) => {
                const name = page.page_name || page.name || "Untitled Page";
                return (
                  <div
                    key={page.id}
                    className="group flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-sm"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <AccountAvatar
                        src={
                          page.id
                            ? facebookApi.pictureUrl(page.id)
                            : page.picture
                        }
                        alt={name}
                        className="bg-blue-50 text-[#1877F2] ring-1 ring-inset ring-blue-100"
                        fallbackIcon={<FaFacebookF className="h-4 w-4" />}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">
                          {name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          ID: {page.fb_user_id || page.page_id || page.id}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                      <FaCheckCircle className="h-3 w-3" />
                      Connected
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Instagram List */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600 text-white">
            <FaInstagram className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-slate-900">
              Connected Instagram Accounts
            </h2>
            <p className="text-xs text-slate-500">
              {instaAccounts.length} account
              {instaAccounts.length === 1 ? "" : "s"} linked
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {instaAccounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-100">
                <FaInbox className="h-6 w-6" />
              </span>
              <p className="mt-3 text-sm font-medium text-slate-700">
                No Instagram Accounts connected
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Connect an account to start managing it from here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {instaAccounts.map((account) => {
                const name =
                  account.username || account.name || "Untitled Account";
                const pic =
                  account.profile_picture_url ||
                  account.profilePictureUrl ||
                  account.profile_picture ||
                  account.picture;
                return (
                  <div
                    key={account.id}
                    className="group flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-pink-200 hover:bg-pink-50/40 hover:shadow-sm"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <AccountAvatar
                        src={pic}
                        alt={name}
                        className="bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600 text-white"
                        fallbackIcon={<FaInstagram className="h-4 w-4" />}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">
                          {name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          ID: {account.instagram_id || account.id}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                      <FaCheckCircle className="h-3 w-3" />
                      Connected
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;