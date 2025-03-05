<template>
  <div class="rich-text-editor" :class="{ 'is-focused': isFocused }">
    <div class="editor-menu" v-if="editor">
      <div class="heading-buttons">
        <button
          v-for="item in headingItems"
          :key="item.title"
          @click="item.action"
          :class="{ 'is-active': item.isActive() }"
          :title="item.title"
        >
          {{ item.text }}
        </button>
      </div>

      <div class="format-buttons">
        <button
          v-for="item in menuItems"
          :key="item.title"
          @click="item.action"
          :class="{ 'is-active': item.isActive() }"
          :title="item.title"
        >
          <UIcon :name="item.icon" class="w-5 h-5" />
        </button>
      </div>
    </div>

    <EditorContent :editor="editor" class="editor-content" />
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { Markdown } from "tiptap-markdown";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "Add your notes here...",
  },
});

const emit = defineEmits(["update:modelValue"]);
const isFocused = ref(false);

// Initialize the editor
const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Typography,
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
    Markdown.configure({
      html: true,
      tightLists: true,
      tightListClass: "tight",
      bulletListMarker: "-",
      linkify: true,
    }),
  ],
  editorProps: {
    attributes: {
      class:
        "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none",
    },
  },
  onUpdate: ({ editor }) => {
    // Emit markdown content instead of HTML
    if (editor && editor.storage.markdown) {
      emit("update:modelValue", editor.storage.markdown.getMarkdown());
    } else {
      emit("update:modelValue", editor.getHTML());
    }
  },
  onFocus: () => {
    isFocused.value = true;
  },
  onBlur: () => {
    isFocused.value = false;
  },
});

// Watch for external changes to modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    // Only update if editor exists and the content is different
    if (editor.value) {
      const currentContent = editor.value.storage.markdown
        ? editor.value.storage.markdown.getMarkdown()
        : editor.value.getHTML();

      if (newValue !== currentContent) {
        editor.value.commands.setContent(newValue, false);
      }
    }
  },
  { deep: true }
);

// Clean up on component unmount
onBeforeUnmount(() => {
  editor.value?.destroy();
});

// Check if a format is active
const isActive = (action: string) => {
  if (!editor.value) return false;
  return editor.value.isActive(action);
};

// Menu items with proper typing
interface MenuItem {
  icon: string;
  title: string;
  action: () => void;
  isActive: () => boolean;
}

// Heading menu items with proper typing
interface HeadingItem {
  text: string;
  title: string;
  action: () => void;
  isActive: () => boolean;
}

// Editor menu items
const menuItems = ref<MenuItem[]>([
  {
    icon: "i-heroicons-bold",
    title: "Bold",
    action: () => editor.value?.chain().focus().toggleBold().run(),
    isActive: () => editor.value?.isActive("bold") || false,
  },
  {
    icon: "i-heroicons-italic",
    title: "Italic",
    action: () => editor.value?.chain().focus().toggleItalic().run(),
    isActive: () => editor.value?.isActive("italic") || false,
  },
  {
    icon: "i-heroicons-list-bullet",
    title: "Bullet List",
    action: () => editor.value?.chain().focus().toggleBulletList().run(),
    isActive: () => editor.value?.isActive("bulletList") || false,
  },
  {
    icon: "i-heroicons-list-ordered",
    title: "Ordered List",
    action: () => editor.value?.chain().focus().toggleOrderedList().run(),
    isActive: () => editor.value?.isActive("orderedList") || false,
  },
  {
    icon: "i-heroicons-chat-bubble-left-right",
    title: "Blockquote",
    action: () => editor.value?.chain().focus().toggleBlockquote().run(),
    isActive: () => editor.value?.isActive("blockquote") || false,
  },
  {
    icon: "i-heroicons-code-bracket",
    title: "Code Block",
    action: () => editor.value?.chain().focus().toggleCodeBlock().run(),
    isActive: () => editor.value?.isActive("codeBlock") || false,
  },
]);

// Heading menu items
const headingItems = ref<HeadingItem[]>([
  {
    text: "P",
    title: "Paragraph",
    action: () => editor.value?.chain().focus().setParagraph().run(),
    isActive: () => editor.value?.isActive("paragraph") || false,
  },
  {
    text: "H1",
    title: "Heading 1",
    action: () =>
      editor.value?.chain().focus().toggleHeading({ level: 1 }).run(),
    isActive: () => editor.value?.isActive("heading", { level: 1 }) || false,
  },
  {
    text: "H2",
    title: "Heading 2",
    action: () =>
      editor.value?.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: () => editor.value?.isActive("heading", { level: 2 }) || false,
  },
  {
    text: "H3",
    title: "Heading 3",
    action: () =>
      editor.value?.chain().focus().toggleHeading({ level: 3 }).run(),
    isActive: () => editor.value?.isActive("heading", { level: 3 }) || false,
  },
]);
</script>

<style scoped>
.rich-text-editor {
  border: 1px solid #ddd;
  border-radius: 5px;
  overflow: hidden;
}

.is-focused {
  border-color: #4f46e5;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
}

.editor-menu {
  display: flex;
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
  background-color: #f9f9f9;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.heading-buttons,
.format-buttons {
  display: flex;
  gap: 0.25rem;
}

.heading-buttons {
  margin-right: 1rem;
}

button {
  border: none;
  background: none;
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

button:hover {
  background-color: #eee;
}

button.is-active {
  background-color: #e0e0e0;
  font-weight: bold;
}

.editor-content {
  padding: 1rem;
  min-height: 200px;
}

.editor-content :deep(p) {
  margin: 0.5rem 0;
}

.editor-content :deep(ul),
.editor-content :deep(ol) {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.editor-content :deep(h1) {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 1rem 0 0.5rem;
}

.editor-content :deep(h2) {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0.8rem 0 0.4rem;
}

.editor-content :deep(h3) {
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0.6rem 0 0.3rem;
}

.editor-content :deep(blockquote) {
  border-left: 3px solid #ddd;
  padding-left: 1rem;
  color: #555;
  margin: 0.5rem 0;
}

.editor-content :deep(pre) {
  background-color: #f5f5f5;
  padding: 0.5rem;
  border-radius: 3px;
  font-family: monospace;
  margin: 0.5rem 0;
  overflow-x: auto;
}

.editor-content :deep(code) {
  background-color: #f5f5f5;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.9em;
}
</style>
