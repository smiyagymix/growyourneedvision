/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
    const dao = new Dao(db);

    const collections = [
        { name: "travel_destinations" },
        { name: "travel_bookings" },
        { name: "travel_itineraries" },
        { name: "travel_transport" }
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
                    "id": "name_" + colData.name,
                    "name": "title",
                    "type": "text",
                    "required": true,
                    "presentable": true,
                    "unique": false,
                    "options": { "min": null, "max": null, "pattern": "" }
                },
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
                {
                    "system": false,
                    "id": "meta_" + colData.name,
                    "name": "metadata",
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
    ["travel_destinations", "travel_bookings", "travel_itineraries", "travel_transport"].forEach(name => {
        try { dao.deleteCollection(dao.findCollectionByNameOrId(name)); } catch (e) { }
    });
})
