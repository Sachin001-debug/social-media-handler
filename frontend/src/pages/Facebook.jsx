import { Link2, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { FaFacebookF } from "react-icons/fa";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { facebookApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import ScheduleFbPost from "../components/ScheduleFbPost";
import FbPostTable from "../components/FbPostTable";

const ERROR_MESSAGES = {
  denied: "Facebook login was cancelled.",
  invalid_state: "Login session expired. Please try again.",
  missing_code: "Facebook did not return an authorization code.",
  account_in_use: "That Facebook account is already linked to another user.",
  login_failed: "Could not connect to Facebook. Please try again.",
  session_expired: "Your session expired. Please sign in again.",
};

const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const Facebook = () => {
  const [formToggled, setFormToggled] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [postsRefreshKey, setPostsRefreshKey] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, fbAccounts, refreshFbAccounts } = useAuth();
  const { showToast } = useToast();

  // Handle the redirect back from Facebook
  useEffect(() => {
    const error = searchParams.get("error");
    const connected = searchParams.get("connected");
    const fbId = searchParams.get("fbId");

    if (error) {
      showToast(ERROR_MESSAGES[error] || "Facebook login failed.", "danger");
    } else if (connected === "true") {
      showToast(
        fbId ? `Facebook account connected (ID ${fbId}).` : "Facebook account connected.",
        "success"
      );
    } else {
      return;
    }

    // Clear the query string so a refresh does not re-trigger
    refreshFbAccounts().catch(() => {});
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = () => {
    setConnecting(true);
    window.location.href = facebookApi.loginUrl();
  };

  const handleDisconnect = async (id) => {
    setRemovingId(id);

    try {
      const data = await facebookApi.disconnect(id);
      await refreshFbAccounts();
      showToast("Facebook account disconnected.", "info");
      return data;
    } catch (error) {
      showToast(error.message, "danger");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#111827]">Facebook</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Connected accounts for{" "}
            <span className="font-semibold text-[#111827]">
              {currentUser?.name}
            </span>
          </p>
        </div>

        <div
          onClick={() => setFormToggled((prev) => !prev)}
          className="group flex shrink-0 items-center gap-2 px-5 py-2 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer bg-[#1877F2] hover:bg-[#166FE5]"
        >
          <Link2
            size={18}
            className="transition-transform duration-200 group-hover:rotate-12"
          />
          Connect
        </div>
      </div>

      {formToggled && (
        <div className="flex justify-end">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-lg ring-1 ring-black/5 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1877F2] text-white">
                <FaFacebookF size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 leading-tight">
                  Connect to Facebook
                </h3>
                <p className="text-xs text-gray-500">
                  You can connect more than one account
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleConnect();
              }}
              className="space-y-3"
            >
              <button
                type="submit"
                disabled={connecting}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#1877F2] hover:bg-[#166FE5] disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-2.5 transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md"
              >
                {connecting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <FaFacebookF size={16} />
                )}
                {connecting
                  ? "Redirecting to Facebook..."
                  : "Connect with Facebook"}
              </button>

              <button
                type="button"
                onClick={() => setFormToggled(false)}
                disabled={connecting}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {fbAccounts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#D1D5DB] bg-white px-6 py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1877F2]/10 text-[#1877F2]">
            <FaFacebookF size={20} />
          </div>
          <h2 className="mt-3 text-sm font-semibold text-[#111827]">
            No Facebook accounts connected
          </h2>
          <p className="mt-1 text-xs text-[#6B7280]">
            Connect an account to start scheduling posts.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {fbAccounts.map((account) => (
            <li
              key={account.id}
              className="flex items-center gap-3.5 rounded-xl bg-white p-4 ring-1 ring-black/5 shadow-sm"
            >
              {account.picture ? (
                <img
                  src={account.picture}
                  alt={account.name || "Facebook profile"}
                  className="h-11 w-11 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1877F2] text-white">
                  <FaFacebookF size={18} />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-[#111827]">
                    {account.name || "Facebook user"}
                  </p>
                  <CheckCircle2 size={14} className="shrink-0 text-[#16A34A]" />
                </div>
                {account.email && (
                  <p className="truncate text-xs text-[#6B7280]">
                    {account.email}
                  </p>
                )}
                <p className="truncate text-xs text-[#9CA3AF]">
                  ID {account.fbUserId}
                </p>
              </div>

              {account.connectedAt && (
                <span className="hidden shrink-0 text-xs text-[#6B7280] sm:block">
                  Connected {formatDate(account.connectedAt)}
                </span>
              )}

              <button
                onClick={() => handleDisconnect(account.id)}
                disabled={removingId === account.id}
                aria-label={`Disconnect ${account.name || "account"}`}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-xs font-medium text-[#6B7280] transition-colors hover:border-[#DC2626] hover:bg-red-50 hover:text-[#DC2626] disabled:opacity-60"
              >
                {removingId === account.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Disconnect
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>

    <ScheduleFbPost onSaved={() => setPostsRefreshKey((key) => key + 1)} />
    <FbPostTable refreshKey={postsRefreshKey} />
    </>
  );
};

export default Facebook;