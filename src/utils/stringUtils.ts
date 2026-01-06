
export const capitalize = (s: string) => {
  if (typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const truncate = (str: string, num: number) => {
  if (str.length <= num) return str;
  return str.slice(0, num) + '...';
};

export const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
};

export const generateInitials = (name: string) => {
    const parts = name.split(' ');
    let initials = '';
    for (let i = 0; i < Math.min(parts.length, 2); i++) {
        if(parts[i].length > 0 && parts[i] !== '') {
            initials += parts[i][0];
        }
    }
    return initials.toUpperCase();
};
