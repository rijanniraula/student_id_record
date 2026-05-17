import { db } from './db'

export const initDatabase = async () => {

  await db.execAsync(`
    PRAGMA foreign_keys = ON;
  `)
  
  try {
    // CLASSES
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      );
    `)

    // STUDENTS
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        roll_number TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (class_id)
        REFERENCES classes(id)
        ON DELETE CASCADE
      );
    `)

    // PHOTOS
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        path TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE
      );
    `)

    console.log('Database initialized')
  } catch (error) {
    console.log('DB INIT ERROR:', error)
  }
}