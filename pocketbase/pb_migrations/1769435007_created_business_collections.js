/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
    const dao = new Dao(db);

    const collections = [
        // Finance / Payments
        { name: "subscriptions", type: "base" },
        { name: "payment_methods", type: "base" },
        { name: "receipts", type: "base" },

        // Resources
        { name: "resources", type: "base" },
        { name: "resource_categories", type: "base" },

        // Professional Services
        { name: "services", type: "base" },
        { name: "service_categories", type: "base" },
        { name: "service_reviews", type: "base" },
        { name: "service_bookings", type: "base" },

        // Settings & System
        { name: "user_preferences", type: "base" },
        { name: "notification_settings", type: "base" },
        { name: "privacy_settings", type: "base" },
        { name: "platform_config", type: "base" },
        { name: "api_keys", type: "base" },
        { name: "user_sessions", type: "base" },
        { name: "account_deletion_requests", type: "base" }
    ];

    collections.forEach(colData => {
        const collection = new Collection({
            "id": "biz_" + colData.name.substring(0, 10) + "_" + Math.floor(Math.random() * 1000),
            "created": "2025-12-31 10:00:00.000Z",
            "updated": "2025-12-31 10:00:00.000Z",
            "name": colData.name,
            "type": colData.type,
            "system": false,
            "schema": [
                // Standard fields
                {
                    "system": false,
                    "id": "title_" + colData.name,
                    "name": "title", // Common title/name field
                    "type": "text",
                    "required": false,
                    "presentable": true,
                    "unique": false,
                    "options": { "min": null, "max": null, "pattern": "" }
                },
                {
                    "system": false,
                    "id": "user_" + colData.name,
                    "name": "user", // Common owner field
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
                {
                    "system": false,
                    "id": "status_" + colData.name,
                    "name": "status", // Common status field
                    "type": "text",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": { "min": null, "max": null, "pattern": "" }
                },
                // Generic data bucket for flexible schema extension
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
                // Specific fields mapping found in interfaces
                // Finance
                {
                    "system": false,
                    "id": "plan_" + colData.name,
                    "name": "plan_id",
                    "type": "text",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": { "min": null, "max": null, "pattern": "" }
                },
                // Resources/Services
                {
                    "system": false,
                    "id": "cat_" + colData.name,
                    "name": "category",
                    "type": "text",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": { "min": null, "max": null, "pattern": "" }
                },
                {
                    "system": false,
                    "id": "vis_" + colData.name,
                    "name": "visibility",
                    "type": "text",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": { "min": null, "max": null, "pattern": "" }
                },
                // Settings
                {
                    "system": false,
                    "id": "key_" + colData.name,
                    "name": "key", // for platform_config / api_keys
                    "type": "text",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": { "min": null, "max": null, "pattern": "" }
                },
                {
                    "system": false,
                    "id": "val_" + colData.name,
                    "name": "value", // for platform_config
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
        "subscriptions", "payment_methods", "receipts",
        "resources", "resource_categories",
        "services", "service_categories", "service_reviews", "service_bookings",
        "user_preferences", "notification_settings", "privacy_settings",
        "platform_config", "api_keys", "user_sessions", "account_deletion_requests"
    ].forEach(name => {
        try { dao.deleteCollection(dao.findCollectionByNameOrId(name)); } catch (e) { }
    });
})
