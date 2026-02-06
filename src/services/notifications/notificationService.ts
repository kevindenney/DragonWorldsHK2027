import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface RaceNotification {
  raceId: string;
  raceName: string;
  startTime: Date;
  notifyBefore?: number; // minutes before race start
}

export const setupNotifications = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('race-updates', {
      name: 'Race Updates',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0066CC',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    return false;
  }
  
  return true;
};

export const scheduleRaceNotification = async (raceNotification: RaceNotification) => {
  const { raceId, raceName, startTime, notifyBefore = 15 } = raceNotification;
  
  const notificationTime = new Date(startTime.getTime() - notifyBefore * 60 * 1000);
  
  if (notificationTime <= new Date()) {
    return null;
  }
  
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Race Starting Soon! 🏁',
      body: `${raceName} starts in ${notifyBefore} minutes`,
      data: { raceId, type: 'race-start' },
      sound: true,
    },
    trigger: {
      date: notificationTime,
      channelId: 'race-updates',
    },
  });
  
  return notificationId;
};

export const cancelRaceNotification = async (notificationId: string) => {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
};

export const sendRaceUpdateNotification = async (title: string, body: string, raceId: string) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { raceId, type: 'race-update' },
      sound: true,
    },
    trigger: null, // Send immediately
  });
};