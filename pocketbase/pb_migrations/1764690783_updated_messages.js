/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2605467279")

  // add field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "select2766477468",
    "maxSelect": 1,
    "name": "recipient_role",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Owner",
      "Admin",
      "Teacher",
      "Student",
      "Parent",
      "All"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2605467279")

  // remove field
  collection.fields.removeById("select2766477468")

  return app.save(collection)
})
