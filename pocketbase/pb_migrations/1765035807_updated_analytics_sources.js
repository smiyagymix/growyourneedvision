/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3845386525")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX `idx_analytics_sources_visitors` ON `analytics_sources` (`visitors`)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3845386525")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  return app.save(collection)
})
