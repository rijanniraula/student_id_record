import {
  createClass,
  deleteClass,
  getClasses,
  updateClass,
} from "@/database/Classes";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

type ClassRow = {
  id: number;
  name: string;
};

export default function ClassesScreen() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [className, setClassName] = useState("");
  const [editingClass, setEditingClass] = useState<ClassRow | null>(null);

  const loadClasses = useCallback(async () => {
    const rows = (await getClasses()) as ClassRow[];
    setClasses(rows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadClasses();
    }, [loadClasses])
  );

  const openAddModal = useCallback(() => {
    setEditingClass(null);
    setClassName("");
    setModalVisible(true);
  }, []);

  const openEditModal = useCallback((item: ClassRow) => {
    setEditingClass(item);
    setClassName(item.name);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setClassName("");
    setEditingClass(null);
  }, []);

  const handleSave = useCallback(async () => {
    const trimmed = className.trim();
    if (!trimmed) {
      Alert.alert("Class name required", "Please enter a class name.");
      return;
    }

    if (editingClass) {
      await updateClass(editingClass.id, trimmed);
    } else {
      await createClass(trimmed);
    }

    closeModal();
    await loadClasses();
  }, [className, closeModal, editingClass, loadClasses]);

  const handleDelete = useCallback(
    (item: ClassRow) => {
      Alert.alert(
        "Delete class",
        `Delete "${item.name}"? Students in this class will also be removed.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              await deleteClass(item.id);
              await loadClasses();
            },
          },
        ]
      );
    },
    [loadClasses]
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: "Classes",
          headerRight: () => (
            <Pressable
              onPress={openAddModal}
              className="mr-2 flex-row items-center rounded-lg bg-blue-600 px-3 py-1.5 active:opacity-80"
            >
              <Text className="text-sm font-semibold text-white">
                + Add Class
              </Text>
            </Pressable>
          ),
        }}
      />

      <View className="flex-1 bg-gray-50">
        <FlatList
          data={classes}
          keyExtractor={(item) => String(item.id)}
          contentContainerClassName="grow px-4 py-3"
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-24">
              <Text className="text-base text-gray-500">No classes yet</Text>
              <Text className="mt-1 text-sm text-gray-400">
                Tap + Add Class to create one
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="mb-2 flex-row items-center rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <Pressable
                onPress={() => router.push(`/class/${item.id}`)}
                className="mr-2 flex-1 active:opacity-70"
              >
                <Text className="text-base font-medium text-gray-900">
                  {item.name}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => openEditModal(item)}
                hitSlop={8}
                className="mr-3 p-1 active:opacity-60"
              >
                <Feather name="edit" size={16} color="blue" />
              </Pressable>
              <Pressable
                onPress={() => handleDelete(item)}
                hitSlop={8}
                className="p-1 active:opacity-60"
              >
                <Feather name="trash-2" size={16} color="red" />
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
              {editingClass ? "Edit Class" : "Add Class"}
            </Text>
            <Text className="mt-1 text-sm text-gray-500">Class Name</Text>
            <TextInput
              className="mt-3 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-base text-gray-900"
              placeholder="e.g. Grade 10-A"
              placeholderTextColor="#9ca3af"
              value={className}
              onChangeText={setClassName}
              autoFocus
              onSubmitEditing={handleSave}
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
                  {editingClass ? "Save" : "Add"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
