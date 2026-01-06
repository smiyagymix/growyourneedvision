/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.role = \"Owner\"",
    "deleteRule": "@request.auth.role = \"Owner\"",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      }
    ],
    "id": "pbc_3715458866",
    "indexes": [],
    "listRule": "@request.auth.role = \"Owner\"",
    "name": "monitoring_events",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.role = \"Owner\"",
    "viewRule": "@request.auth.role = \"Owner\""
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3715458866");

  return app.delete(collection);
})
