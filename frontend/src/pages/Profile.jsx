import React, { useState } from 'react';
import { Camera, Shield, Check, Lock, Mail, Phone, User, Building, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Profile() {
  const { currentUser, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser.name || 'Sachin Kharel',
    email: currentUser.email || 'sachin@example.com',
    phone: currentUser.phone || '+977 9747807614',
    role: currentUser.role || 'Marketing Director',
    company: currentUser.company || 'Brand Studio Inc.',
    bio: currentUser.bio || 'Managing digital presence across Instagram, Facebook, and WhatsApp.',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const getInitials = (name) => {
    if (!name) return 'SK';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      showToast('Name and email are required', 'warning');
      return;
    }
    updateProfile(formData);
    setIsEditing(false);
    showToast('Profile updated successfully', 'success');
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (!passwordData.currentPassword) {
      showToast('Please enter your current password', 'warning');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      showToast('New password must be at least 6 characters', 'warning');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('New passwords do not match', 'danger');
      return;
    }

    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    showToast('Password updated successfully', 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Title */}
      <div className="pb-4 border-b border-[#E5E7EB]">
        <h2 className="text-xl font-bold tracking-tight text-[#111827]">Account Profile</h2>
        <p className="text-xs text-[#6B7280] mt-1">
          Manage your personal details, credentials, and contact preferences.
        </p>
      </div>

      {/* Personal Information Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E5E7EB] gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-[#172033] text-white flex items-center justify-center text-xl font-bold tracking-wider shadow-subtle">
                {getInitials(currentUser.name)}
              </div>
              <button
                type="button"
                onClick={() => showToast('Avatar upload ready for backend S3/GCS integration', 'info')}
                className="absolute -bottom-1 -right-1 p-1.5 bg-white border border-[#E5E7EB] rounded-full text-[#6B7280] hover:text-[#111827] shadow-subtle transition-colors"
                title="Change avatar"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#111827]">{currentUser.name}</h3>
              <p className="text-xs text-[#6B7280] mt-0.5">{currentUser.role} • {currentUser.company}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 text-xs font-medium text-[#111827] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E5E7EB] rounded-lg transition-colors self-start sm:self-auto"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {/* Profile Details Form */}
        <form onSubmit={handleProfileSave} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#111827] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-white disabled:bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#172033]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#111827] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  disabled={!isEditing}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-white disabled:bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#172033]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#111827] mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-white disabled:bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#172033]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#111827] mb-1.5">
                Job Role / Title
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-white disabled:bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#172033]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#111827] mb-1.5">
              Bio / Description
            </label>
            <textarea
              rows={3}
              disabled={!isEditing}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-3.5 py-2 text-xs bg-white disabled:bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#172033] resize-none"
            />
          </div>

          {isEditing && (
            <div className="pt-3 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-xs font-medium text-[#6B7280] hover:text-[#111827] bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium text-white bg-[#172033] hover:bg-[#1F2B45] rounded-lg transition-colors shadow-subtle"
              >
                Save Changes
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Security & Password Section */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-subtle">
        <div className="pb-4 border-b border-[#E5E7EB]">
          <h3 className="text-sm font-semibold text-[#111827] flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#172033]" />
            Change Password
          </h3>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Update your account password to keep your dashboard access protected.
          </p>
        </div>

        <form onSubmit={handlePasswordChange} className="mt-5 space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-medium text-[#111827] mb-1">
              Current Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="w-full px-3.5 py-2 text-xs bg-white border border-[#E5E7EB] rounded-lg text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#172033]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#111827] mb-1">
              New Password
            </label>
            <input
              type="password"
              placeholder="At least 6 characters"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="w-full px-3.5 py-2 text-xs bg-white border border-[#E5E7EB] rounded-lg text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#172033]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#111827] mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              placeholder="Re-enter new password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="w-full px-3.5 py-2 text-xs bg-white border border-[#E5E7EB] rounded-lg text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#172033]"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 text-xs font-medium text-white bg-[#172033] hover:bg-[#1F2B45] rounded-lg transition-colors shadow-subtle"
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}
