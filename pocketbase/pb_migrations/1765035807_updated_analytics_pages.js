/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3913691978")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX `idx_analytics_pages_visitors` ON `analytics_pages` (`visitors`)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3913691978")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  return app.save(collection)
})
