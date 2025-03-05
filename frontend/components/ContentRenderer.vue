<template>
  <div>
    <div
      v-if="value && value.body"
      v-html="renderedContent"
      class="markdown-content"
    ></div>
    <div v-else class="text-gray-500 italic">No content available</div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { marked } from "marked";

const props = defineProps({
  value: {
    type: Object,
    default: () => null,
  },
});

// Determine if content is HTML or markdown and render accordingly
const renderedContent = computed(() => {
  if (!props.value || !props.value.body) return "";

  try {
    const content = props.value.body;

    // Check if content is already HTML (contains HTML tags)
    const containsHtml = /<\/?[a-z][\s\S]*>/i.test(content);

    if (containsHtml) {
      // Content is already HTML, return as is
      return content;
    } else {
      // Content is markdown, convert to HTML
      return marked(content);
    }
  } catch (e) {
    console.error("Error rendering content:", e);
    return `<p class="text-red-500">Error rendering content: ${e.message}</p>`;
  }
});
</script>

<style>
.markdown-content {
  line-height: 1.6;
}

.markdown-content h1 {
  font-size: 1.8rem;
  font-weight: bold;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
}

.markdown-content h2 {
  font-size: 1.5rem;
  font-weight: bold;
  margin-top: 1.2rem;
  margin-bottom: 0.8rem;
}

.markdown-content h3 {
  font-size: 1.2rem;
  font-weight: bold;
  margin-top: 1rem;
  margin-bottom: 0.6rem;
}

.markdown-content p {
  margin-bottom: 1rem;
}

.markdown-content ul,
.markdown-content ol {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.markdown-content ul {
  list-style-type: disc;
}

.markdown-content ol {
  list-style-type: decimal;
}

.markdown-content li {
  margin-bottom: 0.5rem;
}

.markdown-content a {
  color: #3b82f6;
  text-decoration: underline;
}

.markdown-content blockquote {
  border-left: 4px solid #e5e7eb;
  padding-left: 1rem;
  margin-left: 0;
  margin-right: 0;
  font-style: italic;
  color: #4b5563;
}

.markdown-content pre {
  background-color: #f3f4f6;
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  margin-bottom: 1rem;
}

.markdown-content code {
  font-family: monospace;
  background-color: #f3f4f6;
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
}

.markdown-content img {
  max-width: 100%;
  height: auto;
  border-radius: 0.375rem;
  margin: 1rem 0;
}
</style>
