import { Platform, NativeModules } from 'react-native';
import PushNotification from 'react-native-push-notification';

// This file was generated by Mendix Studio Pro.
// BEGIN EXTRA CODE
// END EXTRA CODE
/**
 * @param {string} notificationId - This field is required.
 * @returns {Promise.<void>}
 */
async function CancelScheduledNotification(notificationId) {
    // BEGIN USER CODE
    // Documentation https://github.com/zo0r/react-native-push-notification
    const isIOS = Platform.OS === "ios";
    if (NativeModules && isIOS && !NativeModules.RNCPushNotificationIOS) {
        return Promise.reject(new Error("Notifications module is not available in your app"));
    }
    if (!notificationId) {
        return Promise.reject(new Error("Input parameter 'Notification id' is required"));
    }
    PushNotification.cancelLocalNotification(notificationId);
    return Promise.resolve();
    // END USER CODE
}

export { CancelScheduledNotification };
