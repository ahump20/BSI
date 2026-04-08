import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours

export function usePushNotifications(onTap: (data: Record<string, unknown>) => void) {
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
import { apiPost } from '@shared/api/client';

interface PushRegisterPayload {
  expoPushToken: string;
  favoriteTeams: string[];
}

interface PushRegisterResponse {
  ok: boolean;
}

type NotificationTapHandler = (data: Record<string, unknown>) => void;

export async function requestPushPermissionAndToken(): Promise<string | null> {
  const permissions = await Notifications.getPermissionsAsync();
  let status = permissions.status;

  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== 'granted') {
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

export async function registerPushToken(expoPushToken: string, favoriteTeams: string[]): Promise<PushRegisterResponse> {
  return apiPost<PushRegisterResponse>('/api/push/register', {
    expoPushToken,
    favoriteTeams
  });
}

export function usePushNotifications(onTap: NotificationTapHandler) {
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
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
