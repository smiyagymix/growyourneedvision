module.exports = {
    ci: {
      collect: {
        // Start the Vite dev server
        startServerCommand: 'npm run dev:client',
        // Wait for the server to be ready (Vite usually starts fast, but good to be safe)
        startServerReadyPattern: 'Local:',
        url: ['http://localhost:5173'],
        // Run multiple times to get an average
        numberOfRuns: 3,
        settings: {
            // Only run specific categories if needed, or all by default
            onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
            preset: 'desktop',
        }
      },
      upload: {
        // Upload reports to a temporary public storage for viewing
        target: 'temporary-public-storage',
      },
      assert: {
        // Assertions to fail the build if scores are too low
        preset: 'lighthouse:recommended',
        assertions: {
            'categories:performance': ['warn', {minScore: 0.9}],
            'categories:accessibility': ['error', {minScore: 0.9}],
            'categories:best-practices': ['warn', {minScore: 0.9}],
            'categories:seo': ['warn', {minScore: 0.9}],
        }
      },
    },
  };
