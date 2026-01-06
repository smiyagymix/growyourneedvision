/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
    const dao = new Dao(db);

    // 1. user_merge_logs
    const collection1 = new Collection({
        "id": "user_merge_logs_01",
        "created": "2025-12-31 10:00:00.000Z",
        "updated": "2025-12-31 10:00:00.000Z",
        "name": "user_merge_logs",
        "type": "base",
        "system": false,
        "schema": [
            {
                "system": false,
                "id": "uml_orig",
                "name": "originalUserId",
                "type": "text",
                "required": true,
                "presentable": false,
                "unique": false,
                "options": { "min": null, "max": null, "pattern": "" }
            },
            {
                "system": false,
                "id": "uml_merg",
                "name": "mergedUserId",
                "type": "relation",
                "required": true,
                "presentable": false,
                "unique": false,
                "options": {
                    "collectionId": "_pb_users_auth_",
                    "cascadeDelete": false,
                    "minSelect": null,
                    "maxSelect": 1,
                    "displayFields": []
                }
            },
            {
                "system": false,
                "id": "uml_by",
                "name": "mergedBy",
                "type": "relation",
                "required": true,
                "presentable": false,
                "unique": false,
                "options": {
                    "collectionId": "_pb_users_auth_",
                    "cascadeDelete": false,
                    "minSelect": null,
                    "maxSelect": 1,
                    "displayFields": []
                }
            },
            {
                "system": false,
                "id": "uml_reason",
                "name": "reason",
                "type": "text",
                "required": false,
                "presentable": false,
                "unique": false,
                "options": { "min": null, "max": 500, "pattern": "" }
            }
        ],
        "listRule": "@request.auth.id != ''",
        "viewRule": "@request.auth.id != ''",
        "createRule": "@request.auth.id != ''",
        "updateRule": null,
        "deleteRule": null
    });
    dao.saveCollection(collection1);

    // 2. webhook_deliveries
    const collection2 = new Collection({
        "id": "webhook_deliveries01",
        "created": "2025-12-31 10:00:00.000Z",
        "updated": "2025-12-31 10:00:00.000Z",
        "name": "webhook_deliveries",
        "type": "base",
        "system": false,
        "schema": [
            {
                "system": false,
                "id": "wd_hook",
                "name": "webhookId",
                "type": "text",
                "required": true,
                "presentable": false,
                "unique": false,
                "options": { "min": null, "max": null, "pattern": "" }
            },
            {
                "system": false,
                "id": "wd_status",
                "name": "status",
                "type": "select",
                "required": true,
                "presentable": false,
                "unique": false,
                "options": {
                    "maxSelect": 1,
                    "values": ["success", "failed", "pending"]
                }
            },
            {
                "system": false,
                "id": "wd_code",
                "name": "statusCode",
                "type": "number",
                "required": false,
                "presentable": false,
                "unique": false,
                "options": { "min": null, "max": null, "noDecimal": true }
            },
            {
                "system": false,
                "id": "wd_payload",
                "name": "requestPayload",
                "type": "json",
                "required": false,
                "presentable": false,
                "unique": false,
                "options": { "maxSize": 2000000 }
            },
            {
                "system": false,
                "id": "wd_resp",
                "name": "responseBody",
                "type": "text",
                "required": false,
                "presentable": false,
                "unique": false,
                "options": { "min": null, "max": null, "pattern": "" }
            }
        ],
        "listRule": "@request.auth.id != ''",
        "viewRule": "@request.auth.id != ''",
        "createRule": null, // Created by system only
        "updateRule": null,
        "deleteRule": null
    });
    dao.saveCollection(collection2);

    // 3. tenant_trials
    const collection3 = new Collection({
        "id": "tenant_trials_01",
        "created": "2025-12-31 10:00:00.000Z",
        "updated": "2025-12-31 10:00:00.000Z",
        "name": "tenant_trials",
        "type": "base",
        "system": false,
        "schema": [
            {
                "system": false,
                "id": "tt_tenant",
                "name": "tenantId",
                "type": "text",
                "required": true,
                "presentable": false,
                "unique": false,
                "options": { "min": null, "max": null, "pattern": "" }
            },
            {
                "system": false,
                "id": "tt_plan",
                "name": "planId",
                "type": "text",
                "required": true,
                "presentable": false,
                "unique": false,
                "options": { "min": null, "max": null, "pattern": "" }
            },
            {
                "system": false,
                "id": "tt_start",
                "name": "startDate",
                "type": "date",
                "required": true,
                "presentable": false,
                "unique": false,
                "options": { "min": "", "max": "" }
            },
            {
                "system": false,
                "id": "tt_end",
                "name": "endDate",
                "type": "date",
                "required": true,
                "presentable": false,
                "unique": false,
                "options": { "min": "", "max": "" }
            },
            {
                "system": false,
                "id": "tt_status",
                "name": "status",
                "type": "select",
                "required": true,
                "presentable": false,
                "unique": false,
                "options": {
                    "maxSelect": 1,
                    "values": ["active", "expired", "converted"]
                }
            }
        ],
        "listRule": "@request.auth.id != ''",
        "viewRule": "@request.auth.id != ''",
        "createRule": "@request.auth.id != ''",
        "updateRule": "@request.auth.id != ''",
        "deleteRule": "@request.auth.id != ''"
    });
    dao.saveCollection(collection3);

}, (db) => {
    const dao = new Dao(db);
    try { dao.deleteCollection(dao.findCollectionByNameOrId("user_merge_logs")); } catch (e) { }
    try { dao.deleteCollection(dao.findCollectionByNameOrId("webhook_deliveries")); } catch (e) { }
    try { dao.deleteCollection(dao.findCollectionByNameOrId("tenant_trials")); } catch (e) { }
})
