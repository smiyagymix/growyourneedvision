/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
    const dao = new Dao(db);

    const collections = [
        // Student Specific
        { name: "student_courses", type: "base" },
        { name: "student_assignments", type: "base" },
        { name: "student_grades", type: "base" },
        { name: "student_schedule", type: "base" },
        { name: "student_attendance", type: "base" },
        { name: "study_sessions", type: "base" },
        { name: "flashcard_decks", type: "base" },
        { name: "flashcards", type: "base" },

        // Teacher Specific
        { name: "lesson_plans", type: "base" },
        { name: "grade_entries", type: "base" },
        { name: "teacher_schedule", type: "base" }
    ];

    collections.forEach(colData => {
        const collection = new Collection({
            "id": "acad_" + colData.name + "_id",
            "created": "2025-12-31 10:00:00.000Z",
            "updated": "2025-12-31 10:00:00.000Z",
            "name": colData.name,
            "type": colData.type,
            "system": false,
            "schema": [
                // Common fields for most academic records
                {
                    "system": false,
                    "id": "title_" + colData.name,
                    "name": "title",
                    "type": "text",
                    "required": false,
                    "presentable": true,
                    "unique": false,
                    "options": { "min": null, "max": null, "pattern": "" }
                },
                {
                    "system": false,
                    "id": "status_" + colData.name,
                    "name": "status",
                    "type": "text",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": { "min": null, "max": null, "pattern": "" }
                },
                {
                    "system": false,
                    "id": "student_" + colData.name,
                    "name": "student",
                    "type": "relation",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "collectionId": "_pb_users_auth_",
                        "cascadeDelete": false,
                        "minSelect": null,
                        "maxSelect": 1,
                        "displayFields": []
                    }
                },
                // Generic data field to hold flexible schema content (schedule details, grades, etc.)
                // This is a simplification to ensure the collection exists and can store data
                // without defining every single field from the TS interface strictly right now.
                {
                    "system": false,
                    "id": "data_" + colData.name,
                    "name": "data",
                    "type": "json",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": { "maxSize": 2000000 }
                },
                // Specific fields that are commonly queried
                {
                    "system": false,
                    "id": "teacher_" + colData.name,
                    "name": "teacherId",
                    "type": "text", // Storing as text ID for flexibility if not direct relation
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": { "min": null, "max": null, "pattern": "" }
                },
                {
                    "system": false,
                    "id": "class_" + colData.name,
                    "name": "classId",
                    "type": "text",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": { "min": null, "max": null, "pattern": "" }
                }
            ],
            "listRule": "@request.auth.id != ''",
            "viewRule": "@request.auth.id != ''",
            "createRule": "@request.auth.id != ''",
            "updateRule": "@request.auth.id != ''",
            "deleteRule": "@request.auth.id != ''"
        });
        dao.saveCollection(collection);
    });

}, (db) => {
    const dao = new Dao(db);
    [
        "student_courses", "student_assignments", "student_grades", "student_schedule",
        "student_attendance", "study_sessions", "flashcard_decks", "flashcards",
        "lesson_plans", "grade_entries", "teacher_schedule"
    ].forEach(name => {
        try { dao.deleteCollection(dao.findCollectionByNameOrId(name)); } catch (e) { }
    });
})
