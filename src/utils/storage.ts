import { MistakeRecord } from '../types';
import { SAMPLE_MISTAKES } from '../data/samples';

const STORAGE_KEY = 'mistake_printer_records_v1';

export function loadMistakesFromStorage(): MistakeRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Initialize with sample mistakes so first time users immediately have rich content
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_MISTAKES));
      return SAMPLE_MISTAKES;
    }
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : SAMPLE_MISTAKES;
  } catch (err) {
    console.warn('Failed to load from localStorage:', err);
    return SAMPLE_MISTAKES;
  }
}

export function saveMistakesToStorage(mistakes: MistakeRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mistakes));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export function saveSingleMistake(newRecord: MistakeRecord): MistakeRecord[] {
  const current = loadMistakesFromStorage();
  const existingIndex = current.findIndex(m => m.id === newRecord.id);
  let updated: MistakeRecord[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = newRecord;
  } else {
    updated = [newRecord, ...current];
  }
  saveMistakesToStorage(updated);
  return updated;
}

export function deleteMistakeById(id: string): MistakeRecord[] {
  const current = loadMistakesFromStorage();
  const updated = current.filter(m => m.id !== id);
  saveMistakesToStorage(updated);
  return updated;
}
