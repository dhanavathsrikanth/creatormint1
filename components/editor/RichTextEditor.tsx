"use client";

import { useEffect, useRef, useCallback } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Link as LinkIcon,
  Heading1, Heading2, Heading3, List, ListOrdered, Quote, Minus,
  AlignLeft, AlignCenter, AlignRight, ImageIcon, Undo, Redo, Code,
} from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  userId: string;
  placeholder?: string;
  disabled?: boolean;
}

// ── Toolbar button ────────────────────────────────────────────────
function ToolbarButton({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-md text-sm transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {children}
    </button>
  );
}

// ── Divider ───────────────────────────────────────────────────────
function Divider() {
  return <div className="w-px h-5 bg-border mx-0.5 shrink-0" />;
}

// ── Toolbar ───────────────────────────────────────────────────────
function EditorToolbar({ editor, onImageUpload }: { editor: Editor; onImageUpload: () => void }) {
  const setLink = useCallback(() => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const applyIsolatedBlockFormat = useCallback((action: () => void) => {
    const { state, view } = editor;
    const { selection, tr } = state;

    if (selection.empty) {
      action();
      return;
    }

    const { $from, $to } = selection;
    
    // Only isolate if the selection is perfectly within a single block
    if ($from.parent !== $to.parent) {
      action();
      return;
    }

    const isAtStart = $from.parentOffset === 0;
    const isAtEnd = $to.parentOffset === $from.parent.content.size;

    // If perfectly isolated already, do standard behavior
    if (isAtStart && isAtEnd) {
      action();
      return;
    }

    let transaction = tr;
    let startPos = $from.pos;
    let endPos = $to.pos;

    // Split at the end first so our $from.pos doesn't shift
    if (!isAtEnd) {
      transaction = transaction.split($to.pos);
    }
    // Split at the start (shifts everything after it by 2 tokens)
    if (!isAtStart) {
      transaction = transaction.split($from.pos);
      startPos += 2;
      endPos += 2;
    }

    view.dispatch(transaction);
    editor.commands.setTextSelection({ from: startPos, to: endPos });
    
    // Run the native tiptap command now that the selection is its own separate block
    action();
  }, [editor]);

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-muted/95 backdrop-blur">
      {/* History */}
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
        <Undo className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
        <Redo className="w-4 h-4" />
      </ToolbarButton>
      <Divider />

      {/* Headings */}
      <ToolbarButton onClick={() => applyIsolatedBlockFormat(() => editor.chain().focus().toggleHeading({ level: 1 }).run())} active={editor.isActive("heading", { level: 1 })} title="Heading 1">
        <Heading1 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => applyIsolatedBlockFormat(() => editor.chain().focus().toggleHeading({ level: 2 }).run())} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
        <Heading2 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => applyIsolatedBlockFormat(() => editor.chain().focus().toggleHeading({ level: 3 }).run())} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
        <Heading3 className="w-4 h-4" />
      </ToolbarButton>
      <Divider />

      {/* Inline marks */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
        <Bold className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
        <Italic className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
        <UnderlineIcon className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
        <Strikethrough className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code">
        <Code className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={setLink} active={editor.isActive("link")} title="Insert link">
        <LinkIcon className="w-4 h-4" />
      </ToolbarButton>
      <Divider />

      {/* Lists & blocks */}
      <ToolbarButton onClick={() => applyIsolatedBlockFormat(() => editor.chain().focus().toggleBulletList().run())} active={editor.isActive("bulletList")} title="Bullet list">
        <List className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => applyIsolatedBlockFormat(() => editor.chain().focus().toggleOrderedList().run())} active={editor.isActive("orderedList")} title="Numbered list">
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => applyIsolatedBlockFormat(() => editor.chain().focus().toggleBlockquote().run())} active={editor.isActive("blockquote")} title="Blockquote">
        <Quote className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
        <Minus className="w-4 h-4" />
      </ToolbarButton>
      <Divider />

      {/* Text alignment */}
      <ToolbarButton onClick={() => applyIsolatedBlockFormat(() => editor.chain().focus().setTextAlign("left").run())} active={editor.isActive({ textAlign: "left" })} title="Align left">
        <AlignLeft className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => applyIsolatedBlockFormat(() => editor.chain().focus().setTextAlign("center").run())} active={editor.isActive({ textAlign: "center" })} title="Align center">
        <AlignCenter className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => applyIsolatedBlockFormat(() => editor.chain().focus().setTextAlign("right").run())} active={editor.isActive({ textAlign: "right" })} title="Align right">
        <AlignRight className="w-4 h-4" />
      </ToolbarButton>
      <Divider />

      {/* Image */}
      <ToolbarButton onClick={onImageUpload} title="Insert image">
        <ImageIcon className="w-4 h-4" />
      </ToolbarButton>
    </div>
  );
}

