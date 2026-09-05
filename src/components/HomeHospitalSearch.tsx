"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import type { Department, Region } from "@/types";

export function HomeHospitalSearch({
  regions,
  departments,
}: {
  regions: Region[];
  departments: Department[];
}) {
  const router = useRouter();
  const [sido, setSido] = useState("");
  const [dept, setDept] = useState("");
  const sidoRegions = regions.filter((region) => region.level === "sido");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (sido) params.set("sido", sido);
    if (dept) params.set("dept", dept);
    router.push(`/hospitals${params.size ? `?${params.toString()}` : ""}` as Route);
  }

  return (
    <form
      onSubmit={submit}
      className="mt-8 grid gap-3 rounded-2xl border border-white/15 bg-white p-4 shadow-2xl shadow-black/20 sm:grid-cols-[1fr_1fr_auto] sm:p-5"
      aria-label="병원 검색"
    >
      <label className="text-left">
        <span className="mb-1.5 block text-sm font-semibold text-[var(--color-primary-700)]">지역</span>
        <select
          value={sido}
          onChange={(event) => setSido(event.target.value)}
          className="h-12 w-full rounded-lg border border-[var(--color-surface-border)] bg-white px-4 text-base text-[var(--color-text-primary)]"
        >
          <option value="">전체 지역</option>
          {sidoRegions.map((region) => (
            <option key={region.slug} value={region.slug}>{region.nameKr}</option>
          ))}
        </select>
      </label>
      <label className="text-left">
        <span className="mb-1.5 block text-sm font-semibold text-[var(--color-primary-700)]">진료과</span>
        <select
          value={dept}
          onChange={(event) => setDept(event.target.value)}
          className="h-12 w-full rounded-lg border border-[var(--color-surface-border)] bg-white px-4 text-base text-[var(--color-text-primary)]"
        >
          <option value="">전체 진료과</option>
          {departments.map((department) => (
            <option key={department.slug} value={department.slug}>{department.nameKr}</option>
          ))}
        </select>
      </label>
      <button type="submit" className="btn-accent mt-auto h-12 whitespace-nowrap px-7">
        병원 찾기
      </button>
    </form>
  );
}
