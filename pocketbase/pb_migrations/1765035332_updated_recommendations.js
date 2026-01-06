/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_500998981")

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
  const collection = app.findCollectionByNameOrId("pbc_500998981")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.role = \"Owner\" || @request.auth.role = \"Admin\"",
    "deleteRule": "@request.auth.role = \"Owner\"",
    "listRule": "@request.auth.id != \"\"",
    "updateRule": "@request.auth.role = \"Owner\" || @request.auth.role = \"Admin\"",
    "viewRule": "@request.auth.id != \"\""
  }, collection)

  return app.save(collection)
})
