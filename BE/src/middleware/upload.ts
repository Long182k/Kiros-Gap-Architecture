/**
 * Multer File Upload Middleware
 * Configured for PDF uploads (resume and job description)
 */
import multer from 'multer';
import { Request } from 'express';
import { APIError } from './error-handler.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIMETYPES = ['application/pdf'];

/**
 * Storage configuration (memory storage for processing)
 */
const storage = multer.memoryStorage();

/**
 * File filter for PDF only
 */
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
): void => {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new APIError(
      `Only PDF files are allowed. Invalid file: ${file.fieldname}`,
      400,
      'INVALID_FILE_TYPE'
    ));
  }
};

/**
 * Multer instance configured for resume AND job description uploads
 */
export const uploadFiles = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 2
  },
  fileFilter
}).fields([
  { name: 'resume', maxCount: 1 },
  { name: 'jobDescription', maxCount: 1 }
]);

/**
 * Legacy single file upload (deprecated, kept for backwards compatibility)
 */
export const uploadResume = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  },
  fileFilter
}).single('resume');


/**
 * Wrapper to handle multer errors
 */
export function handleUploadError(err: Error): APIError {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return new APIError('File too large. Maximum size is 5MB', 400, 'FILE_TOO_LARGE');
      case 'LIMIT_FILE_COUNT':
        return new APIError('Too many files. Only one file allowed', 400, 'TOO_MANY_FILES');
      case 'LIMIT_UNEXPECTED_FILE':
        return new APIError('Unexpected field name. Use "resume" for file upload', 400, 'INVALID_FIELD');
      default:
        return new APIError(`Upload error: ${err.message}`, 400, 'UPLOAD_ERROR');
    }
  }
  
  if (err instanceof APIError) {
    return err;
  }

  return new APIError('File upload failed', 500, 'UPLOAD_ERROR');
}
