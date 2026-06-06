// MVP: JSON 파일 저장
// 추후 Payload DB로 마이그레이션 가능한 동일 인터페이스
//
// 파일 위치: data/hospitals.json, data/magazines.json
// 시드 데이터 (lib/data.ts, lib/magazines.ts) → 파일 없을 때 fallback

import fs from "node:fs/promises";
import path from "node:path";
import { hospitals as seedHospitals } from "@/lib/data";
import { magazines as seedMagazines } from "@/lib/magazines";
import type { Hospital } from "@/types";
import type { Magazine } from "@/lib/magazines";

const DATA_DIR = path.join(process.cwd(), "data");
const HOSPITALS_FILE = path.join(DATA_DIR, "hospitals.json");
const MAGAZINES_FILE = path.join(DATA_DIR, "magazines.json");

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

// ─────────────────────────────────────────────
// Magazines
// ─────────────────────────────────────────────

export async function loadMagazines(): Promise<Magazine[]> {
  return readJson<Magazine[]>(MAGAZINES_FILE, seedMagazines);
}

export async function saveMagazines(list: Magazine[]) {
  await writeJson(MAGAZINES_FILE, list);
}

export async function upsertMagazine(m: Magazine): Promise<Magazine> {
  const list = await loadMagazines();
  const idx = list.findIndex((x) => x.slug === m.slug);
  if (idx >= 0) list[idx] = m;
  else list.unshift(m); // 최신이 앞으로
  await saveMagazines(list);
  return m;
}

export async function deleteMagazine(slug: string): Promise<boolean> {
  const list = await loadMagazines();
  const idx = list.findIndex((x) => x.slug === slug);
  if (idx < 0) return false;
  list.splice(idx, 1);
  await saveMagazines(list);
  return true;
}
