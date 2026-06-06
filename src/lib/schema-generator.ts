// JSON-LD Schema.org 자동 생성기 — AEO 핵심
// 매거진/Q&A/의원 페이지에 적절한 schema 자동 주입

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
      logo: { "@type": "ImageObject", url: "https://medirok.com/logo.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": props.url },
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
