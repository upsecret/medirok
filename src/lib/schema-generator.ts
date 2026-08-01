// JSON-LD Schema.org 자동 생성기 — AEO 핵심
// 매거진/Q&A/의원 페이지에 적절한 schema 자동 주입

import { SITE_URL } from "@/lib/site";

interface BaseArticleProps {
  type: "Article" | "MedicalWebPage";
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  authorName?: string;
  authorTitle?: string;
  imageUrl?: string;
  url: string;
}

export function articleSchema(props: BaseArticleProps) {
  return {
    "@context": "https://schema.org",
    "@type": props.type,
    headline: props.title,
    description: props.description,
    datePublished: props.publishedAt,
    dateModified: props.updatedAt ?? props.publishedAt,
    ...(props.imageUrl && { image: props.imageUrl }),
    ...(props.authorName && {
      author: {
        "@type": "Person",
        name: props.authorName,
        ...(props.authorTitle && { jobTitle: props.authorTitle }),
      },
    }),
    publisher: {
      "@type": "Organization",
      name: "메디록",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": props.url },
  };
}

// ─────────────────────────────────────────────
// 병원 블로그 — 네이버 원문 재구성 (attribution 필수)
// ─────────────────────────────────────────────

interface SourcePostProps {
  title: string;
  url: string;
  postedAt: string;
}

interface BlogPostingProps {
  title: string;
  description: string;
  publishedAt: string;
  url: string;
  /** 원문 저자가 의사면 Person, 아니면 병원명으로 Organization */
  authorName?: string;
  authorTitle?: string;
  authorIsPerson: boolean;
  authorUrl?: string;
  /** 재구성의 근거가 된 네이버 원문 — isBasedOn + citation 양쪽에 사용 */
  sourcePosts: SourcePostProps[];
  sourceBlogUrl: string;
  /** 대표 이미지 절대 URL */
  imageUrl?: string;
}

/**
 * 재구성 글임을 구조화해 선언한다.
 * isBasedOn = 원문 URL(기계 판독용), citation = 원문 메타(제목·게시일 포함).
 * 둘 다 넣는 이유: 크롤러마다 읽는 속성이 달라 한쪽만으로는 출처 연결이 끊긴다.
 */
export function blogPostingSchema(props: BlogPostingProps) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: props.title,
    description: props.description,
    datePublished: props.publishedAt,
    dateModified: props.publishedAt,
    ...(props.imageUrl && { image: props.imageUrl }),
    ...(props.authorName && {
      author: {
        "@type": props.authorIsPerson ? "Person" : "Organization",
        name: props.authorName,
        ...(props.authorIsPerson &&
          props.authorTitle && { jobTitle: props.authorTitle }),
        ...(props.authorUrl && { url: props.authorUrl }),
      },
    }),
    publisher: {
      "@type": "Organization",
      name: "메디록",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
    },
    isBasedOn: props.sourcePosts.map((p) => p.url),
    citation: props.sourcePosts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: p.url,
      datePublished: p.postedAt,
    })),
    sameAs: [props.sourceBlogUrl],
    mainEntityOfPage: { "@type": "WebPage", "@id": props.url },
  };
}

interface BlogProps {
  name: string;
  description: string;
  url: string;
  /** 네이버 원본 블로그 — 이 블로그 섹션의 출처 */
  sourceBlogUrl: string;
  posts: { title: string; url: string; publishedAt: string; description: string }[];
}

export function blogSchema(props: BlogProps) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: props.name,
    description: props.description,
    url: props.url,
    sameAs: [props.sourceBlogUrl],
    blogPost: props.posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: p.url,
      datePublished: p.publishedAt,
      description: p.description,
    })),
  };
}

interface FaqProps {
  question: string;
  answer: string;
}

export function faqPageSchema(faqs: FaqProps[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

interface QnAProps {
  question: string;
  answer: string;
  authorName?: string;
  publishedAt: string;
  upvoteCount?: number;
}

export function qnaPageSchema(props: QnAProps) {
  return {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: props.question,
      datePublished: props.publishedAt,
      ...(props.upvoteCount !== undefined && { upvoteCount: props.upvoteCount }),
      acceptedAnswer: {
        "@type": "Answer",
        text: props.answer,
        datePublished: props.publishedAt,
        ...(props.authorName && {
          author: { "@type": "Person", name: props.authorName },
        }),
      },
    },
  };
}

interface HospitalProps {
  name: string;
  url: string;
  address: string;
  phone?: string;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  medicalSpecialty?: string;
}

export function medicalOrgSchema(props: HospitalProps) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalOrganization",
    name: props.name,
    url: props.url,
    address: {
      "@type": "PostalAddress",
      streetAddress: props.address,
      addressCountry: "KR",
    },
    ...(props.phone && { telephone: props.phone }),
    ...(props.medicalSpecialty && { medicalSpecialty: props.medicalSpecialty }),
    ...(props.imageUrl && { image: props.imageUrl }),
    ...(props.rating &&
      props.reviewCount && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: props.rating,
          reviewCount: props.reviewCount,
          bestRating: 5,
        },
      }),
    ...(props.latitude &&
      props.longitude && {
        geo: {
          "@type": "GeoCoordinates",
          latitude: props.latitude,
          longitude: props.longitude,
        },
      }),
  };
}

interface ItemListProps {
  name: string;
  items: { name: string; url: string; description?: string }[];
}

export function itemListSchema(props: ItemListProps) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: props.name,
    itemListElement: props.items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Thing",
        name: item.name,
        url: item.url,
        ...(item.description && { description: item.description }),
      },
    })),
  };
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
