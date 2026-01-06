import pb from "../lib/pocketbase";
import { isMockEnv } from "../utils/mockData";
import type { RecordModel } from "pocketbase";

// ============================================
// TYPES
// ============================================

export interface AdaptiveLearningProfile extends RecordModel {
  userId: string;
  subject: string;
  currentDifficultyLevel: number;
  abilityScore: number;
  learningRate: number;
  algorithm: "IRT" | "CAT" | "BKT";
  questionsAnswered: number;
  correctAnswers: number;
  lastAssessed: string;
  recommendations: string[];
}

export interface LearningAnalytics extends RecordModel {
  userId: string;
  totalStudyTime: number;
  sessionsCompleted: number;
  averageSessionDuration: number;
  engagementScore: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  weakAreas: string[];
  strongAreas: string[];
  dropoutRisk: number;
  predictedGrade?: number;
}

export interface MicroCredential extends RecordModel {
  userId: string;
  credentialName: string;
  description: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialType: "course_completion" | "skill_mastery" | "project_completion" | "certification";
  level: "beginner" | "intermediate" | "advanced" | "expert";
  verificationUrl?: string;
  blockchainHash?: string;
  ipfsHash?: string;
  badgeImage?: string;
  isVerified: boolean;
  isPublic: boolean;
  skills: string[];
}

export interface SkillAssessment extends RecordModel {
  userId: string;
  skillName: string;
  assessmentType: "quiz" | "project" | "assignment" | "exam";
  score: number;
  maxScore: number;
  percentageScore: number;
  assessmentDate: string;
  feedback?: string;
  recommendations: string[];
  skillGaps: string[];
}

