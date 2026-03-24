import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';

export function usePushNotifications(onTap: (data: Record<string, unknown>) => void) {
  useEffect(() => {
    const received = Notifications.addNotificationReceivedListener(() => undefined);
    const response = Notifications.addNotificationResponseReceivedListener((event) => {
      const data = event.notification.request.content.data as Record<string, unknown>;
      onTap(data);
    });

    return () => {
      received.remove();
      response.remove();
    };
  }, [onTap]);
}
