import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function StatCard({ title, value, change, isPositive, icon: Icon }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-subtle flex flex-col justify-between transition-colors hover:border-[#D1D5DB]">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#6B7280]">{title}</span>
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-center text-[#172033]">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="text-2xl font-semibold text-[#111827] tracking-tight">{value}</div>
        {change && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs">
            {isPositive === true && (
              <span className="inline-flex items-center text-[#16A34A] font-medium">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                {change}
              </span>
            )}
            {isPositive === false && (
              <span className="inline-flex items-center text-[#DC2626] font-medium">
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                {change}
              </span>
            )}
            {isPositive === null && (
              <span className="text-[#6B7280] font-normal">{change}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
