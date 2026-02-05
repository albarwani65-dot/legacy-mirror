import { db } from "./firebase";
import { collection, onSnapshot, doc, setDoc, query, orderBy } from "firebase/firestore";
import { Asset } from "./types";

/**
 * Subscribes to the assets collection for a specific user.
 * Returns an unsubscribe function.
 */
export function subscribeToAssets(userId: string, callback: (assets: Asset[]) => void) {
    const assetsRef = collection(db, "users", userId, "assets");
    // Order by lastUpdated descending to see newest first, or by name? 
    // Let's settle on created/inserted order or just let the grid sort it.
    // existing mock data had timestamps.
    const q = query(assetsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const assets: Asset[] = [];
        snapshot.forEach((doc) => {
            assets.push(doc.data() as Asset);
        });
        callback(assets);
    });

    return unsubscribe;
}

/**
 * Adds or Updates an asset in Firestore.
 */
export async function addAssetToFirestore(userId: string, asset: Asset) {
    const assetRef = doc(db, "users", userId, "assets", asset.id);
    // Firestore doesn't accept 'undefined', so we must convert to null or remove keys.
    // JSON.stringify/parse is a quick way to strip undefined, 
    // but better to explicitly ignore undefined or use a spread with check.
    const cleanAsset = JSON.parse(JSON.stringify(asset));
    await setDoc(assetRef, cleanAsset);
}
