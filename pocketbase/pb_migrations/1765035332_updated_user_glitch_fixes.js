/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_548486519")

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
  const collection = app.findCollectionByNameOrId("pbc_548486519")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id = user",
    "deleteRule": "@request.auth.role = \"Owner\"",
    "listRule": "@request.auth.id = user || @request.auth.role = \"Owner\"",
    "updateRule": "@request.auth.role = \"Owner\"",
    "viewRule": "@request.auth.id = user || @request.auth.role = \"Owner\""
  }, collection)

  return app.save(collection)
})
