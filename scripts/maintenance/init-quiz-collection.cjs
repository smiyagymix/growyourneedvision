const PocketBase = require('pocketbase').default;
const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;

async function createQuizCollection() {
    try {
        console.log('🔐 Authenticating...');
        await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('✅ Authenticated\n');

        const collection = {
            name: 'quiz_questions',
            type: 'base',
            schema: [
                { name: 'question', type: 'text', required: true },
                { name: 'options', type: 'json', required: true }, // Array of strings
                { name: 'correct_answer', type: 'number', required: true }, // Index of correct option
                { name: 'explanation', type: 'text', required: false },
                { name: 'difficulty', type: 'select', required: true, options: { maxSelect: 1, values: ['Easy', 'Medium', 'Hard'] } },
                { name: 'subject', type: 'text', required: true },
                { name: 'xp_reward', type: 'number', required: true }
            ],
            listRule: '', // Public read
            viewRule: '',
            createRule: '@request.auth.role = "Owner"',
            updateRule: '@request.auth.role = "Owner"',
            deleteRule: '@request.auth.role = "Owner"'
        };

        try {
            await pb.collections.create(collection);
            console.log(`✅ Created collection: ${collection.name}`);
        } catch (err) {
            if (err.status === 400) {
                console.log(`ℹ️  Collection ${collection.name} already exists`);
            } else {
                console.error(`❌ Error creating ${collection.name}:`, err.message);
            }
        }

        // Seed Data
        console.log('\n🌱 Seeding Quiz Data...');
        const questions = [
            {
                question: "What is the speed of light in a vacuum?",
                options: ["299,792 km/s", "150,000 km/s", "1,080 km/h", "Infinite"],
                correct_answer: 0,
                explanation: "Light travels at approximately 299,792,458 meters per second in a vacuum.",
                difficulty: "Medium",
                subject: "Physics",
                xp_reward: 50
            },
            {
                question: "Which quantum particle is responsible for electromagnetism?",
                options: ["Gluon", "Photon", "Higgs Boson", "Graviton"],
                correct_answer: 1,
                explanation: "The photon is the force carrier for the electromagnetic force.",
                difficulty: "Hard",
                subject: "Physics",
                xp_reward: 100
            },
            {
                question: "What is the powerhouse of the cell?",
                options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi Apparatus"],
                correct_answer: 2,
                explanation: "Mitochondria generate most of the chemical energy needed to power the cell's biochemical reactions.",
                difficulty: "Easy",
                subject: "Biology",
                xp_reward: 25
            },
            {
                question: "In computer science, what does 'CPU' stand for?",
                options: ["Central Processing Unit", "Computer Personal Unit", "Central Power Unit", "Core Processing Utility"],
                correct_answer: 0,
                explanation: "The CPU is the primary component of a computer that acts as its 'brain'.",
                difficulty: "Easy",
                subject: "Tech",
                xp_reward: 25
            },
            {
                question: "Who developed the theory of General Relativity?",
                options: ["Isaac Newton", "Albert Einstein", "Niels Bohr", "Marie Curie"],
                correct_answer: 1,
                explanation: "Einstein published the theory of General Relativity in 1915.",
                difficulty: "Medium",
                subject: "Physics",
                xp_reward: 50
            }
        ];

        for (const q of questions) {
            try {
                await pb.collection('quiz_questions').create(q);
                console.log(`   Created question: ${q.question.substring(0, 30)}...`);
            } catch (e) {
                // Ignore duplicates
            }
        }

    } catch (err) {
        console.error('Fatal error:', err);
    }
}

createQuizCollection();
