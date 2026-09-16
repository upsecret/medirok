// 병원 블로그 런타임 데이터 액세스 — Payload(blog-posts 컬렉션) 백엔드
// magazines-data.ts와 동일 패턴: React cache로 요청 단위 중복 쿼리 제거 + in-memory 필터.
// 글 편수가 병원당 수 편 규모라 전량 조회 후 메모리 필터가 쿼리보다 저렴하다.
//
// URL 1단계는 "소유자"다 — 보통은 글이 귀속된 병원이지만, 네트워크 병원은 지점들을 묶은
// 블로그 그룹이다(src/lib/blog-groups.ts). 글의 hospitalSlug는 늘 실제 지점이다.

import { cache } from "react";
import { getPayloadClient } from "@/lib/payload";
import { mapBlogPost, type Raw } from "@/lib/payload-mappers";
import { getRefSlugMaps, getHospitalsBySlugs } from "@/lib/hospitals-data";
import { blogGroupBySlug, blogOwnerSlug } from "@/lib/blog-groups";
import type { BlogPost, Hospital, Thumbnail } from "@/types";

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

/** 소유자(병원 또는 블로그 그룹) slug로 글 목록 */
export async function getBlogPostsByOwner(ownerSlug: string): Promise<BlogPost[]> {
  const all = await findAll();
  return all.filter((p) => p.hospitalSlug && blogOwnerSlug(p.hospitalSlug) === ownerSlug);
}

/**
 * 상세 조회 — (소유자, slug) 쌍을 함께 검증한다.
 * slug만 맞고 소유자가 다른 URL이 200으로 뜨면 같은 문서가 여러 URL로 색인된다.
 */
export async function getBlogPost(
  ownerSlug: string,
  slug: string
): Promise<BlogPost | undefined> {
  const all = await findAll();
  return all.find(
    (p) => p.slug === slug && p.hospitalSlug && blogOwnerSlug(p.hospitalSlug) === ownerSlug
  );
}

/** 병원 소식의 소유자 — 목록 카드와 소유자 페이지가 쓰는 값 */
export interface BlogOwner {
  slug: string;
  nameKr: string;
  shortDescription?: string;
  logo?: Thumbnail;
  coverImage?: Thumbnail;
  /** 그룹이면 true — 병원 상세 링크를 지점 목록으로 보여 준다 */
  isGroup: boolean;
  /** 연결된 실제 병원. 일반 병원은 자기 자신 1곳, 그룹은 지점 전부(그룹 정의 순서) */
  hospitals: Hospital[];
}

/** 소유자 slug → 소유자. 병원도 그룹도 아니면 undefined */
export async function getBlogOwner(ownerSlug: string): Promise<BlogOwner | undefined> {
  const group = blogGroupBySlug(ownerSlug);
  if (group) {
    const hospitals = await getHospitalsBySlugs(group.hospitalSlugs);
    const bySlug = new Map(hospitals.map((h) => [h.slug, h]));
    const ordered = group.hospitalSlugs.flatMap((s) => bySlug.get(s) ?? []);
    if (ordered.length === 0) return undefined;
    const rep = bySlug.get(group.representativeSlug) ?? ordered[0];
    return {
      slug: group.slug,
      nameKr: group.nameKr,
      shortDescription: group.shortDescription,
      logo: rep.logo,
      coverImage: rep.coverImage,
      isGroup: true,
      hospitals: ordered,
    };
  }
  const [hospital] = await getHospitalsBySlugs([ownerSlug]);
  if (!hospital) return undefined;
  return {
    slug: hospital.slug,
    nameKr: hospital.nameKr,
    shortDescription: hospital.shortDescription,
    logo: hospital.logo,
    coverImage: hospital.coverImage,
    isGroup: false,
    hospitals: [hospital],
  };
}

export interface BlogOwnerGroup {
  owner: BlogOwner;
  posts: BlogPost[];
  sourceBlogName: string;
  sourceBlogUrl: string;
}

/**
 * 블로그 집계 페이지용 — 소유자 단위 묶음.
 * sourceBlogName/Url은 글마다 들고 있으므로 묶음의 최신 글 값을 대표로 쓴다
 * (같은 소유자의 글은 동일 값이어야 하며 시드에서 보장한다).
 */
export async function getBlogOwners(): Promise<BlogOwnerGroup[]> {
  const all = await findAll();
  const order: string[] = [];
  const byOwner = new Map<string, BlogPost[]>();
  for (const post of all) {
    if (!post.hospitalSlug) continue;
    const owner = blogOwnerSlug(post.hospitalSlug);
    const existing = byOwner.get(owner);
    if (existing) {
      existing.push(post);
    } else {
      byOwner.set(owner, [post]);
      order.push(owner);
    }
  }

  const owners = await Promise.all(order.map((slug) => getBlogOwner(slug)));
  return order.flatMap((slug, i) => {
    const owner = owners[i];
    const posts = byOwner.get(slug);
    if (!owner || !posts || posts.length === 0) return [];
    return [
      {
        owner,
        posts,
        sourceBlogName: posts[0].sourceBlogName,
        sourceBlogUrl: posts[0].sourceBlogUrl,
      },
    ];
  });
}
