/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_774663631")

  // add field
  collection.fields.addAt(8, new Field({
    "cascadeDelete": true,
    "collectionId": "pbc_704108680",
    "hidden": false,
    "id": "relation1630877749",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "universe",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_774663631")

  // remove field
  collection.fields.removeById("relation1630877749")

  return app.save(collection)
})
