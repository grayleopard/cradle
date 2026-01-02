
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
  const uploadPreset = envUploadPreset || localStorage.getItem('VITE_CLOUDINARY_UPLOAD_PRESET') || 'cradle_uploads';

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
