/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "ai_stats",
    "created": "2025-01-07 12:00:04.000Z",
    "updated": "2025-01-07 12:00:04.000Z",
    "name": "ai_stats",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "date_field",
        "name": "date",
        "type": "date",
        "required": true,
        "presentable": true,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "system": false,
        "id": "total_requests_field",
        "name": "total_requests",
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
        "id": "error_count_field",
        "name": "error_count",
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
        "id": "total_tokens_field",
        "name": "total_tokens",
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
        "id": "input_tokens_field",
        "name": "input_tokens",
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
        "id": "output_tokens_field",
        "name": "output_tokens",
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
        "id": "avg_latency_field",
        "name": "avg_latency",
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
        "id": "provider_field",
        "name": "provider",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 100,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "model_field",
        "name": "model",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 100,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "cost_usd_field",
        "name": "cost_usd",
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
      "CREATE INDEX `idx_ai_stats_date` ON `ai_stats` (`date`)",
      "CREATE INDEX `idx_ai_stats_tenant` ON `ai_stats` (`tenantId`)",
      "CREATE INDEX `idx_ai_stats_provider` ON `ai_stats` (`provider`)"
    ],
    "listRule": "@request.auth.id != '' && (@request.auth.role = 'Owner' || @request.auth.role = 'Admin')",
    "viewRule": "@request.auth.id != '' && (@request.auth.role = 'Owner' || @request.auth.role = 'Admin')",
    "createRule": "@request.auth.id != '' && (@request.auth.role = 'Owner' || @request.auth.role = 'Admin')",
    "updateRule": "@request.auth.id != '' && (@request.auth.role = 'Owner' || @request.auth.role = 'Admin')",
    "deleteRule": "@request.auth.id != '' && @request.auth.role = 'Owner'",
    "options": {}
  });

  return new Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("ai_stats");

  return dao.deleteCollection(collection);
});
