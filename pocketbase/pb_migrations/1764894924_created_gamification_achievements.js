/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.role = 'Admin'",
    "deleteRule": "@request.auth.role = 'Admin'",
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
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1579384326",
        "max": 0,
        "min": 0,
        "name": "name",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1843675174",
        "max": 0,
        "min": 0,
        "name": "description",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1704208859",
        "max": 0,
        "min": 0,
        "name": "icon",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "select105650625",
        "maxSelect": 1,
        "name": "category",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "Learning",
          "Social",
          "Activity",
          "Milestone"
        ]
      },
      {
        "hidden": false,
        "id": "number732737117",
        "max": null,
        "min": null,
        "name": "xp_reward",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "select1489021200",
        "maxSelect": 1,
        "name": "requirement_type",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "count",
          "score",
          "streak"
        ]
      },
      {
        "hidden": false,
        "id": "number1118228162",
        "max": null,
        "min": null,
        "name": "requirement_value",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "select3082862150",
        "maxSelect": 1,
        "name": "rarity",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "Common",
          "Rare",
          "Epic",
          "Legendary"
        ]
      }
    ],
    "id": "pbc_179832912",
    "indexes": [],
    "listRule": "",
    "name": "gamification_achievements",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.role = 'Admin'",
    "viewRule": ""
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_179832912");

  return app.delete(collection);
})
