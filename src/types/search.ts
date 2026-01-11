/**
 * Search Types
 * Proper types for search functionality
 */

import { RecordModel } from 'pocketbase';

export interface SearchRecord extends RecordModel {
    [key: string]: any;
}
