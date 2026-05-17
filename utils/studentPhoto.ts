import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

const { StorageAccessFramework } = FileSystem;

export const APP_FOLDER = "id-mgmt";

const DOWNLOADS_ROOT_CACHE = `${FileSystem.documentDirectory}.downloads_app_root_uri.txt`;
const CLASS_DIRS_CACHE = `${FileSystem.documentDirectory}.saf_class_folder_uris.json`;

export const sanitizePathSegment = (value: string): string => {
  const sanitized = value
    .trim()
    .replace(/[/\\?%*:|"<>]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 80);

  return sanitized || "unknown";
};

const getPhotoFileName = (studentName: string, studentId: number): string =>
  `${sanitizePathSegment(studentName)}_${studentId}.jpg`;

const getPhotoBaseName = (studentName: string, studentId: number): string =>
  `${sanitizePathSegment(studentName)}_${studentId}`;

/** iOS / fallback file path (Documents/id-mgmt/...). */
export const getStudentPhotoUri = (
  className: string,
  studentName: string,
  studentId: number
): string => {
  const base = FileSystem.documentDirectory;
  if (!base) {
    throw new Error("Document directory is not available.");
  }
  const fileName = getPhotoFileName(studentName, studentId);
  return `${base}${APP_FOLDER}/${sanitizePathSegment(className)}/${fileName}`;
};

const getSafEntryName = (uri: string): string => {
  const decoded = decodeURIComponent(uri);
  const lastSegment = decoded.split("/").pop() ?? decoded;
  if (lastSegment.includes(":")) {
    return lastSegment.split(":").pop() ?? lastSegment;
  }
  return lastSegment;
};

const folderNamesMatch = (a: string, b: string): boolean =>
  sanitizePathSegment(a).toLowerCase() === sanitizePathSegment(b).toLowerCase();

const readClassDirCache = async (): Promise<Record<string, string>> => {
  const info = await FileSystem.getInfoAsync(CLASS_DIRS_CACHE);
  if (!info.exists) return {};
  try {
    const raw = await FileSystem.readAsStringAsync(CLASS_DIRS_CACHE);
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
};

const writeClassDirCache = async (cache: Record<string, string>): Promise<void> => {
  await FileSystem.writeAsStringAsync(CLASS_DIRS_CACHE, JSON.stringify(cache));
};

const getCachedClassDirUri = async (
  className: string
): Promise<string | null> => {
  const key = sanitizePathSegment(className);
  const cache = await readClassDirCache();
  const cachedUri = cache[key];
  if (!cachedUri) return null;

  const info = await FileSystem.getInfoAsync(cachedUri);
  return info.exists ? cachedUri : null;
};

const setCachedClassDirUri = async (
  className: string,
  dirUri: string
): Promise<void> => {
  const key = sanitizePathSegment(className);
  const cache = await readClassDirCache();
  cache[key] = dirUri;
  await writeClassDirCache(cache);
};

const findSubdirectoryUri = async (
  parentUri: string,
  dirName: string
): Promise<string | null> => {
  const children = await StorageAccessFramework.readDirectoryAsync(parentUri);
  for (const childUri of children) {
    const entryName = getSafEntryName(childUri);
    if (folderNamesMatch(entryName, dirName)) {
      return childUri;
    }
  }
  return null;
};

const ensureSubdirectory = async (
  parentUri: string,
  dirName: string
): Promise<string> => {
  const existing = await findSubdirectoryUri(parentUri, dirName);
  if (existing) {
    return existing;
  }

  const safeName = sanitizePathSegment(dirName);
  return await StorageAccessFramework.makeDirectoryAsync(parentUri, safeName);
};

const ensureClassDirectory = async (
  appRootUri: string,
  className: string
): Promise<string> => {
  const cached = await getCachedClassDirUri(className);
  if (cached) {
    return cached;
  }

  const classDirUri = await ensureSubdirectory(
    appRootUri,
    sanitizePathSegment(className)
  );
  await setCachedClassDirUri(className, classDirUri);
  return classDirUri;
};

const getAndroidAppRootUri = async (): Promise<string> => {
  const cacheInfo = await FileSystem.getInfoAsync(DOWNLOADS_ROOT_CACHE);
  if (cacheInfo.exists) {
    const cached = await FileSystem.readAsStringAsync(DOWNLOADS_ROOT_CACHE);
    if (cached) return cached;
  }

  const downloadPickerUri =
    StorageAccessFramework.getUriForDirectoryInRoot("Download");
  const result =
    await StorageAccessFramework.requestDirectoryPermissionsAsync(
      downloadPickerUri
    );

  if (!result.granted) {
    throw new Error(
      "Downloads folder access is required to save student photos. Please allow access to the Download folder."
    );
  }

  const appRootUri = await ensureSubdirectory(
    result.directoryUri,
    APP_FOLDER
  );
  await FileSystem.writeAsStringAsync(DOWNLOADS_ROOT_CACHE, appRootUri);
  return appRootUri;
};

const writeLocalFileToSaf = async (
  localFileUri: string,
  safFileUri: string
): Promise<void> => {
  const base64 = await FileSystem.readAsStringAsync(localFileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  await FileSystem.writeAsStringAsync(safFileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
};

const copyToStagingFile = async (
  sourceUri: string,
  studentId: number
): Promise<string> => {
  const stagingUri = `${FileSystem.cacheDirectory}student_photo_${studentId}_${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: sourceUri, to: stagingUri });
  return stagingUri;
};

const writeSourceToSaf = async (
  sourceUri: string,
  safFileUri: string,
  studentId: number
): Promise<void> => {
  if (sourceUri.startsWith("file://")) {
    await writeLocalFileToSaf(sourceUri, safFileUri);
    return;
  }

  const stagingUri = await copyToStagingFile(sourceUri, studentId);
  try {
    await writeLocalFileToSaf(stagingUri, safFileUri);
  } finally {
    await FileSystem.deleteAsync(stagingUri, { idempotent: true });
  }
};

const deleteMatchingFilesInDirectory = async (
  dirUri: string,
  baseName: string
): Promise<void> => {
  try {
    const entries = await StorageAccessFramework.readDirectoryAsync(dirUri);
    for (const entry of entries) {
      const decoded = decodeURIComponent(entry);
      if (decoded.includes(baseName)) {
        await FileSystem.deleteAsync(entry, { idempotent: true });
      }
    }
  } catch {
    // Directory may be empty or unreadable, ignore.
  }
};

const saveToAndroidDownloads = async (
  tempUri: string,
  className: string,
  studentName: string,
  studentId: number
): Promise<string> => {
  const appRootUri = await getAndroidAppRootUri();
  const classDirUri = await ensureClassDirectory(appRootUri, className);
  const baseName = getPhotoBaseName(studentName, studentId);

  await deleteMatchingFilesInDirectory(classDirUri, baseName);

  const fileUri = await StorageAccessFramework.createFileAsync(
    classDirUri,
    baseName,
    "image/jpeg"
  );

  await writeSourceToSaf(tempUri, fileUri, studentId);

  const info = await FileSystem.getInfoAsync(fileUri);
  if (!info.exists) {
    throw new Error("Photo file was not written to Downloads.");
  }

  return fileUri;
};

const saveToAppDocuments = async (
  tempUri: string,
  className: string,
  studentName: string,
  studentId: number
): Promise<string> => {
  const destUri = getStudentPhotoUri(className, studentName, studentId);
  const dirUri = destUri.slice(0, destUri.lastIndexOf("/") + 1);

  await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });

  const existing = await FileSystem.getInfoAsync(destUri);
  if (existing.exists) {
    await FileSystem.deleteAsync(destUri, { idempotent: true });
  }

  await FileSystem.copyAsync({ from: tempUri, to: destUri });

  const info = await FileSystem.getInfoAsync(destUri);
  if (!info.exists) {
    throw new Error("Photo file was not written to storage.");
  }

  return destUri;
};

export const saveStudentPhotoFromUri = async (
  tempUri: string,
  className: string,
  studentName: string,
  studentId: number
): Promise<string> => {
  if (Platform.OS === "android") {
    return saveToAndroidDownloads(tempUri, className, studentName, studentId);
  }
  return saveToAppDocuments(tempUri, className, studentName, studentId);
};

export const migrateStudentPhotoPath = async (
  currentPath: string | null,
  className: string,
  newStudentName: string,
  studentId: number
): Promise<string | null> => {
  if (!currentPath) return null;

  const currentInfo = await FileSystem.getInfoAsync(currentPath);
  if (!currentInfo.exists) return null;

  const destUri = getStudentPhotoUri(className, newStudentName, studentId);
  if (currentPath === destUri) {
    return currentPath;
  }

  if (Platform.OS === "android") {
    const appRootUri = await getAndroidAppRootUri();
    const classDirUri = await ensureClassDirectory(appRootUri, className);
    const baseName = getPhotoBaseName(newStudentName, studentId);
    await deleteMatchingFilesInDirectory(classDirUri, baseName);

    const fileUri = await StorageAccessFramework.createFileAsync(
      classDirUri,
      baseName,
      "image/jpeg"
    );

    await writeSourceToSaf(currentPath, fileUri, studentId);
    await FileSystem.deleteAsync(currentPath, { idempotent: true });
    return fileUri;
  }

  const dirUri = destUri.slice(0, destUri.lastIndexOf("/") + 1);
  await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
  await FileSystem.copyAsync({ from: currentPath, to: destUri });
  await FileSystem.deleteAsync(currentPath, { idempotent: true });
  return destUri;
};

export const photoFileExists = async (
  uri: string | null | undefined
): Promise<boolean> => {
  if (!uri) return false;
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists;
  } catch {
    return false;
  }
};

export const deleteStudentPhoto = async (
  uri: string | null | undefined
): Promise<void> => {
  if (!uri) return;
  await FileSystem.deleteAsync(uri, { idempotent: true });
};
