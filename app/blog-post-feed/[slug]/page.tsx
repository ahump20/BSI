import { blogPostFeedParams } from '@/lib/generate-static-params';
import { BlogPostClient } from './BlogPostClient';

// Static export: only pre-rendered slugs will exist at build time.
// New posts published after a deploy require a rebuild to get a static page.
export const dynamicParams = false;

export async function generateStaticParams() {
  return blogPostFeedParams();
}

export default function BlogPostPage() {
  return <BlogPostClient />;
}
