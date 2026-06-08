// 병원 데이터: JSON 파일 저장 (MVP)
// 매거진은 Payload CMS로 이전됨 → src/lib/magazines-data.ts 참조

import fs from "node:fs/promises";
import path from "node:path";
import { hospitals as seedHospitals } from "@/lib/data";
import type { Hospital } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const HOSPITALS_FILE = path.join(DATA_DIR, "hospitals.json");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const buf = await fs.readFile(file, "utf-8");
    return JSON.parse(buf) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(file: string, data: T) {
  await ensureDir();
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}

// ─────────────────────────────────────────────
// Hospitals
// ─────────────────────────────────────────────

export async function loadHospitals(): Promise<Hospital[]> {
  return readJson<Hospital[]>(HOSPITALS_FILE, seedHospitals);
}

export async function saveHospitals(list: Hospital[]) {
  await writeJson(HOSPITALS_FILE, list);
}

export async function upsertHospital(h: Hospital): Promise<Hospital> {
  const list = await loadHospitals();
  const idx = list.findIndex((x) => x.slug === h.slug);
  if (idx >= 0) list[idx] = h;
  else list.push(h);
  await saveHospitals(list);
  return h;
}

export async function deleteHospital(slug: string): Promise<boolean> {
  const list = await loadHospitals();
  const idx = list.findIndex((x) => x.slug === slug);
  if (idx < 0) return false;
  list.splice(idx, 1);
  await saveHospitals(list);
  return true;
}
