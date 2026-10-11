export type SaveResponseScope = Readonly<{ saveId: string; generation: number }>;

/** Invalidates every response started for an older save selection, including A → B → A changes. */
export class SaveResponseScopeGate {
  private generation = 0;
  private activeSaveId: string | null = null;

  activate(saveId: string): SaveResponseScope {
    if (!saveId.trim()) throw new Error('SAVE_SCOPE_ID_REQUIRED');
    this.generation += 1;
    this.activeSaveId = saveId;
    return { saveId, generation: this.generation };
  }

  clear(): number {
    this.generation += 1;
    this.activeSaveId = null;
    return this.generation;
  }

  capture(expectedSaveId = this.activeSaveId): SaveResponseScope | null {
    if (!expectedSaveId || expectedSaveId !== this.activeSaveId) return null;
    return { saveId: expectedSaveId, generation: this.generation };
  }

  isCurrent(scope: SaveResponseScope): boolean {
    return scope.generation === this.generation && scope.saveId === this.activeSaveId;
  }

  isPickerCurrent(generation: number): boolean {
    return generation === this.generation && this.activeSaveId === null;
  }
}
