import pb from '../lib/pocketbase';
import { wellnessService } from './wellnessService';
import { crmService } from './crmService';
import { academicsService } from './academicsService';
import { attendanceService } from './attendanceService';

export class LocalIntelligence {
    
    static async process(query: string, context: string, userId: string, role: string = 'user'): Promise<string> {
        const q = query.toLowerCase();

        // --- ROLE-BASED PERSONA ADJUSTMENTS ---
        if (role === 'owner') {
            if (q.includes('error') || q.includes('debug') || q.includes('fix')) {
                return "As the Owner, you have full system access. I recommend checking the 'Admin Panel' for system logs or the 'Type Safety Report' for code issues.";
            }
            if (q.includes('deploy') || q.includes('production')) {
                return "For production deployment, ensure all environment variables are set in the server dashboard. I can help you verify the build status.";
            }
            if (q.includes('handover') || q.includes('transfer')) {
                return "For project handovers, please ensure all documentation in the 'docs/' folder is up to date and that the 'CREDENTIALS.md' file is securely shared.";
            }
        }

        if (role === 'student') {
            if (q.includes('learn') || q.includes('study') || q.includes('homework')) {
                return "I can help you plan your study schedule. Have you checked your upcoming assignments in the 'Academics' tab?";
            }
            if (q.includes('search') || q.includes('find') || q.includes('resource')) {
                return "I can help you find learning resources. Try asking specifically for 'math videos' or 'history articles'.";
            }
            if (q.includes('wellness') || q.includes('health') || q.includes('stress')) {
                return "Your well-being is important. Check the 'Wellness' tab for mood tracking and relaxation exercises.";
            }
            if (q.includes('course') || q.includes('class')) {
                return "You can view all your enrolled courses in the 'Academics' > 'Courses' section.";
            }
        }

        if (role === 'teacher') {
            if (q.includes('lesson') || q.includes('plan')) {
                return "I can assist with lesson planning. Visit the 'Lesson Planner' to use the AI generator.";
            }
            if (q.includes('grade') || q.includes('assess')) {
                return "Need to enter grades? The 'Gradebook' is ready. I can also help generate rubrics.";
            }
            if (q.includes('student') || q.includes('track')) {
                return "You can track student progress and attendance in the 'School' section.";
            }
        }

        if (role === 'parent') {
            if (q.includes('child') || q.includes('progress') || q.includes('grade')) {
                return "You can view your child's latest grades and assignments in the 'Academics' overview.";
            }
            if (q.includes('pay') || q.includes('bill') || q.includes('tuition')) {
                return "Tuition payments and invoices can be managed in the 'Finances' section.";
            }
            if (q.includes('contact') || q.includes('message')) {
                return "You can message teachers directly through the 'Communication' hub.";
            }
        }

        if (role === 'individual') {
            if (q.includes('project') || q.includes('create')) {
                return "Ready to create? Go to the 'Projects' dashboard to start a new design, video, or document.";
            }
            if (q.includes('learn') || q.includes('skill')) {
                return "Explore new skills in the 'Learn' section to enhance your creative toolkit.";
            }
            if (q.includes('asset') || q.includes('file')) {
                return "Your 'Asset Library' holds all your uploads and brand materials.";
            }
        }

        // --- WELLNESS COACH PERSONA ---
        if (context === 'Wellness Coach') {
            if (q.includes('status') || q.includes('how am i') || q.includes('summary')) {
                const log = await wellnessService.getTodayLog(userId);
                if (!log) return "I don't see any wellness data for today yet. Try logging your steps or sleep!";
                
                return `Here is your wellness summary for today:\n` +
                       `- **Steps**: ${log.steps} (Goal: 10,000)\n` +
                       `- **Sleep**: ${Math.floor(log.sleep_minutes/60)}h ${log.sleep_minutes%60}m\n` +
                       `- **Mood**: ${log.mood}\n` +
                       `Keep up the good work!`;
            }
            
            if (q.includes('sleep')) {
                const logs = await wellnessService.getLogs(userId);
                const avgSleep = logs.reduce((acc, l) => acc + l.sleep_minutes, 0) / (logs.length || 1);
                return `Your average sleep over the last ${logs.length} days is **${Math.floor(avgSleep/60)}h ${Math.floor(avgSleep%60)}m**. ` +
                       (avgSleep < 420 ? "Try to get a bit more rest for better recovery." : "You're getting good rest!");
            }

            if (q.includes('advice') || q.includes('tip')) {
                const tips = [
                    "Drink a glass of water right after waking up to jumpstart your metabolism.",
                    "Take a 5-minute stretch break for every hour of desk work.",
                    "Try the 4-7-8 breathing technique to reduce stress.",
                    "Aim for 30 minutes of moderate activity today."
                ];
                return `💡 **Wellness Tip**: ${tips[Math.floor(Math.random() * tips.length)]}`;
            }

            return "I can help you track your **steps**, **sleep**, and **mood**. Ask me for a summary or advice!";
        }

        // --- SYSTEM ADMIN / GENERAL PERSONA ---
        
        // 1. CRM / Business
        if (q.includes('revenue') || q.includes('forecast') || q.includes('money')) {
            const forecast = await crmService.getForecast();
            const totalProjected = forecast.reduce((sum, f) => sum + (f.projected || 0), 0);
            return `Based on the CRM forecast, the total projected revenue for the upcoming quarter is **$${totalProjected.toLocaleString()}**.`;
        }

        if (q.includes('deal') || q.includes('pipeline')) {
            const deals = await crmService.getDeals();
// Cast stage to string to avoid strict type overlap error since 'Lost' is not in the Deal type definition yet
                        const activeDeals = deals.filter(d => d.stage !== 'Subscribed' && (d.stage as string) !== 'Lost');
            
            const value = activeDeals.reduce((sum, d) => sum + d.value, 0);
            return `There are currently **${activeDeals.length} active deals** in the pipeline with a total potential value of **$${value.toLocaleString()}**.`;
        }

        // 2. Academics (Teacher/Parent view)
        if (q.includes('student') || q.includes('grade') || q.includes('performance')) {
            // This is a bit complex as we need to know WHICH student. 
            // For now, we'll give a generic summary if no specific name is found.
            return "To check student performance, please visit the **Academics** tab. I can fetch specific grades if you provide a student ID (feature coming soon).";
        }

        if (q.includes('attendance')) {
            return "Attendance records are available in the **Attendance** module. You can view daily stats and individual records there.";
        }

        // 3. System Stats
        if (q.includes('user') || q.includes('count')) {
            try {
                const users = await pb.collection('users').getList(1, 1);
                return `The platform currently has **${users.totalItems} registered users** across all roles.`;
            } catch (e) {
                return "I couldn't access the user directory at the moment.";
            }
        }

        if (q.includes('help') || q.includes('what can you do')) {
            return "I am the **Concierge AI**. I can assist with:\n" +
                   "- **Business Insights**: Revenue, deals, and forecasts.\n" +
                   "- **Wellness**: Your personal health stats and advice.\n" +
                   "- **System Info**: User counts and platform status.\n" +
                   "- **Navigation**: Guide you to specific modules.\n\n" +
                   "Just ask me a question!";
        }

        // Default Fallback (generic to avoid duplicating user text in UI)
        return "I'm processing your request... (Simulated AI Response: As an AI Assistant, I can help you navigate the platform or retrieve data. Please be more specific if you need a report.)";
    }
}
