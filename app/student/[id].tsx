import { getClassById } from "@/database/Classes";
import { getPhotoByStudentId, upsertStudentPhoto } from "@/database/Photos";
import { getStudentById, updateStudent } from "@/database/Students";
import { StudentCameraModal } from "@/components/StudentCameraModal";
import {
  StudentPhotoActionModal,
  StudentPhotoPreviewModal,
} from "@/components/StudentPhotoModals";
import {
  deleteStudentPhoto,
  migrateStudentPhotoPath,
  photoFileExists,
  saveStudentPhotoFromUri,
} from "@/utils/studentPhoto";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type StudentRow = {
  id: number;
  class_id: number;
  name: string;
  phone: string | null;
  dob: string | null;
};

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const studentId = Number(id);

  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoVersion, setPhotoVersion] = useState(0);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);

  const handlePhotoPlaceholderPress = useCallback(() => {
    if (savingPhoto) return;
    if (photoUri) {
      setActionModalVisible(true);
    } else {
      setCameraVisible(true);
    }
  }, [photoUri, savingPhoto]);

  const loadStudent = useCallback(async () => {
    if (!studentId || Number.isNaN(studentId)) return;

    setLoading(true);
    const row = (await getStudentById(studentId)) as StudentRow | null;
    if (row) {
      setName(row.name);
      setSavedName(row.name);
      setPhone(row.phone ?? "");
      setDob(row.dob ?? "");

      const cls = (await getClassById(row.class_id)) as { name: string } | null;
      setClassName(cls?.name ?? "unknown");

      const photo = await getPhotoByStudentId(studentId);
      const path =
        photo?.path && (await photoFileExists(photo.path)) ? photo.path : null;

      setPhotoUri(path);
      if (path) {
        setPhotoVersion((v) => v + 1);
      }
    }
    setLoading(false);
  }, [studentId]);

  useFocusEffect(
    useCallback(() => {
      loadStudent();
    }, [loadStudent])
  );

  const handlePhotoCapture = useCallback(
    async (tempUri: string) => {
      const trimmedName = name.trim() || savedName;
      if (!trimmedName || !className) {
        Alert.alert("Save name first", "Enter the student's name before adding a photo.");
        return;
      }

      setSavingPhoto(true);
      try {
        if (photoUri) {
          await deleteStudentPhoto(photoUri);
        }

        const path = await saveStudentPhotoFromUri(
          tempUri,
          className,
          trimmedName,
          studentId
        );
        await upsertStudentPhoto(studentId, path);
        setPhotoUri(path);
        setPhotoVersion((v) => v + 1);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not save the student photo.";
        Alert.alert("Photo failed", message);
      } finally {
        setSavingPhoto(false);
      }
    },
    [className, name, photoUri, savedName, studentId]
  );

  const handleSave = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert("Name required", "Please enter the student's name.");
      return;
    }

    await updateStudent(studentId, trimmedName, phone, dob);

    if (photoUri && trimmedName !== savedName && className) {
      const newPath = await migrateStudentPhotoPath(
        photoUri,
        className,
        trimmedName,
        studentId
      );
      if (newPath) {
        await upsertStudentPhoto(studentId, newPath);
        setPhotoUri(newPath);
      }
    }

    setSavedName(trimmedName);
    Alert.alert("Saved", "Student details updated.");
    await loadStudent();
  }, [className, dob, loadStudent, name, phone, photoUri, savedName, studentId]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const hasPhoto = Boolean(photoUri);

  return (
    <>
      <Stack.Screen options={{ title: "Student Details" }} />

      <StudentCameraModal
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        onCapture={handlePhotoCapture}
      />

      <StudentPhotoActionModal
        visible={actionModalVisible}
        onClose={() => setActionModalVisible(false)}
        onView={() => {
          setActionModalVisible(false);
          setPreviewVisible(true);
        }}
        onRetake={() => {
          setActionModalVisible(false);
          setCameraVisible(true);
        }}
      />

      <StudentPhotoPreviewModal
        visible={previewVisible}
        photoUri={photoUri}
        photoVersion={photoVersion}
        studentName={name.trim() || savedName || "Student"}
        onClose={() => setPreviewVisible(false)}
      />

      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerClassName="px-4 py-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-6 items-center">
          <Pressable
            onPress={handlePhotoPlaceholderPress}
            disabled={savingPhoto}
            className="h-40 w-40 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-white active:opacity-80"
          >
            {savingPhoto ? (
              <ActivityIndicator size="large" color="#2563eb" />
            ) : hasPhoto && photoUri ? (
              <Image
                key={`${photoUri}-${photoVersion}`}
                source={{ uri: photoUri }}
                style={styles.photo}
                resizeMode="cover"
              />
            ) : (
              <View className="items-center px-3">
                <Ionicons name="image-outline" size={40} color="#9ca3af" />
                <Text className="mt-2 text-center text-sm text-gray-500">
                  Tap to add photo
                </Text>
              </View>
            )}
          </Pressable>
          {hasPhoto && (
            <Text className="mt-2 text-xs text-gray-400">
              Tap to view or retake photo
            </Text>
          )}
        </View>

        <View className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <Text className="text-sm font-medium text-gray-500">Name</Text>
          <TextInput
            className="mt-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-base text-gray-900"
            value={name}
            onChangeText={setName}
            placeholder="Student name"
            placeholderTextColor="#9ca3af"
          />

          <Text className="mt-4 text-sm font-medium text-gray-500">
            Phone number
          </Text>
          <TextInput
            className="mt-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-base text-gray-900"
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone number"
            placeholderTextColor="#9ca3af"
            keyboardType="phone-pad"
          />

          <Text className="mt-4 text-sm font-medium text-gray-500">
            Date of birth
          </Text>
          <TextInput
            className="mt-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-base text-gray-900"
            value={dob}
            onChangeText={setDob}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <Pressable
          onPress={handleSave}
          className="mt-6 items-center rounded-xl bg-blue-600 py-3.5 active:opacity-80"
        >
          <Text className="text-base font-semibold text-white">Save</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  photo: {
    width: 160,
    height: 160,
  },
});
