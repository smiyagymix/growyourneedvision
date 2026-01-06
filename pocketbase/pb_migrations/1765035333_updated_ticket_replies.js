/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2334608367")

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
  const collection = app.findCollectionByNameOrId("pbc_2334608367")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id = user",
    "deleteRule": null,
    "listRule": "@request.auth.id = user || ticket.user = @request.auth.id",
    "updateRule": null,
    "viewRule": "@request.auth.id = user || ticket.user = @request.auth.id"
  }, collection)

  return app.save(collection)
})
