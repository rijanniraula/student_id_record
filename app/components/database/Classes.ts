import { db } from './db'

export const createClass = async (name: string) => {
  return await db.runAsync(
    'INSERT INTO classes (name) VALUES (?);',
    [name]
  )
}

export const getClasses = async () => {
  return await db.getAllAsync(
    'SELECT * FROM classes ORDER BY id DESC;'
  )
}

export const deleteClass = async (id: number) => {
  return await db.runAsync(
    'DELETE FROM classes WHERE id = ?;',
    [id]
  )
}