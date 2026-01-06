/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_tokenKey__pb_users_auth_` ON `users` (`tokenKey`)",
      "CREATE UNIQUE INDEX `idx_email__pb_users_auth_` ON `users` (`email`) WHERE `email` != ''",
      "CREATE INDEX `idx_users_email` ON `users` (`email`)",
      "CREATE INDEX `idx_users_created` ON `users` (`created`)",
      "CREATE INDEX `idx_role_users` ON `users` (`role`)",
      "CREATE INDEX `idx_tenantId_users` ON `users` (`tenantId`)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_tokenKey__pb_users_auth_` ON `users` (`tokenKey`)",
      "CREATE UNIQUE INDEX `idx_email__pb_users_auth_` ON `users` (`email`) WHERE `email` != ''",
      "CREATE INDEX `idx_users_email` ON `users` (`email`)",
      "CREATE INDEX `idx_users_created` ON `users` (`created`)"
    ]
  }, collection)

  return app.save(collection)
})
