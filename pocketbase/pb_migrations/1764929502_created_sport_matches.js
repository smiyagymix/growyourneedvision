/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
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
        "cascadeDelete": false,
        "collectionId": "pbc_3528417333",
        "hidden": false,
        "id": "relation2688022699",
        "maxSelect": 0,
        "minSelect": 0,
        "name": "team_home",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_3528417333",
        "hidden": false,
        "id": "relation2008962730",
        "maxSelect": 0,
        "minSelect": 0,
        "name": "team_away",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "number1540263334",
        "max": null,
        "min": null,
        "name": "score_home",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number2353472423",
        "max": null,
        "min": null,
        "name": "score_away",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "select2063623452",
        "maxSelect": 0,
        "name": "status",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "Scheduled",
          "Live",
          "Finished",
          "Cancelled"
        ]
      },
      {
        "hidden": false,
        "id": "date3421603336",
        "max": "",
        "min": "",
        "name": "match_date",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_1449767434",
        "hidden": false,
        "id": "relation2442205965",
        "maxSelect": 0,
        "minSelect": 0,
        "name": "venue",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text444985298",
        "max": 0,
        "min": 0,
        "name": "sport",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      }
    ],
    "id": "pbc_1319593057",
    "indexes": [],
    "listRule": "",
    "name": "sport_matches",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": ""
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1319593057");

  return app.delete(collection);
})
