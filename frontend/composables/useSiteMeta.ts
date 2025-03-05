/**
 * Composable for handling site meta tags
 */
export function useSiteMeta() {
  // Default meta values
  const defaultMeta = {
    title: "House Searcher",
    description: "Find and track your perfect property listings in one place",
    url: "https://house-searcher.codefolde.com", // Replace with your actual domain
  };

  // Valid OG types
  type OgType =
    | "website"
    | "article"
    | "book"
    | "profile"
    | "music.song"
    | "music.album"
    | "music.playlist"
    | "music.radio_status"
    | "video.movie"
    | "video.episode"
    | "video.tv_show"
    | "video.other";

  /**
   * Set page meta tags with customizable values
   */
  const setPageMeta = (meta: {
    title?: string;
    description?: string;
    url?: string;
    type?: OgType;
  } = {}) => {
    // Merge with defaults
    const metaData = {
      ...defaultMeta,
      ...meta,
      // Ensure title has site name
      title: meta.title
        ? `${meta.title} | ${defaultMeta.title}`
        : defaultMeta.title,
    };

    // Use Nuxt's useHead and useSeoMeta for comprehensive meta tag coverage
    useHead({
      title: metaData.title,
      link: [
        {
          rel: "canonical",
          href: metaData.url,
        },
      ],
    });

    useSeoMeta({
      title: metaData.title,
      ogTitle: metaData.title,
      description: metaData.description,
      ogDescription: metaData.description,
      ogUrl: metaData.url,
      ogType: meta.type || "website",
      twitterCard: "summary",
    });
  };

  return {
    setPageMeta,
  };
}
