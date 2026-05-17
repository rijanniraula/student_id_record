import { db } from './db'

export const createStudent = async (
  classId: number,
  name: string,
  phone?: string,
  dob?: string
) => {
  return await db.runAsync(
    `
    INSERT INTO students
    (class_id, name, phone, dob)
    VALUES (?, ?, ?, ?);
    `,
    [classId, name, phone?.trim() || null, dob?.trim() || null]
  )
}

export const getStudentsByClass = async (classId: number) => {
  return await db.getAllAsync(
    `
    SELECT * FROM students
    WHERE class_id = ?
    ORDER BY name ASC;
    `,
    [classId]
  )
}

export const getStudentById = async (id: number) => {
  return await db.getFirstAsync('SELECT * FROM students WHERE id = ?;', [id])
}

export const updateStudent = async (
  id: number,
  name: string,
  phone?: string,
  dob?: string
) => {
  return await db.runAsync(
    `
    UPDATE students
    SET name = ?, phone = ?, dob = ?
    WHERE id = ?;
    `,
    [name, phone?.trim() || null, dob?.trim() || null, id]
  )
}

export const deleteStudent = async (id: number) => {
  return await db.runAsync('DELETE FROM students WHERE id = ?;', [id])
}
