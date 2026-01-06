/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_247482587")

  // add field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3065852031",
    "max": 0,
    "min": 0,
    "name": "message",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "select4133540203",
    "maxSelect": 1,
    "name": "severity",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "critical",
      "warning",
      "info"
    ]
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text927479371",
    "max": 0,
    "min": 0,
    "name": "actionUrl",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_247482587")

  // remove field
  collection.fields.removeById("text3065852031")

  // remove field
  collection.fields.removeById("select4133540203")

  // remove field
  collection.fields.removeById("text927479371")

  return app.save(collection)
})
