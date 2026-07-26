import * as fs from "fs";
import * as path from "path";

const uploadsDirectory = path.resolve(process.cwd(), "uploads");
const uploadsPublicBasePath = "/uploads";
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".avif", ".bmp"]);

export const ensureUploadsDirectory = (): string => {
  fs.mkdirSync(uploadsDirectory, { recursive: true });
  return uploadsDirectory;
};

export const getUploadsDirectory = (): string => ensureUploadsDirectory();

export const getUploadsPublicBasePath = (): string => uploadsPublicBasePath;

export const isImageReference = (value?: string | null): boolean => {
  if (!value) {
    return false;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return false;
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    return true;
  }

  const normalizedValue = trimmedValue.replace(/\\/g, "/");
  if (normalizedValue.startsWith("/")) {
    return imageExtensions.has(path.extname(normalizedValue).toLowerCase()) || normalizedValue.startsWith("/uploads/");
  }

  if (normalizedValue.startsWith("uploads/")) {
    return true;
  }

  return imageExtensions.has(path.extname(normalizedValue).toLowerCase());
};

export const toPublicImageUrl = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue;
  }

  if (!isImageReference(trimmedValue)) {
    return trimmedValue;
  }

  const normalizedValue = trimmedValue.replace(/\\/g, "/").replace(/^\/+/, "");
  if (normalizedValue.startsWith("uploads/")) {
    return `/${normalizedValue}`;
  }

  return `${uploadsPublicBasePath}/${normalizedValue}`;
};

export const toStoredImageReference = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue;
  }

  if (!isImageReference(trimmedValue)) {
    return trimmedValue;
  }

  const normalizedValue = trimmedValue.replace(/\\/g, "/").replace(/^\/+/, "");
  if (normalizedValue.startsWith("uploads/")) {
    return normalizedValue;
  }

  return normalizedValue;
};
