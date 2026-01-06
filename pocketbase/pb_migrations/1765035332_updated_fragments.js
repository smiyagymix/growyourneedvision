/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3595709141")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != ''",
    "listRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3595709141")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.role = \"Owner\"",
    "deleteRule": "@request.auth.role = \"Owner\"",
    "listRule": "",
    "updateRule": "@request.auth.role = \"Owner\"",
    "viewRule": ""
  }, collection)

  return app.save(collection)
})
