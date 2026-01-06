/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
    const dao = new Dao(db);

    const collections = [
        // Marketing
        { name: "campaigns", type: "base" },
        { name: "audiences", type: "base" },
        { name: "ab_tests", type: "base" },
        { name: "customer_profiles", type: "base" },
        { name: "personalization_rules", type: "base" },
        { name: "journeys", type: "base" },
        { name: "lead_scores", type: "base" },
        { name: "social_posts", type: "base" },
        { name: "social_accounts", type: "base" },
        { name: "creative_projects", type: "base" },
        { name: "attribution", type: "base" },

        // Marketplace
        { name: "marketplace_apps", type: "base" },
        { name: "app_reviews", type: "base" },
        { name: "app_installations", type: "base" },

        // Media
        { name: "media_items", type: "base" },
        { name: "tv_channels", type: "base" },
        { name: "m3u_playlists", type: "base" },
        { name: "watch_history", type: "base" }
    ];

    collections.forEach(colData => {
        const collection = new Collection({
            "id": "exp_" + colData.name.substring(0, 10) + "_" + Math.floor(Math.random() * 1000),
            "created": "2025-12-31 11:00:00.000Z",
            "updated": "2025-12-31 11:00:00.000Z",
            "name": colData.name,
            "type": colData.type,
            "system": false,
            "schema": [
                // Common Name/Title
                {
                    "system": false,
                    "id": "title_" + colData.name,
                    "name": "name", // Most expansion collections use 'name' (campaigns, apps, etc.)
                    "type": "text",
                    "required": false,
                    "presentable": true,
                    "unique": false,
                    "options": { "min": null, "max": null, "pattern": "" }
                },
                // Common Description
                {
                    "system": false,
                    "id": "desc_" + colData.name,
                    "name": "description",
                    "type": "text",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": { "min": null, "max": null, "pattern": "" }
                },
                // Common Valid/Active Status
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
                // JSON Data for complex fields (variants, steps, factors, canvas_data)
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
                // Specific Relations
                {
                    "system": false,
                    "id": "user_" + colData.name,
                    "name": "user",
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
                // Category/Type
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
                    "id": "type_" + colData.name,
                    "name": "type",
                    "type": "text",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": { "min": null, "max": null, "pattern": "" }
                },
                // Specific Mappings
                // Media
                {
                    "system": false,
                    "id": "url_" + colData.name,
                    "name": "url", // playlists, media items
                    "type": "text",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": { "min": null, "max": null, "pattern": "" }
                },
                // Marketplace
                {
                    "system": false,
                    "id": "app_" + colData.name,
                    "name": "app", // for reviews, installs
                    "type": "relation",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "collectionId": "exp_marketplac_123", // Placeholder, relation logic handles lazy binding usually or we just use text ID if strictly needed, but broad schema is fine
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
    });

}, (db) => {
    const dao = new Dao(db);
    [
        "campaigns", "audiences", "ab_tests", "customer_profiles", "personalization_rules",
        "journeys", "lead_scores", "social_posts", "social_accounts", "creative_projects", "attribution",
        "marketplace_apps", "app_reviews", "app_installations",
        "media_items", "tv_channels", "m3u_playlists", "watch_history"
    ].forEach(name => {
        try { dao.deleteCollection(dao.findCollectionByNameOrId(name)); } catch (e) { }
    });
})
