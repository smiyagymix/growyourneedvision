/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_251006600")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != ''"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_251006600")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.role ~ 'Admin|Teacher'",
    "deleteRule": "@request.auth.role ~ 'Admin|Teacher'",
    "updateRule": "@request.auth.role ~ 'Admin|Teacher'"
  }, collection)

  return app.save(collection)
})
