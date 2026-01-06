/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
    const dao = new Dao(db);
    const collection = new Collection({
        "name": "marketplace_apps",
        "type": "base",
        "system": false,
        "schema": [
            {
                "system": false,
                "name": "name",
                "type": "text",
                "required": true,
                "presentable": true,
                "unique": false,
                "options": { "min": null, "max": null, "pattern": "" }
            },
            {
                "system": false,
                "name": "provider",
                "type": "text",
                "required": false,
                "presentable": false,
                "unique": false,
                "options": { "min": null, "max": null, "pattern": "" }
            },
            {
                "system": false,
                "name": "category",
                "type": "text",
                "required": false,
                "presentable": false,
                "unique": false,
                "options": { "min": null, "max": null, "pattern": "" }
            },
            {
                "system": false,
                "name": "rating",
                "type": "number",
                "required": false,
                "presentable": false,
                "unique": false,
                "options": { "min": null, "max": null, "noDecimal": false }
            },
            {
                "system": false,
                "name": "installs",
                "type": "number",
                "required": false,
                "presentable": false,
                "unique": false,
                "options": { "min": null, "max": null, "noDecimal": true }
            },
            {
                "system": false,
                "name": "price",
                "type": "text",
                "required": false,
                "presentable": false,
                "unique": false,
                "options": { "min": null, "max": null, "pattern": "" }
            },
            {
                "system": false,
                "name": "verified",
                "type": "bool",
                "required": false,
                "presentable": false,
                "unique": false,
                "options": {}
            },
            {
                "system": false,
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
}, (db) => {
    const dao = new Dao(db);
    try {
        const collection = dao.findCollectionByNameOrId("marketplace_apps");
        dao.deleteCollection(collection);
    } catch (_) { }
})
