import { db } from "./db";

export type PhotoRow = {
  id: number;
  student_id: number;
  path: string;
  created_at: string;
};

export const getPhotoByStudentId = async (studentId: number) => {
  return await db.getFirstAsync<PhotoRow>(
    `
    SELECT * FROM photos
    WHERE student_id = ?
    ORDER BY id DESC
    LIMIT 1;
    `,
    [studentId]
  );
};

export const upsertStudentPhoto = async (studentId: number, path: string) => {
  const existing = await getPhotoByStudentId(studentId);

  if (existing) {
    await db.runAsync("UPDATE photos SET path = ? WHERE id = ?;", [
      path,
      existing.id,
    ]);
    return existing.id;
  }

  const result = await db.runAsync(
    "INSERT INTO photos (student_id, path) VALUES (?, ?);",
    [studentId, path]
  );
  return result.lastInsertRowId;
};
