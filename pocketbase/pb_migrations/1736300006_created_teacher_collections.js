/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  // Lesson Plans Collection
  const lessonPlans = new Collection({
    "id": "lesson_plans",
    "created": "2025-01-07 12:00:06.000Z",
    "updated": "2025-01-07 12:00:06.000Z",
    "name": "lesson_plans",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "title_field",
        "name": "title",
        "type": "text",
        "required": true,
        "presentable": true,
        "unique": false,
        "options": {
          "min": 2,
          "max": 300,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "classId_field",
        "name": "classId",
        "type": "relation",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "classes",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "class_name_field",
        "name": "class_name",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 200,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "date_field",
        "name": "date",
        "type": "date",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "system": false,
        "id": "duration_field",
        "name": "duration",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 480,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "objectives_field",
        "name": "objectives",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 50000
        }
      },
      {
        "system": false,
        "id": "materials_field",
        "name": "materials",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 50000
        }
      },
      {
        "system": false,
        "id": "activities_field",
        "name": "activities",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 100000
        }
      },
      {
        "system": false,
        "id": "homework_field",
        "name": "homework",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 5000,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "notes_field",
        "name": "notes",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 10000,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "status_field",
        "name": "status",
        "type": "select",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "draft",
            "scheduled",
            "completed"
          ]
        }
      },
      {
        "system": false,
        "id": "teacherId_field",
        "name": "teacherId",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "tenant_field",
        "name": "tenantId",
        "type": "relation",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "tenants",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      }
    ],
    "indexes": [
      "CREATE INDEX `idx_lesson_plans_teacher` ON `lesson_plans` (`teacherId`)",
      "CREATE INDEX `idx_lesson_plans_date` ON `lesson_plans` (`date`)",
      "CREATE INDEX `idx_lesson_plans_class` ON `lesson_plans` (`classId`)"
    ],
    "listRule": "@request.auth.id != '' && (teacherId = @request.auth.id || @request.auth.role = 'Admin' || @request.auth.role = 'Owner')",
    "viewRule": "@request.auth.id != '' && (teacherId = @request.auth.id || @request.auth.role = 'Admin' || @request.auth.role = 'Owner')",
    "createRule": "@request.auth.id != '' && (@request.auth.role = 'Teacher' || @request.auth.role = 'Admin' || @request.auth.role = 'Owner')",
    "updateRule": "@request.auth.id != '' && (teacherId = @request.auth.id || @request.auth.role = 'Admin' || @request.auth.role = 'Owner')",
    "deleteRule": "@request.auth.id != '' && (teacherId = @request.auth.id || @request.auth.role = 'Admin' || @request.auth.role = 'Owner')",
    "options": {}
  });

  new Dao(db).saveCollection(lessonPlans);

  // Grade Entries Collection
  const gradeEntries = new Collection({
    "id": "grade_entries",
    "created": "2025-01-07 12:00:06.000Z",
    "updated": "2025-01-07 12:00:06.000Z",
    "name": "grade_entries",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "studentId_field",
        "name": "studentId",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "student_name_field",
        "name": "student_name",
        "type": "text",
        "required": false,
        "presentable": true,
        "unique": false,
        "options": {
          "min": null,
          "max": 200,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "classId_field",
        "name": "classId",
        "type": "relation",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "classes",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "class_name_field",
        "name": "class_name",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 200,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "assignment_type_field",
        "name": "assignment_type",
        "type": "select",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "homework",
            "quiz",
            "test",
            "project",
            "participation",
            "final"
          ]
        }
      },
      {
        "system": false,
        "id": "assignment_name_field",
        "name": "assignment_name",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 300,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "score_field",
        "name": "score",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": null,
          "noDecimal": false
        }
      },
      {
        "system": false,
        "id": "max_score_field",
        "name": "max_score",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": null,
          "noDecimal": false
        }
      },
      {
        "system": false,
        "id": "percentage_field",
        "name": "percentage",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 100,
          "noDecimal": false
        }
      },
      {
        "system": false,
        "id": "grade_letter_field",
        "name": "grade_letter",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 10,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "date_field",
        "name": "date",
        "type": "date",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "system": false,
        "id": "feedback_field",
        "name": "feedback",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 5000,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "teacherId_field",
        "name": "teacherId",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "tenant_field",
        "name": "tenantId",
        "type": "relation",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "tenants",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      }
    ],
    "indexes": [
      "CREATE INDEX `idx_grade_entries_student` ON `grade_entries` (`studentId`)",
      "CREATE INDEX `idx_grade_entries_class` ON `grade_entries` (`classId`)",
      "CREATE INDEX `idx_grade_entries_teacher` ON `grade_entries` (`teacherId`)",
      "CREATE INDEX `idx_grade_entries_date` ON `grade_entries` (`date`)"
    ],
    "listRule": "@request.auth.id != '' && (teacherId = @request.auth.id || studentId = @request.auth.id || @request.auth.role = 'Admin' || @request.auth.role = 'Owner' || @request.auth.role = 'Parent')",
    "viewRule": "@request.auth.id != '' && (teacherId = @request.auth.id || studentId = @request.auth.id || @request.auth.role = 'Admin' || @request.auth.role = 'Owner' || @request.auth.role = 'Parent')",
    "createRule": "@request.auth.id != '' && (@request.auth.role = 'Teacher' || @request.auth.role = 'Admin' || @request.auth.role = 'Owner')",
    "updateRule": "@request.auth.id != '' && (teacherId = @request.auth.id || @request.auth.role = 'Admin' || @request.auth.role = 'Owner')",
    "deleteRule": "@request.auth.id != '' && (teacherId = @request.auth.id || @request.auth.role = 'Admin' || @request.auth.role = 'Owner')",
    "options": {}
  });

  new Dao(db).saveCollection(gradeEntries);

  // Teacher Schedule Collection
  const teacherSchedule = new Collection({
    "id": "teacher_schedule",
    "created": "2025-01-07 12:00:06.000Z",
    "updated": "2025-01-07 12:00:06.000Z",
    "name": "teacher_schedule",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "teacherId_field",
        "name": "teacherId",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "classId_field",
        "name": "classId",
        "type": "relation",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "classes",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "class_name_field",
        "name": "class_name",
        "type": "text",
        "required": false,
        "presentable": true,
        "unique": false,
        "options": {
          "min": null,
          "max": 200,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "subject_field",
        "name": "subject",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 200,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "day_field",
        "name": "day",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
          ]
        }
      },
      {
        "system": false,
        "id": "start_time_field",
        "name": "start_time",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 10,
          "pattern": "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
        }
      },
      {
        "system": false,
        "id": "end_time_field",
        "name": "end_time",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 10,
          "pattern": "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
        }
      },
      {
        "system": false,
        "id": "room_field",
        "name": "room",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 50,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "type_field",
        "name": "type",
        "type": "select",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "class",
            "meeting",
            "prep",
            "duty"
          ]
        }
      },
      {
        "system": false,
        "id": "tenant_field",
        "name": "tenantId",
        "type": "relation",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "tenants",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      }
    ],
    "indexes": [
      "CREATE INDEX `idx_teacher_schedule_teacher` ON `teacher_schedule` (`teacherId`)",
      "CREATE INDEX `idx_teacher_schedule_day` ON `teacher_schedule` (`day`)"
    ],
    "listRule": "@request.auth.id != '' && (teacherId = @request.auth.id || @request.auth.role = 'Admin' || @request.auth.role = 'Owner')",
    "viewRule": "@request.auth.id != '' && (teacherId = @request.auth.id || @request.auth.role = 'Admin' || @request.auth.role = 'Owner')",
    "createRule": "@request.auth.id != '' && (@request.auth.role = 'Admin' || @request.auth.role = 'Owner')",
    "updateRule": "@request.auth.id != '' && (@request.auth.role = 'Admin' || @request.auth.role = 'Owner')",
    "deleteRule": "@request.auth.id != '' && (@request.auth.role = 'Admin' || @request.auth.role = 'Owner')",
    "options": {}
  });

  return new Dao(db).saveCollection(teacherSchedule);
}, (db) => {
  const dao = new Dao(db);
  
  try { dao.deleteCollection(dao.findCollectionByNameOrId("teacher_schedule")); } catch (e) {}
  try { dao.deleteCollection(dao.findCollectionByNameOrId("grade_entries")); } catch (e) {}
  try { dao.deleteCollection(dao.findCollectionByNameOrId("lesson_plans")); } catch (e) {}
});
