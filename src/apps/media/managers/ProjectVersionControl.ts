export interface VideoProject {
    id: string;
    name: string;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    state: Record<string, unknown>;
    thumbnail?: string;
}

export interface ProjectVersion {
    version: number;
    timestamp: Date;
    state: Record<string, unknown>;
    message?: string;
}

export class ProjectVersionControl {
    private projects: Map<string, VideoProject> = new Map();
    private versions: Map<string, ProjectVersion[]> = new Map();
    private maxVersions: number = 50;

    createProject(name: string, initialState: Record<string, unknown>): VideoProject {
        const project: VideoProject = {
            id: `project-${Date.now()}`,
            name,
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            state: initialState,
        };

        this.projects.set(project.id, project);
        this.versions.set(project.id, [{
            version: 1,
            timestamp: new Date(),
            state: initialState,
            message: 'Initial version',
        }]);

        return project;
    }

    saveVersion(
        projectId: string,
        newState: Record<string, unknown>,
        message?: string
    ): VideoProject | null {
        const project = this.projects.get(projectId);
        if (!project) return null;

        project.version++;
        project.updatedAt = new Date();
        project.state = newState;

        const versions = this.versions.get(projectId) || [];
        versions.push({
            version: project.version,
            timestamp: new Date(),
            state: newState,
            message,
        });

        // Keep only the last N versions
        if (versions.length > this.maxVersions) {
            versions.splice(0, versions.length - this.maxVersions);
        }

        this.versions.set(projectId, versions);
        return project;
    }

    getProject(projectId: string): VideoProject | null {
        return this.projects.get(projectId) || null;
    }

    getVersionHistory(projectId: string): ProjectVersion[] {
        return this.versions.get(projectId) || [];
    }

    restoreVersion(projectId: string, version: number): VideoProject | null {
        const project = this.projects.get(projectId);
        const versions = this.versions.get(projectId);

        if (!project || !versions) return null;

        const targetVersion = versions.find(v => v.version === version);
        if (!targetVersion) return null;

        project.state = targetVersion.state;
        project.updatedAt = new Date();

        return project;
    }

    compareVersions(
        projectId: string,
        version1: number,
        version2: number
    ): { added: string[]; removed: string[]; modified: string[] } | null {
        const versions = this.versions.get(projectId);
        if (!versions) return null;

        const v1 = versions.find(v => v.version === version1);
        const v2 = versions.find(v => v.version === version2);

        if (!v1 || !v2) return null;

        const keys1 = Object.keys(v1.state);
        const keys2 = Object.keys(v2.state);

        const added = keys2.filter(k => !keys1.includes(k));
        const removed = keys1.filter(k => !keys2.includes(k));
        const modified = keys1.filter(k =>
            keys2.includes(k) &&
            JSON.stringify(v1.state[k]) !== JSON.stringify(v2.state[k])
        );

        return { added, removed, modified };
    }

    duplicateProject(projectId: string, newName: string): VideoProject | null {
        const original = this.projects.get(projectId);
        if (!original) return null;

        return this.createProject(newName, { ...original.state });
    }

    deleteProject(projectId: string): boolean {
        this.versions.delete(projectId);
        return this.projects.delete(projectId);
    }

    getAllProjects(): VideoProject[] {
        return Array.from(this.projects.values());
    }

    searchProjects(query: string): VideoProject[] {
        const lowerQuery = query.toLowerCase();
        return this.getAllProjects().filter(p =>
            p.name.toLowerCase().includes(lowerQuery)
        );
    }
}

export const versionControl = new ProjectVersionControl();
