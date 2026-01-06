export interface ColorGrade {
    name: string;
    temperature: number;
    tint: number;
    exposure: number;
    contrast: number;
    highlights: number;
    shadows: number;
    saturation: number;
    vibrance: number;
}

export const COLOR_PRESETS: Record<string, ColorGrade> = {
    cinematic: {
        name: 'Cinematic',
        temperature: 10,
        tint: -5,
        exposure: 5,
        contrast: 15,
        highlights: -10,
        shadows: 20,
        saturation: -5,
        vibrance: 15,
    },
    vintage: {
        name: 'Vintage',
        temperature: 15,
        tint: 5,
        exposure: -5,
        contrast: -10,
        highlights: 10,
        shadows: -15,
        saturation: -20,
        vibrance: -10,
    },
    vibrant: {
        name: 'Vibrant',
        temperature: 0,
        tint: 0,
        exposure: 10,
        contrast: 20,
        highlights: 5,
        shadows: 5,
        saturation: 30,
        vibrance: 25,
    },
    moody: {
        name: 'Moody',
        temperature: -10,
        tint: 10,
        exposure: -15,
        contrast: 25,
        highlights: -20,
        shadows: 30,
        saturation: 10,
        vibrance: 5,
    },
    cool: {
        name: 'Cool',
        temperature: -20,
        tint: -10,
        exposure: 0,
        contrast: 10,
        highlights: 0,
        shadows: 10,
        saturation: 5,
        vibrance: 10,
    },
    warm: {
        name: 'Warm',
        temperature: 25,
        tint: 5,
        exposure: 5,
        contrast: 5,
        highlights: -5,
        shadows: 10,
        saturation: 10,
        vibrance: 15,
    },
};

export class ColorGradingEngine {
    static applyGrade(grade: ColorGrade): string {
        const filters: string[] = [];

        // Temperature (blue to yellow shift)
        if (grade.temperature !== 0) {
            const hueShift = grade.temperature > 0 ? grade.temperature / 2 : grade.temperature;
            filters.push(`hue-rotate(${hueShift}deg)`);
        }

        // Exposure
        if (grade.exposure !== 0) {
            const brightness = 100 + grade.exposure * 2;
            filters.push(`brightness(${brightness}%)`);
        }

        // Contrast
        if (grade.contrast !== 0) {
            const contrast = 100 + grade.contrast;
            filters.push(`contrast(${contrast}%)`);
        }

        // Saturation
        if (grade.saturation !== 0) {
            const saturate = 100 + grade.saturation * 2;
            filters.push(`saturate(${saturate}%)`);
        }

        return filters.join(' ');
    }

    static blendGrades(grade1: ColorGrade, grade2: ColorGrade, blend: number): ColorGrade {
        return {
            name: `Blended`,
            temperature: grade1.temperature + (grade2.temperature - grade1.temperature) * blend,
            tint: grade1.tint + (grade2.tint - grade1.tint) * blend,
            exposure: grade1.exposure + (grade2.exposure - grade1.exposure) * blend,
            contrast: grade1.contrast + (grade2.contrast - grade1.contrast) * blend,
            highlights: grade1.highlights + (grade2.highlights - grade1.highlights) * blend,
            shadows: grade1.shadows + (grade2.shadows - grade1.shadows) * blend,
            saturation: grade1.saturation + (grade2.saturation - grade1.saturation) * blend,
            vibrance: grade1.vibrance + (grade2.vibrance - grade1.vibrance) * blend,
        };
    }

    static createCustomGrade(name: string): ColorGrade {
        return {
            name,
            temperature: 0,
            tint: 0,
            exposure: 0,
            contrast: 0,
            highlights: 0,
            shadows: 0,
            saturation: 0,
            vibrance: 0,
        };
    }
}
