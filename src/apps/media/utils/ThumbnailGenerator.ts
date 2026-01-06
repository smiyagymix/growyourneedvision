export interface ThumbnailOptions {
    frame: number;
    width?: number;
    height?: number;
    quality?: number;
}

export class ThumbnailGenerator {
    static async generateFromFrame(
        videoElement: HTMLVideoElement,
        frame: number,
        fps: number,
        options: Partial<ThumbnailOptions> = {}
    ): Promise<string> {
        const {
            width = 320,
            height = 180,
            quality = 0.8,
        } = options;

        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }

            const timeInSeconds = frame / fps;
            videoElement.currentTime = timeInSeconds;

            videoElement.addEventListener('seeked', () => {
                ctx.drawImage(videoElement, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            }, { once: true });

            videoElement.addEventListener('error', (error) => {
                reject(error);
            }, { once: true });
        });
    }

    static async generateMultiple(
        videoElement: HTMLVideoElement,
        frames: number[],
        fps: number,
        options: Partial<ThumbnailOptions> = {}
    ): Promise<string[]> {
        const thumbnails: string[] = [];

        for (const frame of frames) {
            try {
                const thumbnail = await this.generateFromFrame(videoElement, frame, fps, options);
                thumbnails.push(thumbnail);
            } catch (error) {
                console.error(`Failed to generate thumbnail for frame ${frame}:`, error);
                thumbnails.push('');
            }
        }

        return thumbnails;
    }

    static async generateAtIntervals(
        videoElement: HTMLVideoElement,
        durationInFrames: number,
        fps: number,
        intervalSeconds: number = 5,
        options: Partial<ThumbnailOptions> = {}
    ): Promise<{ frame: number; thumbnail: string }[]> {
        const frames: number[] = [];
        const intervalFrames = intervalSeconds * fps;

        for (let frame = 0; frame < durationInFrames; frame += intervalFrames) {
            frames.push(frame);
        }

        const thumbnails = await this.generateMultiple(videoElement, frames, fps, options);

        return frames.map((frame, index) => ({
            frame,
            thumbnail: thumbnails[index],
        }));
    }

    static downloadThumbnail(dataUrl: string, filename: string = 'thumbnail.jpg'): void {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    static async uploadThumbnail(dataUrl: string, uploadUrl: string): Promise<Response> {
        const blob = await fetch(dataUrl).then(r => r.blob());
        const formData = new FormData();
        formData.append('thumbnail', blob, 'thumbnail.jpg');

        return fetch(uploadUrl, {
            method: 'POST',
            body: formData,
        });
    }
}
