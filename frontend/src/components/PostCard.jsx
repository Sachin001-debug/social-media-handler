import React from 'react';
import { MessageCircle, Calendar, Clock, Edit2, Trash2 } from 'lucide-react';
import { Instagram, Facebook } from './SocialIcons';

export default function PostCard({ post, onEdit, onDelete }) {
  const getPlatformIcon = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'instagram':
        return <Instagram className="w-3.5 h-3.5" />;
      case 'facebook':
        return <Facebook className="w-3.5 h-3.5" />;
      case 'whatsapp':
        return <MessageCircle className="w-3.5 h-3.5" />;
      default:
        return <MessageCircle className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-subtle hover:border-[#D1D5DB] transition-all flex flex-col justify-between">
      {/* Media thumbnail if present */}
      {post.mediaUrl ? (
        <div className="h-44 w-full bg-[#F1F5F9] relative overflow-hidden border-b border-[#E5E7EB]">
          <img
            src={post.mediaUrl}
            alt={post.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-white/95 backdrop-blur-none border border-[#E5E7EB] rounded-md text-xs font-medium text-[#111827]">
            {getPlatformIcon(post.platform)}
            <span>{post.platform}</span>
          </div>
          <div className="absolute top-3 right-3 px-2 py-0.5 bg-[#172033] text-white text-[11px] font-medium rounded-md">
            {post.status || 'Scheduled'}
          </div>
        </div>
      ) : (
        <div className="p-4 border-b border-[#E5E7EB] bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#E5E7EB] rounded-md text-xs font-medium text-[#111827]">
            {getPlatformIcon(post.platform)}
            <span>{post.platform}</span>
          </div>
          <span className="text-xs font-medium px-2 py-0.5 bg-[#F1F5F9] text-[#6B7280] rounded-md border border-[#E5E7EB]">
            {post.status || 'Scheduled'}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-semibold text-[#111827] line-clamp-1 mb-1">
            {post.title}
          </h4>
          <p className="text-xs text-[#6B7280] line-clamp-3 leading-relaxed mb-4">
            {post.caption}
          </p>
        </div>

        {/* Date and Time */}
        <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#6B7280]" />
            <span>{post.displayDate || post.scheduledAt?.split('T')[0] || 'Scheduled'}</span>
          </div>
          {post.scheduledAt?.includes('T') && (
            <div className="flex items-center gap-1 text-[11px]">
              <Clock className="w-3 h-3 text-[#6B7280]" />
              <span>{post.scheduledAt.split('T')[1]}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-[#F8FAFC] border-t border-[#E5E7EB] flex items-center justify-end gap-2">
        {onEdit && (
          <button
            onClick={() => onEdit(post)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#111827] bg-white hover:bg-[#F1F5F9] border border-[#E5E7EB] rounded-lg transition-colors"
          >
            <Edit2 className="w-3 h-3 text-[#6B7280]" />
            Edit
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(post.id)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#DC2626] bg-white hover:bg-[#FEF2F2] border border-[#E5E7EB] hover:border-[#FEE2E2] rounded-lg transition-colors"
            title="Delete post"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
