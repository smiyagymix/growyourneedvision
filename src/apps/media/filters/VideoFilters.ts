export interface VideoFilter {
    name: string;
    cssFilter: string;
    description: string;
}

export const VIDEO_FILTERS: VideoFilter[] = [
    { name: 'None', cssFilter: '', description: 'No filter applied' },
    { name: 'Vintage', cssFilter: 'sepia(50%) contrast(120%) brightness(90%)', description: 'Retro look' },
    { name: 'Black & White', cssFilter: 'grayscale(100%)', description: 'Classic monochrome' },
    { name: 'Warm', cssFilter: 'sepia(30%) saturate(130%) brightness(105%)', description: 'Warm tones' },
    { name: 'Cool', cssFilter: 'hue-rotate(180deg) saturate(80%)', description: 'Cool blue tones' },
    { name: 'High Contrast', cssFilter: 'contrast(150%) saturate(110%)', description: 'Punchy colors' },
    { name: 'Soft', cssFilter: 'contrast(85%) brightness(110%) saturate(90%)', description: 'Gentle, dreamy look' },
    { name: 'Dramatic', cssFilter: 'contrast(140%) brightness(90%) saturate(120%)', description: 'Bold and intense' },
    { name: 'Faded', cssFilter: 'contrast(70%) brightness(110%) saturate(70%)', description: 'Washed out look' },
    { name: 'Vivid', cssFilter: 'saturate(200%) contrast(110%)', description: 'Super saturated' },
    { name: 'Noir', cssFilter: 'grayscale(100%) contrast(150%)', description: 'Film noir style' },
    { name: 'Sunset', cssFilter: 'sepia(50%) saturate(200%) hue-rotate(-20deg)', description: 'Golden hour' },
    { name: 'Arctic', cssFilter: 'hue-rotate(180deg) brightness(110%) saturate(120%)', description: 'Cold atmosphere' },
    { name: 'Neon', cssFilter: 'saturate(300%) brightness(110%) contrast(120%)', description: 'Neon glow effect' },
    { name: 'Pastel', cssFilter: 'saturate(60%) brightness(120%) contrast(80%)', description: 'Soft pastel colors' },
];

export class FilterEngine {
    static applyFilter(filterName: string): string {
        const filter = VIDEO_FILTERS.find(f => f.name === filterName);
        return filter ? filter.cssFilter : '';
    }

    static getAllFilters(): VideoFilter[] {
        return VIDEO_FILTERS;
    }

    static createCustomFilter(
        brightness: number = 100,
        contrast: number = 100,
        saturate: number = 100,
        sepia: number = 0,
        grayscale: number = 0,
        hueRotate: number = 0
    ): string {
        const filters: string[] = [];

        if (brightness !== 100) filters.push(`brightness(${brightness}%)`);
        if (contrast !== 100) filters.push(`contrast(${contrast}%)`);
        if (saturate !== 100) filters.push(`saturate(${saturate}%)`);
        if (sepia > 0) filters.push(`sepia(${sepia}%)`);
        if (grayscale > 0) filters.push(`grayscale(${grayscale}%)`);
        if (hueRotate !== 0) filters.push(`hue-rotate(${hueRotate}deg)`);

        return filters.join(' ');
    }

    static blendFilters(filter1: string, filter2: string, blend: number): string {
        // Simple blending by opacity transition
        // In production, would need more sophisticated blending
        return blend < 0.5 ? filter1 : filter2;
    }

    static getFilterPreview(filterName: string, imageUrl: string): React.CSSProperties {
        const filter = this.applyFilter(filterName);
        return {
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            filter,
        };
    }
}
