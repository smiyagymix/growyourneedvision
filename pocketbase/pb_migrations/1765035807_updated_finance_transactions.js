/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3956073405")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX `idx_finance_transactions_date` ON `finance_transactions` (`date`)",
      "CREATE INDEX `idx_finance_transactions_category` ON `finance_transactions` (`category`)",
      "CREATE INDEX `idx_finance_transactions_type` ON `finance_transactions` (`type`)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3956073405")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  return app.save(collection)
})
