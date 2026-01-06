/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_699394385")

  // add field
  collection.fields.addAt(16, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation2911524009",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "admin_user",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(17, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3252000302",
    "max": 0,
    "min": 0,
    "name": "subdomain",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(18, new Field({
    "hidden": false,
    "id": "select3713686397",
    "maxSelect": 1,
    "name": "plan",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "free",
      "basic",
      "pro",
      "enterprise"
    ]
  }))

  // add field
  collection.fields.addAt(19, new Field({
    "hidden": false,
    "id": "select3002498459",
    "maxSelect": 1,
    "name": "subscription_status",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "active",
      "past_due",
      "cancelled",
      "trialing"
    ]
  }))

  // add field
  collection.fields.addAt(20, new Field({
    "hidden": false,
    "id": "number3578592097",
    "max": null,
    "min": null,
    "name": "max_students",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(21, new Field({
    "hidden": false,
    "id": "number2619500837",
    "max": null,
    "min": null,
    "name": "max_teachers",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(22, new Field({
    "hidden": false,
    "id": "number945184987",
    "max": null,
    "min": null,
    "name": "max_storage_gb",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(23, new Field({
    "hidden": false,
    "id": "json966362225",
    "maxSize": 0,
    "name": "features_enabled",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(24, new Field({
    "hidden": false,
    "id": "date746802699",
    "max": "",
    "min": "",
    "name": "trial_ends_at",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(25, new Field({
    "hidden": false,
    "id": "date1549756988",
    "max": "",
    "min": "",
    "name": "subscription_ends_at",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(26, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1888339527",
    "max": 0,
    "min": 0,
    "name": "stripe_customer_id",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(27, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3051075425",
    "max": 0,
    "min": 0,
    "name": "stripe_subscription_id",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(0, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3208210256",
    "max": 0,
    "min": 0,
    "name": "id",
    "pattern": "^[a-z0-9]+$",
    "presentable": false,
    "primaryKey": true,
    "required": true,
    "system": true,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "select2363381545",
    "maxSelect": 1,
    "name": "type",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "School",
      "Individual",
      "Business"
    ]
  }))

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "file3834550803",
    "maxSelect": 0,
    "maxSize": 0,
    "mimeTypes": null,
    "name": "logo",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": null,
    "type": "file"
  }))

  // update field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "select2063623452",
    "maxSelect": 1,
    "name": "status",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Active",
      "Suspended",
      "Trial",
      "Cancelled"
    ]
  }))

  // update field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "json2992344663",
    "maxSize": 0,
    "name": "branding",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // update field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "json3846545605",
    "maxSize": 0,
    "name": "settings",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // update field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "select3053057214",
    "maxSelect": 1,
    "name": "billing_cycle",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Monthly",
      "Yearly"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_699394385")

  // remove field
  collection.fields.removeById("relation2911524009")

  // remove field
  collection.fields.removeById("text3252000302")

  // remove field
  collection.fields.removeById("select3713686397")

  // remove field
  collection.fields.removeById("select3002498459")

  // remove field
  collection.fields.removeById("number3578592097")

  // remove field
  collection.fields.removeById("number2619500837")

  // remove field
  collection.fields.removeById("number945184987")

  // remove field
  collection.fields.removeById("json966362225")

  // remove field
  collection.fields.removeById("date746802699")

  // remove field
  collection.fields.removeById("date1549756988")

  // remove field
  collection.fields.removeById("text1888339527")

  // remove field
  collection.fields.removeById("text3051075425")

  // update field
  collection.fields.addAt(0, new Field({
    "autogeneratePattern": "[a-z0-9]{15}",
    "hidden": false,
    "id": "text3208210256",
    "max": 15,
    "min": 15,
    "name": "id",
    "pattern": "^[a-z0-9]+$",
    "presentable": false,
    "primaryKey": true,
    "required": true,
    "system": true,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "select2363381545",
    "maxSelect": 1,
    "name": "type",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "School",
      "Individual",
      "Enterprise"
    ]
  }))

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "file3834550803",
    "maxSelect": 1,
    "maxSize": 5242880,
    "mimeTypes": null,
    "name": "logo",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": null,
    "type": "file"
  }))

  // update field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "select2063623452",
    "maxSelect": 1,
    "name": "status",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Active",
      "Inactive",
      "Pending"
    ]
  }))

  // update field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "json2992344663",
    "maxSize": 2000000,
    "name": "branding",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // update field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "json3846545605",
    "maxSize": 2000000,
    "name": "settings",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // update field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "select3053057214",
    "maxSelect": 0,
    "name": "billing_cycle",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Monthly",
      "Yearly"
    ]
  }))

  return app.save(collection)
})
