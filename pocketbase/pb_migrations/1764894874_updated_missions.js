/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1958710375")

  // add field
  collection.fields.addAt(8, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1958710375",
    "hidden": false,
    "id": "relation2978403836",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "required_mission",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(7, new Field({
    "cascadeDelete": true,
    "collectionId": "pbc_3685880632",
    "hidden": false,
    "id": "relation1191102054",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "timeline",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1958710375")

  // remove field
  collection.fields.removeById("relation2978403836")

  // update field
  collection.fields.addAt(7, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3685880632",
    "hidden": false,
    "id": "relation1191102054",
    "maxSelect": 0,
    "minSelect": 0,
    "name": "timeline",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
})
