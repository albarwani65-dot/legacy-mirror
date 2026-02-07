import { db } from "./firebase";
import { collection, onSnapshot, doc, setDoc, query, orderBy, getDocs, addDoc, deleteDoc } from "firebase/firestore";
import { Asset, HistoryRecord } from "./types";

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

/**
 * Deletes an asset from Firestore.
 */
export async function deleteAssetFromFirestore(userId: string, assetId: string) {
    const assetRef = doc(db, "users", userId, "assets", assetId);
    await deleteDoc(assetRef);
}

/**
 * Calculates current totals and saves a snapshot to history.
 */
export async function saveSnapshot(userId: string) {
    // 1. Fetch all current assets
    const assetsRef = collection(db, "users", userId, "assets");
    const snapshot = await getDocs(assetsRef);
    const assets: Asset[] = [];
    snapshot.forEach((doc) => assets.push(doc.data() as Asset));

    // 2. Calculate Totals
    let totalAssets = 0;
    let totalLiabilities = 0;

    assets.forEach(asset => {
        if (asset.category === 'LIABILITY') {
            totalLiabilities += asset.value;
        } else {
            totalAssets += asset.value;
        }
    });

    const netWorth = totalAssets - totalLiabilities;

    // 3. Save to History
    const historyRef = collection(db, "users", userId, "history");
    const newRecord: Omit<HistoryRecord, 'id'> = {
        timestamp: Date.now(),
        totalAssets,
        totalLiabilities,
        netWorth
    };

    await addDoc(historyRef, newRecord);
}

/**
 * Subscribes to history collection.
 */
export function subscribeToHistory(userId: string, callback: (history: HistoryRecord[]) => void) {
    const historyRef = collection(db, "users", userId, "history");
    const q = query(historyRef, orderBy("timestamp", "asc"));

    return onSnapshot(q, (snapshot) => {
        const history: HistoryRecord[] = [];
        snapshot.forEach((doc) => {
            history.push({ id: doc.id, ...doc.data() } as HistoryRecord);
        });
        callback(history);
    });
}