export interface LearningPathRecommendation extends RecordModel {
  userId: string;
  pathName: string;
  description: string;
  targetSkills: string[];
  currentSkillLevel: "beginner" | "intermediate" | "advanced";
  estimatedDuration: string;
  courses: string[];
  milestones: string[];
  progressPercentage: number;
  isActive: boolean;
  completedMilestones: string[];
  nextSteps: string[];
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_ADAPTIVE_PROFILES: AdaptiveLearningProfile[] = [
  {
    id: "profile1",
    userId: "student1",
    subject: "Mathematics",
    currentDifficultyLevel: 7,
    abilityScore: 0.85,
    learningRate: 0.12,
    algorithm: "IRT",
    questionsAnswered: 150,
    correctAnswers: 125,
    lastAssessed: new Date().toISOString(),
    recommendations: ["Focus on algebra", "Try advanced geometry"],
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    collectionId: "adaptive_learning_profiles",
    collectionName: "adaptive_learning_profiles",
  },
];

const MOCK_LEARNING_ANALYTICS: LearningAnalytics[] = [
  {
    id: "analytics1",
    userId: "student1",
    totalStudyTime: 1470,
    sessionsCompleted: 45,
    averageSessionDuration: 32.7,
    engagementScore: 92,
    completionRate: 88,
    currentStreak: 12,
    longestStreak: 18,
    lastActiveDate: new Date().toISOString(),
    weakAreas: ["Calculus", "Statistics"],
    strongAreas: ["Algebra", "Geometry"],
    dropoutRisk: 15,
    predictedGrade: 88,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    collectionId: "learning_analytics",
    collectionName: "learning_analytics",
  },
];

const MOCK_CREDENTIALS: MicroCredential[] = [
  {
    id: "cred1",
    userId: "student1",
    credentialName: "Python Basics",
    description: "Completed Python Programming Fundamentals course",
    issuer: "Grow Your Need Academy",
    issueDate: new Date().toISOString(),
    credentialType: "course_completion",
    level: "beginner",
    isVerified: true,
    isPublic: true,
    skills: ["Python", "Programming", "Problem Solving"],
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    collectionId: "micro_credentials",
    collectionName: "micro_credentials",
  },
];

// ============================================
// ADAPTIVE LEARNING SERVICE
// ============================================

export const adaptiveLearningService = {
  async getProfile(userId: string, subject: string): Promise<AdaptiveLearningProfile | null> {
    if (isMockEnv()) {
      return MOCK_ADAPTIVE_PROFILES.find((p) => p.userId === userId && p.subject === subject) || null;
    }

    try {
      const profiles = await pb.collection("adaptive_learning_profiles").getFullList<AdaptiveLearningProfile>({
        filter: `userId = "${userId}" && subject = "${subject}"`,
        requestKey: null,
      });
      return profiles.length > 0 ? profiles[0] : null;
    } catch (error) {
      console.error("Adaptive profile fetch error:", error);
      return null;
    }
  },

  async getAllProfiles(userId: string): Promise<AdaptiveLearningProfile[]> {
    if (isMockEnv()) return MOCK_ADAPTIVE_PROFILES.filter((p) => p.userId === userId);

    return pb.collection("adaptive_learning_profiles").getFullList<AdaptiveLearningProfile>({
      filter: `userId = "${userId}"`,
      sort: "-lastAssessed",
      requestKey: null,
    });
  },

  async updateProfile(
    profileId: string,
    data: Partial<AdaptiveLearningProfile>
  ): Promise<AdaptiveLearningProfile> {
    if (isMockEnv()) {
      return MOCK_ADAPTIVE_PROFILES.find((p) => p.id === profileId)!;
    }

    return pb.collection("adaptive_learning_profiles").update<AdaptiveLearningProfile>(
      profileId,
      data,
      { requestKey: null }
    );
  },

  async recordAnswer(
    userId: string,
    subject: string,
    isCorrect: boolean,
    difficulty: number
  ): Promise<AdaptiveLearningProfile> {
    if (isMockEnv()) {
      return MOCK_ADAPTIVE_PROFILES[0];
    }

    // Get or create profile
    let profile = await this.getProfile(userId, subject);

    if (!profile) {
      profile = await pb.collection("adaptive_learning_profiles").create<AdaptiveLearningProfile>({
        userId,
        subject,
        currentDifficultyLevel: 5,
        abilityScore: 0.5,
        learningRate: 0.1,
        algorithm: "IRT",
        questionsAnswered: 0,
        correctAnswers: 0,
        lastAssessed: new Date().toISOString(),
        recommendations: [],
      }, { requestKey: null });
    }

    // Update stats
    const questionsAnswered = profile.questionsAnswered + 1;
    const correctAnswers = profile.correctAnswers + (isCorrect ? 1 : 0);

    // Simple IRT ability estimation (simplified version)
    const newAbility = isCorrect
      ? profile.abilityScore + 0.05
      : profile.abilityScore - 0.03;

    return pb.collection("adaptive_learning_profiles").update<AdaptiveLearningProfile>(
      profile.id,
      {
        questionsAnswered,
        correctAnswers,
        abilityScore: Math.max(0, Math.min(1, newAbility)),
        currentDifficultyLevel: Math.round(newAbility * 10),
        lastAssessed: new Date().toISOString(),
      },
      { requestKey: null }
    );
  },
};

// ============================================
// ANALYTICS SERVICE
// ============================================

export const learningAnalyticsService = {
  async getAnalytics(userId: string): Promise<LearningAnalytics | null> {
    if (isMockEnv()) {
      return MOCK_LEARNING_ANALYTICS.find((a) => a.userId === userId) || null;
    }

    try {
      const analytics = await pb.collection("learning_analytics").getFullList<LearningAnalytics>({
        filter: `userId = "${userId}"`,
        requestKey: null,
      });
      return analytics.length > 0 ? analytics[0] : null;
    } catch (error) {
      console.error("Analytics fetch error:", error);
      return null;
    }
  },

  async updateAnalytics(analyticsId: string, data: Partial<LearningAnalytics>): Promise<LearningAnalytics> {
    if (isMockEnv()) {
      return MOCK_LEARNING_ANALYTICS[0];
    }

    return pb.collection("learning_analytics").update<LearningAnalytics>(
      analyticsId,
      data,
      { requestKey: null }
    );
  },

  async recordSession(userId: string, duration: number): Promise<void> {
    if (isMockEnv()) return;

    const analytics = await this.getAnalytics(userId);

    if (!analytics) {
      await pb.collection("learning_analytics").create({
        userId,
        totalStudyTime: duration,
        sessionsCompleted: 1,
        averageSessionDuration: duration,
        engagementScore: 50,
        completionRate: 0,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: new Date().toISOString(),
        weakAreas: [],
        strongAreas: [],
        dropoutRisk: 0,
      }, { requestKey: null });
    } else {
      const totalStudyTime = analytics.totalStudyTime + duration;
      const sessionsCompleted = analytics.sessionsCompleted + 1;
      const averageSessionDuration = totalStudyTime / sessionsCompleted;

      await pb.collection("learning_analytics").update(analytics.id, {
        totalStudyTime,
        sessionsCompleted,
        averageSessionDuration,
        lastActiveDate: new Date().toISOString(),
      }, { requestKey: null });
    }
  },
};

// ============================================
// CREDENTIAL SERVICE
// ============================================

export const credentialService = {
  async getCredentials(userId: string): Promise<MicroCredential[]> {
    if (isMockEnv()) return MOCK_CREDENTIALS.filter((c) => c.userId === userId);

    return pb.collection("micro_credentials").getFullList<MicroCredential>({
      filter: `userId = "${userId}"`,
      sort: "-issueDate",
      requestKey: null,
    });
  },

  async issueCredential(data: {
    userId: string;
    credentialName: string;
    description: string;
    credentialType: MicroCredential["credentialType"];
    level: MicroCredential["level"];
    skills: string[];
  }): Promise<MicroCredential> {
    if (isMockEnv()) {
      const newCred: MicroCredential = {
        id: `cred${Date.now()}`,
        ...data,
        issuer: "Grow Your Need Academy",
        issueDate: new Date().toISOString(),
        isVerified: true,
        isPublic: false,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        collectionId: "micro_credentials",
        collectionName: "micro_credentials",
      };
      return newCred;
    }

    return pb.collection("micro_credentials").create<MicroCredential>(
      {
        ...data,
        issuer: "Grow Your Need Academy",
        issueDate: new Date().toISOString(),
        isVerified: true,
        isPublic: false,
      },
      { requestKey: null }
    );
  },

  async verifyCredential(credentialId: string): Promise<MicroCredential> {
    if (isMockEnv()) {
      return MOCK_CREDENTIALS[0];
    }

    return pb.collection("micro_credentials").update<MicroCredential>(
      credentialId,
      { isVerified: true },
      { requestKey: null }
    );
  },
};

// ============================================
// SKILL ASSESSMENT SERVICE
// ============================================

export const skillAssessmentService = {
  async getAssessments(userId: string): Promise<SkillAssessment[]> {
    if (isMockEnv()) return [];

    return pb.collection("skill_assessments").getFullList<SkillAssessment>({
      filter: `userId = "${userId}"`,
      sort: "-assessmentDate",
      requestKey: null,
    });
  },

  async recordAssessment(data: {
    userId: string;
    skillName: string;
    assessmentType: SkillAssessment["assessmentType"];
    score: number;
    maxScore: number;
    feedback?: string;
  }): Promise<SkillAssessment> {
    if (isMockEnv()) {
      return {
        id: `assess${Date.now()}`,
        ...data,
        percentageScore: (data.score / data.maxScore) * 100,
        assessmentDate: new Date().toISOString(),
        recommendations: [],
        skillGaps: [],
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        collectionId: "skill_assessments",
        collectionName: "skill_assessments",
      };
    }

    return pb.collection("skill_assessments").create<SkillAssessment>(
      {
        ...data,
        percentageScore: (data.score / data.maxScore) * 100,
        assessmentDate: new Date().toISOString(),
        recommendations: [],
        skillGaps: [],
      },
      { requestKey: null }
    );
  },
};

// ============================================
// LEARNING PATH SERVICE
// ============================================

export const learningPathService = {
  async getPaths(userId: string): Promise<LearningPathRecommendation[]> {
    if (isMockEnv()) return [];

    return pb.collection("learning_path_recommendations").getFullList<LearningPathRecommendation>({
      filter: `userId = "${userId}"`,
      sort: "-created",
      requestKey: null,
    });
  },

  async createPath(data: {
    userId: string;
    pathName: string;
    description: string;
    targetSkills: string[];
    currentSkillLevel: LearningPathRecommendation["currentSkillLevel"];
    courses: string[];
    milestones: string[];
  }): Promise<LearningPathRecommendation> {
    if (isMockEnv()) {
      return {
        id: `path${Date.now()}`,
        ...data,
        estimatedDuration: "12 weeks",
        progressPercentage: 0,
        isActive: true,
        completedMilestones: [],
        nextSteps: [],
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        collectionId: "learning_path_recommendations",
        collectionName: "learning_path_recommendations",
      };
    }

    return pb.collection("learning_path_recommendations").create<LearningPathRecommendation>(
      {
        ...data,
        estimatedDuration: "12 weeks",
        progressPercentage: 0,
        isActive: true,
        completedMilestones: [],
        nextSteps: [],
      },
      { requestKey: null }
    );
  },

  async updateProgress(
    pathId: string,
    completedMilestone: string
  ): Promise<LearningPathRecommendation> {
    if (isMockEnv()) {
      return {} as LearningPathRecommendation;
    }

    const path = await pb.collection("learning_path_recommendations").getOne<LearningPathRecommendation>(pathId);
    const completedMilestones = [...path.completedMilestones, completedMilestone];
    const progressPercentage = (completedMilestones.length / path.milestones.length) * 100;

    return pb.collection("learning_path_recommendations").update<LearningPathRecommendation>(
      pathId,
      { completedMilestones, progressPercentage },
      { requestKey: null }
    );
  },
};
