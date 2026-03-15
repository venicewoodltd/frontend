"use client";

import { useRef, useCallback, useEffect, useState } from "react";

interface WYSIWYGEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

function ToolbarButton({
  onClick,
  title,
  children,
  active = false,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={`p-2 rounded hover:bg-[#4e342e]/10 transition ${active ? "bg-[#4e342e] text-white" : "text-gray-700"}`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-[#d7ccc8] mx-1" />;
}

type ViewMode = "editor" | "html" | "preview";

function ViewModeButtons({
  viewMode,
  onEditor,
  onHtml,
  onPreview,
}: {
  viewMode: ViewMode;
  onEditor: () => void;
  onHtml: () => void;
  onPreview: () => void;
}) {
  return (
    <div className="flex items-center gap-1 border border-[#d7ccc8] rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onEditor}
        className={`px-3 py-1 text-xs font-medium transition ${viewMode === "editor" ? "bg-[#4e342e] text-white" : "bg-white text-gray-600 hover:bg-[#fcfaf6]"}`}
      >
        Editor
      </button>
      <button
        type="button"
        onClick={onHtml}
        className={`px-3 py-1 text-xs font-medium transition ${viewMode === "html" ? "bg-[#4e342e] text-white" : "bg-white text-gray-600 hover:bg-[#fcfaf6]"}`}
      >
        HTML
      </button>
      <button
        type="button"
        onClick={onPreview}
        className={`px-3 py-1 text-xs font-medium transition ${viewMode === "preview" ? "bg-[#4e342e] text-white" : "bg-white text-gray-600 hover:bg-[#fcfaf6]"}`}
      >
        Preview
      </button>
    </div>
  );
}

export default function WYSIWYGEditor({
  value,
  onChange,
  placeholder = "Start writing...",
  minHeight = "400px",
  className = "",
}: WYSIWYGEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("editor");
  const [htmlSource, setHtmlSource] = useState(value);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const savedSelectionRef = useRef<Range | null>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const execCmd = useCallback(
    (command: string, val: string | undefined = undefined) => {
      editorRef.current?.focus();
      document.execCommand(command, false, val);
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    },
    [onChange],
  );

  const formatBlock = useCallback(
    (tag: string) => {
      execCmd("formatBlock", `<${tag}>`);
    },
    [execCmd],
  );

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "b":
            e.preventDefault();
            execCmd("bold");
            break;
          case "i":
            e.preventDefault();
            execCmd("italic");
            break;
          case "u":
            e.preventDefault();
            execCmd("underline");
            break;
          case "z":
            if (e.shiftKey) {
              e.preventDefault();
              execCmd("redo");
            }
            break;
        }
      }
    },
    [execCmd],
  );

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedSelectionRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    }
  };

  const handleInsertLink = () => {
    saveSelection();
    const sel = window.getSelection();
    setLinkText(sel?.toString() || "");
    setLinkUrl("https://");
    setShowLinkModal(true);
  };

  const confirmInsertLink = () => {
    if (!linkUrl) return;
    editorRef.current?.focus();
    restoreSelection();

    if (linkText && !window.getSelection()?.toString()) {
      const link = `<a href="${linkUrl}" target="_blank">${linkText}</a>`;
      execCmd("insertHTML", link);
    } else {
      execCmd("createLink", linkUrl);
    }
    setShowLinkModal(false);
    setLinkUrl("");
    setLinkText("");
  };

  const handleInsertHR = () => {
    execCmd("insertHTML", "<hr/>");
  };

  const switchToHtmlView = () => {
    if (editorRef.current) {
      setHtmlSource(editorRef.current.innerHTML);
    }
    setViewMode("html");
  };

  const switchToEditorView = () => {
    if (viewMode === "html") {
      if (editorRef.current) {
        editorRef.current.innerHTML = htmlSource;
      }
      onChange(htmlSource);
    }
    setViewMode("editor");
  };

  const switchToPreview = () => {
    if (editorRef.current) {
      setHtmlSource(editorRef.current.innerHTML);
    }
    setViewMode("preview");
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-lg overflow-hidden border border-[#d7ccc8] ${className}`}
    >
      {/* Toolbar */}
      {viewMode === "editor" && (
        <div className="bg-[#fcfaf6] border-b border-[#d7ccc8]">
          {/* Row 1: Formatting */}
          <div className="flex flex-wrap items-center gap-1 p-2 border-b border-[#d7ccc8]/50">
            <ToolbarButton
              onClick={() => execCmd("undo")}
              title="Undo (Ctrl+Z)"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => execCmd("redo")}
              title="Redo (Ctrl+Shift+Z)"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
                />
              </svg>
            </ToolbarButton>

            <ToolbarDivider />

            <select
              onChange={(e) => {
                if (e.target.value) formatBlock(e.target.value);
                e.target.value = "";
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="px-2 py-1 rounded border border-[#d7ccc8] bg-white text-sm text-gray-700 hover:bg-[#fcfaf6] focus:ring-1 focus:ring-[#4e342e]"
              defaultValue=""
            >
              <option value="" disabled>
                Format
              </option>
              <option value="p">Paragraph</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="blockquote">Quote</option>
              <option value="pre">Code Block</option>
            </select>

            <ToolbarDivider />

            <ToolbarButton
              onClick={() => execCmd("bold")}
              title="Bold (Ctrl+B)"
            >
              <span className="font-bold text-sm">B</span>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => execCmd("italic")}
              title="Italic (Ctrl+I)"
            >
              <span className="italic text-sm">I</span>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => execCmd("underline")}
              title="Underline (Ctrl+U)"
            >
              <span className="underline text-sm">U</span>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => execCmd("strikeThrough")}
              title="Strikethrough"
            >
              <span className="line-through text-sm">S</span>
            </ToolbarButton>

            <ToolbarDivider />

            <div className="relative flex items-center">
              <label
                title="Text Color"
                className="p-2 rounded hover:bg-[#4e342e]/10 transition cursor-pointer flex items-center gap-1"
              >
                <span className="text-sm font-bold">A</span>
                <div className="w-3 h-3 rounded border border-gray-300 bg-black" />
                <input
                  type="color"
                  defaultValue="#000000"
                  onChange={(e) => execCmd("foreColor", e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </label>
            </div>
            <div className="relative flex items-center">
              <label
                title="Highlight Color"
                className="p-2 rounded hover:bg-[#4e342e]/10 transition cursor-pointer flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
                <div className="w-3 h-3 rounded border border-gray-300 bg-yellow-300" />
                <input
                  type="color"
                  defaultValue="#ffff00"
                  onChange={(e) => execCmd("hiliteColor", e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </label>
            </div>

            <ToolbarDivider />

            <ToolbarButton
              onClick={() => execCmd("justifyLeft")}
              title="Align Left"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h10M4 18h16"
                />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => execCmd("justifyCenter")}
              title="Align Center"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M7 12h10M4 18h16"
                />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => execCmd("justifyRight")}
              title="Align Right"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M10 12h10M4 18h16"
                />
              </svg>
            </ToolbarButton>
          </div>

          {/* Row 2 */}
          <div className="flex flex-wrap items-center gap-1 p-2">
            <ToolbarButton
              onClick={() => execCmd("insertUnorderedList")}
              title="Bullet List"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
                />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => execCmd("insertOrderedList")}
              title="Numbered List"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 6h13M7 12h13M7 18h13"
                />
                <text x="1" y="8" fontSize="7" fill="currentColor">
                  1
                </text>
                <text x="1" y="14" fontSize="7" fill="currentColor">
                  2
                </text>
                <text x="1" y="20" fontSize="7" fill="currentColor">
                  3
                </text>
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => execCmd("indent")}
              title="Increase Indent"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 5h8M13 9h8M13 13h8M13 17h8M3 8l4 4-4 4"
                />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => execCmd("outdent")}
              title="Decrease Indent"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 5h8M13 9h8M13 13h8M13 17h8M7 8L3 12l4 4"
                />
              </svg>
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton onClick={handleInsertLink} title="Insert Link">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => execCmd("unlink")}
              title="Remove Link"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
                <line
                  x1="4"
                  y1="4"
                  x2="20"
                  y2="20"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton onClick={handleInsertHR} title="Horizontal Line">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 12h16"
                />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => execCmd("removeFormat")}
              title="Clear Formatting"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </ToolbarButton>

            <div className="flex-1" />

            <ViewModeButtons
              viewMode={viewMode}
              onEditor={switchToEditorView}
              onHtml={switchToHtmlView}
              onPreview={switchToPreview}
            />
          </div>
        </div>
      )}

      {viewMode !== "editor" && (
        <div className="flex items-center gap-1 p-2 bg-[#fcfaf6] border-b border-[#d7ccc8]">
          <ViewModeButtons
            viewMode={viewMode}
            onEditor={switchToEditorView}
            onHtml={switchToHtmlView}
            onPreview={switchToPreview}
          />
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={viewMode === "editor"}
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        style={{ minHeight }}
        className={`p-4 outline-none text-gray-800 leading-relaxed wysiwyg-content ${viewMode !== "editor" ? "hidden" : ""}`}
      />

      {viewMode === "html" && (
        <textarea
          value={htmlSource}
          onChange={(e) => setHtmlSource(e.target.value)}
          style={{ minHeight }}
          className="w-full p-4 font-mono text-sm text-gray-800 bg-gray-50 outline-none resize-y border-0"
          spellCheck={false}
        />
      )}

      {viewMode === "preview" && (
        <div
          style={{ minHeight }}
          className="p-4 text-gray-800 leading-relaxed wysiwyg-content"
          dangerouslySetInnerHTML={{ __html: htmlSource }}
        />
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-[#3e2723] mb-4">
              Insert Link
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4e342e] focus:border-transparent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Text (optional)
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Link text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4e342e] focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmInsertLink}
                className="px-4 py-2 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723]"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .wysiwyg-content[data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        .wysiwyg-content h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        .wysiwyg-content h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        .wysiwyg-content h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        .wysiwyg-content p {
          margin: 0.5em 0;
        }
        .wysiwyg-content ul {
          list-style-type: disc;
          margin-left: 1.5em;
        }
        .wysiwyg-content ol {
          list-style-type: decimal;
          margin-left: 1.5em;
        }
        .wysiwyg-content blockquote {
          border-left: 4px solid #8d6e63;
          padding-left: 1em;
          margin: 1em 0;
          font-style: italic;
          color: #666;
        }
        .wysiwyg-content a {
          color: #4e342e;
          text-decoration: underline;
        }
        .wysiwyg-content img {
          max-width: 100%;
          height: auto;
          margin: 1em 0;
        }
        .wysiwyg-content pre {
          background: #1e1e1e;
          color: #d4d4d4;
          padding: 1em;
          border-radius: 0.5em;
          overflow-x: auto;
          font-family: monospace;
        }
        .wysiwyg-content code {
          background: #f3f4f6;
          padding: 0.2em 0.4em;
          border-radius: 0.25em;
          font-family: monospace;
        }
        .wysiwyg-content hr {
          border: none;
          border-top: 2px solid #d7ccc8;
          margin: 1.5em 0;
        }
        .wysiwyg-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1em 0;
        }
        .wysiwyg-content table td,
        .wysiwyg-content table th {
          border: 1px solid #d7ccc8;
          padding: 0.5em;
        }
      `}</style>
    </div>
  );
}
