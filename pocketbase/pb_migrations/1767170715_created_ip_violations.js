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
    "id": "pbc_374185278",
    "indexes": [],
    "listRule": "@request.auth.role = \"Owner\"",
    "name": "ip_violations",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.role = \"Owner\"",
    "viewRule": "@request.auth.role = \"Owner\""
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_374185278");

  return app.delete(collection);
})
