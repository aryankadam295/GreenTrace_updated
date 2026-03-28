import api from './api';

export const getMediaUrl = (mediaPath, folder = '') => {
  if (!mediaPath) return '';
  if (mediaPath.startsWith('data:')) return mediaPath;
  if (mediaPath.startsWith('http://') || mediaPath.startsWith('https://')) {
    return mediaPath;
  }

  const apiBaseUrl = api.defaults.baseURL || '';
  const backendOrigin = apiBaseUrl.replace(/\/api\/?$/, '');
  const normalizedPath = mediaPath.startsWith('/') ? mediaPath : mediaPath;

  if (normalizedPath.startsWith('/uploads/')) {
    return `${backendOrigin}${normalizedPath}`;
  }

  if (folder) {
    return `${backendOrigin}/uploads/${folder}/${normalizedPath}`;
  }

  return `${backendOrigin}/${normalizedPath.replace(/^\/+/, '')}`;
};
