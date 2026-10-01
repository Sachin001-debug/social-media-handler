import React from 'react';
import { MessageCircle, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { Instagram, Facebook } from './SocialIcons';
import { Link } from 'react-router-dom';

export default function PlatformCard({ account, onConnect, onDisconnect }) {
  const getPlatformIcon = (platform) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="w-5 h-5 text-[#111827]" />;
      case 'facebook':
        return <Facebook className="w-5 h-5 text-[#111827]" />;
      case 'whatsapp':
        return <MessageCircle className="w-5 h-5 text-[#111827]" />;
      default:
        return <MessageCircle className="w-5 h-5 text-[#111827]" />;
    }
  };

  const getPlatformLink = (platform) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return '/instagram';
      case 'facebook':
        return '/facebook';
      case 'whatsapp':
        return '/whatsapp';
      default:
        return '/dashboard';
    }
  };

  const isConnected = account.connected;

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-subtle flex flex-col justify-between transition-colors hover:border-[#D1D5DB]">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-center">
              {getPlatformIcon(account.platform)}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#111827]">{account.platform}</h4>
              <p className="text-xs text-[#6B7280]">
                {isConnected ? account.username : account.category || 'Not connected'}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${
              isConnected
                ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]'
                : 'bg-[#F8FAFC] text-[#6B7280] border border-[#E5E7EB]'
            }`}
          >
            {isConnected ? (
              <>
                <CheckCircle2 className="w-3 h-3" /> Connected
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3" /> Disconnected
              </>
            )}
          </span>
        </div>

        {/* Stats / Info */}
        <div className="mt-4 pt-4 border-t border-[#E5E7EB] grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-[#6B7280] block">
              {account.platform === 'WhatsApp' ? 'Contacts' : 'Followers'}
            </span>
            <span className="font-semibold text-sm text-[#111827] mt-0.5 block">
              {isConnected
                ? account.platform === 'WhatsApp'
                  ? `${account.contacts?.toLocaleString() || 1420}`
                  : `${(account.followers / 1000).toFixed(1)}K`
                : '—'}
            </span>
          </div>
          <div>
            <span className="text-[#6B7280] block">
              {account.platform === 'WhatsApp' ? 'Type' : 'Published'}
            </span>
            <span className="font-semibold text-sm text-[#111827] mt-0.5 block">
              {isConnected
                ? account.platform === 'WhatsApp'
                  ? 'Business API'
                  : `${account.postsCount || 0} posts`
                : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3 flex items-center gap-2">
        {isConnected ? (
          <>
            <Link
              to={getPlatformLink(account.platform)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[#111827] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E5E7EB] rounded-lg transition-colors"
            >
              Manage
              <ExternalLink className="w-3.5 h-3.5 text-[#6B7280]" />
            </Link>
            <button
              onClick={() => onDisconnect && onDisconnect(account.platform)}
              className="px-3 py-2 text-xs font-medium text-[#6B7280] hover:text-[#DC2626] hover:bg-[#FEF2F2] border border-transparent hover:border-[#FEE2E2] rounded-lg transition-colors"
              title="Disconnect account"
            >
              Disconnect
            </button>
          </>
        ) : (
          <button
            onClick={() => onConnect && onConnect(account.platform)}
            className="w-full inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-[#172033] hover:bg-[#1F2B45] rounded-lg transition-colors shadow-subtle"
          >
            Connect {account.platform}
          </button>
        )}
      </div>
    </div>
  );
}
