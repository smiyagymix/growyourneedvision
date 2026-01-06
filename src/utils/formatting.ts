/**
 * Formatting Utilities
 * 
 * Centralized formatting functions for dates, numbers, currency, and other common data types.
 * Ensures consistent formatting across the application.
 * 
 * @example
 * import { formatCurrency, formatDate, formatRelativeTime } from '@/utils/formatting';
 * 
 * formatCurrency(1234.56, 'USD') // => "$1,234.56"
 * formatDate(new Date(), 'short') // => "12/22/2025"
 * formatRelativeTime(new Date(Date.now() - 3600000)) // => "1 hour ago"
 */

// =============================================================================
// CURRENCY FORMATTING
// =============================================================================

/**
 * Format a number as currency
 * @param amount - The amount to format
 * @param currency - ISO 4217 currency code (default: 'USD')
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format currency with optional compact notation (e.g., "$1.2K")
 */
export function formatCompactCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  if (Math.abs(amount) < 1000) {
    return formatCurrency(amount, currency, locale);
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1
  }).format(amount);
}

/**
 * Parse currency string to number
 * @param currencyString - String like "$1,234.56"
 * @returns Numeric value
 */
export function parseCurrency(currencyString: string): number {
  return parseFloat(currencyString.replace(/[^0-9.-]+/g, ''));
}

// =============================================================================
// DATE & TIME FORMATTING
// =============================================================================

/**
 * Format a date in various styles
 * @param date - Date object, ISO string, or timestamp
 * @param style - Format style: 'short', 'medium', 'long', 'full', or custom format
 * @param locale - Locale string (default: 'en-US')
 */
export function formatDate(
  date: Date | string | number,
  style: 'short' | 'medium' | 'long' | 'full' | string = 'medium',
  locale: string = 'en-US'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  // Predefined styles
  const styleMap = {
    short: { dateStyle: 'short' as const },
    medium: { dateStyle: 'medium' as const },
    long: { dateStyle: 'long' as const },
    full: { dateStyle: 'full' as const }
  };

  if (style in styleMap) {
    return new Intl.DateTimeFormat(locale, styleMap[style as keyof typeof styleMap]).format(dateObj);
  }

  // Custom format (simplified)
  return dateObj.toLocaleDateString(locale);
}

/**
 * Format time only
 */
export function formatTime(
  date: Date | string | number,
  format: '12h' | '24h' = '12h',
  locale: string = 'en-US'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: format === '12h'
  }).format(dateObj);
}

/**
 * Format date and time together
 */
export function formatDateTime(
  date: Date | string | number,
  dateStyle: 'short' | 'medium' | 'long' = 'medium',
  timeFormat: '12h' | '24h' = '12h',
  locale: string = 'en-US'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat(locale, {
    dateStyle: dateStyle,
    timeStyle: 'short',
    hour12: timeFormat === '12h'
  }).format(dateObj);
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: string = 'en-US'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(diffSeconds) < 60) {
    return rtf.format(-diffSeconds, 'second');
  } else if (Math.abs(diffMinutes) < 60) {
    return rtf.format(-diffMinutes, 'minute');
  } else if (Math.abs(diffHours) < 24) {
    return rtf.format(-diffHours, 'hour');
  } else if (Math.abs(diffDays) < 7) {
    return rtf.format(-diffDays, 'day');
  } else if (Math.abs(diffWeeks) < 4) {
    return rtf.format(-diffWeeks, 'week');
  } else if (Math.abs(diffMonths) < 12) {
    return rtf.format(-diffMonths, 'month');
  } else {
    return rtf.format(-diffYears, 'year');
  }
}

/**
 * Format duration in milliseconds to human-readable format
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Format ISO date string from Date object
 */
export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// =============================================================================
// NUMBER FORMATTING
// =============================================================================

/**
 * Format number with locale-specific separators
 */
export function formatNumber(
  value: number,
  decimals: number = 0,
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Format number as percentage
 */
export function formatPercentage(
  value: number,
  decimals: number = 1,
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100);
}

/**
 * Format file size in bytes to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format large numbers with compact notation (e.g., "1.2M")
 */
export function formatCompactNumber(
  value: number,
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(value);
}

// =============================================================================
// STRING FORMATTING
// =============================================================================

/**
 * Capitalize first letter of string
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert string to title case
 */
export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Convert camelCase or PascalCase to readable format
 */
export function toReadable(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

/**
 * Format phone number (US format)
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}

// =============================================================================
// LIST FORMATTING
// =============================================================================

/**
 * Format array as comma-separated list with "and" before last item
 */
export function formatList(
  items: string[],
  type: 'conjunction' | 'disjunction' = 'conjunction',
  locale: string = 'en-US'
): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];

  const formatter = new Intl.ListFormat(locale, {
    style: 'long',
    type: type
  });

  return formatter.format(items);
}

// =============================================================================
// GRADE & SCORE FORMATTING
// =============================================================================

/**
 * Convert numeric grade to letter grade (US system)
 */
export function formatLetterGrade(percentage: number): string {
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 63) return 'D';
  if (percentage >= 60) return 'D-';
  return 'F';
}

/**
 * Format GPA (0-4 scale)
 */
export function formatGPA(gpa: number): string {
  return gpa.toFixed(2);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format boolean as Yes/No
 */
export function formatBoolean(value: boolean): string {
  return value ? 'Yes' : 'No';
}

/**
 * Format status with emoji
 */
export function formatStatus(
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'failed' | 'canceled'
): string {
  const statusMap = {
    active: '🟒 Active',
    inactive: 'βš«οΈ Inactive',
    pending: '🟑 Pending',
    completed: 'βœ… Completed',
    failed: '❌ Failed',
    canceled: 'πŸ"΄ Canceled'
  };
  return statusMap[status] || status;
}

/**
 * Generate initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Format address for display
 */
export function formatAddress(address: {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}): string {
  const parts = [
    address.street,
    address.city,
    address.state && address.zip ? `${address.state} ${address.zip}` : address.state || address.zip,
    address.country
  ].filter(Boolean);

  return parts.join(', ');
}
