export interface AudioTrack {
    id: string;
    url: string;
    name: string;
    volume: number;
    pan: number;
    solo: boolean;
    mute: boolean;
    startFrame: number;
}

export class AudioMixer {
    private tracks: Map<string, AudioTrack> = new Map();

    addTrack(track: Omit<AudioTrack, 'id'>): AudioTrack {
        const newTrack: AudioTrack = {
            ...track,
            id: `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };

        this.tracks.set(newTrack.id, newTrack);
        return newTrack;
    }

    removeTrack(trackId: string): boolean {
        return this.tracks.delete(trackId);
    }

    setVolume(trackId: string, volume: number): void {
        const track = this.tracks.get(trackId);
        if (track) {
            track.volume = Math.max(0, Math.min(1, volume));
        }
    }

    setPan(trackId: string, pan: number): void {
        const track = this.tracks.get(trackId);
        if (track) {
            track.pan = Math.max(-1, Math.min(1, pan));
        }
    }

    toggleMute(trackId: string): void {
        const track = this.tracks.get(trackId);
        if (track) {
            track.mute = !track.mute;
        }
    }

    toggleSolo(trackId: string): void {
        const track = this.tracks.get(trackId);
        if (track) {
            track.solo = !track.solo;
        }
    }

    getMixedVolume(): number {
        const activeTracks = Array.from(this.tracks.values()).filter(t => !t.mute);

        if (activeTracks.length === 0) return 0;

        const soloedTracks = activeTracks.filter(t => t.solo);
        const tracksToMix = soloedTracks.length > 0 ? soloedTracks : activeTracks;

        const totalVolume = tracksToMix.reduce((sum, track) => sum + track.volume, 0);
        return Math.min(1, totalVolume / tracksToMix.length);
    }

    getTrack(trackId: string): AudioTrack | null {
        return this.tracks.get(trackId) || null;
    }

    getAllTracks(): AudioTrack[] {
        return Array.from(this.tracks.values());
    }

    clearAllTracks(): void {
        this.tracks.clear();
    }

    muteAll(): void {
        this.tracks.forEach(track => {
            track.mute = true;
        });
    }

    unmuteAll(): void {
        this.tracks.forEach(track => {
            track.mute = false;
        });
    }

    normalizeVolumes(): void {
        const tracks = this.getAllTracks();
        if (tracks.length === 0) return;

        const maxVolume = Math.max(...tracks.map(t => t.volume));
        if (maxVolume === 0) return;

        tracks.forEach(track => {
            track.volume = track.volume / maxVolume;
        });
    }

    exportMixerState(): string {
        return JSON.stringify(this.getAllTracks(), null, 2);
    }

    importMixerState(stateJson: string): void {
        try {
            const tracks: AudioTrack[] = JSON.parse(stateJson);
            this.clearAllTracks();
            tracks.forEach(track => {
                this.tracks.set(track.id, track);
            });
        } catch (error) {
            console.error('Failed to import mixer state:', error);
        }
    }
}

export const audioMixer = new AudioMixer();
