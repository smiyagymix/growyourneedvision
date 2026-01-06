export const PROJECT_KNOWLEDGE = {
    overview: "GrowYourNeed is a multi-tenant SaaS 'digital operating system' for schools (B2B) and individuals (B2C). It integrates management, learning, creativity, and productivity tools into a single dashboard.",
    roles: {
        owner: {
            focus: "Platform health, tenant management, global config, AI operations.",
            features: ["Tenant Management", "Platform CRM", "Tool-Platform", "Concierge AI (Level 1-5 Intelligence)", "System Health Monitoring"],
            permissions: "Full access (*:*), including billing, settings, and AI configuration."
        },
        school_admin: {
            focus: "School management, user control, finance, academics.",
            features: ["User Management", "Academics", "Finance", "School CRM", "Security & Compliance", "Communication Center"]
        },
        teacher: {
            focus: "Classroom, lesson planning, grading.",
            features: [
                "My Classes", 
                "Lesson Planner (AI-powered)", 
                "Gradebook (Mastery View, AI Grading)", 
                "Student Analytics (Early Warning System)", 
                "Parent Comms (Bulk Messaging, Conference Scheduling)",
                "Resource Library"
            ],
            ai_capabilities: ["Lesson Plan Generator", "Rubric Generator", "Worksheet Generator", "Differentiated Instruction Assistant"]
        },
        student: {
            focus: "Learning, skills, well-being.",
            features: [
                "Course Hub", 
                "AI Study Hub (Tutor, Planner, Visualizer)", 
                "Portfolio (Skills, Showcase, Career Compass)", 
                "Wellness Hub (Mood Tracking, Journal)", 
                "Gamification (Learning Path, Leaderboards)",
                "Tools (Focus Timer, Mind Mapper, Debate Simulator)"
            ],
            ai_capabilities: ["Tutoring", "Essay Outlining", "Practice Questions", "Concept Explanation"]
        },
        parent: {
            focus: "Child progress, communication.",
            features: [
                "Child Selector", 
                "Academic Overview (Grades, Assignments)", 
                "School Life (Calendar, Lunch Menu)", 
                "Finances (Tuition Payment)", 
                "Wellness (Mood Trends)",
                "Communication (Teacher Messaging)"
            ],
            ai_capabilities: ["Assignment Explanation", "School Policy Q&A", "Academic Summary", "Email Drafting"]
        },
        individual: {
            focus: "Project management, creativity, personal productivity.",
            features: [
                "Project Dashboard (Kanban, Goals)", 
                "My Creations (Designs, Videos, Docs)", 
                "Asset Library (Brand Kit)", 
                "Template Library", 
                "Tools (AI Content Repurposer)", 
                "Learn (Courses, Tutorials)"
            ],
            ai_capabilities: ["Brainstorming", "Content Generation", "Design Critique", "Marketing Strategy"]
        }
    },
    apps: ["Studio (Designer, Video, Coder, Office)", "Media", "Market", "Knowledge", "Wellness", "Gamification"],
    techStack: "React, Vite, PocketBase, Open WebUI, Tailwind CSS, TypeScript."
};

export const getRoleKnowledge = (role: string) => {
    const r = role?.toLowerCase();
    const k = PROJECT_KNOWLEDGE;
    let specific = "";
    
    if (r === 'owner') specific = JSON.stringify(k.roles.owner);
    else if (r === 'student') specific = JSON.stringify(k.roles.student);
    else if (r === 'teacher') specific = JSON.stringify(k.roles.teacher);
    else if (r === 'parent') specific = JSON.stringify(k.roles.parent);
    else if (r === 'school_admin') specific = JSON.stringify(k.roles.school_admin);
    else if (r === 'individual') specific = JSON.stringify(k.roles.individual);
    
    return `Project Overview: ${k.overview}\nTech Stack: ${k.techStack}\nApps: ${k.apps.join(', ')}\nYour Role Context: ${specific}`;
};
