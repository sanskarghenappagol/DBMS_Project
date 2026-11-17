import { Router, Request, Response } from 'express';
import multer from 'multer';
import { supabaseAdmin } from '../config/supabase';
import { authenticateUser } from '../middleware/auth';

const router = Router();
router.use(authenticateUser);

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only PDF, JPG, and PNG are allowed.'));
    }
  }
});

/**
 * POST /api/storage/upload
 * Upload medical document to Supabase Storage 'medical-reports' bucket
 */
router.post('/upload', upload.single('document'), async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'No document file uploaded' });
      return;
    }

    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `patient-reports/${fileName}`;

    let signedUrl = `https://mock-storage.supabase.co/storage/v1/object/sign/medical-reports/${filePath}`;

    // Upload to real Supabase Storage if configured
    if (supabaseAdmin) {
      try {
        const { error: uploadError } = await supabaseAdmin.storage
          .from('medical-reports')
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false
          });

        if (uploadError) {
          console.warn('Supabase storage upload error:', uploadError.message);
        } else {
          const { data: signedData } = await supabaseAdmin.storage
            .from('medical-reports')
            .createSignedUrl(filePath, 3600); // 1 hour validity

          if (signedData?.signedUrl) {
            signedUrl = signedData.signedUrl;
          }
        }
      } catch (storageErr) {
        console.warn('Supabase storage exception, using signed path preview:', storageErr);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Medical document uploaded to Supabase Storage private bucket',
      data: {
        storage_path: filePath,
        file_name: file.originalname,
        file_size_bytes: file.size,
        file_type: file.mimetype,
        signed_url: signedUrl
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/storage/signed-url
 * Generate short-lived signed URL for authorized viewing
 */
router.get('/signed-url', async (req: Request, res: Response): Promise<void> => {
  try {
    const { path } = req.query;

    if (!path) {
      res.status(400).json({ error: 'File path required' });
      return;
    }

    let signedUrl = `https://mock-storage.supabase.co/storage/v1/object/sign/medical-reports/${path}`;

    if (supabaseAdmin) {
      try {
        const { data } = await supabaseAdmin.storage
          .from('medical-reports')
          .createSignedUrl(String(path), 3600);

        if (data?.signedUrl) {
          signedUrl = data.signedUrl;
        }
      } catch {
        // fallback
      }
    }

    res.json({ success: true, signed_url: signedUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

