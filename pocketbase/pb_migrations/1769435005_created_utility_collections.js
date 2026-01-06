/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
    const dao = new Dao(db);

    const collections = [
        // Tenant related
        { name: "tenant_health_history", type: "base" },
        { name: "tenant_notifications", type: "base" },
        { name: "notification_templates", type: "base" },
        { name: "usage_reports", type: "base" },
        { name: "api_logs", type: "base" },
        { name: "tenant_storage", type: "base" },
        // Utility related
        { name: "utils_dev", type: "base" },
        { name: "utils_design", type: "base" },
        { name: "utils_general", type: "base" },
        { name: "utils_resources", type: "base" }
    ];

    collections.forEach(colData => {
        const collection = new Collection({
            "id": "gen_" + colData.name + "_id",
            "created": "2025-12-31 10:00:00.000Z",
            "updated": "2025-12-31 10:00:00.000Z",
            "name": colData.name,
            "type": colData.type,
            "system": false,
            "schema": [
                {
                    "system": false,
                    "id": "nm_" + colData.name,
                    "name": "name",
                    "type": "text",
                    "required": false,
                    "presentable": true,
                    "unique": false,
                    "options": { "min": null, "max": null, "pattern": "" }
                },
                {
                    "system": false,
                    "id": "dt_" + colData.name,
                    "name": "data",
                    "type": "json",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": { "maxSize": 2000000 }
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
        "tenant_health_history", "tenant_notifications", "notification_templates",
        "usage_reports", "api_logs", "tenant_storage",
        "utils_dev", "utils_design", "utils_general", "utils_resources"
    ].forEach(name => {
        try { dao.deleteCollection(dao.findCollectionByNameOrId(name)); } catch (e) { }
    });
})
