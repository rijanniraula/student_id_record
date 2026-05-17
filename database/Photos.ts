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

export const getLatestPhotosByClassId = async (
  classId: number
): Promise<Record<number, string>> => {
  const rows = await db.getAllAsync<{ student_id: number; path: string }>(
    `
    SELECT p.student_id, p.path
    FROM photos p
    INNER JOIN students s ON s.id = p.student_id
    WHERE s.class_id = ?
      AND p.id = (
        SELECT MAX(p2.id)
        FROM photos p2
        WHERE p2.student_id = p.student_id
      );
    `,
    [classId]
  );

  const map: Record<number, string> = {};
  for (const row of rows) {
    map[row.student_id] = row.path;
  }
  return map;
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
