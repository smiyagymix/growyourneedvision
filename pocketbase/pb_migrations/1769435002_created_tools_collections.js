/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
    const dao = new Dao(db);

    const collections = [
        { name: "tools_business", type: "base" },
        { name: "tools_finance", type: "base" },
        { name: "tools_marketing", type: "base" },
        { name: "system_logs", type: "base" }, // from toolService.ts
        { name: "ticket_comments", type: "base" } // from ticketService.ts
    ];

    collections.forEach(colData => {
        const collection = new Collection({
            "id": colData.name + "_id",
            "created": "2025-12-31 10:00:00.000Z",
            "updated": "2025-12-31 10:00:00.000Z",
            "name": colData.name,
            "type": colData.type,
            "system": false,
            "schema": [
                {
                    "system": false,
                    "id": "gen_name_" + colData.name,
                    "name": "name",
                    "type": "text",
                    "required": false,
                    "presentable": true,
                    "unique": false,
                    "options": { "min": null, "max": null, "pattern": "" }
                },
                {
                    "system": false,
                    "id": "gen_data_" + colData.name,
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
    ["tools_business", "tools_finance", "tools_marketing", "system_logs", "ticket_comments"].forEach(name => {
        try { dao.deleteCollection(dao.findCollectionByNameOrId(name)); } catch (e) { }
    });
})
