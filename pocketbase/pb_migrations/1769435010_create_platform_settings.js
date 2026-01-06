/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
    const dao = new Dao(db);
    const collection = new Collection({
        "name": "platform_settings",
        "type": "base",
        "system": false,
        "schema": [
            {
                "system": false,
                "name": "key",
                "type": "text",
                "required": true,
                "presentable": true,
                "unique": true,
                "options": { "min": null, "max": null, "pattern": "" }
            },
            {
                "system": false,
                "name": "value",
                "type": "json",
                "required": false,
                "presentable": false,
                "unique": false,
                "options": { "maxSize": 2000000 }
            },
            {
                "system": false,
                "name": "description",
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
        const collection = dao.findCollectionByNameOrId("platform_settings");
        dao.deleteCollection(collection);
    } catch (_) { }
})
