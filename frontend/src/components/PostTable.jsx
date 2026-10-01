import React from 'react';
import { MessageCircle, Calendar, Edit2, Trash2 } from 'lucide-react';
import { Instagram, Facebook } from './SocialIcons';

export default function PostTable({ posts = [], onEdit, onDelete }) {
  const getPlatformIcon = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'instagram':
        return <Instagram className="w-4 h-4 text-[#111827]" />;
      case 'facebook':
        return <Facebook className="w-4 h-4 text-[#111827]" />;
      case 'whatsapp':
        return <MessageCircle className="w-4 h-4 text-[#111827]" />;
      default:
        return <MessageCircle className="w-4 h-4 text-[#111827]" />;
    }
  };

  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <div className="w-full overflow-hidden border border-[#E5E7EB] rounded-xl bg-white shadow-subtle">
      {/* Desktop & Tablet Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-xs font-medium text-[#6B7280]">
              <th className="py-3 px-4">Platform</th>
              <th className="py-3 px-4">Post Title & Caption</th>
              <th className="py-3 px-4">Schedule Time</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-[#F8FAFC] transition-colors">
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-[#F1F5F9] border border-[#E5E7EB] flex items-center justify-center">
                      {getPlatformIcon(post.platform)}
                    </div>
                    <span className="font-medium text-[#111827]">{post.platform}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-medium text-[#111827] line-clamp-1">{post.title}</div>
                  <div className="text-xs text-[#6B7280] line-clamp-1 mt-0.5 max-w-md">
                    {post.caption}
                  </div>
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap text-xs text-[#6B7280]">
                  <div className="flex items-center gap-1.5 font-medium text-[#111827]">
                    <Calendar className="w-3.5 h-3.5 text-[#6B7280]" />
                    <span>{post.displayDate || post.scheduledAt}</span>
                  </div>
                  <div className="text-[11px] text-[#6B7280] mt-0.5">{post.timezone || 'Asia/Kathmandu'}</div>
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#F1F5F9] text-[#172033] border border-[#E5E7EB]">
                    {post.status || 'Scheduled'}
                  </span>
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(post)}
                        className="p-1.5 text-[#6B7280] hover:text-[#111827] hover:bg-[#F1F5F9] rounded-md transition-colors"
                        title="Edit post"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(post.id)}
                        className="p-1.5 text-[#6B7280] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-md transition-colors"
                        title="Delete post"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List (< 640px) */}
      <div className="sm:hidden divide-y divide-[#E5E7EB]">
        {posts.map((post) => (
          <div key={post.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#F1F5F9] border border-[#E5E7EB] flex items-center justify-center">
                  {getPlatformIcon(post.platform)}
                </div>
                <span className="font-semibold text-xs text-[#111827]">{post.platform}</span>
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 bg-[#F1F5F9] text-[#172033] rounded border border-[#E5E7EB]">
                {post.status || 'Scheduled'}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-[#111827] line-clamp-1">{post.title}</h4>
              <p className="text-xs text-[#6B7280] line-clamp-2 mt-0.5">{post.caption}</p>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-[#6B7280]">
              <span>{post.displayDate || post.scheduledAt}</span>
              <div className="flex items-center gap-2">
                {onEdit && (
                  <button
                    onClick={() => onEdit(post)}
                    className="text-xs font-medium text-[#111827] hover:underline"
                  >
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(post.id)}
                    className="text-xs font-medium text-[#DC2626] hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
