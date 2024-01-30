import { Platform, NativeModules } from 'react-native';
import PushNotification from 'react-native-push-notification';

// This file was generated by Mendix Studio Pro.
// BEGIN EXTRA CODE
// END EXTRA CODE
/**
 * Clears all delivered notifications from notification tray
 * @returns {Promise.<void>}
 */
async function ClearAllDeliveredNotifications() {
    // BEGIN USER CODE
    // Documentation https://github.com/zo0r/react-native-push-notification
    const isIOS = Platform.OS === "ios";
    if (NativeModules && isIOS && !NativeModules.RNCPushNotificationIOS) {
        return Promise.reject(new Error("Notifications module is not available in your app"));
    }
    PushNotification.removeAllDeliveredNotifications();
    return Promise.resolve();
    // END USER CODE
}

export { ClearAllDeliveredNotifications };