// ── Main Editor Component ─────────────────────────────────────────
export function RichTextEditor({
  content,
  onChange,
  userId,
  placeholder = "Write your product description here…",
  disabled = false,
}: RichTextEditorProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<Editor | null>(null);

  // ── Image upload handler ──────────────────────────────────────
  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are supported");
      return null;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10 MB");
      return null;
    }
    const toastId = toast.loading("Uploading image…");
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/editor/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("cover-images")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("cover-images").getPublicUrl(path);
      toast.success("Image uploaded", { id: toastId });
      return data.publicUrl;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error(msg, { id: toastId });
      return null;
    }
  }, [supabase, userId]);

  // ── Insert image URL into editor ──────────────────────────────
  const insertImage = useCallback(async (file: File) => {
    const url = await uploadImage(file);
    if (url && editorRef.current) {
      editorRef.current.chain().focus().setImage({ src: url, alt: file.name }).run();
    }
  }, [uploadImage]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) insertImage(file);
    e.target.value = "";
  }, [insertImage]);

  // ── Tiptap editor setup ───────────────────────────────────────
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: "rounded-lg max-w-full my-4 border border-gray-200",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-blue-600 underline cursor-pointer" },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
    ],
    content: content || "",
    editable: !disabled,
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      // Don't save empty editor as "<p></p>"
      onChange(html === "<p></p>" ? "" : html);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[260px] p-4 focus:outline-none text-foreground",
      },
      handleDrop: (_view, event) => {
        const files = (event as DragEvent).dataTransfer?.files;
        if (files?.length && files[0].type.startsWith("image/")) {
          event.preventDefault();
          insertImage(files[0]);
          return true;
        }
        return false;
      },
      handlePaste: (_view, event) => {
        const items = (event as ClipboardEvent).clipboardData?.items;
        if (items) {
          for (const item of Array.from(items)) {
            if (item.type.startsWith("image/")) {
              const file = item.getAsFile();
              if (file) {
                insertImage(file);
                return true;
              }
            }
          }
        }
        return false;
      },
    },
  });

  // Keep editorRef in sync for image insertions
  useEffect(() => {
    editorRef.current = editor ?? null;
  }, [editor]);

  // Sync external content changes (e.g., when product loads)
  useEffect(() => {
    if (editor && content !== undefined) {
      const current = editor.getHTML();
      if (current !== content && content !== "") {
        editor.commands.setContent(content);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only on mount

  if (!editor) return null;

  return (
    <div className={`relative flex flex-col rounded-xl border border-border overflow-hidden bg-background max-h-[600px] ${disabled ? "opacity-60" : ""}`}>
      <EditorToolbar editor={editor} onImageUpload={() => fileInputRef.current?.click()} />
      <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />
      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          height: 0;
        }
        .ProseMirror {
          outline: none;
        }
        .ProseMirror h1 { font-size: 2rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; line-height: 1.2; }
        .ProseMirror h2 { font-size: 1.5rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.5rem; }
        .ProseMirror h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem; }
        .ProseMirror ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        .ProseMirror ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
        .ProseMirror li { margin: 0.25rem 0; }
        .ProseMirror blockquote { border-left: 4px solid hsl(var(--border)); padding-left: 1rem; color: hsl(var(--muted-foreground)); margin: 1rem 0; font-style: italic; }
        .ProseMirror code { background: hsl(var(--muted)); padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.875rem; font-family: monospace; }
        .ProseMirror pre { background: hsl(var(--muted)); padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin: 1rem 0; }
        .ProseMirror pre code { background: none; padding: 0; }
        .ProseMirror hr { border: none; border-top: 1px solid hsl(var(--border)); margin: 1.5rem 0; }
        .ProseMirror p { margin: 0.5rem 0; line-height: 1.7; }
        .ProseMirror img { max-width: 100%; }
      `}</style>
    </div>
  );
}
