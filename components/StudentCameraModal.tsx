import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type StudentCameraModalProps = {
  visible: boolean;
  onClose: () => void;
  onCapture: (uri: string) => void;
};

export function StudentCameraModal({
  visible,
  onClose,
  onCapture,
}: StudentCameraModalProps) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    if (!visible) {
      setCameraReady(false);
      setCapturing(false);
      return;
    }

    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [visible, permission, requestPermission]);

  const handleCapture = async () => {
    if (capturing) return;

    if (!cameraRef.current) {
      Alert.alert("Camera not ready", "Please wait a moment and try again.");
      return;
    }

    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
      });

      if (photo?.uri) {
        onCapture(photo.uri);
        onClose();
      } else {
        Alert.alert("Capture failed", "No photo was returned. Please try again.");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not take photo.";
      Alert.alert("Capture failed", message);
    } finally {
      setCapturing(false);
    }
  };

  const permissionDenied = permission && !permission.granted;
  const permissionLoading = !permission;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {permissionLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : permissionDenied ? (
          <View style={[styles.centered, styles.permissionBox]}>
            <Text style={styles.permissionText}>
              Camera permission is required to take a student photo.
            </Text>
            <Pressable
              onPress={requestPermission}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Grant permission</Text>
            </Pressable>
            <Pressable onPress={onClose} style={styles.textButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.preview}>
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing="back"
                mode="picture"
                onCameraReady={() => setCameraReady(true)}
              />
              {!cameraReady && (
                <View style={styles.readyOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.readyText}>Starting camera…</Text>
                </View>
              )}
            </View>

            <View
              style={[
                styles.controls,
                { paddingBottom: Math.max(insets.bottom, 16) },
              ]}
            >
              <Pressable onPress={onClose} style={styles.sideButton}>
                <Text style={styles.sideButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleCapture}
                disabled={capturing}
                style={({ pressed }) => [
                  styles.shutterOuter,
                  pressed && styles.shutterPressed,
                  capturing && styles.shutterDisabled,
                ]}
              >
                {capturing ? (
                  <ActivityIndicator color="#2563eb" size="small" />
                ) : (
                  <View style={styles.shutterInner} />
                )}
              </Pressable>

              <View style={styles.sideButton}>
                <Text style={styles.takePhotoLabel}>Take photo</Text>
              </View>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionBox: {
    paddingHorizontal: 24,
  },
  permissionText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  primaryButton: {
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: "#2563eb",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  textButton: {
    marginTop: 12,
    padding: 8,
  },
  cancelText: {
    color: "#d1d5db",
    fontSize: 16,
  },
  preview: {
    flex: 1,
    overflow: "hidden",
  },
  readyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  readyText: {
    marginTop: 12,
    color: "#fff",
    fontSize: 14,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#111",
    paddingTop: 16,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  sideButton: {
    width: 88,
    alignItems: "center",
  },
  sideButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  takePhotoLabel: {
    color: "#9ca3af",
    fontSize: 12,
    textAlign: "center",
  },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
  },
  shutterPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.95 }],
  },
  shutterDisabled: {
    opacity: 0.5,
  },
});
