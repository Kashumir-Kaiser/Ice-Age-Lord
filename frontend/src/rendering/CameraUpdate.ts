import type { MapSnapshot } from './MapSceneAdapter.ts';

/** Camera events replace only the camera; terrain and building inputs keep their identities. */
export function cameraOnlySnapshot(snapshot:MapSnapshot,camera:MapSnapshot['camera']):MapSnapshot {
  return {...snapshot,camera};
}

/** A changed React source must be applied before a camera event can draw it. */
export function cameraSourceChanged(previous:MapSnapshot,next:MapSnapshot):boolean {
  return previous!==next;
}

/** Preserve structural terrain comparison for full snapshot updates, including recreated arrays. */
export function terrainInputsChanged(previous:MapSnapshot,next:MapSnapshot):boolean {
  return next.identity!==previous.identity||
    JSON.stringify([next.visualIdentity,next.modeledInfill,next.compact,next.geography,next.regions])!==
    JSON.stringify([previous.visualIdentity,previous.modeledInfill,previous.compact,previous.geography,previous.regions]);
}
