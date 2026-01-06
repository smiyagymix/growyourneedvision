export interface Scene {
    id: string;
    name: string;
    startFrame: number;
    durationInFrames: number;
    templateType: 'educational' | 'corporate' | 'minimal';
    props: Record<string, string | number | boolean | null>;
}

export interface SceneTimeline {
    scenes: Scene[];
    totalDuration: number;
}

export class SceneManager {
    static createScene(
        id: string,
        name: string,
        startFrame: number,
        durationInFrames: number,
        templateType: Scene['templateType']
    ): Scene {
        return {
            id,
            name,
            startFrame,
            durationInFrames,
            templateType,
            props: {},
        };
    }

    static addScene(timeline: SceneTimeline, scene: Scene): SceneTimeline {
        const newScenes = [...timeline.scenes, scene].sort((a, b) => a.startFrame - b.startFrame);
        const totalDuration = Math.max(...newScenes.map(s => s.startFrame + s.durationInFrames));

        return {
            scenes: newScenes,
            totalDuration,
        };
    }

    static removeScene(timeline: SceneTimeline, sceneId: string): SceneTimeline {
        const newScenes = timeline.scenes.filter(s => s.id !== sceneId);
        const totalDuration = newScenes.length > 0
            ? Math.max(...newScenes.map(s => s.startFrame + s.durationInFrames))
            : 0;

        return {
            scenes: newScenes,
            totalDuration,
        };
    }

    static updateSceneDuration(
        timeline: SceneTimeline,
        sceneId: string,
        newDuration: number
    ): SceneTimeline {
        const newScenes = timeline.scenes.map(scene =>
            scene.id === sceneId ? { ...scene, durationInFrames: newDuration } : scene
        );

        const totalDuration = Math.max(...newScenes.map(s => s.startFrame + s.durationInFrames));

        return {
            scenes: newScenes,
            totalDuration,
        };
    }

    static moveScene(
        timeline: SceneTimeline,
        sceneId: string,
        newStartFrame: number
    ): SceneTimeline {
        const newScenes = timeline.scenes.map(scene =>
            scene.id === sceneId ? { ...scene, startFrame: newStartFrame } : scene
        ).sort((a, b) => a.startFrame - b.startFrame);

        const totalDuration = Math.max(...newScenes.map(s => s.startFrame + s.durationInFrames));

        return {
            scenes: newScenes,
            totalDuration,
        };
    }

    static getActiveScene(timeline: SceneTimeline, currentFrame: number): Scene | null {
        return timeline.scenes.find(
            scene => currentFrame >= scene.startFrame &&
                currentFrame < scene.startFrame + scene.durationInFrames
        ) || null;
    }

    static getSceneAtIndex(timeline: SceneTimeline, index: number): Scene | null {
        return timeline.scenes[index] || null;
    }

    static reorderScenes(timeline: SceneTimeline): SceneTimeline {
        let currentFrame = 0;
        const newScenes = timeline.scenes.map(scene => {
            const updatedScene = { ...scene, startFrame: currentFrame };
            currentFrame += scene.durationInFrames;
            return updatedScene;
        });

        return {
            scenes: newScenes,
            totalDuration: currentFrame,
        };
    }

    static duplicateScene(timeline: SceneTimeline, sceneId: string): SceneTimeline {
        const scene = timeline.scenes.find(s => s.id === sceneId);
        if (!scene) return timeline;

        const newScene: Scene = {
            ...scene,
            id: `${scene.id}-copy-${Date.now()}`,
            name: `${scene.name} (Copy)`,
            startFrame: scene.startFrame + scene.durationInFrames,
        };

        return this.addScene(timeline, newScene);
    }
}
