import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Image, Calendar, Clock, Globe, Upload } from 'lucide-react';
import { Instagram, Facebook } from './SocialIcons';

export default function SchedulePostModal({
  isOpen,
  onClose,
  onSubmit,
  postToEdit = null,
  initialPlatform = null,
}) {
  const [selectedPlatforms, setSelectedPlatforms] = useState(['Instagram']);
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [scheduleType, setScheduleType] = useState('schedule'); // 'now' or 'schedule'
  const [scheduleDate, setScheduleDate] = useState('2026-10-01');
  const [scheduleTime, setScheduleTime] = useState('19:30');
  const [timezone, setTimezone] = useState('Asia/Kathmandu');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (postToEdit) {
        setSelectedPlatforms(postToEdit.targetPlatforms || [postToEdit.platform]);
        setCaption(postToEdit.caption || '');
        setMediaUrl(postToEdit.mediaUrl || '');
        setScheduleType(postToEdit.status === 'Published' ? 'now' : 'schedule');
        if (postToEdit.scheduledAt?.includes('T')) {
          const parts = postToEdit.scheduledAt.split('T');
          setScheduleDate(parts[0]);
          setScheduleTime(parts[1]?.slice(0, 5) || '19:30');
        }
        setTimezone(postToEdit.timezone || 'Asia/Kathmandu');
      } else {
        setSelectedPlatforms(initialPlatform ? [initialPlatform] : ['Instagram']);
        setCaption('');
        setMediaUrl('');
        setScheduleType('schedule');
        setScheduleDate('2026-10-01');
        setScheduleTime('19:30');
        setTimezone('Asia/Kathmandu');
      }
      setErrors({});
    }
  }, [isOpen, postToEdit, initialPlatform]);

  if (!isOpen) return null;

  const togglePlatform = (p) => {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((item) => item !== p));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const handleSampleImage = () => {
    const samples = [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=800&auto=format&fit=crop&q=80',
    ];
    const random = samples[Math.floor(Math.random() * samples.length)];
    setMediaUrl(random);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (selectedPlatforms.length === 0) {
      newErrors.platforms = 'Please select at least one platform';
    }
    if (!caption.trim()) {
      newErrors.caption = 'Caption cannot be empty';
    }
    if (scheduleType === 'schedule' && (!scheduleDate || !scheduleTime)) {
      newErrors.schedule = 'Please choose a valid date and time';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Format display date
    const displayDate =
      scheduleType === 'now'
        ? 'Just now'
        : `${scheduleDate} at ${scheduleTime}`;

    const postPayload = {
      targetPlatforms: selectedPlatforms,
      platform: selectedPlatforms[0],
      title: caption.trim().slice(0, 35) + (caption.length > 35 ? '...' : ''),
      caption: caption.trim(),
      mediaUrl: mediaUrl.trim(),
      publishNow: scheduleType === 'now',
      scheduledAt: `${scheduleDate}T${scheduleTime}`,
      displayDate,
      timezone,
    };

    onSubmit(postPayload, postToEdit ? postToEdit.id : null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#111827]/40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-xl border border-[#E5E7EB] shadow-modal w-full max-w-xl p-6 overflow-hidden z-10 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
          <div>
            <h3 className="text-base font-semibold text-[#111827]">
              {postToEdit ? 'Edit Scheduled Post' : 'Create Post'}
            </h3>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Craft and schedule content across your connected channels.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#111827] p-1 rounded-lg hover:bg-[#F8FAFC] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Platforms Selection */}
          <div>
            <label className="block text-xs font-medium text-[#111827] mb-2">
              Select platforms
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { name: 'Instagram', icon: Instagram },
                { name: 'Facebook', icon: Facebook },
                { name: 'WhatsApp', icon: MessageCircle },
              ].map(({ name, icon: Icon }) => {
                const isSelected = selectedPlatforms.includes(name);
                return (
                  <button
                    type="button"
                    key={name}
                    onClick={() => togglePlatform(name)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-[#172033] bg-[#172033] text-white shadow-subtle'
                        : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#D1D5DB]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{name}</span>
                  </button>
                );
              })}
            </div>
            {errors.platforms && (
              <p className="text-xs text-[#DC2626] mt-1">{errors.platforms}</p>
            )}
          </div>

          {/* Caption */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-[#111827]">Caption</label>
              <span className="text-[11px] text-[#6B7280]">{caption.length} / 2200</span>
            </div>
            <textarea
              rows={4}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write your caption here... Use hashtags, links, or marketing hooks."
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E5E7EB] rounded-lg text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#172033] focus:border-[#172033] resize-none"
            />
            {errors.caption && (
              <p className="text-xs text-[#DC2626] mt-1">{errors.caption}</p>
            )}
          </div>

          {/* Media Upload / URL */}
          <div>
            <label className="block text-xs font-medium text-[#111827] mb-1.5">
              Media (Image URL or Mock Attachment)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... or paste image link"
                className="flex-1 px-3.5 py-2 text-xs bg-white border border-[#E5E7EB] rounded-lg text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#172033] focus:border-[#172033]"
              />
              <button
                type="button"
                onClick={handleSampleImage}
                className="px-3 py-2 text-xs font-medium text-[#172033] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E5E7EB] rounded-lg transition-colors shrink-0 flex items-center gap-1.5"
                title="Add a high-quality sample image"
              >
                <Upload className="w-3.5 h-3.5 text-[#6B7280]" />
                Mock Image
              </button>
            </div>
            {mediaUrl && (
              <div className="mt-2 relative rounded-lg overflow-hidden border border-[#E5E7EB] h-24 w-36 bg-[#F8FAFC]">
                <img
                  src={mediaUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={() => setMediaUrl('')}
                />
                <button
                  type="button"
                  onClick={() => setMediaUrl('')}
                  className="absolute top-1 right-1 p-1 bg-white/90 rounded text-[#DC2626] hover:bg-white"
                  title="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Schedule Mode */}
          <div className="pt-2 border-t border-[#E5E7EB]">
            <label className="block text-xs font-medium text-[#111827] mb-2">
              Publishing Option
            </label>
            <div className="flex items-center gap-6 text-xs text-[#111827]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scheduleType"
                  value="now"
                  checked={scheduleType === 'now'}
                  onChange={() => setScheduleType('now')}
                  className="text-[#172033] focus:ring-[#172033]"
                />
                <span>Publish now</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scheduleType"
                  value="schedule"
                  checked={scheduleType === 'schedule'}
                  onChange={() => setScheduleType('schedule')}
                  className="text-[#172033] focus:ring-[#172033]"
                />
                <span>Schedule for later</span>
              </label>
            </div>
          </div>

          {/* Date & Time if scheduled */}
          {scheduleType === 'schedule' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#F8FAFC] p-3.5 rounded-lg border border-[#E5E7EB]">
              <div>
                <label className="block text-[11px] font-medium text-[#6B7280] mb-1">
                  Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-md text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#172033]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#6B7280] mb-1">
                  Time
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-md text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#172033]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#6B7280] mb-1">
                  Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-md text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#172033]"
                >
                  <option value="Asia/Kathmandu">Asia/Kathmandu (GMT+5:45)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                </select>
              </div>
            </div>
          )}

          {errors.schedule && (
            <p className="text-xs text-[#DC2626]">{errors.schedule}</p>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#6B7280] hover:text-[#111827] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E5E7EB] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-[#172033] hover:bg-[#1F2B45] rounded-lg transition-colors shadow-subtle"
            >
              {scheduleType === 'now'
                ? 'Publish Now'
                : postToEdit
                ? 'Save Changes'
                : 'Schedule Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
