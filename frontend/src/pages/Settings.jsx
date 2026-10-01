import React, { useState } from 'react';
import {
  Globe,
  Bell,
  Shield,
  Trash2,
  Check,
  AlertTriangle,
  Lock,
  Smartphone,
  X,
} from 'lucide-react';
import { useSocialData } from '../context/SocialDataContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { settings, updateSetting } = useSocialData();
  const { showToast } = useToast();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'notifications' | 'security' | 'account'
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const toggle = (section, key) => {
    const currentValue = settings[section]?.[key];
    updateSetting(section, key, !currentValue);
  };

  const handleSelectChange = (section, key, value) => {
    updateSetting(section, key, value);
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText.toLowerCase() === 'delete') {
      setDeleteModalOpen(false);
      showToast('Account deleted successfully', 'info');
      logout();
      navigate('/register');
    } else {
      showToast('Please type "delete" to confirm', 'danger');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="pb-4 border-b border-[#E5E7EB]">
        <h2 className="text-xl font-bold tracking-tight text-[#111827]">Settings</h2>
        <p className="text-xs text-[#6B7280] mt-1">
          Manage system configurations, notification channels, and workspace parameters.
        </p>
      </div>

      {/* Tabs / Subnav */}
      <div className="flex items-center gap-2 border-b border-[#E5E7EB] text-xs font-medium">
        {[
          { id: 'general', label: 'General', icon: Globe },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'security', label: 'Security & 2FA', icon: Shield },
          { id: 'account', label: 'Account Data', icon: Trash2 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-3 transition-colors flex items-center gap-1.5 relative ${
                activeTab === tab.id
                  ? 'text-[#111827] font-semibold'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#172033]" />
              )}
            </button>
          );
        })}
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-subtle space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-[#111827]">Regional Preferences</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Customize language, time localization, and scheduling calendar defaults.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-[#E5E7EB]">
            <div>
              <label className="block text-xs font-medium text-[#111827] mb-1.5">
                Dashboard Language
              </label>
              <select
                value={settings.general?.language || 'English (US)'}
                onChange={(e) => handleSelectChange('general', 'language', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-lg text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#172033]"
              >
                <option value="English (US)">English (US)</option>
                <option value="English (UK)">English (UK)</option>
                <option value="Spanish">Español</option>
                <option value="German">Deutsch</option>
                <option value="Nepali">Nepali</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#111827] mb-1.5">
                Default Timezone
              </label>
              <select
                value={settings.general?.timezone || 'Asia/Kathmandu'}
                onChange={(e) => handleSelectChange('general', 'timezone', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-lg text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#172033]"
              >
                <option value="Asia/Kathmandu">Asia/Kathmandu (GMT+05:45)</option>
                <option value="America/New_York">America/New_York (EST / EDT)</option>
                <option value="Europe/London">Europe/London (GMT / BST)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#111827] mb-1.5">
                Date Format
              </label>
              <select
                value={settings.general?.dateFormat || 'YYYY-MM-DD'}
                onChange={(e) => handleSelectChange('general', 'dateFormat', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-lg text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#172033]"
              >
                <option value="YYYY-MM-DD">2026-10-01 (YYYY-MM-DD)</option>
                <option value="DD/MM/YYYY">01/10/2026 (DD/MM/YYYY)</option>
                <option value="MM/DD/YYYY">10/01/2026 (MM/DD/YYYY)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#111827] mb-1.5">
                Workspace Theme
              </label>
              <select
                value={settings.general?.theme || 'Light (Default)'}
                onChange={(e) => handleSelectChange('general', 'theme', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-lg text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#172033]"
              >
                <option value="Light (Default)">Light (Neutral Minimalist)</option>
                <option value="System">System Default</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Settings */}
      {activeTab === 'notifications' && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-subtle space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-[#111827]">Notification Triggers</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Control when and how you receive alerts regarding dispatch queues and account health.
            </p>
          </div>

          <div className="divide-y divide-[#E5E7EB] pt-2">
            {[
              {
                key: 'emailNotifications',
                title: 'Email Notifications',
                desc: 'Receive digest summaries and critical warnings in your inbox.',
              },
              {
                key: 'postPublished',
                title: 'Post Published Successfully',
                desc: 'Alert when a scheduled Instagram or Facebook post is published.',
              },
              {
                key: 'postFailed',
                title: 'Post Dispatch Failed',
                desc: 'Immediate warning if an API token expires or dispatch hits an error.',
              },
              {
                key: 'scheduledReminder',
                title: 'Scheduled Post Reminder',
                desc: 'Receive a reminder 1 hour prior to any scheduled post execution.',
              },
              {
                key: 'weeklyDigest',
                title: 'Weekly Performance Digest',
                desc: 'Receive weekly engagement metrics and reach progress.',
              },
            ].map(({ key, title, desc }) => {
              const isChecked = Boolean(settings.notifications?.[key]);
              return (
                <div key={key} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-semibold text-[#111827]">{title}</h4>
                    <p className="text-xs text-[#6B7280] mt-0.5">{desc}</p>
                  </div>
                  {/* Clean Accessible Toggle Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isChecked}
                    onClick={() => toggle('notifications', key)}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isChecked ? 'bg-[#172033]' : 'bg-[#E5E7EB]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-subtle transition duration-200 ease-in-out ${
                        isChecked ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Security & 2FA */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-subtle">
            <div className="flex items-start justify-between pb-6 border-b border-[#E5E7EB]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-center text-[#111827]">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#111827]">
                    Two-Factor Authentication (2FA)
                  </h3>
                  <p className="text-xs text-[#6B7280] mt-0.5 max-w-md leading-relaxed">
                    Protect your social publishing authorizations with an extra layer of security
                    using an Authenticator app (Google Authenticator, 1Password, Authy).
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={Boolean(settings.security?.twoFactorEnabled)}
                onClick={() => toggle('security', 'twoFactorEnabled')}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.security?.twoFactorEnabled ? 'bg-[#16A34A]' : 'bg-[#E5E7EB]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-subtle transition duration-200 ease-in-out ${
                    settings.security?.twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="pt-4 flex items-center justify-between text-xs text-[#6B7280]">
              <span>Status: {settings.security?.twoFactorEnabled ? 'Enabled & Protected' : 'Disabled'}</span>
              <button
                onClick={() => showToast('2FA QR code generator simulation ready', 'info')}
                className="font-medium text-[#172033] hover:underline"
              >
                Setup details
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-subtle">
            <h3 className="text-sm font-semibold text-[#111827] mb-1">Active Sessions</h3>
            <p className="text-xs text-[#6B7280] mb-4">
              Devices currently signed in to your Socially workspace.
            </p>

            <div className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-[#111827] block">Current Session • Windows PC</span>
                <span className="text-[#6B7280] text-[11px]">Kathmandu, Nepal • Chrome Browser</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]">
                Active Now
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Account Deletion */}
      {activeTab === 'account' && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-subtle space-y-4">
          <div className="flex items-center gap-2 text-[#DC2626]">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-sm font-semibold">Danger Zone</h3>
          </div>
          <p className="text-xs text-[#6B7280] leading-relaxed">
            Permanently delete your Socially organization account, remove all scheduled posts,
            and revoke social API tokens. This action cannot be reversed.
          </p>

          <div className="pt-2">
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="px-4 py-2 text-xs font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg transition-colors shadow-subtle"
            >
              Delete Account
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#111827]/40 transition-opacity"
            onClick={() => setDeleteModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl border border-[#E5E7EB] shadow-modal w-full max-w-md p-6 z-10">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3 className="text-sm font-semibold text-[#DC2626]">Delete Account</h3>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="text-[#6B7280] hover:text-[#111827] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#6B7280] mt-4 leading-relaxed">
              Are you sure? All scheduled queues and connected Instagram, Facebook, and WhatsApp
              tokens will be erased.
            </p>
            <p className="text-xs font-medium text-[#111827] mt-3">
              Type <strong className="text-[#DC2626]">delete</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="delete"
              className="w-full mt-2 px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-lg text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
            />
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-[#6B7280] hover:text-[#111827] bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
