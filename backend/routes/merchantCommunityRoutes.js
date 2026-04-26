import express from "express";
import {
  createCommunityChat,
  createCommunityListing,
  deleteCommunityListing,
  getCommunityChatMessages,
  getCommunityChats,
  getCommunityListings,
  getCommunityMerchants,
  sendCommunityMessage,
  updateCommunityListing
} from "../controllers/merchantCommunityController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/merchants", getCommunityMerchants);
router.get("/listings", getCommunityListings);
router.post("/listings", createCommunityListing);
router.put("/listings/:listingId", updateCommunityListing);
router.delete("/listings/:listingId", deleteCommunityListing);

router.get("/chats", getCommunityChats);
router.post("/chats", createCommunityChat);
router.get("/chats/:chatId", getCommunityChatMessages);
router.post("/chats/:chatId/messages", sendCommunityMessage);

export default router;
