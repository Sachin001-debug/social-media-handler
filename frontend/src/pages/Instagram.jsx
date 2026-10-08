import { CheckCircle2, Link2, Loader2, Trash2 } from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { instagramApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import ScheduleInstaPost from "../components/ScheduleInstaPost";
import InstaPosttable from "../components/InstaPosttable";

//err msgs
const ERROR_MESSAGES = {
  denied: "Instagram login was cancelled.",
  invalid_state: "Login session expired. Please try again.",
  missing_code: "Instagram did not return an authorization code.",
  account_in_use: "That Instagram account is already linked to another user.",
  no_instagram:
    "No Instagram Business or Creator accounts were found on your Facebook Pages.",
  professional_required:
    "Your Page is linked to an Instagram account, but it is not a Business or Creator account. Switch it to a professional account in Instagram, then reconnect.",
  login_failed: "Could not connect to Instagram. Please try again.",
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

const Instagram = () => {
  const [formToggled, setFormToggled] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const handledOAuthResult = useRef(false);
  const [postsRefreshKey, setPostsRefreshKey] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;

    instagramApi
      .accounts()
      .then((data) => {
        if (active) setAccounts(Array.isArray(data?.accounts) ? data.accounts : []);
      })
      .catch((error) => {
        if (active) showToast(error.message, "danger");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [showToast]);

  useEffect(() => {
    const error = searchParams.get("error");
    const connected = searchParams.get("connected");
    const igId = searchParams.get("igId");

    if ((!error && connected !== "true") || handledOAuthResult.current) {
      return;
    }

    handledOAuthResult.current = true;

    if (error) {
      const base = ERROR_MESSAGES[error] || "Instagram login failed.";
      const detail = searchParams.get("reason");
      showToast(detail ? `${base} (${detail})` : base, "danger");
      console.error("Instagram OAuth error:", error, detail || "");
    } else if (connected === "true") {
      showToast(
        igId
          ? `Instagram account connected (ID ${igId}).`
          : "Instagram account connected.",
        "success",
      );
    }

    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams, showToast]);

  const handleConnect = () => {
    setConnecting(true);
    window.location.href = instagramApi.loginUrl();
  };


  //discout the insta
  const handleDisconnect = async (id) => {
    setRemovingId(id);

    try {
      await instagramApi.disconnect(id);
      setAccounts((current) => current.filter((account) => account.id !== id));
      showToast("Instagram account disconnected.", "info");
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
          <h1 className="text-xl font-bold text-[#111827]">Instagram</h1>
          <p className="mt-0.5 text-sm text-[#6B7280]">
            Connected accounts for{" "}
            <span className="font-semibold text-[#111827]">
              {currentUser?.name}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setFormToggled((previous) => !previous)}
          className="group flex shrink-0 items-center gap-2 rounded-lg bg-gradient-to-tr from-[#833AB4] via-[#FD1D1D] to-[#FCB045] bg-[length:200%_200%] bg-left px-5 py-2 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-right hover:shadow-md active:scale-95"
        >
          <Link2
            size={18}
            className="transition-transform duration-200 group-hover:rotate-12"
          />
          Connect
        </button>
      </div>

      {formToggled && (
        <div className="flex justify-end">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg ring-1 ring-black/5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-[#833AB4] via-[#FD1D1D] to-[#FCB045] text-white">
                <FaInstagram size={18} />
              </div>
              <div>
                <h3 className="font-semibold leading-tight text-gray-900">
                  Connect to Instagram
                </h3>
                <p className="text-xs text-gray-500">
                  Connect an Instagram Business or Creator account
                </p>
              </div>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleConnect();
              }}
              className="space-y-3"
            >
              <button
                type="submit"
                disabled={connecting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-tr from-[#833AB4] via-[#FD1D1D] to-[#FCB045] bg-[length:200%_200%] bg-left py-2.5 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-right hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {connecting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <FaInstagram size={16} />
                )}
                {connecting
                  ? "Redirecting to Instagram..."
                  : "Connect with Instagram"}
              </button>

              <button
                type="button"
                disabled={connecting}
                onClick={() => setFormToggled(false)}
                className="w-full text-center text-sm text-gray-500 transition hover:text-gray-700 disabled:opacity-60"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-xl bg-white px-6 py-10 text-sm text-[#6B7280]">
          <Loader2 size={18} className="mr-2 animate-spin" />
          Loading Instagram accounts...
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#D1D5DB] bg-white px-6 py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#C13584]/10 text-[#C13584]">
            <FaInstagram size={20} />
          </div>
          <h2 className="mt-3 text-sm font-semibold text-[#111827]">
            No Instagram accounts connected
          </h2>
          <p className="mt-1 text-xs text-[#6B7280]">
            Connect a Business or Creator account linked to a Facebook Page.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {accounts.map((account) => (
            <li
              key={account.id}
              className="flex items-center gap-3.5 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5"
            >
              {account.profilePictureUrl ? (
                <img
                  src={account.profilePictureUrl}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#C13584]/10 text-[#C13584]">
                  <FaInstagram size={20} />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-[#111827]">
                    {account.username ? `@${account.username}` : "Instagram account"}
                  </p>
                  <CheckCircle2 size={14} className="shrink-0 text-[#16A34A]" />
                </div>
                {account.pageName && (
                  <p className="truncate text-xs text-[#6B7280]">
                    Facebook Page: {account.pageName}
                  </p>
                )}
                <p className="truncate text-xs text-[#9CA3AF]">
                  ID {account.igUserId}
                </p>
              </div>

              {account.connectedAt && (
                <span className="hidden shrink-0 text-xs text-[#6B7280] sm:block">
                  Connected {formatDate(account.connectedAt)}
                </span>
              )}

              <button
                type="button"
                onClick={() => handleDisconnect(account.id)}
                disabled={removingId === account.id}
                aria-label={`Disconnect ${account.username || "Instagram account"}`}
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


    <ScheduleInstaPost onSaved={() => setPostsRefreshKey((key) => key + 1)} />
    <InstaPosttable refreshKey={postsRefreshKey} />
    </>
  );
};

export default Instagram;
