/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2889108411")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id = user",
    "deleteRule": "@request.auth.role = \"Owner\"",
    "listRule": "@request.auth.id = user || @request.auth.role = \"Owner\" || @request.auth.role = \"Teacher\"",
    "updateRule": "@request.auth.role = \"Owner\"",
    "viewRule": "@request.auth.id = user || @request.auth.role = \"Owner\" || @request.auth.role = \"Teacher\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2889108411")

  // update collection data
  unmarshal({
    "createRule": null,
    "deleteRule": null,
    "listRule": null,
    "updateRule": null,
    "viewRule": null
  }, collection)

  return app.save(collection)
})
