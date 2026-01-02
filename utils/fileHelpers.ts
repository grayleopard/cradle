export interface ProcessedImage {
  blob: Blob;
  base64: string;
  previewUrl: string;
  mimeType: string;
}

export const processImage = (file: File): Promise<ProcessedImage> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        // Calculate new dimensions (Max 1200px for better quality on retina screens)
        const MAX_DIMENSION = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG at 80% quality
        const mimeType = 'image/jpeg';
        
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas to Blob conversion failed'));
            return;
          }

          // We also need Base64 for the Gemini AI check locally
          const base64Reader = new FileReader();
          base64Reader.readAsDataURL(blob);
          base64Reader.onloadend = () => {
            const base64String = (base64Reader.result as string).split(',')[1];
            
            resolve({
              blob,
              base64: base64String,
              previewUrl: URL.createObjectURL(blob), // Local object URL for immediate display
              mimeType
            });
          };
        }, mimeType, 0.8);
      };
      
      img.onerror = (error) => reject(error);
    };
    
    reader.onerror = (error) => reject(error);
  });
};