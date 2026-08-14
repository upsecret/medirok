// 병원 블로그 런타임 데이터 액세스 — Payload(blog-posts 컬렉션) 백엔드
// magazines-data.ts와 동일 패턴: React cache로 요청 단위 중복 쿼리 제거 + in-memory 필터.
// 글 편수가 병원당 수 편 규모라 전량 조회 후 메모리 필터가 쿼리보다 저렴하다.

import { cache } from "react";
import { getPayloadClient } from "@/lib/payload";
import { mapBlogPost, type Raw } from "@/lib/payload-mappers";
import { getRefSlugMaps, getHospitalsBySlugs } from "@/lib/hospitals-data";
import type { BlogPost, Hospital } from "@/types";

const findAll = cache(async (): Promise<BlogPost[]> => {
  const payload = await getPayloadClient();
  const [res, refs] = await Promise.all([
    payload.find({
      collection: "blog-posts",
      limit: 500,
      sort: "-publishedAt",
      depth: 0,
      pagination: false,
    }),
    getRefSlugMaps(),
  ]);
  return (res.docs as unknown as Raw[]).map((d) => mapBlogPost(d, refs));
});

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  return findAll();
}

export async function getBlogPostsByHospital(
  hospitalSlug: string
): Promise<BlogPost[]> {
  const all = await findAll();
  return all.filter((p) => p.hospitalSlug === hospitalSlug);
}

/**
 * 상세 조회 — (병원, slug) 쌍을 함께 검증한다.
 * slug만 맞고 병원이 다른 URL이 200으로 뜨면 같은 문서가 여러 URL로 색인된다.
 */
export async function getBlogPost(
  hospitalSlug: string,
  slug: string
): Promise<BlogPost | undefined> {
  const all = await findAll();
  return all.find((p) => p.slug === slug && p.hospitalSlug === hospitalSlug);
}

export interface BlogHospitalGroup {
  hospital: Hospital;
  posts: BlogPost[];
  sourceBlogName: string;
  sourceBlogUrl: string;
}

/**
 * 블로그 집계 페이지용 — 병원 단위 그룹.
 * sourceBlogName/Url은 글마다 들고 있으므로 그룹의 최신 글 값을 대표로 쓴다
 * (같은 병원의 글은 동일 값이어야 하며 시드에서 보장한다).
 */
export async function getBlogHospitals(): Promise<BlogHospitalGroup[]> {
  const all = await findAll();
  const order: string[] = [];
  const bySlug = new Map<string, BlogPost[]>();
  for (const post of all) {
    if (!post.hospitalSlug) continue;
    const existing = bySlug.get(post.hospitalSlug);
    if (existing) {
      existing.push(post);
    } else {
      bySlug.set(post.hospitalSlug, [post]);
      order.push(post.hospitalSlug);
    }
  }

  const hospitals = await getHospitalsBySlugs(order);
  const hospitalBySlug = new Map(hospitals.map((h) => [h.slug, h]));

  return order.flatMap((slug) => {
    const hospital = hospitalBySlug.get(slug);
    const posts = bySlug.get(slug);
    if (!hospital || !posts || posts.length === 0) return [];
    return [
      {
        hospital,
        posts,
        sourceBlogName: posts[0].sourceBlogName,
        sourceBlogUrl: posts[0].sourceBlogUrl,
      },
    ];
  });
}
