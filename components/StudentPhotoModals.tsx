import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  clamp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;

type ZoomablePreviewImageProps = {
  uri: string;
  version: number;
};

function ZoomablePreviewImage({ uri, version }: ZoomablePreviewImageProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const resetTransform = () => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  useEffect(() => {
    resetTransform();
  }, [uri, version]);

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = clamp(savedScale.value * event.scale, MIN_SCALE, MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= MIN_SCALE) {
        scale.value = withTiming(MIN_SCALE);
        savedScale.value = MIN_SCALE;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      if (scale.value > MIN_SCALE) {
        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > MIN_SCALE) {
        scale.value = withTiming(MIN_SCALE);
        savedScale.value = MIN_SCALE;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withTiming(DOUBLE_TAP_SCALE);
        savedScale.value = DOUBLE_TAP_SCALE;
      }
    });

  const gesture = Gesture.Simultaneous(
    pinch,
    pan,
    doubleTap
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.zoomableContainer, animatedStyle]}>
        <Image
          source={{ uri }}
          style={styles.previewImage}
          resizeMode="contain"
        />
      </Animated.View>
    </GestureDetector>
  );
}

type StudentPhotoActionModalProps = {
  visible: boolean;
  onClose: () => void;
  onView: () => void;
  onRetake: () => void;
};

export function StudentPhotoActionModal({
  visible,
  onClose,
  onView,
  onRetake,
}: StudentPhotoActionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.actionCard} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.actionTitle}>Student photo</Text>

          <Pressable
            onPress={onView}
            className="flex-row items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-base text-gray-900"
            style={({ pressed }) => [
              styles.actionRow,
              pressed && styles.actionRowPressed,
            ]}
          >
            <Ionicons name="eye-outline" size={22} color="#2563eb" />
            <Text style={styles.actionRowText}>View</Text>
          </Pressable>

          <Pressable
            onPress={onRetake}
            className="flex-row items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-base text-gray-900 mt-4"
            style={({ pressed }) => [
              styles.actionRow,
              pressed && styles.actionRowPressed,
            ]}
          >
            <Ionicons name="camera-outline" size={22} color="#2563eb" />
            <Text style={styles.actionRowText}>Retake</Text>
          </Pressable>

          <Pressable onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type StudentPhotoPreviewModalProps = {
  visible: boolean;
  photoUri: string | null;
  photoVersion: number;
  studentName: string;
  onClose: () => void;
};

export function StudentPhotoPreviewModal({
  visible,
  photoUri,
  photoVersion,
  studentName,
  onClose,
}: StudentPhotoPreviewModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.previewContainer}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewTitle} numberOfLines={1}>
            {studentName}
          </Text>
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.previewImageWrap}>
          {photoUri ? (
            <ZoomablePreviewImage
              key={`${photoUri}-${photoVersion}`}
              uri={photoUri}
              version={photoVersion}
            />
          ) : (
            <ActivityIndicator size="large" color="#fff" />
          )}
        </View>

        <Text style={styles.previewHint}>Pinch to zoom · double-tap to reset</Text>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 24,
  },
  actionCard: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 16,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  actionRowPressed: {
    backgroundColor: "#f3f4f6",
  },
  actionRowText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 4,
  },
  cancelText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
  },
  previewContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  previewTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginRight: 12,
  },
  closeButton: {
    padding: 4,
  },
  previewImageWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  zoomableContainer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewHint: {
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 12,
    paddingBottom: 28,
    paddingTop: 8,
  },
});
