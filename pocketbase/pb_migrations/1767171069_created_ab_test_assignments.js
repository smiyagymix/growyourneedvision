/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": null,
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
    "id": "pbc_3407231288",
    "indexes": [],
    "listRule": "@request.auth.role = \"Owner\"",
    "name": "ab_test_assignments",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": "@request.auth.role = \"Owner\""
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3407231288");

  return app.delete(collection);
})
