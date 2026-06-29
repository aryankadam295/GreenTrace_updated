import api from './api';

export const getMediaUrl = (mediaPath, folder = '') => {
  if (!mediaPath) return '';
  if (mediaPath.startsWith('data:')) return mediaPath;

  const apiBaseUrl = api.defaults.baseURL || '';
  const backendOrigin = apiBaseUrl.replace(/\/api\/?$/, '');

  if (mediaPath.startsWith('http://') || mediaPath.startsWith('https://')) {
    const isS3Url = /\.s3[.-][^/]*amazonaws\.com\//i.test(mediaPath);
    return isS3Url
      ? `${backendOrigin}/api/media?url=${encodeURIComponent(mediaPath)}`
      : mediaPath;
  }

  const normalizedPath = mediaPath.startsWith('/') ? mediaPath : mediaPath;

  if (normalizedPath.startsWith('/uploads/')) {
    return `${backendOrigin}${normalizedPath}`;
  }

  if (folder) {
    return `${backendOrigin}/uploads/${folder}/${normalizedPath}`;
  }

  return `${backendOrigin}/${normalizedPath.replace(/^\/+/, '')}`;
};
