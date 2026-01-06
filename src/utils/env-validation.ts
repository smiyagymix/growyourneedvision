/**
 * Environment Variable Validation Utility
 * Ensures all required environment variables are present at startup.
 */

export const requiredEnvVars = [
    'VITE_POCKETBASE_URL',
    'VITE_APP_URL',
    // Add other critical variables here
];

export function validateEnv() {
    const missingVars: string[] = [];

    requiredEnvVars.forEach(key => {
        if (!import.meta.env[key]) {
            missingVars.push(key);
        }
    });

    if (missingVars.length > 0) {
        const errorMessage = `
      🚨 CRITICAL ERROR: Missing Environment Variables 🚨
      
      The following required environment variables are missing:
      ${missingVars.map(v => `- ${v}`).join('\n')}
      
      Please check your .env file or deployment configuration.
      Application cannot start without these variables.
    `;

        console.error(errorMessage);

        // In production, we might want to stop execution or show a fatal error UI
        if (import.meta.env.PROD) {
            document.body.innerHTML = `
        <div style="
          height: 100vh; 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: center; 
          font-family: system-ui, sans-serif; 
          background-color: #fef2f2; 
          color: #991b1b;
          text-align: center;
          padding: 20px;
        ">
          <h1 style="font-size: 2rem; margin-bottom: 1rem;">Configuration Error</h1>
          <p style="max-width: 600px; line-height: 1.5;">
            The application is missing critical configuration. 
            Please contact the administrator.
          </p>
          <pre style="
            background: #fff; 
            padding: 1rem; 
            border-radius: 0.5rem; 
            margin-top: 2rem; 
            border: 1px solid #fca5a5;
            text-align: left;
          ">Missing: ${missingVars.join(', ')}</pre>
        </div>
      `;
            throw new Error(errorMessage);
        }
    }
    
    console.log('✅ Environment variables validated');
}
