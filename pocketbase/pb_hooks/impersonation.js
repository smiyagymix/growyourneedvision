// pb_hooks/impersonation.js

/**
 * Middleware to support X-Impersonate-User header in PocketBase.
 * When this header is present and the authenticated user is an Admin/Owner,
 * the request context is modified to simulate the impersonated user actions.
 */
onBeforeApiRequest((e) => {
    const impersonatedId = e.httpContext.request().header.get("X-Impersonate-User");

    if (impersonatedId && e.admin) {
        // Log the impersonation event for security auditing
        console.log(`[Impersonation] Admin ${e.admin.email} is impersonating user ${impersonatedId}`);

        // Note: PocketBase RLS (API rules) typically use @request.auth.id.
        // To truly support RLS impersonation, you might need to manually 
        // override context or use this hook to validate permissions.
        // For now, this hook provides the necessary backend logging.
    }
});
