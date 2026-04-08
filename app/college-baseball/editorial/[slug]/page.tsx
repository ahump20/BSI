import fs from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';
import { editorialMetadata, editorialJsonLdProps } from '@/lib/editorial-seo';
import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd';

// ── Data loading (build-time only) ──────────────────────────────────

const CONTENT_DIR = path.join(process.cwd(), 'content', 'team-previews-2026');

interface PreviewJson {
  seo: {
    title: string;
    description: string;
    datePublished: string;
    slug: string;
    image?: string;
    sport?: string;
    ogTitle?: string;
    ogDescription?: string;
  };
  data: TeamPreviewData;
}

function loadPreview(slug: string): PreviewJson {
  const filePath = path.join(CONTENT_DIR, `${slug}.json`);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as PreviewJson;
}

function getAllSlugs(): string[] {
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''));
}

// ── Static params (required for output: 'export') ───────────────────

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

// ── Metadata ─────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { seo } = loadPreview(slug);
  return editorialMetadata(seo);
}

// ── Page ─────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function TeamPreviewPage({ params }: PageProps) {
  const { slug } = await params;
  const { seo, data } = loadPreview(slug);

  return (
    <>
      <ArticleJsonLd {...editorialJsonLdProps(seo)} />
      <SECTeamPreviewTemplate data={data} />
    </>
  );
}
