// Notification utilities and cross-platform notification manager

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export function getNotificationPermission(): NotificationPermissionStatus {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionStatus;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const result = await Notification.requestPermission();
    return result as NotificationPermissionStatus;
  } catch (err) {
    console.error('Failed to request notification permission:', err);
    return 'denied';
  }
}

export function sendBrowserNotification(title: string, options?: NotificationOptions) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  if (Notification.permission === 'granted') {
    try {
      // If service worker is active, use serviceWorkerRegistration.showNotification for background support
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            ...(options as Record<string, unknown>),
          } as unknown as NotificationOptions);
        });
        return true;
      } else {
        const notif = new Notification(title, {
          icon: '/favicon.ico',
          ...options,
        });
        return notif;
      }
    } catch (e) {
      console.warn('Standard notification creation error, falling back:', e);
    }
  }
  return null;
}

/**
 * Platform Compatibility and Background Limitations guide:
 */
export const NOTIFICATION_PLATFORM_GUIDE = [
  {
    platform: 'Desktop (Chrome, Edge, Brave, Firefox)',
    status: 'Full Support',
    description: 'Immediate desktop push notifications. Alerts sound and display banner even when tab is in background.',
    closedTabSupport: 'Requires browser to be open or background apps allowed in OS settings.',
  },
  {
    platform: 'macOS Safari',
    status: 'Supported (macOS Ventura+)',
    description: 'Web Notifications supported. Safari must have macOS System Notification permissions enabled in System Settings.',
    closedTabSupport: 'Supported via Web Push API / PWA.',
  },
  {
    platform: 'Android (Chrome, Firefox)',
    status: 'Full PWA & Push Support',
    description: 'Full support including background service workers, vibration, and push notification tray alerts.',
    closedTabSupport: 'Works even when browser is closed if installed as PWA or service worker registered.',
  },
  {
    platform: 'iOS (iPhone & iPad Safari)',
    status: 'PWA Mode Required (iOS 16.4+)',
    description: 'Apple requires you to tap "Share" -> "Add to Home Screen" to install the app. Once opened from Home Screen, Web Push notifications operate like native iOS apps.',
    closedTabSupport: 'Supported when launched from Home Screen icon with notifications allowed in iOS Settings.',
  },
];
