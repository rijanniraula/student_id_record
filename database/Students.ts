import { db } from './db'

export const createStudent = async (
  classId: number,
  name: string,
  rollNumber?: string
) => {
  return await db.runAsync(
    `
    INSERT INTO students
    (class_id, name, roll_number)
    VALUES (?, ?, ?);
    `,
    [classId, name, rollNumber || null]
  )
}

export const getStudentsByClass = async (
  classId: number
) => {
  return await db.getAllAsync(
    `
    SELECT * FROM students
    WHERE class_id = ?
    ORDER BY name ASC;
    `,
    [classId]
  )
}