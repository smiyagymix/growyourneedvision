
import PocketBase, { RecordModel } from 'pocketbase';

/**
 * Creates a strongly typed collection reference
 * @param pb PocketBase instance
 * @param collectionName Name of the collection
 */
export function createTypedCollection<T extends RecordModel>(pb: PocketBase, collectionName: string) {
    return pb.collection(collectionName);
}
