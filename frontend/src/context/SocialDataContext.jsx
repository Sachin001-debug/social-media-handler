import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  initialSocialAccounts,
  initialScheduledPosts,
  initialPublishedPosts,
  initialActivities,
  initialNotifications,
  initialSettings,
} from '../assets/data';
import { useToast } from './ToastContext';

const SocialDataContext = createContext(null);

export const SocialDataProvider = ({ children }) => {
  const { showToast } = useToast();

  const [socialAccounts, setSocialAccounts] = useState(() => {
    const saved = localStorage.getItem('socially_accounts');
    return saved ? JSON.parse(saved) : initialSocialAccounts;
  });

  const [scheduledPosts, setScheduledPosts] = useState(() => {
    const saved = localStorage.getItem('socially_scheduled');
    return saved ? JSON.parse(saved) : initialScheduledPosts;
  });

  const [publishedPosts, setPublishedPosts] = useState(() => {
    const saved = localStorage.getItem('socially_published');
    return saved ? JSON.parse(saved) : initialPublishedPosts;
  });

  const [activities, setActivities] = useState(() => {
    const saved = localStorage.getItem('socially_activities');
    return saved ? JSON.parse(saved) : initialActivities;
  });

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('socially_notifications');
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('socially_settings');
    return saved ? JSON.parse(saved) : initialSettings;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('socially_accounts', JSON.stringify(socialAccounts));
  }, [socialAccounts]);

  useEffect(() => {
    localStorage.setItem('socially_scheduled', JSON.stringify(scheduledPosts));
  }, [scheduledPosts]);

  useEffect(() => {
    localStorage.setItem('socially_published', JSON.stringify(publishedPosts));
  }, [publishedPosts]);

  useEffect(() => {
    localStorage.setItem('socially_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('socially_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('socially_settings', JSON.stringify(settings));
  }, [settings]);

  // Connect platform
  const connectAccount = (platformName, details = {}) => {
    setSocialAccounts((prev) =>
      prev.map((acc) => {
        if (acc.platform.toLowerCase() === platformName.toLowerCase()) {
          return {
            ...acc,
            connected: true,
            username: details.username || (platformName === 'WhatsApp' ? '+977 9841234567' : `@${details.accountName || 'brandstudio'}`),
            accountName: details.accountName || acc.accountName,
            followers: acc.followers || (platformName === 'WhatsApp' ? 120 : 12400),
            connectedAt: new Date().toISOString().split('T')[0],
          };
        }
        return acc;
      })
    );

    // Add activity
    const newActivity = {
      id: 'act-' + Date.now(),
      action: `${platformName} account connected`,
      time: 'Just now',
      type: 'connect',
      platform: platformName,
      description: `Successfully authenticated ${platformName} credentials.`,
    };
    setActivities((prev) => [newActivity, ...prev]);

    // Add notification
    const newNotif = {
      id: 'notif-' + Date.now(),
      title: `${platformName} connected`,
      description: `${platformName} connection successfully verified.`,
      time: 'Just now',
      type: 'success',
      read: false,
      platform: platformName,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    showToast(`${platformName} connected successfully`, 'success');
  };

  // Disconnect platform
  const disconnectAccount = (platformName) => {
    setSocialAccounts((prev) =>
      prev.map((acc) => {
        if (acc.platform.toLowerCase() === platformName.toLowerCase()) {
          return {
            ...acc,
            connected: false,
          };
        }
        return acc;
      })
    );

    const newActivity = {
      id: 'act-' + Date.now(),
      action: `${platformName} disconnected`,
      time: 'Just now',
      type: 'disconnect',
      platform: platformName,
      description: `Revoked access to ${platformName} account.`,
    };
    setActivities((prev) => [newActivity, ...prev]);

    showToast(`${platformName} disconnected`, 'info');
  };

  // Add scheduled post
  const addScheduledPost = (postData) => {
    const id = 'sp-' + Date.now();
    const newPost = {
      id,
      platform: postData.targetPlatforms && postData.targetPlatforms[0] ? postData.targetPlatforms[0] : 'Instagram',
      title: postData.title || (postData.caption ? postData.caption.slice(0, 30) + '...' : 'Scheduled Post'),
      caption: postData.caption || '',
      scheduledAt: postData.scheduledAt || new Date().toISOString(),
      displayDate: postData.displayDate || 'Scheduled soon',
      status: postData.publishNow ? 'Published' : 'Scheduled',
      mediaUrl: postData.mediaUrl || '',
      mediaType: postData.mediaType || (postData.mediaUrl ? 'image' : 'text'),
      timezone: postData.timezone || 'Asia/Kathmandu',
      targetPlatforms: postData.targetPlatforms || ['Instagram'],
      createdAt: new Date().toISOString(),
    };

    if (postData.publishNow) {
      setPublishedPosts((prev) => [newPost, ...prev]);
      setActivities((prev) => [
        {
          id: 'act-' + Date.now(),
          action: `Post published on ${newPost.platform}`,
          time: 'Just now',
          type: 'publish',
          platform: newPost.platform,
          description: newPost.caption ? newPost.caption.slice(0, 60) + '...' : 'New post published',
        },
        ...prev,
      ]);
      showToast('Post published successfully!', 'success');
    } else {
      setScheduledPosts((prev) => [newPost, ...prev]);
      setActivities((prev) => [
        {
          id: 'act-' + Date.now(),
          action: `Post scheduled for ${newPost.displayDate}`,
          time: 'Just now',
          type: 'schedule',
          platform: newPost.platform,
          description: newPost.title,
        },
        ...prev,
      ]);
      showToast('Post scheduled successfully', 'success');
    }

    return newPost;
  };

  // Update scheduled post
  const updateScheduledPost = (id, updatedFields) => {
    setScheduledPosts((prev) =>
      prev.map((post) => {
        if (post.id === id) {
          return { ...post, ...updatedFields };
        }
        return post;
      })
    );
    showToast('Scheduled post updated successfully', 'success');
  };

  // Delete scheduled post
  const deleteScheduledPost = (id) => {
    const postToDelete = scheduledPosts.find((p) => p.id === id);
    setScheduledPosts((prev) => prev.filter((post) => post.id !== id));
    if (postToDelete) {
      setActivities((prev) => [
        {
          id: 'act-' + Date.now(),
          action: 'Post schedule cancelled',
          time: 'Just now',
          type: 'delete',
          platform: postToDelete.platform,
          description: `Cancelled: "${postToDelete.title}"`,
        },
        ...prev,
      ]);
    }
    showToast('Post deleted', 'info');
  };

  // Notifications
  const markNotificationAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
    showToast('All notifications marked as read', 'info');
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  // Settings
  const updateSetting = (section, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
    showToast('Settings saved', 'success');
  };

  // Calculated Stats
  const connectedCount = socialAccounts.filter((a) => a.connected).length;
  const stats = {
    totalPosts: {
      value: publishedPosts.length + scheduledPosts.length,
      change: '+12 this month',
      isPositive: true,
    },
    scheduled: {
      value: scheduledPosts.length,
      change: `+${scheduledPosts.length} queued`,
      isPositive: true,
    },
    published: {
      value: publishedPosts.length,
      change: '+8 this month',
      isPositive: true,
    },
    connectedAccounts: {
      value: `${connectedCount} / ${socialAccounts.length}`,
      change: `${socialAccounts.length - connectedCount} Available to connect`,
      isPositive: connectedCount === socialAccounts.length,
    },
  };

  return (
    <SocialDataContext.Provider
      value={{
        socialAccounts,
        connectAccount,
        disconnectAccount,
        scheduledPosts,
        publishedPosts,
        addScheduledPost,
        updateScheduledPost,
        deleteScheduledPost,
        activities,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        unreadNotificationsCount,
        settings,
        updateSetting,
        stats,
      }}
    >
      {children}
    </SocialDataContext.Provider>
  );
};

export const useSocialData = () => {
  const context = useContext(SocialDataContext);
  if (!context) {
    throw new Error('useSocialData must be used within a SocialDataProvider');
  }
  return context;
};
