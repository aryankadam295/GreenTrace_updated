# TODO: Add Chatbox Section to Farmer and Merchant Dashboards

## Backend Implementation
- [x] Create backend/models/Chat.js for chat message schema
- [x] Create backend/controllers/chatController.js for chat logic
- [x] Create backend/routes/chatRoutes.js for chat endpoints
- [x] Update backend/server.js to register chat routes

## Frontend Implementation
- [x] Update frontend/src/utils/api.js with chat API functions
- [x] Create frontend/src/components/farmer/Chatbox.jsx
- [x] Create frontend/src/components/merchant/Chatbox.jsx
- [x] Update frontend/src/components/FarmerDashboard.jsx to add Chat tab
- [x] Update frontend/src/components/MerchantDashboard.jsx to add Chat tab

## Testing and Followup
- [ ] Test chat functionality between farmer and merchant accounts
- [ ] Add authentication checks for chat access
- [ ] Implement real-time updates (WebSockets or polling)
