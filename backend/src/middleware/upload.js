import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

/**
 * Returns a multer instance that uploads directly to Cloudinary.
 * @param {string} folder - sub-folder inside the 'umuhoza' Cloudinary folder
 */
function makeUpload(folder) {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `umuhoza/${folder}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    },
  });
  return multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
}

export default makeUpload;
