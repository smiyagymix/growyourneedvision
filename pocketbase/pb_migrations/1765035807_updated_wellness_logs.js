/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_926415452")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX `idx_wellness_logs_date` ON `wellness_logs` (`date`)",
      "CREATE INDEX `idx_wellness_logs_user` ON `wellness_logs` (`user`)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_926415452")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  return app.save(collection)
})
