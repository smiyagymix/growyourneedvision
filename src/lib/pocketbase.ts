import PocketBase from 'pocketbase';

// Initialize the PocketBase client
// Default to local instance, but allow override via env var
const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090');

// Auto-cancellation is enabled by default, but for a dashboard with many parallel requests
// we might want to disable it globally or handle it per-request.
pb.autoCancellation(false); 

export default pb;
