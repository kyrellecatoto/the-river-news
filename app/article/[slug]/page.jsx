import ArticleClient from '../[slug]/ArticleClient'

export async function generateMetadata({ params }) {
  const slug = params.slug

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/news_articles?slug=eq.${slug}&select=*`,
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
    return {
      title: 'Article Not Found',
    }
  }

  let imageUrl = article.cover_image_url
  if (imageUrl && !imageUrl.startsWith('http')) {
    const bucketName = 'article-images'
    if (!imageUrl.startsWith(bucketName)) {
        imageUrl = `${bucketName}/${imageUrl}`
  }
    imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${imageUrl}`
  }

  return {
    title: article.title,
    description: article.subtitle || article.content?.substring(0, 160),
    openGraph: {
      title: article.title,
      description: article.subtitle || article.content?.substring(0, 160),
      url: `https://the-river-news.live/article/${slug}`, // Replace with your actual domain
      siteName: 'The River',
      images: [
        {
          url: imageUrl || 'https://the-river-news.live/default-news.jpg', // Fallback image
          width: 1200,
          height: 630,
        },
      ],
      type: 'article',
      publishedTime: article.published_at,
      authors: [article.author_name],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.subtitle,
      images: [imageUrl],
    },
  }
}

export default function Page() {
  return <ArticleClient />
}