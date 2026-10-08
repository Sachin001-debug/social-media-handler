import React, { useEffect, useState } from "react";
import { authApi, facebookApi, instagramApi } from "../api/client";
import {
  FaUserCircle,
  FaFacebookF,
  FaInstagram,
  FaLink,
  FaInbox,
  FaCheckCircle,
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

const Dashboard = () => {
  const [user, setUser] = useState("");
  const [fbAccounts, setFbAccounts] = useState([]);
  const [instaAccounts, setInstaAccounts] = useState([]);

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

  const totalAccounts = fbAccounts.length + instaAccounts.length;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700">
              <FaUserCircle className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Welcome back</p>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {user || "User"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <FaLink className="h-4 w-4 text-slate-500" />
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

        <p className="relative mt-5 max-w-xl text-sm leading-relaxed text-slate-500">
          Manage your user account(s) from here. Social media handling has
          never been easier.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300  hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/10">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-sky-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Facebook Pages</p>
              <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
                {fbAccounts.length}
              </p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#1877F2] ring-1 ring-inset ring-blue-100 transition-transform duration-300 group-hover:scale-110">
              <FaFacebookF className="h-6 w-6" />
            </span>
          </div>
          <p className="mt-4 text-sm text-slate-500">Connected Facebook Pages</p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300  hover:border-pink-200 hover:shadow-xl hover:shadow-pink-500/10">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Instagram Accounts</p>
              <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
                {instaAccounts.length}
              </p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600 text-white shadow-sm transition-transform duration-300 group-hover:scale-110">
              <FaInstagram className="h-6 w-6" />
            </span>
          </div>
          <p className="mt-4 text-sm text-slate-500">Connected Instagram Accounts</p>
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
              {fbAccounts.length} page{fbAccounts.length === 1 ? "" : "s"} linked
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
                        <p className="truncate font-medium text-slate-900">{name}</p>
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
                        <p className="truncate font-medium text-slate-900">{name}</p>
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