import { sanitizePathSegment } from "@/utils/studentPhoto";

export type StudentExportRow = {
  id: number;
  name: string;
  phone: string | null;
  dob: string | null;
};

const escapeCsvField = (value: string): string => {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export const getClassExportFileName = (className: string): string => {
  return `${sanitizePathSegment(className)}.csv`;
};

export const buildClassStudentsCsv = (students: StudentExportRow[]): string => {
  const lines = ["id,name,phone,dob"];

  for (const student of students) {
    lines.push(
      [
        escapeCsvField(String(student.id)),
        escapeCsvField(student.name),
        escapeCsvField(student.phone ?? ""),
        escapeCsvField(student.dob ?? ""),
      ].join(",")
    );
  }

  return lines.join("\n");
};
