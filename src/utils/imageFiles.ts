import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { ensureFirebaseAuth, firebaseStorage, isFirebaseConfigured } from "../config/firebase";

export type ImageUploadFolder = "services" | "inspiration" | "barbers";

export interface ImageFileResult {
  imageUrl: string;
  imageStoragePath: string;
  persisted: boolean;
}

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen seleccionada."));
    reader.readAsDataURL(file);
  });
}

export async function fileToDataUrl(file: File): Promise<string> {
  try {
    const uploadId = `owner-upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const uploaded = await uploadImageFile(file, buildImageStoragePath("services", uploadId, file));
    return uploaded.imageUrl;
  } catch (error) {
    console.warn("Firebase Storage no está disponible para esta imagen. Se usará respaldo temporal local.", error);
    return readFileAsDataUrl(file);
  }
}

function getImageExtension(file: File): string {
  if (file.type && MIME_EXTENSIONS[file.type]) {
    return MIME_EXTENSIONS[file.type];
  }

  const extension = file.name.split(".").pop()?.trim().toLowerCase();
  return extension && /^[a-z0-9]+$/.test(extension) ? extension : "jpg";
}

function cleanPathPart(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_") || "image";
}

export function buildImageStoragePath(folder: ImageUploadFolder, itemId: string, file: File, filename = "cover"): string {
  const safeFolder = folder === "inspiration" ? "services" : folder;
  const safeItemId = folder === "inspiration" ? `inspiration_${itemId}` : itemId;
  return `${safeFolder}/${cleanPathPart(safeItemId)}/${cleanPathPart(filename)}.${getImageExtension(file)}`;
}

export async function uploadImageFile(file: File, storagePath: string): Promise<ImageFileResult> {
  if (!isFirebaseConfigured || !firebaseStorage) {
    throw new Error("Firebase Storage no está configurado.");
  }

  const user = await ensureFirebaseAuth();
  if (!user) {
    throw new Error("No se pudo iniciar sesión para subir la imagen.");
  }

  const normalizedPath = storagePath.replace(/^\/+/, "");
  const storageRef = ref(firebaseStorage, normalizedPath);

  await uploadBytes(storageRef, file, {
    contentType: file.type || "image/jpeg",
    cacheControl: "public,max-age=31536000"
  });

  const imageUrl = await getDownloadURL(storageRef);

  return {
    imageUrl,
    imageStoragePath: normalizedPath,
    persisted: true
  };
}
