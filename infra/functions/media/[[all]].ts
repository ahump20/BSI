export const onRequest: PagesFunction<{ MEDIA: R2Bucket }> = async (ctx) => {
  const key = ctx.request.url.split('/media/')[1];
  if (!key) {
    return new Response('Not found', { status: 404 });
  }
  const obj = await ctx.env.MEDIA.get(key);
  if (!obj) {
    return new Response('Not found', { status: 404 });
  }
  return new Response(obj.body, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=604800, stale-while-revalidate=86400',
    },
  });
};
