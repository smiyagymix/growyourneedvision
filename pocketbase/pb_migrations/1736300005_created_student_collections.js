/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  // Student Courses Collection
  const studentCourses = new Collection({
    "id": "student_courses",
    "created": "2025-01-07 12:00:05.000Z",
    "updated": "2025-01-07 12:00:05.000Z",
    "name": "student_courses",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "student_field",
        "name": "student",
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
        "id": "name_field",
        "name": "name",
        "type": "text",
        "required": true,
        "presentable": true,
        "unique": false,
        "options": {
          "min": 2,
          "max": 200,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "code_field",
        "name": "code",
        "type": "text",
        "required": true,
        "presentable": true,
        "unique": false,
        "options": {
          "min": 2,
          "max": 50,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "teacher_field",
        "name": "teacher",
        "type": "relation",
        "required": false,
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
        "id": "teacher_name_field",
        "name": "teacher_name",
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
        "id": "description_field",
        "name": "description",
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
        "id": "schedule_field",
        "name": "schedule",
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
        "id": "credits_field",
        "name": "credits",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 20,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "grade_field",
        "name": "grade",
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
        "id": "status_field",
        "name": "status",
        "type": "select",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "active",
            "completed",
            "dropped"
          ]
        }
      },
      {
        "system": false,
        "id": "progress_field",
        "name": "progress",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 100,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "color_field",
        "name": "color",
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
      "CREATE INDEX `idx_student_courses_student` ON `student_courses` (`student`)",
      "CREATE INDEX `idx_student_courses_status` ON `student_courses` (`status`)"
    ],
    "listRule": "@request.auth.id != '' && (student = @request.auth.id || @request.auth.role = 'Teacher' || @request.auth.role = 'Admin' || @request.auth.role = 'Owner')",
    "viewRule": "@request.auth.id != '' && (student = @request.auth.id || @request.auth.role = 'Teacher' || @request.auth.role = 'Admin' || @request.auth.role = 'Owner')",
    "createRule": "@request.auth.id != '' && (@request.auth.role = 'Teacher' || @request.auth.role = 'Admin' || @request.auth.role = 'Owner')",
    "updateRule": "@request.auth.id != '' && (@request.auth.role = 'Teacher' || @request.auth.role = 'Admin' || @request.auth.role = 'Owner')",
    "deleteRule": "@request.auth.id != '' && (@request.auth.role = 'Admin' || @request.auth.role = 'Owner')",
    "options": {}
  });

  new Dao(db).saveCollection(studentCourses);

  // Student Assignments Collection
  const studentAssignments = new Collection({
    "id": "student_assignments",
    "created": "2025-01-07 12:00:05.000Z",
    "updated": "2025-01-07 12:00:05.000Z",
    "name": "student_assignments",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "student_field",
        "name": "student",
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
        "id": "course_id_field",
        "name": "course_id",
        "type": "relation",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "student_courses",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "course_name_field",
        "name": "course_name",
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
        "id": "description_field",
        "name": "description",
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
        "id": "type_field",
        "name": "type",
        "type": "select",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "homework",
            "quiz",
            "exam",
            "project",
            "essay",
            "lab"
          ]
        }
      },
      {
        "system": false,
        "id": "due_date_field",
        "name": "due_date",
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
        "id": "status_field",
        "name": "status",
        "type": "select",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "pending",
            "submitted",
            "graded",
            "late",
            "missed"
          ]
        }
      },
      {
        "system": false,
        "id": "grade_field",
        "name": "grade",
        "type": "number",
        "required": false,
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
        "id": "max_grade_field",
        "name": "max_grade",
        "type": "number",
        "required": false,
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
        "id": "submission_date_field",
        "name": "submission_date",
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
        "id": "attachments_field",
        "name": "attachments",
        "type": "file",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "mimeTypes": [],
          "thumbs": [],
          "maxSelect": 10,
          "maxSize": 10485760,
          "protected": false
        }
      },
      {
        "system": false,
        "id": "priority_field",
        "name": "priority",
        "type": "select",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "low",
            "medium",
            "high"
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
      "CREATE INDEX `idx_student_assignments_student` ON `student_assignments` (`student`)",
      "CREATE INDEX `idx_student_assignments_due` ON `student_assignments` (`due_date`)",
      "CREATE INDEX `idx_student_assignments_status` ON `student_assignments` (`status`)"
    ],
    "listRule": "@request.auth.id != '' && (student = @request.auth.id || @request.auth.role = 'Teacher' || @request.auth.role = 'Admin' || @request.auth.role = 'Owner')",
    "viewRule": "@request.auth.id != '' && (student = @request.auth.id || @request.auth.role = 'Teacher' || @request.auth.role = 'Admin' || @request.auth.role = 'Owner')",
    "createRule": "@request.auth.id != '' && (@request.auth.role = 'Teacher' || @request.auth.role = 'Admin' || @request.auth.role = 'Owner')",
    "updateRule": "@request.auth.id != '' && (student = @request.auth.id || @request.auth.role = 'Teacher' || @request.auth.role = 'Admin' || @request.auth.role = 'Owner')",
    "deleteRule": "@request.auth.id != '' && (@request.auth.role = 'Admin' || @request.auth.role = 'Owner')",
    "options": {}
  });

  new Dao(db).saveCollection(studentAssignments);

  // Student Grades Collection
  const studentGrades = new Collection({
    "id": "student_grades",
    "created": "2025-01-07 12:00:05.000Z",
    "updated": "2025-01-07 12:00:05.000Z",
    "name": "student_grades",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "student_field",
        "name": "student",
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
        "id": "course_id_field",
        "name": "course_id",
        "type": "relation",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "student_courses",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "course_name_field",
        "name": "course_name",
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
        "id": "assignment_id_field",
        "name": "assignment_id",
        "type": "relation",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "student_assignments",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
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
            "assignment",
            "quiz",
            "exam",
            "participation",
            "project",
            "final"
          ]
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
        "id": "letter_grade_field",
        "name": "letter_grade",
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
        "id": "weight_field",
        "name": "weight",
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
        "id": "comments_field",
        "name": "comments",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 2000,
          "pattern": ""
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
      "CREATE INDEX `idx_student_grades_student` ON `student_grades` (`student`)",
      "CREATE INDEX `idx_student_grades_course` ON `student_grades` (`course_id`)",
      "CREATE INDEX `idx_student_grades_date` ON `student_grades` (`date`)"
    ],
    "listRule": "@request.auth.id != '' && (student = @request.auth.id || @request.auth.role = 'Teacher' || @request.auth.role = 'Admin' || @request.auth.role = 'Owner' || @request.auth.role = 'Parent')",
    "viewRule": "@request.auth.id != '' && (student = @request.auth.id || @request.auth.role = 'Teacher' || @request.auth.role = 'Admin' || @request.auth.role = 'Owner' || @request.auth.role = 'Parent')",
    "createRule": "@request.auth.id != '' && (@request.auth.role = 'Teacher' || @request.auth.role = 'Admin' || @request.auth.role = 'Owner')",
    "updateRule": "@request.auth.id != '' && (@request.auth.role = 'Teacher' || @request.auth.role = 'Admin' || @request.auth.role = 'Owner')",
    "deleteRule": "@request.auth.id != '' && (@request.auth.role = 'Admin' || @request.auth.role = 'Owner')",
    "options": {}
  });

  return new Dao(db).saveCollection(studentGrades);
}, (db) => {
  const dao = new Dao(db);
  
  try { dao.deleteCollection(dao.findCollectionByNameOrId("student_grades")); } catch (e) {}
  try { dao.deleteCollection(dao.findCollectionByNameOrId("student_assignments")); } catch (e) {}
  try { dao.deleteCollection(dao.findCollectionByNameOrId("student_courses")); } catch (e) {}
});
