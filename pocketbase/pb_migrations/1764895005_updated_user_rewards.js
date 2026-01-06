/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3870770235")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX idx_ur_user ON user_rewards (user)",
      "CREATE INDEX idx_ur_reward ON user_rewards (reward)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3870770235")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  return app.save(collection)
})
