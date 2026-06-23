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

export const updateStudentPaymentStatus = async (
  id: number,
  isPaid: boolean
) => {
  return await db.runAsync(
    'UPDATE students SET is_paid = ? WHERE id = ?;',
    [isPaid ? 1 : 0, id]
  )
}

export type StudentImportRow = {
  name: string
  phone?: string
  dob?: string
}

export const importStudentsForClass = async (
  classId: number,
  rows: StudentImportRow[]
) => {
  const existing = (await getStudentsByClass(classId)) as {
    id: number
    name: string
  }[]

  const byName = new Map(
    existing.map((s) => [s.name.trim().toLowerCase(), s])
  )

  let created = 0
  let updated = 0

  for (const row of rows) {
    const trimmedName = row.name.trim()
    const key = trimmedName.toLowerCase()
    const match = byName.get(key)

    if (match) {
      await updateStudent(match.id, trimmedName, row.phone, row.dob)
      updated++
    } else {
      const result = await createStudent(
        classId,
        trimmedName,
        row.phone,
        row.dob
      )
      if (result.lastInsertRowId) {
        byName.set(key, { id: Number(result.lastInsertRowId), name: trimmedName })
      }
      created++
    }
  }

  return { created, updated }
}
