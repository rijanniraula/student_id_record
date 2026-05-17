import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { initDatabase } from '../components/database/Schema'
import { createClass, getClasses } from '../components/database/Classes'
import '../index.css'

export default function Layout() {
  useEffect(() => {
    initDatabase()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      const data = await getClasses()
      console.log(data)
    }
    fetchData()

    const createClassLocal = async () => {
      const class1 = await createClass('Class 1')
      console.log(class1)
      const class2 = await createClass('Class 2')
      console.log(class2)
      const class3 = await createClass('Class 3')
      console.log(class3)
    }
    createClassLocal()
  }, [])
  console.log('Layout rendered')

  return <Stack />
}