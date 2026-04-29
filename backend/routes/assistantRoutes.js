import express from 'express';
import assistantController from '../controllers/assistantController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.post('/chat', assistantController.chatWithAssistant);
router.post('/transcribe', assistantController.transcribeAudio);

export default router;
