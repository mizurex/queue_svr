import express from 'express';
import fileUploadRoutes from './file-upload';

const router = express.Router();

router.use('/upload', fileUploadRoutes);

export default router;
