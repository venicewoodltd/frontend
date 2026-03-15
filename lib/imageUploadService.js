const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
  "image/x-icon",
];
const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|ico)$/i;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const uploadImageToGridFS = async (file, onProgress = null) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided"));
      return;
    }

    if (
      !ALLOWED_MIME_TYPES.includes(file.type) &&
      !ALLOWED_EXTENSIONS.test(file.name)
    ) {
      reject(
        new Error(
          "File type not supported. Allowed: jpg, jpeg, png, gif, webp, svg, bmp, tiff, ico",
        ),
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      reject(
        new Error(
          `File size exceeds 100MB limit. Your file: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        ),
      );
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
      });
    }

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.success && response.fileId) {
            resolve({
              fileId: response.fileId,
              filename: response.filename,
              success: true,
            });
          } else {
            reject(new Error(response.error || "Image upload failed"));
          }
        } catch {
          reject(new Error("Invalid response from server"));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error || `Upload failed: ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed: ${xhr.statusText || xhr.status}`));
        }
      }
    });

    xhr.addEventListener("error", () => {
      reject(
        new Error(
          "Network error during upload. Check CORS and server connection.",
        ),
      );
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload cancelled"));
    });

    xhr.open("POST", `${API_URL}/api/images/image`);

    const token =
      typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.send(formData);
  });
};

export const deleteImageFromGridFS = async (fileId) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const response = await fetch(`${API_URL}/api/images/${fileId}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) throw new Error(`Delete failed: ${response.statusText}`);
  const data = await response.json();
  return data.success || true;
};

export const getImageUrl = (fileId) => {
  if (!fileId) return null;
  return `${API_URL}/api/images/${fileId}`;
};

export const validateImageFile = (file) => {
  const errors = [];

  if (!file) {
    errors.push("No file selected");
    return { valid: false, errors };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    errors.push(
      "File type not supported. Allowed: jpg, jpeg, png, gif, webp, svg, bmp, tiff, ico",
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    errors.push(
      `File size exceeds 100MB limit. Your file: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
  };
};
