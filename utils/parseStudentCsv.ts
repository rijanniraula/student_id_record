export type StudentCsvRow = {
  name: string;
  dob?: string;
  phone?: string;
};

export type ParseStudentCsvResult = {
  rows: StudentCsvRow[];
  errors: string[];
};

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
};

export const parseStudentCsv = (content: string): ParseStudentCsvResult => {
  const errors: string[] = [];
  const normalized = content.replace(/^\uFEFF/, "").trim();

  if (!normalized) {
    return { rows: [], errors: ["The file is empty."] };
  }

  const lines = normalized.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return {
      rows: [],
      errors: ["CSV must include a header row and at least one student row."],
    };
  }

  const headers = parseCsvLine(lines[0]).map((h) =>
    h.trim().toLowerCase().replace(/^"|"$/g, "")
  );

  const nameIdx = headers.indexOf("name");
  const dobIdx = headers.indexOf("dob");
  const phoneIdx = headers.indexOf("phone");

  if (nameIdx === -1) {
    return {
      rows: [],
      errors: ['Missing required column "name". Expected headers: name, dob, phone.'],
    };
  }

  const rows: StudentCsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]).map((c) => c.trim().replace(/^"|"$/g, ""));
    const name = cols[nameIdx]?.trim();

    if (!name) {
      errors.push(`Row ${i + 1}: name is required.`);
      continue;
    }

    rows.push({
      name,
      dob: dobIdx >= 0 ? cols[dobIdx]?.trim() || undefined : undefined,
      phone: phoneIdx >= 0 ? cols[phoneIdx]?.trim() || undefined : undefined,
    });
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push("No valid student rows found.");
  }

  return { rows, errors };
};
