import { notFound } from "next/navigation";
import Link from "next/link";
import { loadMagazines, loadHospitals } from "@/lib/storage";
import { getDoctorBySlug } from "@/lib/data";
import { ShortAnswerBlock } from "@/components/ShortAnswerBlock";
import { FaqBlock } from "@/components/FaqBlock";
import { PriceTable } from "@/components/PriceTable";
import { HospitalCard } from "@/components/HospitalCard";
import { MagazineCard } from "@/components/MagazineCard";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";
import { AuthorProfile } from "@/components/AuthorProfile";
import { JsonLd } from "@/components/JsonLd";
import {
  articleSchema,
  faqPageSchema,
  qnaPageSchema,
  breadcrumbSchema,
} from "@/lib/schema-generator";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const list = await loadMagazines();
  return list.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const list = await loadMagazines();
  const m = list.find((x) => x.slug === slug);
  if (!m) return {};
  return {
    title: m.seoTitle,
    description: m.metaDescription,
    openGraph: { title: m.seoTitle, description: m.metaDescription, type: "article" },
  };
}

export default async function MagazineDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [magazines, hospitals] = await Promise.all([loadMagazines(), loadHospitals()]);
  const magazine = magazines.find((m) => m.slug === slug);
  if (!magazine) notFound();

  const linkedHospitals = magazine.linkedHospitalSlugs
    ? hospitals.filter((h) => magazine.linkedHospitalSlugs!.includes(h.slug))
    : [];

  const authorDoctor = magazine.authorDoctorSlug
    ? getDoctorBySlug(magazine.authorDoctorSlug)
    : undefined;

  const relatedMagazines = magazines
    .filter(
      (m) =>
        m.slug !== magazine.slug &&
        (m.linkedDepartmentSlug === magazine.linkedDepartmentSlug ||
          m.linkedTreatmentSlug === magazine.linkedTreatmentSlug)
    )
    .slice(0, 3);

  const url = `https://medirok.com/magazine/${magazine.slug}`;

  // Schema 자동 생성
  const schemas: Record<string, unknown>[] = [
    breadcrumbSchema([
      { name: "홈", url: "https://medirok.com" },
      { name: "매거진", url: "https://medirok.com/magazine" },
      { name: magazine.seoTitle, url },
    ]),
  ];

  if (magazine.type === "qna") {
    schemas.push(
      qnaPageSchema({
        question: magazine.seoTitle,
        answer: magazine.shortAnswer,
        authorName: magazine.authorName,
        publishedAt: magazine.publishedAt,
      })
    );
  } else {
    schemas.push(
      articleSchema({
        type: "Article",
        title: magazine.seoTitle,
        description: magazine.metaDescription,
        publishedAt: magazine.publishedAt,
        authorName: magazine.authorName,
        authorTitle: magazine.authorTitle,
        url,
      })
    );
  }

  if (magazine.faqBlocks && magazine.faqBlocks.length > 0) {
    schemas.push(faqPageSchema(magazine.faqBlocks));
  }

  return (
    <>
      <JsonLd data={schemas} />

      <nav className="bg-white border-b border-[var(--color-surface-border)] py-2">
        <div className="container-content text-xs text-[var(--color-text-muted)]">
          <Link href="/">홈</Link> › <Link href="/magazine">매거진</Link> ›{" "}
          {magazine.category}
        </div>
      </nav>

      <article className="bg-white">
        <header className="container-content pt-7 pb-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[var(--color-accent-100)] text-[var(--color-accent-600)]">
              {magazine.category}
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">
              {magazine.publishedAt}
            </span>
          </div>
          <h1 className="editorial">{magazine.seoTitle}</h1>
          {magazine.authorName && (
            <p className="text-sm text-[var(--color-text-muted)] mt-3">
              <span className="hanja text-[var(--color-accent-600)]">醫錄</span>{" "}
              {authorDoctor ? (
                <>
                  <span className="text-[var(--color-text-primary)] font-medium">
                    {authorDoctor.nameKr}
                  </span>
                  {" · "}
                  {authorDoctor.title}
                </>
              ) : (
                <>
                  {magazine.authorName}
                  {magazine.authorTitle && ` · ${magazine.authorTitle}`}
                </>
              )}
            </p>
          )}
        </header>

        <div className="container-content">
          <ShortAnswerBlock
            answer={magazine.shortAnswer}
            authorName={magazine.authorName}
            authorTitle={magazine.authorTitle}
          />

          <div className="prose-medirok max-w-none text-[var(--color-text-primary)]">
            {magazine.body.split("\n").map((line, i) => {
              if (line.startsWith("## ")) {
                return (
                  <h2 key={i} className="text-xl font-medium mt-7 mb-3">
                    {line.replace("## ", "")}
                  </h2>
                );
              }
              if (line.startsWith("**Q. ")) {
                return (
                  <p key={i} className="font-medium text-base mt-5 mb-2">
                    {line.replace(/\*\*/g, "")}
                  </p>
                );
              }
              if (line.startsWith("- ")) {
                return (
                  <li key={i} className="ml-5 text-sm leading-relaxed">
                    {line.replace("- ", "")}
                  </li>
                );
              }
              if (line.startsWith("| ")) {
                return (
                  <p key={i} className="text-xs font-mono text-[var(--color-text-secondary)] my-1">
                    {line}
                  </p>
                );
              }
              if (line.trim() === "") return null;
              return (
                <p key={i} className="text-base leading-relaxed my-3">
                  {line}
                </p>
              );
            })}
          </div>

          {magazine.priceTable && magazine.priceTable.length > 0 && (
            <PriceTable rows={magazine.priceTable} />
          )}

          {magazine.faqBlocks && magazine.faqBlocks.length > 0 && (
            <FaqBlock faqs={magazine.faqBlocks} />
          )}

          <AuthorProfile
            authorDoctor={authorDoctor}
            authorName={magazine.authorName}
            authorTitle={magazine.authorTitle}
            currentMagazineSlug={magazine.slug}
          />

          {linkedHospitals.length > 0 && (
            <section className="my-8 pt-6 border-t border-[var(--color-surface-border)]">
              <h2 className="text-lg font-medium mb-3">
                관련 <span className="hanja text-[var(--color-accent-600)]">醫錄</span> 의원
              </h2>
              <div className="space-y-2">
                {linkedHospitals.map((h) => (
                  <HospitalCard key={h.slug} hospital={h} />
                ))}
              </div>
            </section>
          )}

          <MedicalDisclaimer type={magazine.disclaimerType} />
        </div>
      </article>

      {relatedMagazines.length > 0 && (
        <section className="bg-[var(--color-surface-bg)] py-7 border-t border-[var(--color-surface-border)]">
          <div className="container-content">
            <h2 className="text-lg font-medium mb-3">관련 매거진</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {relatedMagazines.map((m) => (
                <MagazineCard key={m.slug} magazine={m} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
