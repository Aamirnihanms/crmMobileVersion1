import { useEffect } from 'react';
import { Platform } from 'react-native';
import SpInAppUpdates, {
  IAUUpdateKind,
  StartUpdateOptions,
} from 'sp-react-native-in-app-updates';

const inAppUpdates = new SpInAppUpdates(
  false // isDebug
);

export const useUpdateCheck = () => {
  useEffect(() => {
    // We only want this to run once when the app is mounted.
    // The checkNeedsUpdate method compares the current app version with the store version.
    inAppUpdates.checkNeedsUpdate().then((result) => {
      if (result.shouldUpdate) {
        let updateOptions: StartUpdateOptions = {};
        
        if (Platform.OS === 'android') {
          // On Android, we can choose between FLEXIBLE (background download) and IMMEDIATE (blocking).
          updateOptions = {
            updateType: IAUUpdateKind.FLEXIBLE,
          };
        } else if (Platform.OS === 'ios') {
          // On iOS, this will automatically prompt the user with a dialog that links to the App Store.
          updateOptions = {
            title: 'Update Available',
            message: 'A new version of the app is available. Please update to the latest version to enjoy new features and improvements.',
            buttonUpgradeText: 'Update',
            buttonCancelText: 'Cancel',
          };
        }
        
        // Starts the update process
        inAppUpdates.startUpdate(updateOptions).catch((err) => {
          console.warn('In-app update error:', err);
        });
      }
    }).catch((err) => {
      console.warn('Failed to check for updates:', err);
    });
  }, []);
};
