import { IMAGE_VALIDATION_THRESHOLDS } from '../types';

// Pre-upload validation result
export interface PreUploadValidation {
  isValid: boolean;
  error?: string;
  warning?: string;
}

// Client-side validation before upload
export const validateImageFile = (file: File): PreUploadValidation => {
  const { MAX_FILE_SIZE_MB, ALLOWED_TYPES } = IMAGE_VALIDATION_THRESHOLDS;

  // Check file type
  const fileType = file.type.toLowerCase();
  if (!ALLOWED_TYPES.includes(fileType)) {
    return {
      isValid: false,
      error: `Unsupported file type. Please use JPEG, PNG, or WebP.`
    };
  }

  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > MAX_FILE_SIZE_MB) {
    return {
      isValid: false,
      error: `File too large (${fileSizeMB.toFixed(1)}MB). Maximum size is ${MAX_FILE_SIZE_MB}MB.`
    };
  }

  // Warn if file might be low quality (very small file size)
  if (fileSizeMB < 0.05) {
    return {
      isValid: true,
      warning: 'This image appears to be very low resolution.'
    };
  }

  return { isValid: true };
};

// Async validation for image dimensions
export const validateImageDimensions = (file: File): Promise<PreUploadValidation> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const { MIN_RESOLUTION } = IMAGE_VALIDATION_THRESHOLDS;

      if (img.width < MIN_RESOLUTION || img.height < MIN_RESOLUTION) {
        resolve({
          isValid: false,
          error: `Image resolution too low (${img.width}x${img.height}). Minimum is ${MIN_RESOLUTION}px.`
        });
      } else if (img.width < MIN_RESOLUTION * 1.5 || img.height < MIN_RESOLUTION * 1.5) {
        resolve({
          isValid: true,
          warning: 'Higher resolution photos help buyers see details better.'
        });
      } else {
        resolve({ isValid: true });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        isValid: false,
        error: 'Could not read image file. Please try a different photo.'
      });
    };

    img.src = url;
  });
};

// Full pre-upload validation (sync + async)
export const validateBeforeUpload = async (file: File): Promise<PreUploadValidation> => {
  // Quick sync checks first
  const syncResult = validateImageFile(file);
  if (!syncResult.isValid) {
    return syncResult;
  }

  // Then async dimension check
  const dimResult = await validateImageDimensions(file);
  if (!dimResult.isValid) {
    return dimResult;
  }

  // Combine warnings
  if (syncResult.warning || dimResult.warning) {
    return {
      isValid: true,
      warning: syncResult.warning || dimResult.warning
    };
  }

  return { isValid: true };
};

export const uploadToCloudinary = async (file: Blob): Promise<string> => {
  // Access env vars safely using optional chaining
  let envCloudName, envUploadPreset;
  try {
    // @ts-ignore
    envCloudName = (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME;
    // @ts-ignore
    envUploadPreset = (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET;
  } catch (e) {
    // Ignore
  }
  
  const cloudName = envCloudName || localStorage.getItem('VITE_CLOUDINARY_CLOUD_NAME') || 'dgq9mn6uz';
  const uploadPreset = envUploadPreset || localStorage.getItem('VITE_CLOUDINARY_UPLOAD_PRESET') || 'pipit_uploads';

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration missing. Please set keys in .env or Dev Settings.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Image upload failed');
  }

  const data = await response.json();
  return data.secure_url;
};
