/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
    const dao = new Dao(db);

    const collections = [
        { name: "wellness_logs" },
        { name: "wellness_goals" }
    ];

    collections.forEach(colData => {
        const collection = new Collection({
            "id": colData.name + "_id",
            "created": "2025-12-31 10:00:00.000Z",
            "updated": "2025-12-31 10:00:00.000Z",
            "name": colData.name,
            "type": "base",
            "system": false,
            "schema": [
                {
                    "system": false,
                    "id": "user_" + colData.name,
                    "name": "userId",
                    "type": "relation",
                    "required": true,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "collectionId": "_pb_users_auth_",
                        "cascadeDelete": true,
                        "minSelect": null,
                        "maxSelect": 1,
                        "displayFields": []
                    }
                },
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
                {
                    "system": false,
                    "id": "date_" + colData.name,
                    "name": "date",
                    "type": "date",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": { "min": "", "max": "" }
                }
            ],
            "listRule": "@request.auth.id = userId",
            "viewRule": "@request.auth.id = userId",
            "createRule": "@request.auth.id = userId",
            "updateRule": "@request.auth.id = userId",
            "deleteRule": "@request.auth.id = userId"
        });
        dao.saveCollection(collection);
    });

}, (db) => {
    const dao = new Dao(db);
    ["wellness_logs", "wellness_goals"].forEach(name => {
        try { dao.deleteCollection(dao.findCollectionByNameOrId(name)); } catch (e) { }
    });
})
