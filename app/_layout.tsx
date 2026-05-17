import "./index.css";
import { initDatabase } from "@/database/Schema";
import { Stack } from "expo-router";
import { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "left",
      }}
    />
  );
}
