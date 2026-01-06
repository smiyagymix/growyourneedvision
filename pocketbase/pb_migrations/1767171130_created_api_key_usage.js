/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "",
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
    "id": "pbc_2788539317",
    "indexes": [],
    "listRule": "@request.auth.role = \"Owner\"",
    "name": "api_key_usage",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": "@request.auth.role = \"Owner\""
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2788539317");

  return app.delete(collection);
})
