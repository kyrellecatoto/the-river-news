import ArticleClient from './ArticleClient'

export async function generateMetadata({ params }) {

  const resolvedParams = await params
  const slug = resolvedParams.slug

  console.log('Fetching metadata for slug:', slug)

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/news_articles?slug=eq.${encodeURIComponent(slug)}&select=*`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      cache: 'no-store', 
    }
  )

  const data = await response.json()
  const article = data?.[0]

  if (!article) {
    console.error('Metadata Fetch Failed: Article not found for slug', slug)
    return {
      title: 'Article Not Found',
    }
  }


  let imageUrl = article.cover_image_url
  if (imageUrl && !imageUrl.startsWith('http')) {
    if (!imageUrl.startsWith('article-images')) {
       imageUrl = `article-images/${imageUrl}`
    }
    imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${imageUrl}`
  }

  return {
    title: article.title,
    description: article.subtitle || article.content?.substring(0, 160),
    openGraph: {
      title: article.title,
      description: article.subtitle || article.content?.substring(0, 160),
      url: `https://www.the-river-news.live/article/${slug}`,
      siteName: 'The River',
      images: [
        {
          url: imageUrl || 'https://www.the-river-news.live/default-news.jpg',
          width: 1200,
          height: 630,
        },
      ],
      type: 'article',
      publishedTime: article.published_at,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.subtitle,
      images: [imageUrl],
    },
  }
}

export default async function Page({ params }) {
  return <ArticleClient />
}