/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "hobby_activities",
    "created": "2025-01-07 12:00:02.000Z",
    "updated": "2025-01-07 12:00:02.000Z",
    "name": "hobby_activities",
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
        "id": "category_field",
        "name": "category",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "Arts & Crafts",
            "Music",
            "Sports",
            "Gaming",
            "Reading",
            "Cooking",
            "Photography",
            "Gardening",
            "Travel",
            "Technology",
            "Fitness",
            "Other"
          ]
        }
      },
      {
        "system": false,
        "id": "difficulty_field",
        "name": "difficulty",
        "type": "select",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "Beginner",
            "Intermediate",
            "Advanced",
            "Expert"
          ]
        }
      },
      {
        "system": false,
        "id": "time_commitment_field",
        "name": "time_commitment",
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
        "id": "cost_estimate_field",
        "name": "cost_estimate",
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
        "id": "equipment_needed_field",
        "name": "equipment_needed",
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
        "id": "benefits_field",
        "name": "benefits",
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
        "id": "image_field",
        "name": "image",
        "type": "file",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "mimeTypes": [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
          ],
          "thumbs": [
            "100x100",
            "300x300"
          ],
          "maxSelect": 1,
          "maxSize": 5242880,
          "protected": false
        }
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
      },
      {
        "system": false,
        "id": "popularity_score_field",
        "name": "popularity_score",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": null,
          "noDecimal": true
        }
      }
    ],
    "indexes": [
      "CREATE INDEX `idx_hobbies_category` ON `hobby_activities` (`category`)",
      "CREATE INDEX `idx_hobbies_featured` ON `hobby_activities` (`is_featured`)"
    ],
    "listRule": "",
    "viewRule": "",
    "createRule": "@request.auth.id != '' && (@request.auth.role = 'Owner' || @request.auth.role = 'Admin')",
    "updateRule": "@request.auth.id != '' && (@request.auth.role = 'Owner' || @request.auth.role = 'Admin')",
    "deleteRule": "@request.auth.id != '' && (@request.auth.role = 'Owner' || @request.auth.role = 'Admin')",
    "options": {}
  });

  return new Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("hobby_activities");

  return dao.deleteCollection(collection);
});
