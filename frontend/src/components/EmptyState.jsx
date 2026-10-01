import React from 'react';
import { Calendar } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Calendar,
  title = "No posts found",
  description = "Get started by scheduling your first social media post.",
  actionText,
  onAction,
}) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 sm:p-12 text-center flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] mb-4">
        <Icon className="w-6 h-6 text-[#172033]" />
      </div>
      <h3 className="text-base font-semibold text-[#111827]">{title}</h3>
      <p className="text-sm text-[#6B7280] max-w-sm mt-1 mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-[#172033] hover:bg-[#1F2B45] rounded-lg transition-colors shadow-subtle"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
