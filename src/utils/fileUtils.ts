import { IconName } from '../components/shared/ui/CommonUI';

/**
 * Format bytes to human readable string
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Get icon name based on file extension or mime type
 */
export const getFileIcon = (filename: string): IconName => {
  const ext = filename.split('.').pop()?.toLowerCase();

  switch (ext) {
    // Documents
    case 'pdf':
      return 'DocumentTextIcon';
    case 'doc':
    case 'docx':
      return 'DocumentTextIcon'; // Or specific Word icon if available
    case 'xls':
    case 'xlsx':
    case 'csv':
      return 'TableCellsIcon';
    case 'ppt':
    case 'pptx':
      return 'PresentationChartBarIcon';
    case 'txt':
      return 'DocumentIcon';

    // Images
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
    case 'webp':
      return 'PhotoIcon';

    // Video/Audio
    case 'mp4':
    case 'mov':
    case 'avi':
    case 'webm':
      return 'VideoCameraIcon';
    case 'mp3':
    case 'wav':
      return 'MusicalNoteIcon';

    // Archives
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
      return 'ArchiveBoxIcon';

    // Code
    case 'js':
    case 'ts':
    case 'tsx':
    case 'jsx':
    case 'html':
    case 'css':
    case 'json':
      return 'CommandLineIcon';

    default:
      return 'DocumentIcon';
  }
};

/**
 * Get color class based on file extension
 */
export const getFileColorClass = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'pdf': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
    case 'doc':
    case 'docx': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
    case 'xls':
    case 'xlsx':
    case 'csv': return 'text-green-500 bg-green-50 dark:bg-green-900/20';
    case 'ppt':
    case 'pptx': return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20';
    case 'zip':
    case 'rar': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
    case 'jpg':
    case 'png': return 'text-purple-500 bg-purple-50 dark:bg-purple-900/20';
    default: return 'text-gray-500 bg-gray-50 dark:bg-gray-800';
  }
};
