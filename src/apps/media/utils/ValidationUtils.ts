import { VIDEO_CONSTANTS } from '../constants';

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

export class FileValidator {
    static validateFileSize(file: File, maxSize: number): ValidationResult {
        const errors: string[] = [];

        if (file.size > maxSize) {
            const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
            errors.push(`File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`);
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    static validateFileType(file: File, allowedExtensions: string[]): ValidationResult {
        const errors: string[] = [];
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();

        if (!allowedExtensions.includes(extension)) {
            errors.push(`File type ${extension} is not supported. Allowed types: ${allowedExtensions.join(', ')}`);
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    static validateImage(file: File): ValidationResult {
        const sizeValidation = this.validateFileSize(file, VIDEO_CONSTANTS.MAX_FILE_SIZES.image);
        const typeValidation = this.validateFileType(file, [...VIDEO_CONSTANTS.SUPPORTED_FORMATS.image]);

        return {
            valid: sizeValidation.valid && typeValidation.valid,
            errors: [...sizeValidation.errors, ...typeValidation.errors],
        };
    }

    static validateVideo(file: File): ValidationResult {
        const sizeValidation = this.validateFileSize(file, VIDEO_CONSTANTS.MAX_FILE_SIZES.video);
        const typeValidation = this.validateFileType(file, [...VIDEO_CONSTANTS.SUPPORTED_FORMATS.video]);

        return {
            valid: sizeValidation.valid && typeValidation.valid,
            errors: [...sizeValidation.errors, ...typeValidation.errors],
        };
    }

    static validateAudio(file: File): ValidationResult {
        const sizeValidation = this.validateFileSize(file, VIDEO_CONSTANTS.MAX_FILE_SIZES.audio);
        const typeValidation = this.validateFileType(file, [...VIDEO_CONSTANTS.SUPPORTED_FORMATS.audio]);

        return {
            valid: sizeValidation.valid && typeValidation.valid,
            errors: [...sizeValidation.errors, ...typeValidation.errors],
        };
    }

    static validateLogo(file: File): ValidationResult {
        const sizeValidation = this.validateFileSize(file, VIDEO_CONSTANTS.MAX_FILE_SIZES.logo);
        const typeValidation = this.validateFileType(file, [...VIDEO_CONSTANTS.SUPPORTED_FORMATS.image]);

        return {
            valid: sizeValidation.valid && typeValidation.valid,
            errors: [...sizeValidation.errors, ...typeValidation.errors],
        };
    }

    static async validateImageDimensions(
        file: File,
        minWidth?: number,
        minHeight?: number,
        maxWidth?: number,
        maxHeight?: number
    ): Promise<ValidationResult> {
        return new Promise((resolve) => {
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                const errors: string[] = [];

                if (minWidth && img.width < minWidth) {
                    errors.push(`Image width (${img.width}px) is below minimum (${minWidth}px)`);
                }
                if (minHeight && img.height < minHeight) {
                    errors.push(`Image height (${img.height}px) is below minimum (${minHeight}px)`);
                }
                if (maxWidth && img.width > maxWidth) {
                    errors.push(`Image width (${img.width}px) exceeds maximum (${maxWidth}px)`);
                }
                if (maxHeight && img.height > maxHeight) {
                    errors.push(`Image height (${img.height}px) exceeds maximum (${maxHeight}px)`);
                }

                URL.revokeObjectURL(url);
                resolve({ valid: errors.length === 0, errors });
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                resolve({ valid: false, errors: ['Failed to load image'] });
            };

            img.src = url;
        });
    }
}

export class InputValidator {
    static validateString(value: string, minLength: number = 1, maxLength: number = 255): ValidationResult {
        const errors: string[] = [];

        if (value.length < minLength) {
            errors.push(`Value must be at least ${minLength} characters`);
        }
        if (value.length > maxLength) {
            errors.push(`Value must not exceed ${maxLength} characters`);
        }

        return { valid: errors.length === 0, errors };
    }

    static validateNumber(value: number, min?: number, max?: number): ValidationResult {
        const errors: string[] = [];

        if (typeof value !== 'number' || isNaN(value)) {
            errors.push('Value must be a valid number');
        }
        if (min !== undefined && value < min) {
            errors.push(`Value must be at least ${min}`);
        }
        if (max !== undefined && value > max) {
            errors.push(`Value must not exceed ${max}`);
        }

        return { valid: errors.length === 0, errors };
    }

    static validateDuration(frames: number, fps: number): ValidationResult {
        const min = VIDEO_CONSTANTS.MIN_DURATION;
        const max = VIDEO_CONSTANTS.MAX_DURATION;

        return this.validateNumber(frames, min, max);
    }

    static validateColor(color: string): ValidationResult {
        const hexRegex = /^#[0-9A-F]{6}$/i;
        const valid = hexRegex.test(color);

        return {
            valid,
            errors: valid ? [] : ['Invalid color format. Use hex format (#RRGGBB)'],
        };
    }

    static validateUrl(url: string): ValidationResult {
        try {
            new URL(url);
            return { valid: true, errors: [] };
        } catch {
            return { valid: false, errors: ['Invalid URL format'] };
        }
    }

    static validateAudioVolume(volume: number): ValidationResult {
        return this.validateNumber(volume, 0, 1);
    }

    static validateAudioStartFrame(startFrame: number, maxDuration: number): ValidationResult {
        return this.validateNumber(startFrame, 0, maxDuration);
    }
}
