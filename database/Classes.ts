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

export const getClassById = async (id: number) => {
  return await db.getFirstAsync('SELECT * FROM classes WHERE id = ?;', [id])
}

export const updateClass = async (id: number, name: string) => {
  return await db.runAsync(
    'UPDATE classes SET name = ? WHERE id = ?;',
    [name, id]
  )
}

export const deleteClass = async (id: number) => {
  return await db.runAsync(
    'DELETE FROM classes WHERE id = ?;',
    [id]
  )
}