import Land from '../models/Land.js';
import User from '../models/User.js';
import { verifyDocumentWithOCR } from '../utils/ocrService.js';
import { getStoredFileResponse, getUploadedFileUrl } from '../utils/storage.js';

// @desc    Create new land listing
// @route   POST /api/land
// @access  Private (Farmer)
export const createLand = async (req, res) => {
  try {
    const { title, description, area, village, district, state, rentPrice, rentDuration, selfDeclaration } = req.body;
    const documentFiles = req.files?.documents || [];
    const landImageFile = req.files?.landImage?.[0];
    
    // Convert string 'true' to boolean true if necessary
    const isSelfDeclared = selfDeclaration === 'true' || selfDeclaration === true;
    const normalizedRentDuration = rentDuration === 'monthly' ? 'monthly' : 'yearly';

    if (!isSelfDeclared) {
      return res.status(400).json({ message: 'Self declaration is required.' });
    }

    if (!documentFiles.length) {
      return res.status(400).json({ message: 'Please upload necessary documents (7/12, Aadhaar, Tax receipt).' });
    }

    // Process files
    // Since req.files is an array, we map uploaded docs.
    // In a full implementation, we might get explicit fields for each doc type using multer fields.
    // For now, we'll map them generically or if fieldnames were used.
    const documents = documentFiles.map((file, index) => {
      // Best guess based on index or front-end passing an array, 
      // ideally we'd use req.files['document1'] with multer.fields
      let docType = '7/12';
      if (index === 1) docType = 'Aadhaar';
      if (index === 2) docType = 'Tax';
      if (file.fieldname === 'aadhaar') docType = 'Aadhaar';
      if (file.fieldname === 'tax') docType = 'Tax';
      if (file.fieldname === '712') docType = '7/12';

      return {
        type: docType,
        url: getUploadedFileUrl(file),
      };
    });

    const user = await User.findById(req.user.id);

    // Optional: Kick off Mock OCR verification
    // We just run it and log the result to simulate processing.
    if (documents.length > 0) {
      verifyDocumentWithOCR(documents[0].url, user.fullName)
        .then(result => console.log('OCR Result:', result))
        .catch(err => console.error('OCR Error:', err));
    }

    const land = await Land.create({
      title,
      description: description || '',
      area,
      village,
      district,
      state,
      rentPrice,
      rentDuration: normalizedRentDuration,
      landImage: landImageFile ? getUploadedFileUrl(landImageFile) : '',
      owner: req.user.id,
      selfDeclaration: isSelfDeclared,
      documents,
      status: 'pending' // Default
    });

    res.status(201).json(land);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all verified lands (Public view)
// @route   GET /api/land
// @access  Public
export const getVerifiedLands = async (req, res) => {
  try {
    const lands = await Land.find({ status: 'verified' })
      .populate('owner', 'fullName phoneNumber profileImage')
      .sort({ createdAt: -1 });
    res.json(lands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single land
// @route   GET /api/land/:id
// @access  Public
export const getLandById = async (req, res) => {
  try {
    const land = await Land.findById(req.params.id).populate('owner', 'fullName phoneNumber email profileImage');
    if (land) {
      res.json(land);
    } else {
      res.status(404).json({ message: 'Land not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in farmer lands
// @route   GET /api/land/farmer
// @access  Private
export const getFarmerLands = async (req, res) => {
  try {
    const lands = await Land.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(lands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify Land Request (Admin)
// @route   PUT /api/land/:id/verify
// @access  Private/Admin
export const verifyLand = async (req, res) => {
  try {
    const { status } = req.body; // 'verified' or 'rejected'
    
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const land = await Land.findById(req.params.id);

    if (land) {
      land.status = status;
      const updatedLand = await land.save();
      
      // If setting to verified, we might want to also flag the user as a verified land owner overall if needed.
      if (status === 'verified') {
        const user = await User.findById(land.owner);
        if (user && !user.isVerified) {
            user.isVerified = true;
            await user.save();
        }
      }

      res.json(updatedLand);
    } else {
      res.status(404).json({ message: 'Land not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all pending land requests (Admin)
// @route   GET /api/land/pending
// @access  Private/Admin
export const getPendingLands = async (req, res) => {
  try {
    const lands = await Land.find({ status: 'pending' })
      .populate('owner', 'fullName phoneNumber')
      .sort({ createdAt: -1 });
    res.json(lands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all land listings for admin moderation
// @route   GET /api/land/admin/all
// @access  Private/Admin
export const getAdminLands = async (req, res) => {
  try {
    const lands = await Land.find({})
      .populate('owner', 'fullName phoneNumber')
      .populate('reports.user', 'fullName email phoneNumber')
      .sort({ reportCount: -1, createdAt: -1 });

    res.json(lands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Stream a land document for admin review
// @route   GET /api/land/document
// @access  Private/Admin
export const viewLandDocument = async (req, res) => {
  try {
    const { docUrl } = req.query;

    if (!docUrl) {
      return res.status(400).json({ message: 'Document URL is required.' });
    }

    const fileResponse = await getStoredFileResponse(docUrl);

    if (!fileResponse || !fileResponse.Body) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    if (fileResponse.ContentType) {
      res.setHeader('Content-Type', fileResponse.ContentType);
    }
    res.setHeader('Content-Disposition', 'inline');

    fileResponse.Body.pipe(res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Report a Land Listing
// @route   POST /api/land/:id/report
// @access  Private
export const reportLand = async (req, res) => {
  try {
    const { reason } = req.body;
    const land = await Land.findById(req.params.id);

    if (land) {
      // Check if already reported by this user
      const alreadyReported = land.reports.find(r => r.user.toString() === req.user.id.toString());
      if (alreadyReported) {
        return res.status(400).json({ message: 'You have already reported this listing.' });
      }

      land.reports.push({
        user: req.user.id,
        reason: reason || 'Suspicious listing'
      });
      // reportCount is computed pre-save
      await land.save();
      res.status(201).json({ message: 'Land reported successfully.' });
    } else {
      res.status(404).json({ message: 'Land not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
