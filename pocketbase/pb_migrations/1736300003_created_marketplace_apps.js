/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "marketplace_apps",
    "created": "2025-01-07 12:00:03.000Z",
    "updated": "2025-01-07 12:00:03.000Z",
    "name": "marketplace_apps",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "name_field",
        "name": "name",
        "type": "text",
        "required": true,
        "presentable": true,
        "unique": false,
        "options": {
          "min": 2,
          "max": 200,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "description_field",
        "name": "description",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 5000,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "short_description_field",
        "name": "short_description",
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
        "id": "category_field",
        "name": "category",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "Productivity",
            "Communication",
            "Analytics",
            "Integration",
            "Education",
            "Finance",
            "Marketing",
            "Security",
            "Utilities",
            "Other"
          ]
        }
      },
      {
        "system": false,
        "id": "icon_field",
        "name": "icon",
        "type": "file",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "mimeTypes": [
            "image/png",
            "image/svg+xml",
            "image/webp"
          ],
          "thumbs": [
            "64x64",
            "128x128"
          ],
          "maxSelect": 1,
          "maxSize": 1048576,
          "protected": false
        }
      },
      {
        "system": false,
        "id": "screenshots_field",
        "name": "screenshots",
        "type": "file",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "mimeTypes": [
            "image/jpeg",
            "image/png",
            "image/webp"
          ],
          "thumbs": [
            "400x300"
          ],
          "maxSelect": 5,
          "maxSize": 5242880,
          "protected": false
        }
      },
      {
        "system": false,
        "id": "developer_name_field",
        "name": "developer_name",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 200,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "developer_url_field",
        "name": "developer_url",
        "type": "url",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "exceptDomains": null,
          "onlyDomains": null
        }
      },
      {
        "system": false,
        "id": "version_field",
        "name": "version",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 50,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "price_field",
        "name": "price",
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
        "id": "price_type_field",
        "name": "price_type",
        "type": "select",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "free",
            "one_time",
            "monthly",
            "yearly"
          ]
        }
      },
      {
        "system": false,
        "id": "rating_field",
        "name": "rating",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 5,
          "noDecimal": false
        }
      },
      {
        "system": false,
        "id": "reviews_count_field",
        "name": "reviews_count",
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
        "id": "installs_count_field",
        "name": "installs_count",
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
        "id": "status_field",
        "name": "status",
        "type": "select",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "pending",
            "approved",
            "rejected",
            "published",
            "suspended"
          ]
        }
      },
      {
        "system": false,
        "id": "features_field",
        "name": "features",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 50000
        }
      },
      {
        "system": false,
        "id": "permissions_field",
        "name": "permissions",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 50000
        }
      },
      {
        "system": false,
        "id": "webhook_url_field",
        "name": "webhook_url",
        "type": "url",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "exceptDomains": null,
          "onlyDomains": null
        }
      },
      {
        "system": false,
        "id": "is_verified_field",
        "name": "is_verified",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      },
      {
        "system": false,
        "id": "is_featured_field",
        "name": "is_featured",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      }
    ],
    "indexes": [
      "CREATE INDEX `idx_apps_category` ON `marketplace_apps` (`category`)",
      "CREATE INDEX `idx_apps_status` ON `marketplace_apps` (`status`)",
      "CREATE INDEX `idx_apps_featured` ON `marketplace_apps` (`is_featured`)",
      "CREATE INDEX `idx_apps_rating` ON `marketplace_apps` (`rating`)"
    ],
    "listRule": "status = 'published' || (@request.auth.id != '' && @request.auth.role = 'Owner')",
    "viewRule": "status = 'published' || (@request.auth.id != '' && @request.auth.role = 'Owner')",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != '' && (@request.auth.role = 'Owner' || @request.auth.role = 'Admin')",
    "deleteRule": "@request.auth.id != '' && (@request.auth.role = 'Owner' || @request.auth.role = 'Admin')",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("marketplace_apps");

  return dao.deleteCollection(collection);
});
