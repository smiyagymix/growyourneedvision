/**
 * Secure Password Generation Utility
 * Uses cryptographically secure random number generation
 */

/**
 * Generates a cryptographically secure random password
 * @param length - Length of the password (default: 16)
 * @param options - Configuration options for password generation
 * @returns A secure random password string
 */
export const generateSecurePassword = (
  length: number = 16,
  options: {
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
  } = {}
): string => {
  const {
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
  } = options;

  let chars = '';
  if (includeUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (includeLowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (includeNumbers) chars += '0123456789';
  if (includeSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (chars.length === 0) {
    throw new Error('At least one character type must be included');
  }

  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  
  let password = Array.from(array, x => chars[x % chars.length]).join('');

  // Ensure at least one character from each required category
  const requirements: { condition: boolean; chars: string }[] = [
    { condition: includeUppercase, chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
    { condition: includeLowercase, chars: 'abcdefghijklmnopqrstuvwxyz' },
    { condition: includeNumbers, chars: '0123456789' },
    { condition: includeSymbols, chars: '!@#$%^&*()_+-=[]{}|;:,.<>?' },
  ];

  // Check if password meets all requirements, regenerate if not
  const meetsRequirements = requirements.every(
    req => !req.condition || req.chars.split('').some(c => password.includes(c))
  );

  if (!meetsRequirements && length >= 4) {
    // Insert one character from each required category at random positions
    const passwordArray = password.split('');
    requirements.forEach((req, index) => {
      if (req.condition && index < length) {
        const randomCharIndex = crypto.getRandomValues(new Uint32Array(1))[0] % req.chars.length;
        const randomPosIndex = crypto.getRandomValues(new Uint32Array(1))[0] % length;
        passwordArray[randomPosIndex] = req.chars[randomCharIndex];
      }
    });
    password = passwordArray.join('');
  }

  return password;
};

/**
 * Generates a temporary password suitable for initial user creation
 * These passwords should be changed on first login
 * @returns A secure temporary password
 */
export const generateTemporaryPassword = (): string => {
  return generateSecurePassword(12, {
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: false, // Simpler for initial passwords
  });
};

/**
 * Validates password strength
 * @param password - Password to validate
 * @returns Object with validation result and feedback
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  score: number; // 0-4
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else feedback.push('Password should be at least 8 characters');

  if (password.length >= 12) score++;

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  else feedback.push('Include both uppercase and lowercase letters');

  if (/\d/.test(password)) score++;
  else feedback.push('Include at least one number');

  if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) score++;
  else feedback.push('Include at least one special character');

  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    score--;
    feedback.push('Avoid repeating characters');
  }

  if (/^(password|123456|qwerty)/i.test(password)) {
    score = 0;
    feedback.push('Avoid common passwords');
  }

  return {
    isValid: score >= 3 && password.length >= 8,
    score: Math.max(0, Math.min(4, score)),
    feedback,
  };
};

/**
 * Generates a password reset token
 * @returns A secure random token for password reset
 */
export const generateResetToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};
