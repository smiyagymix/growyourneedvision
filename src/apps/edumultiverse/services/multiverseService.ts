import pb from '../../../lib/pocketbase';
import { Universe, Timeline, Mission, Glitch, MultiverseProfile, MissionRun, Fragment, Recipe, UserFragment, QuizQuestion } from '../types/gamification';

export const multiverseService = {
    // --- Universes ---
    async getUniverses(): Promise<Universe[]> {
        return await pb.collection('universes').getFullList<Universe>();
    },

    async getUniverse(id: string): Promise<Universe> {
        return await pb.collection('universes').getOne<Universe>(id);
    },

    // --- Timelines ---
    async getTimelines(universeId: string): Promise<Timeline[]> {
        return await pb.collection('timelines').getFullList<Timeline>({
            filter: `universe = "${universeId}"`,
            sort: 'difficulty'
        });
    },

    // --- Missions ---
    async getMissions(universeId: string, timelineId?: string): Promise<Mission[]> {
        let filter = `universe = "${universeId}"`;
        if (timelineId) {
            filter += ` && timeline = "${timelineId}"`;
        }
        return await pb.collection('missions').getFullList<Mission>({ filter });
    },

    async getMission(id: string): Promise<Mission> {
        return await pb.collection('missions').getOne<Mission>(id);
    },

    async getMissionsByType(type: string): Promise<Mission[]> {
        return await pb.collection('missions').getFullList<Mission>({
            filter: `type = "${type}"`
        });
    },

    // --- Glitches ---
    async getGlitches(universeId?: string): Promise<Glitch[]> {
        const filter = universeId ? `universe = "${universeId}"` : '';
        return await pb.collection('glitches').getFullList<Glitch>({ filter });
    },

    async getActiveGlitches(): Promise<Glitch[]> {
        // Assuming active glitches might have a status or just return all for now
        return await pb.collection('glitches').getFullList<Glitch>({ sort: '-created' });
    },

    async fixGlitch(userId: string, glitchId: string): Promise<void> {
        // Logic to record the fix, maybe create a 'glitch_fix' record
        // For now, just award XP
        const glitch = await pb.collection('glitches').getOne<Glitch>(glitchId);
        const profile = await this.getProfile(userId);
        
        if (profile) {
            // Award XP based on difficulty (e.g., difficulty * 50)
            const xpAward = (glitch.difficulty || 1) * 50;
            await pb.collection('multiverse_profiles').update(profile.id, {
                totalXP: profile.totalXP + xpAward
            });
        }
    },

    // --- Profile ---
    async getProfile(userId: string): Promise<MultiverseProfile | null> {
        try {
            return await pb.collection('multiverse_profiles').getFirstListItem<MultiverseProfile>(`user = "${userId}"`);
        } catch (e) {
            return null;
        }
    },

    async createProfile(userId: string): Promise<MultiverseProfile> {
        return await pb.collection('multiverse_profiles').create<MultiverseProfile>({
            user: userId,
            totalXP: 0,
            level: 1,
            streakDays: 0,
            badges: []
        });
    },

    // --- Gameplay ---
    async completeMission(missionId: string, userId: string, score: number): Promise<MissionRun> {
        // 1. Log the run
        const run = await pb.collection('mission_runs').create<MissionRun>({
            mission: missionId,
            student: userId,
            score,
            status: score > 0 ? 'completed' : 'failed',
            completedAt: new Date().toISOString()
        });

        // 2. Update XP if successful
        if (score > 0) {
            const mission = await this.getMission(missionId);
            const profile = await this.getProfile(userId);
            if (profile) {
                await pb.collection('multiverse_profiles').update(profile.id, {
                    totalXP: profile.totalXP + (mission.xp_reward || 0)
                });
            }
        }

        return run;
    },

    // --- Concept Fusion ---
    async getUserFragments(userId: string): Promise<UserFragment[]> {
        return await pb.collection('user_fragments').getFullList<UserFragment>({
            filter: `user = "${userId}"`,
            expand: 'fragment'
        });
    },

    async getRecipes(): Promise<Recipe[]> {
        return await pb.collection('recipes').getFullList<Recipe>();
    },

    async fuseFragments(userId: string, fragmentIds: string[]): Promise<Recipe | null> {
        // 1. Verify user has fragments
        // 2. Check if combination matches a recipe
        // 3. Consume fragments (decrement quantity)
        // 4. Award XP
        // This logic is complex for client-side, ideally should be a backend hook/endpoint.
        // For now, we'll simulate the check here.

        const recipes = await this.getRecipes();
        const userFragments = await this.getUserFragments(userId);

        // Get the types of the selected fragments
        // We need to map the input fragmentIds (which are user_fragment IDs) to their actual Fragment types
        const selectedUserFragments = userFragments.filter(uf => fragmentIds.includes(uf.id));
        const selectedTypes = selectedUserFragments.map(uf => uf.expand?.fragment.type).sort();

        // Find matching recipe
        const match = recipes.find(r => {
            const ingredients = [...r.ingredients].sort();
            return JSON.stringify(ingredients) === JSON.stringify(selectedTypes);
        });

        if (match) {
            // Consume fragments
            for (const uf of selectedUserFragments) {
                if (uf.quantity > 1) {
                    await pb.collection('user_fragments').update(uf.id, { quantity: uf.quantity - 1 });
                } else {
                    await pb.collection('user_fragments').delete(uf.id);
                }
            }

            // Award XP
            const profile = await this.getProfile(userId);
            if (profile) {
                await pb.collection('multiverse_profiles').update(profile.id, {
                    totalXP: profile.totalXP + match.xp_reward
                });
            }

            return match;
        }

        return null;
    },

    // Debug helper to give fragments to user
    async debugAddFragment(userId: string, fragmentId: string): Promise<void> {
        try {
            // Check if exists
            const existing = await pb.collection('user_fragments').getFirstListItem(`user="${userId}" && fragment="${fragmentId}"`);
            await pb.collection('user_fragments').update(existing.id, { quantity: existing.quantity + 1 });
        } catch (e) {
            await pb.collection('user_fragments').create({
                user: userId,
                fragment: fragmentId,
                quantity: 1
            });
        }
    },

    async getAllFragments(): Promise<Fragment[]> {
        return await pb.collection('fragments').getFullList<Fragment>();
    },

    // --- Quantum Quiz ---
    async getQuizQuestions(difficulty?: number, subject?: string): Promise<QuizQuestion[]> {
        let filter = '';
        const filters = [];
        if (difficulty) filters.push(`difficulty = ${difficulty}`);
        if (subject) filters.push(`subject = "${subject}"`);
        
        if (filters.length > 0) {
            filter = filters.join(' && ');
        }

        return await pb.collection('quiz_questions').getFullList<QuizQuestion>({ 
            filter,
            sort: '@random' // Randomize questions
        });
    },

    async submitQuizResult(userId: string, score: number): Promise<void> {
        // Award XP based on score
        // e.g. 10 XP per correct answer
        const xpAward = score * 10;
        
        if (xpAward > 0) {
            const profile = await this.getProfile(userId);
            if (profile) {
                await pb.collection('multiverse_profiles').update(profile.id, {
                    totalXP: profile.totalXP + xpAward
                });
            }
        }
    }
};
