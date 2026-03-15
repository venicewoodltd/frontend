"use client";

import { useCallback, useMemo } from "react";

export default function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Start writing your content...",
  minHeight = "300px",
  className = "",
  showWordCount = true,
}) {
  const { wordCount, charCount } = useMemo(() => {
    const plainText = value || "";
    const words = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
    const chars = plainText.length;
    return { wordCount: words, charCount: chars };
  }, [value]);

  const handleChange = useCallback(
    (e) => {
      const newValue = e.target.value;
      if (onChange) onChange(newValue);
    },
    [onChange],
  );

  return (
    <div
      className={`border border-[#d7ccc8] rounded-xl overflow-hidden bg-white shadow-sm ${className}`}
    >
      <textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 text-[#3e2723] bg-white resize-none focus:outline-none focus:ring-0 border-none"
        style={{ minHeight }}
      />

      {showWordCount && (
        <div className="bg-[#fcfaf6] border-t border-[#d7ccc8] px-4 py-2 flex justify-between items-center text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>Words: {wordCount}</span>
            <span>Characters: {charCount}</span>
          </div>
        </div>
      )}
    </div>
  );
}
