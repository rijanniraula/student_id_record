import * as ImagePicker from "expo-image-picker";
import { Alert, Linking } from "react-native";

/**
 * Opens the device native camera app and returns the captured image URI.
 * Returns null if the user cancels or permission is denied.
 */
export const launchNativeCamera = async (): Promise<string | null> => {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    if (!permission.canAskAgain) {
      Alert.alert(
        "Camera permission required",
        "Enable camera access in Settings to take student photos.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => Linking.openSettings(),
          },
        ]
      );
    } else {
      Alert.alert(
        "Camera permission required",
        "Allow camera access to take student photos."
      );
    }
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    quality: 1,
    exif: false,
  });

  if (result.canceled || !result.assets[0]?.uri) {
    return null;
  }

  return result.assets[0].uri;
};
