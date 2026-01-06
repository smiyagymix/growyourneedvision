/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "dashboard_layouts_01",
    "created": "2025-12-31 10:00:00.000Z",
    "updated": "2025-12-31 10:00:00.000Z",
    "name": "dashboard_layouts",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "dl_name",
        "name": "name",
        "type": "text",
        "required": true,
        "presentable": true,
        "unique": false,
        "options": {
          "min": 1,
          "max": 100,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "dl_desc",
        "name": "description",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 500,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "dl_user",
        "name": "userId",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": []
        }
      },
      {
        "system": false,
        "id": "dl_default",
        "name": "isDefault",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      },
      {
        "system": false,
        "id": "dl_widgets",
        "name": "widgets",
        "type": "json",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
            "maxSize": 2000000
        }
      },
      {
        "system": false,
        "id": "dl_grid",
        "name": "gridConfig",
        "type": "json",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
            "maxSize": 2000000
        }
      },
      {
        "system": false,
        "id": "dl_theme",
        "name": "theme",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 50,
          "pattern": ""
        }
      }
    ],
    "indexes": [
      "CREATE INDEX `idx_dl_user` ON `dashboard_layouts` (`userId`)",
      "CREATE INDEX `idx_dl_default` ON `dashboard_layouts` (`userId`, `isDefault`)"
    ],
    "listRule": "@request.auth.id = userId",
    "viewRule": "@request.auth.id = userId",
    "createRule": "@request.auth.id != '' && @request.auth.id = userId",
    "updateRule": "@request.auth.id = userId",
    "deleteRule": "@request.auth.id = userId",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("dashboard_layouts");

  return dao.deleteCollection(collection);
})
