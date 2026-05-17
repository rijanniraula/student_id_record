import { getClasses } from "@/database/Classes";
import { initDatabase } from "@/database/Schema";
import { Stack } from "expo-router";
import { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
    initDatabase()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      const data = await getClasses()
      console.log(data)
    }
    fetchData()
  }, [])

  
  return <Stack />;
}
