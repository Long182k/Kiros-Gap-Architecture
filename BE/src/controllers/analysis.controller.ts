/**
 * Analysis Controller - Express Route Handlers
 */
import { Router, Request, Response, NextFunction } from 'express';
import { analysisService } from '../services/analysis.service.js';
import { pdfService } from '../services/pdf.service.js';
import { CreateAnalysisSchema } from '../schemas/analysis.schema.js';
import { uploadFiles, handleUploadError } from '../middleware/upload.js';
import { analysisRateLimiter } from '../middleware/rate-limit.js';
import { APIError, Errors } from '../middleware/error-handler.js';

const router: Router = Router();

/**
 * POST /api/v1/analysis
 * Submit resume + JD for analysis (both as PDFs via multipart form)
 */
router.post(
  '/',
  analysisRateLimiter,
  (req: Request, res: Response, next: NextFunction) => {
    // Handle multipart upload for both files
    uploadFiles(req, res, (err: any) => {
      if (err) {
        return next(handleUploadError(err));
      }
      next();
    });
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      
      let resumeText: string;
      let jobDescriptionText: string;
      let resumeFilename: string | undefined;

      // Extract resume text (from PDF or fallback to text field)
      if (files?.resume?.[0]) {
        const resumeFile = files.resume[0];
        const validation = pdfService.validate(resumeFile.mimetype, resumeFile.size);
        if (!validation.valid) {
          throw Errors.badRequest(`Resume: ${validation.error!}`);
        }
        resumeText = await pdfService.extractText(resumeFile.buffer);
        resumeFilename = resumeFile.originalname;
      } else if (req.body.resumeText) {
        resumeText = req.body.resumeText;
      } else {
        throw Errors.badRequest('Resume PDF file is required');
      }

      // Extract job description text (from PDF or fallback to text field)
      if (files?.jobDescription?.[0]) {
        const jdFile = files.jobDescription[0];
        const validation = pdfService.validate(jdFile.mimetype, jdFile.size);
        if (!validation.valid) {
          throw Errors.badRequest(`Job Description: ${validation.error!}`);
        }
        jobDescriptionText = await pdfService.extractText(jdFile.buffer);
      } else if (req.body.jobDescription) {
        jobDescriptionText = req.body.jobDescription;
      } else {
        throw Errors.badRequest('Job Description PDF file is required');
      }

      // Validate input
      const validationResult = CreateAnalysisSchema.safeParse({
        resumeText,
        jobDescription: jobDescriptionText,
        resumeFilename
      });

      if (!validationResult.success) {
        throw Errors.validation(
          'Invalid input',
          validationResult.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        );
      }

      // Create analysis
      const result = await analysisService.createAnalysis(
        validationResult.data,
        req.sessionId
      );

      // Return appropriate status code
      const statusCode = result.cached ? 200 : 202;
      res.status(statusCode).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/analysis/:id
 * Poll for analysis result
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw Errors.badRequest('Invalid analysis ID format');
    }

    const analysis = await analysisService.getAnalysis(id);

    if (!analysis) {
      throw Errors.notFound('Analysis');
    }

    res.json({
      success: true,
      ...analysis
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/analysis/history
 * Get analysis history for current session
 */
router.get('/user/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    
    const history = await analysisService.getHistory(req.sessionId, limit);

    res.json({
      success: true,
      count: history.length,
      analyses: history
    });
  } catch (error) {
    next(error);
  }
});

export { router as analysisRouter };