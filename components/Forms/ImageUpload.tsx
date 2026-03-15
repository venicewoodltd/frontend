"use client";

import { useState } from "react";
import { uploadImageToGridFS } from "@/lib/imageUploadService";
import CircularProgress from "@/components/ui/CircularProgress";

interface ImageUploadResponse {
  success: boolean;
  fileId: string;
  filename: string;
  message?: string;
}

interface ImageUploadProps {
  productId: string;
  type?: "main" | "gallery";
  onSuccess?: (data: ImageUploadResponse) => void;
  onError?: (error: string) => void;
}

export default function ImageUpload({
  productId,
  type = "gallery",
  onSuccess,
  onError,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      const result = await (uploadImageToGridFS as any)(file, (progress: number) => {
        setUploadProgress(progress);
      });

      if (result && result.success && result.fileId) {
        onSuccess?.({
          success: true,
          fileId: result.fileId,
          filename: result.filename || file.name,
        });
      } else {
        throw new Error("Upload did not return a valid fileId");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      onError?.(message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
          id={`file-input-${productId}-${type}`}
        />
        <label
          htmlFor={`file-input-${productId}-${type}`}
          className="cursor-pointer block"
        >
          <div className="text-gray-600">
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <CircularProgress
                  progress={uploadProgress}
                  size={50}
                  strokeWidth={4}
                />
                <p className="text-sm text-[#4e342e] font-medium">
                  Uploading... {Math.round(uploadProgress)}%
                </p>
              </div>
            ) : (
              <>
                <p className="font-semibold">Click to upload</p>
                <p className="text-sm text-gray-500">or drag and drop</p>
              </>
            )}
          </div>
        </label>
      </div>

      {preview && (
        <div className="relative w-full h-48">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover rounded-lg"
          />
          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-lg">
              <CircularProgress
                progress={uploadProgress}
                size={50}
                strokeWidth={4}
              />
              <span className="text-white text-xs mt-2 font-medium">
                Uploading...
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
