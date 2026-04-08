import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
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
  // Use ref to avoid re-subscribing on every render when callers pass inline functions
  const onTapRef = useRef(onTap);
  onTapRef.current = onTap;

  useEffect(() => {
    const received = Notifications.addNotificationReceivedListener(() => undefined);
    const response = Notifications.addNotificationResponseReceivedListener((event) => {
      const data = event.notification.request.content.data as Record<string, unknown>;
      onTapRef.current(data);
    });

    return () => {
      received.remove();
      response.remove();
    };
  }, []);
}
