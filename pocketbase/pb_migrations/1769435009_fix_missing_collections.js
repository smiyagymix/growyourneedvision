/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
    const dao = new Dao(db);

    const collectionsToFix = [
        "student_courses",
        "student_assignments",
        "student_grades",
        "student_schedule",
        "student_attendance",
        "study_sessions",
        "flashcard_decks",
        "flashcards",
        "lesson_plans",
        "grade_entries",
        "teacher_schedule"
    ];

    collectionsToFix.forEach(name => {
        try {
            dao.findCollectionByNameOrId(name);
            // If found, good.
        } catch (e) {
            // Not found, create it properly
            const collection = new Collection({
                "name": name,
                "type": "base",
                "system": false,
                "schema": [
                    {
                        "system": false,
                        "name": "title",
                        "type": "text",
                        "required": false,
                        "presentable": true,
                        "unique": false,
                        "options": { "min": null, "max": null, "pattern": "" }
                    },
                    {
                        "system": false,
                        "name": "status",
                        "type": "text",
                        "required": false,
                        "presentable": false,
                        "unique": false,
                        "options": { "min": null, "max": null, "pattern": "" }
                    },
                    {
                        "system": false,
                        "name": "data",
                        "type": "json",
                        "required": false,
                        "presentable": false,
                        "unique": false,
                        "options": { "maxSize": 2000000 }
                    },
                    {
                        "system": false,
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
                    }
                ],
                "listRule": "@request.auth.id != ''",
                "viewRule": "@request.auth.id != ''",
                "createRule": "@request.auth.id != ''",
                "updateRule": "@request.auth.id != ''",
                "deleteRule": "@request.auth.id != ''"
            });
            dao.saveCollection(collection);
        }
    });

}, (db) => {
    // Down migration - do nothing or delete?
    // Safer to do nothing as we might delete valid data if rolled back.
})
