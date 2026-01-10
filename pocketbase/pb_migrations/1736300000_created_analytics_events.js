/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "analytics_events",
    "created": "2025-01-07 12:00:00.000Z",
    "updated": "2025-01-07 12:00:00.000Z",
    "name": "analytics_events",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "value_field",
        "name": "value",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
        }
      },
      {
        "system": false,
        "id": "active_users_field",
        "name": "active_users",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": null,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "revenue_field",
        "name": "revenue",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": null,
          "noDecimal": false
        }
      },
      {
        "system": false,
        "id": "event_type_field",
        "name": "event_type",
        "type": "select",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "page_view",
            "user_action",
            "system_event",
            "transaction",
            "error"
          ]
        }
      },
      {
        "system": false,
        "id": "metadata_field",
        "name": "metadata",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 2000000
        }
      },
      {
        "system": false,
        "id": "tenant_field",
        "name": "tenantId",
        "type": "relation",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "tenants",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      }
    ],
    "indexes": [
      "CREATE INDEX `idx_analytics_created` ON `analytics_events` (`created`)",
      "CREATE INDEX `idx_analytics_tenant` ON `analytics_events` (`tenantId`)",
      "CREATE INDEX `idx_analytics_type` ON `analytics_events` (`event_type`)"
    ],
    "listRule": "@request.auth.id != '' && (@request.auth.role = 'Owner' || @request.auth.role = 'Admin' || @request.auth.tenantId = tenantId)",
    "viewRule": "@request.auth.id != '' && (@request.auth.role = 'Owner' || @request.auth.role = 'Admin' || @request.auth.tenantId = tenantId)",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.role = 'Owner' || @request.auth.role = 'Admin'",
    "deleteRule": "@request.auth.role = 'Owner' || @request.auth.role = 'Admin'",
    "options": {}
  });

  return new Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("analytics_events");

  return dao.deleteCollection(collection);
});
