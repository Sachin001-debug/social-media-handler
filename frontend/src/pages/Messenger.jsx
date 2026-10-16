import { Link2, Loader2, RefreshCw, Send, CheckCircle2, File, X } from "lucide-react";
import { FaFacebookMessenger } from "react-icons/fa";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { facebookApi, messengerApi } from "../api/client";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import FacebookPageAvatar from "../components/FacebookPageAvatar";

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const initial = (name) => (name ? name.trim().charAt(0).toUpperCase() : "?");

const Messenger = () => {
  const { fbAccounts } = useAuth();
  const { showToast } = useToast();

  const [selectedAccountId, setSelectedAccountId] = useState(
    fbAccounts[0]?.id ?? null
  );
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const fileInputRef = useRef(null);
  const threadEndRef = useRef(null);

  // Keep the selected Page valid as accounts load/change
  useEffect(() => {
    if (!fbAccounts.length) {
      setSelectedAccountId(null);
      return;
    }
    setSelectedAccountId((prev) =>
      prev && fbAccounts.some((acc) => acc.id === prev) ? prev : fbAccounts[0].id
    );
  }, [fbAccounts]);

  const loadConversations = useCallback(
    async (accountId = selectedAccountId, { silent = false } = {}) => {
      if (!accountId) return;

      if (!silent) setConversationsLoading(true);
      try {
        const data = await messengerApi.conversations(accountId);
        setConversations(data.conversations || []);
      } catch (error) {
        showToast(error.message, "danger");
        setConversations([]);
      } finally {
        if (!silent) setConversationsLoading(false);
      }
    },
    [selectedAccountId, showToast]
  );

  useEffect(() => {
    setSelectedConversation(null);
    setMessages([]);
    setConversations([]);
    loadConversations(selectedAccountId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccountId]);

  useEffect(() => {
    if (!selectedConversation || !selectedAccountId) return;

    let active = true;
    setMessagesLoading(true);

    messengerApi
      .messages(selectedAccountId, selectedConversation.id)
      .then((data) => {
        if (active) setMessages(data.messages || []);
      })
      .catch((error) => {
        if (active) {
          showToast(error.message, "danger");
          setMessages([]);
        }
      })
      .finally(() => {
        if (active) setMessagesLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation, selectedAccountId]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Build (and clean up) a preview URL whenever the selected file changes
  useEffect(() => {
    if (!selectedFile) {
      setFilePreview(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const handleConnect = () => {
    window.location.href = facebookApi.loginUrl();
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = reply.trim();
    if ((!text && !selectedFile) || !selectedConversation || !selectedAccountId)
      return;

    // Capture the file before clearing state
    const fileToSend = selectedFile;
    const previewUrl = filePreview;

    setSending(true);
    try {
      await messengerApi.sendMessage(
        selectedAccountId,
        selectedConversation.id,
        {
          recipientId: selectedConversation.participant?.id,
          message: text,
          file: fileToSend,
        }
      );

      // Build a local attachment so the sent image appears immediately.
      // Note: we intentionally DON'T revoke the preview URL here because
      // it's now referenced by the message in the thread.
      const localAttachments = fileToSend
        ? [
            {
              id: `local-att-${Date.now()}`,
              imageUrl: previewUrl,
            },
          ]
        : [];

      // Reflect the sent message locally
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          createdTime: new Date().toISOString(),
          message: text,
          fromPage: true,
          attachments: localAttachments,
        },
      ]);

      setReply("");
      // Clear the input without revoking the URL we just handed to the message.
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      showToast(error.message, "danger");
    } finally {
      setSending(false);
    }
  };

  if (!fbAccounts.length) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[#111827]">Messenger</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Chat with people who message your Facebook Page.
          </p>
        </div>

        <div className="rounded-xl border border-dashed border-[#D1D5DB] bg-white px-6 py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#00C6FF] to-[#006AFF] text-white">
            <FaFacebookMessenger size={22} />
          </div>
          <h2 className="mt-3 text-sm font-semibold text-[#111827]">
            No Facebook Page connected
          </h2>
          <p className="mt-1 text-xs text-[#6B7280]">
            Connect a Page to view and reply to its Messenger conversations.
          </p>
          <button
            type="button"
            onClick={handleConnect}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#0084FF] to-[#006AFF] px-5 py-2 font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md active:scale-95"
          >
            <Link2 size={18} />
            Connect Facebook
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#111827]">Messenger</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Conversations for your connected Page.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadConversations(selectedAccountId)}
          disabled={conversationsLoading}
          className="group flex shrink-0 items-center gap-2 rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#374151] transition-colors hover:bg-[#F8FAFC] disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={conversationsLoading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {fbAccounts.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {fbAccounts.map((account) => (
            <button
              key={account.id}
              type="button"
              onClick={() => setSelectedAccountId(account.id)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                account.id === selectedAccountId
                  ? "border-[#0084FF] bg-[#0084FF]/10 text-[#006AFF]"
                  : "border-[#E5E7EB] text-[#6B7280] hover:bg-[#F8FAFC]"
              }`}
            >
              <FacebookPageAvatar account={account} className="h-5 w-5" />
              <span className="max-w-[10rem] truncate">{account.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[20rem_1fr]">
        {/* Conversation list */}
        <div className="rounded-xl bg-white ring-1 ring-black/5 shadow-sm overflow-hidden">
          <div className="border-b border-[#E5E7EB] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Inbox
            </p>
          </div>

          <div className="max-h-[65vh] overflow-y-auto">
            {conversationsLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-[#6B7280]">
                <Loader2 size={16} className="animate-spin" />
                Loading conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm font-medium text-[#111827]">
                  No conversations
                </p>
                <p className="mt-1 text-xs text-[#6B7280]">
                  Messages will appear here once someone writes to your Page.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[#F3F4F6]">
                {conversations.map((conversation) => {
                  const active = selectedConversation?.id === conversation.id;
                  return (
                    <li key={conversation.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedConversation(conversation)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                          active ? "bg-[#0084FF]/5" : "hover:bg-[#F8FAFC]"
                        }`}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E5E7EB] text-sm font-semibold text-[#374151]">
                          {initial(conversation.participant?.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-[#111827]">
                              {conversation.participant?.name || "Facebook user"}
                            </p>
                            <span className="shrink-0 text-[10px] text-[#9CA3AF]">
                              {formatTime(conversation.updatedTime)}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-[#6B7280]">
                            {conversation.snippet || "No messages yet"}
                          </p>
                        </div>
                        {conversation.unreadCount > 0 && (
                          <span className="mt-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0084FF] px-1.5 text-[10px] font-semibold text-white">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Thread */}
        <div className="flex min-h-[65vh] flex-col rounded-xl bg-white ring-1 ring-black/5 shadow-sm overflow-hidden">
          {!selectedConversation ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#00C6FF] to-[#006AFF] text-white">
                <FaFacebookMessenger size={22} />
              </div>
              <p className="mt-3 text-sm font-semibold text-[#111827]">
                Select a conversation
              </p>
              <p className="mt-1 text-xs text-[#6B7280]">
                Pick a chat on the left to read and reply.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-[#E5E7EB] px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E5E7EB] text-sm font-semibold text-[#374151]">
                  {initial(selectedConversation.participant?.name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#111827]">
                    {selectedConversation.participant?.name || "Facebook user"}
                  </p>
                  <p className="truncate text-[11px] text-[#6B7280]">
                    {selectedConversation.messageCount || messages.length} messages
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-[#F8FAFC] px-4 py-4 max-h-[50vh]">
                {messagesLoading ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-sm text-[#6B7280]">
                    <Loader2 size={16} className="animate-spin" />
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <p className="py-10 text-center text-xs text-[#6B7280]">
                    No messages in this conversation.
                  </p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.fromPage ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                          message.fromPage
                            ? "bg-[#0084FF] text-white"
                            : "bg-white text-[#111827] ring-1 ring-black/5"
                        }`}
                      >
                        {(message.attachments || []).map((attachment) =>
                          attachment.imageUrl ? (
                            <img
                              key={attachment.id}
                              src={attachment.imageUrl}
                              alt="attachment"
                              className="mb-1.5 max-h-48 rounded-lg"
                            />
                          ) : null
                        )}
                        {message.message && (
                          <p className="whitespace-pre-wrap">{message.message}</p>
                        )}
                        <p
                          className={`mt-1 text-[10px] ${
                            message.fromPage ? "text-white/70" : "text-[#9CA3AF]"
                          }`}
                        >
                          {formatTime(message.createdTime)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={threadEndRef} />
              </div>

              {/* Selected file preview */}
              {selectedFile && (
                <div className="flex items-center gap-3 border-t border-[#E5E7EB] bg-[#F8FAFC] px-4 py-2">
                  {filePreview ? (
                    <img
                      src={filePreview}
                      alt="preview"
                      className="h-14 w-14 rounded-lg object-cover ring-1 ring-black/5"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#E5E7EB]">
                      <File size={20} className="text-[#6B7280]" />
                    </div>
                  )}
                  <span className="flex-1 truncate text-xs text-[#6B7280]">
                    {selectedFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={clearSelectedFile}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[#6B7280] transition hover:bg-[#E5E7EB] hover:text-[#111827]"
                    title="Remove attachment"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <form
                onSubmit={handleSend}
                className="flex items-center gap-2 border-t border-[#E5E7EB] px-4 py-3"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setSelectedFile(file);
                  }}
                />

                <div
                  className="bg-blue-200 p-2 rounded-full cursor-pointer hover:bg-blue-300 transition"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach image"
                >
                  <File size={22} className="text-blue-900" />
                </div>

                <input
                  type="text"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#111827] outline-none transition focus:border-[#0084FF] focus:ring-2 focus:ring-[#0084FF]/20"
                />
                <button
                  type="submit"
                  disabled={sending || (!reply.trim() && !selectedFile)}
                  className="flex items-center gap-1.5 rounded-lg bg-[#0084FF] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0077E6] disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
        <CheckCircle2 size={14} className="text-[#16A34A]" />
        Messaging uses the Page access token stored when you connected Facebook.
      </div>
    </div>
  );
};

export default Messenger;