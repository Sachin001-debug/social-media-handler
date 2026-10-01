import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, Bell, CheckCircle2, AlertTriangle, Info, Check, LogOut, User as UserIcon, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocialData } from '../context/SocialDataContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Header({ title = 'Dashboard', onToggleMobileSidebar, searchTerm, setSearchTerm }) {
  const { currentUser, logout } = useAuth();
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    unreadNotificationsCount,
  } = useSocialData();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const notifRef = useRef(null);
  const userRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'SK';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#E5E7EB] px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAFC] rounded-lg transition-colors"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-[#111827] tracking-tight">{title}</h1>
      </div>

      {/* Right: Search, Notifications & User */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Input */}
        <div className="relative hidden md:block w-48 lg:w-64">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search posts, platforms..."
            value={searchTerm || ''}
            onChange={(e) => setSearchTerm && setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:bg-white focus:border-[#172033] transition-all"
          />
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAFC] rounded-lg transition-colors border border-transparent hover:border-[#E5E7EB]"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#DC2626]" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E5E7EB] rounded-xl shadow-modal z-50 overflow-hidden">
              <div className="p-3.5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8FAFC]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#111827]">Notifications</span>
                  {unreadNotificationsCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-[#172033] text-white rounded">
                      {unreadNotificationsCount} new
                    </span>
                  )}
                </div>
                {unreadNotificationsCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-[11px] text-[#6B7280] hover:text-[#111827] font-medium flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-[#E5E7EB]">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#6B7280]">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationAsRead(notif.id)}
                      className={`p-3.5 hover:bg-[#F8FAFC] transition-colors cursor-pointer flex items-start gap-3 ${
                        !notif.read ? 'bg-[#F8FAFC]/60' : ''
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {notif.type === 'success' && (
                          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                        )}
                        {notif.type === 'warning' && (
                          <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                        )}
                        {notif.type === 'info' && (
                          <Info className="w-4 h-4 text-[#172033]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs ${!notif.read ? 'font-semibold text-[#111827]' : 'font-medium text-[#111827]'}`}>
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-[#9CA3AF] shrink-0">{notif.time}</span>
                        </div>
                        <p className="text-[11px] text-[#6B7280] mt-0.5 leading-snug">
                          {notif.description}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Dropdown */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-[#F8FAFC] border border-transparent hover:border-[#E5E7EB] transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[#172033] text-white flex items-center justify-center text-xs font-semibold tracking-wider">
              {getInitials(currentUser.name)}
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-medium text-[#111827] block leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-[#6B7280] block">
                {currentUser.role || 'Admin'}
              </span>
            </div>
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-[#E5E7EB] rounded-xl shadow-modal z-50 overflow-hidden">
              <div className="p-3 border-b border-[#E5E7EB] bg-[#F8FAFC]">
                <p className="text-xs font-semibold text-[#111827] truncate">{currentUser.name}</p>
                <p className="text-[11px] text-[#6B7280] truncate">{currentUser.email}</p>
              </div>

              <div className="p-1">
                <Link
                  to="/profile"
                  onClick={() => setShowUserDropdown(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#111827] hover:bg-[#F8FAFC] rounded-lg transition-colors"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#6B7280]" />
                  Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setShowUserDropdown(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#111827] hover:bg-[#F8FAFC] rounded-lg transition-colors"
                >
                  <SettingsIcon className="w-3.5 h-3.5 text-[#6B7280]" />
                  Settings
                </Link>
                <div className="my-1 border-t border-[#E5E7EB]" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#DC2626]" />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
