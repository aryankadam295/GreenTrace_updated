import '../config/env.js';
import path from 'path';
import fs from 'fs';
import { DeleteObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

const s3Enabled =
  !!process.env.AWS_ACCESS_KEY_ID &&
  !!process.env.AWS_SECRET_ACCESS_KEY &&
  !!process.env.AWS_S3_BUCKET_NAME;

const s3Client = s3Enabled
  ? new S3Client({
      region: process.env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    })
  : null;

export const getUploadedFileUrl = (file) => {
  if (!file) return '';
  if (file.location) return file.location;

  const normalizedPath = (file.path || '').replace(/\\/g, '/');
  return normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
};

export const getS3KeyFromUrl = (fileUrl) => {
  try {
    const parsed = new URL(fileUrl);
    return decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
  } catch {
    return '';
  }
};

export const getStoredFileResponse = async (fileUrl) => {
  if (!fileUrl) return null;

  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    if (!s3Client || !process.env.AWS_S3_BUCKET_NAME) return null;

    const key = getS3KeyFromUrl(fileUrl);
    if (!key) return null;

    return s3Client.send(
      new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key
      })
    );
  }

  const localPath = path.resolve(fileUrl.replace(/^\/+/, ''));
  if (!fs.existsSync(localPath)) return null;

  return {
    Body: fs.createReadStream(localPath),
    ContentType: undefined
  };
};

export const deleteStoredFile = async (fileUrl, fallbackFolder = '') => {
  if (!fileUrl) return;

  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    if (!s3Client || !process.env.AWS_S3_BUCKET_NAME) return;

    const key = getS3KeyFromUrl(fileUrl);
    if (!key) return;

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key
      })
    );
    return;
  }

  const filename = path.basename(fileUrl);
  const localFilePath = fallbackFolder
    ? path.join('uploads', fallbackFolder, filename)
    : fileUrl.replace(/^\/+/, '');

  if (fs.existsSync(localFilePath)) {
    fs.unlinkSync(localFilePath);
  }
};

export const isS3Enabled = s3Enabled;
