import React, { useCallback, useEffect, useState } from "react";
import { facebookApi } from "../api/client";

const formatDate = (value) => {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not scheduled"
    : date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
};

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700",
  processing: "bg-blue-50 text-blue-700",
  published: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
};

const FbPostTable = ({ refreshKey = 0 }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPosts = useCallback(async () => {
    const result = await facebookApi.scheduledPosts();
    return Array.isArray(result?.posts) ? result.posts : [];
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchPosts()
      .then((savedPosts) => {
        if (!cancelled) {
          setPosts(savedPosts);
          setError("");
        }
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message || "Could not load saved posts.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchPosts, refreshKey]);

  const retryLoadPosts = async () => {
    setLoading(true);
    setError("");
    try {
      setPosts(await fetchPosts());
    } catch (loadError) {
      setError(loadError.message || "Could not load saved posts.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Your Facebook posts</h2>
        <p className="mt-1 text-sm text-slate-500">
          Posts saved for your connected Facebook Pages.
        </p>
      </div>

      {loading ? (
        <p className="px-5 py-8 text-center text-sm text-slate-500">Loading posts…</p>
      ) : error ? (
        <div className="px-5 py-8 text-center">
          <p role="alert" className="text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={retryLoadPosts}
            className="mt-3 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Try again
          </button>
        </div>
      ) : posts.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-slate-500">
          No Facebook posts have been saved yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">Post</th>
                <th scope="col" className="px-5 py-3 font-medium">Facebook Page</th>
                <th scope="col" className="px-5 py-3 font-medium">When</th>
                <th scope="col" className="px-5 py-3 font-medium">Status</th>
                <th scope="col" className="px-5 py-3 font-medium">Media</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {posts.map((post) => (
                <tr key={post.id} className="align-top">
                  <td className="max-w-sm px-5 py-4">
                    <p className="whitespace-pre-wrap break-words text-slate-800">
                      {post.message || "Media post"}
                    </p>
                    {post.link && (
                      <a
                        href={post.link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block truncate text-blue-600 hover:underline"
                      >
                        {post.link}
                      </a>
                    )}
                    {post.errorMessage && (
                      <p className="mt-1 text-xs text-red-600">{post.errorMessage}</p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-700">
                    <p className="font-medium">{post.fbAccount?.name || "Disconnected Page"}</p>
                    {post.fbAccount?.fbUserId && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        Facebook ID {post.fbAccount.fbUserId}
                      </p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                    <p>{post.mode === "schedule" ? formatDate(post.scheduledAt) : "Post now"}</p>
                    <p className="mt-0.5 text-xs capitalize text-slate-500">{post.mode}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[post.status] || "bg-slate-100 text-slate-700"}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-700">
                    {post.mediaType === "none" ? "—" : post.mediaOriginalName || post.mediaType}
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

export default FbPostTable
