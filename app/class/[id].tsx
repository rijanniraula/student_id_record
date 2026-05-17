import { getClassById } from "@/database/Classes";
import {
  createStudent,
  deleteStudent,
  getStudentsByClass,
  importStudentsForClass,
  updateStudent,
} from "@/database/Students";
import { parseStudentCsv } from "@/utils/parseStudentCsv";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
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

export default function ClassStudentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const classId = Number(id);
  const router = useRouter();

  const [className, setClassName] = useState("");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [editingStudent, setEditingStudent] = useState<StudentRow | null>(null);
  const [importing, setImporting] = useState(false);

  const loadData = useCallback(async () => {
    if (!classId || Number.isNaN(classId)) return;

    const cls = (await getClassById(classId)) as { name: string } | null;
    setClassName(cls?.name ?? "Class");

    const rows = (await getStudentsByClass(classId)) as StudentRow[];
    setStudents(rows);
  }, [classId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const openAddModal = useCallback(() => {
    setEditingStudent(null);
    setName("");
    setPhone("");
    setDob("");
    setModalVisible(true);
  }, []);

  const openEditModal = useCallback((item: StudentRow) => {
    setEditingStudent(item);
    setName(item.name);
    setPhone(item.phone ?? "");
    setDob(item.dob ?? "");
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setName("");
    setPhone("");
    setDob("");
    setEditingStudent(null);
  }, []);

  const handleSave = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert("Name required", "Please enter the student's name.");
      return;
    }

    if (editingStudent) {
      await updateStudent(
        editingStudent.id,
        trimmedName,
        phone,
        dob
      );
    } else {
      await createStudent(classId, trimmedName, phone, dob);
    }

    closeModal();
    await loadData();
  }, [classId, closeModal, dob, editingStudent, loadData, name, phone]);

  const handleImport = useCallback(async () => {
    if (!classId || Number.isNaN(classId) || importing) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "text/csv",
          "text/comma-separated-values",
          "application/csv",
          "application/vnd.ms-excel",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets[0]) return;

      setImporting(true);
      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri);
      const { rows, errors } = parseStudentCsv(content);

      if (rows.length === 0) {
        Alert.alert(
          "Import failed",
          errors.length > 0
            ? errors.slice(0, 5).join("\n")
            : "No valid rows found in the CSV file."
        );
        return;
      }

      const { created, updated } = await importStudentsForClass(classId, rows);
      await loadData();

      const summary = `Added ${created} student${created === 1 ? "" : "s"}, updated ${updated}.`;
      if (errors.length > 0) {
        Alert.alert(
          "Import completed with warnings",
          `${summary}\n\n${errors.slice(0, 5).join("\n")}${
            errors.length > 5 ? `\n…and ${errors.length - 5} more.` : ""
          }`
        );
      } else {
        Alert.alert("Import complete", summary);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not import CSV file.";
      Alert.alert("Import failed", message);
    } finally {
      setImporting(false);
    }
  }, [classId, importing, loadData]);

  const handleDelete = useCallback(
    (item: StudentRow) => {
      Alert.alert(
        "Delete student",
        `Delete "${item.name}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              await deleteStudent(item.id);
              await loadData();
            },
          },
        ]
      );
    },
    [loadData]
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: className,
          headerRight: () => (
            <View className="mr-2 flex-row items-center gap-2">
              <Pressable
                onPress={handleImport}
                disabled={importing}
                className="flex-row items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 active:opacity-80 disabled:opacity-50"
              >
                {importing ? (
                  <ActivityIndicator size="small" color="#2563eb" />
                ) : (
                  <Text className="text-sm font-semibold text-gray-800">
                    Import
                  </Text>
                )}
              </Pressable>
              <Pressable
                onPress={openAddModal}
                disabled={importing}
                className="flex-row items-center rounded-lg bg-blue-600 px-3 py-1.5 active:opacity-80 disabled:opacity-50"
              >
                <Text className="text-sm font-semibold text-white">
                  + Add Student
                </Text>
              </Pressable>
            </View>
          ),
        }}
      />

      <View className="flex-1 bg-gray-50">
        <FlatList
          data={students}
          keyExtractor={(item) => String(item.id)}
          contentContainerClassName="grow px-4 py-3"
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-24">
              <Text className="text-base text-gray-500">No students yet</Text>
              <Text className="mt-1 text-center text-sm text-gray-400">
                Tap + Add Student or Import a CSV
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="mb-2 flex-row items-center rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <Pressable
                onPress={() => router.push(`/student/${item.id}`)}
                className="mr-2 flex-1 active:opacity-70"
              >
                <Text className="text-base font-medium text-gray-900">
                  {item.name}
                </Text>
                {(item.phone || item.dob) && (
                  <Text className="mt-0.5 text-sm text-gray-500">
                    {[item.phone, item.dob].filter(Boolean).join(" · ")}
                  </Text>
                )}
              </Pressable>
              <Pressable
                onPress={() => openEditModal(item)}
                hitSlop={8}
                className="mr-3 p-1 active:opacity-60"
              >
                <Ionicons name="pencil" size={20} color="#2563eb" />
              </Pressable>
              <Pressable
                onPress={() => handleDelete(item)}
                hitSlop={8}
                className="p-1 active:opacity-60"
              >
                <Ionicons name="trash-outline" size={20} color="#dc2626" />
              </Pressable>
            </View>
          )}
        />
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/40 px-6"
          onPress={closeModal}
        >
          <Pressable
            className="w-full max-w-sm rounded-2xl bg-white p-5"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-lg font-semibold text-gray-900">
              {editingStudent ? "Edit Student" : "Add Student"}
            </Text>

            <Text className="mt-4 text-sm text-gray-500">Name</Text>
            <TextInput
              className="mt-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-base text-gray-900"
              placeholder="Student name"
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={setName}
              autoFocus
            />

            <Text className="mt-3 text-sm text-gray-500">Phone</Text>
            <TextInput
              className="mt-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-base text-gray-900"
              placeholder="Phone number"
              placeholderTextColor="#9ca3af"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <Text className="mt-3 text-sm text-gray-500">Date of birth</Text>
            <TextInput
              className="mt-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-base text-gray-900"
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
              value={dob}
              onChangeText={setDob}
            />

            <View className="mt-5 flex-row justify-end gap-2">
              <Pressable
                onPress={closeModal}
                className="rounded-lg px-4 py-2 active:opacity-70"
              >
                <Text className="text-base font-medium text-gray-600">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                className="rounded-lg bg-blue-600 px-4 py-2 active:opacity-80"
              >
                <Text className="text-base font-semibold text-white">
                  {editingStudent ? "Save" : "Add"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
