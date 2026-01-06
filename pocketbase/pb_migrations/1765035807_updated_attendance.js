/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2471705857")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX `idx_attendance_date` ON `attendance` (`date`)",
      "CREATE INDEX `idx_attendance_student` ON `attendance` (`student`)",
      "CREATE INDEX `idx_attendance_class` ON `attendance` (`class`)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2471705857")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  return app.save(collection)
})
