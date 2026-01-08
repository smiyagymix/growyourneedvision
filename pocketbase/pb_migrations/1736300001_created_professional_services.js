/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "professional_services",
    "created": "2025-01-07 12:00:01.000Z",
    "updated": "2025-01-07 12:00:01.000Z",
    "name": "professional_services",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "title_field",
        "name": "title",
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
        "id": "provider_name_field",
        "name": "provider_name",
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
        "id": "category_field",
        "name": "category",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "Finance",
            "Legal",
            "Home Services",
            "Health & Fitness",
            "Technology",
            "Education",
            "Marketing",
            "Design",
            "Consulting",
            "Other"
          ]
        }
      },
      {
        "system": false,
        "id": "price_field",
        "name": "price",
        "type": "number",
        "required": true,
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
        "id": "location_field",
        "name": "location",
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
        "id": "availability_field",
        "name": "availability",
        "type": "select",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "Available",
            "Busy",
            "Unavailable"
          ]
        }
      },
      {
        "system": false,
        "id": "experience_years_field",
        "name": "experience_years",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 100,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "certifications_field",
        "name": "certifications",
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
        "id": "provider_user_field",
        "name": "provider_user",
        "type": "relation",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
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
      },
      {
        "system": false,
        "id": "is_active_field",
        "name": "is_active",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      }
    ],
    "indexes": [
      "CREATE INDEX `idx_services_category` ON `professional_services` (`category`)",
      "CREATE INDEX `idx_services_tenant` ON `professional_services` (`tenantId`)",
      "CREATE INDEX `idx_services_rating` ON `professional_services` (`rating`)"
    ],
    "listRule": "",
    "viewRule": "",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != '' && (provider_user = @request.auth.id || @request.auth.role = 'Owner' || @request.auth.role = 'Admin')",
    "deleteRule": "@request.auth.id != '' && (provider_user = @request.auth.id || @request.auth.role = 'Owner' || @request.auth.role = 'Admin')",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("professional_services");

  return dao.deleteCollection(collection);
});
