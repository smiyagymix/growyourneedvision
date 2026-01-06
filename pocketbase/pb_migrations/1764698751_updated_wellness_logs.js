/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_926415452")

  // update collection data
  unmarshal({
    "deleteRule": "@request.auth.id = user.id",
    "listRule": "@request.auth.id = user.id",
    "updateRule": "@request.auth.id = user.id",
    "viewRule": "@request.auth.id = user.id"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_926415452")

  // update collection data
  unmarshal({
    "deleteRule": "@request.auth.id != ''",
    "listRule": "",
    "updateRule": "@request.auth.id != ''",
    "viewRule": ""
  }, collection)

  return app.save(collection)
})
