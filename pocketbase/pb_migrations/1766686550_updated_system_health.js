/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_929082275")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.role = \"Owner\"",
    "deleteRule": "@request.auth.role = \"Owner\"",
    "listRule": "@request.auth.role = \"Owner\"",
    "updateRule": "@request.auth.role = \"Owner\"",
    "viewRule": "@request.auth.role = \"Owner\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_929082275")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != ''",
    "listRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''"
  }, collection)

  return app.save(collection)
})
