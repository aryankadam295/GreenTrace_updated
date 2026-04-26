import React, { useEffect, useRef, useState } from "react";
import { MessageCircle, Plus, Search, Store, Users } from "lucide-react";
import { merchantCommunityAPI } from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";

const categories = ["Grains", "Fruits", "Vegetables", "Pulses", "Dairy", "Spices", "Others"];
const units = ["kg", "quintal", "ton", "pieces", "liters", "bags"];
const qualityGrades = ["Premium", "Grade A", "Grade B", "Standard"];

const emptyListingForm = {
  productName: "",
  category: "Grains",
  quantity: "",
  unit: "kg",
  pricePerUnit: "",
  minOrderQuantity: "1",
  qualityGrade: "Standard",
  description: "",
  preferredTrade: "",
  city: "",
  state: ""
};

const MerchantCommunity = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState("marketplace");
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [filters, setFilters] = useState({ search: "", category: "", city: "", state: "" });
  const [merchantFilters, setMerchantFilters] = useState({ search: "", city: "", state: "", businessType: "" });
  const [form, setForm] = useState({
    ...emptyListingForm,
    city: user?.city || "",
    state: user?.merchantState || ""
  });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const messagesListRef = useRef(null);
  const currentUserId = user?._id || user?.id;

  useEffect(() => {
    fetchListings();
    fetchMyListings();
    fetchMerchants();
    fetchChats();
  }, []);

  useEffect(() => {
    if (selectedChatId) fetchMessages(selectedChatId);
  }, [selectedChatId]);

  useEffect(() => {
    if (!messagesListRef.current) return;
    messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
  }, [messages]);

  const showNotice = (text) => {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 3500);
  };

  const fetchListings = async (nextFilters = filters) => {
    try {
      setLoading(true);
      const response = await merchantCommunityAPI.getListings({
        ...nextFilters,
        status: "active",
        limit: 24
      });
      setListings(response.data.listings || []);
    } catch (error) {
      showNotice(error.response?.data?.message || "Unable to load community listings");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyListings = async () => {
    try {
      const response = await merchantCommunityAPI.getListings({
        mine: "true",
        status: "",
        limit: 30
      });
      setMyListings(response.data.listings || []);
    } catch (error) {
      console.error("Unable to load my community listings:", error);
    }
  };

  const fetchMerchants = async (nextFilters = merchantFilters) => {
    try {
      const response = await merchantCommunityAPI.getMerchants({
        ...nextFilters,
        limit: 24
      });
      setMerchants(response.data.merchants || []);
    } catch (error) {
      console.error("Unable to load merchants:", error);
    }
  };

  const fetchChats = async () => {
    try {
      const response = await merchantCommunityAPI.getChats();
      setChats(response.data.chats || []);
    } catch (error) {
      console.error("Unable to load community chats:", error);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      setMessagesLoading(true);
      const response = await merchantCommunityAPI.getChatMessages(chatId);
      setMessages(response.data.chat.messages || []);
      setSelectedChat(response.data.chat);
    } catch (error) {
      showNotice(error.response?.data?.message || "Unable to load messages");
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleListingSubmit = async (event) => {
    event.preventDefault();

    try {
      await merchantCommunityAPI.createListing({
        ...form,
        quantity: Number(form.quantity),
        pricePerUnit: Number(form.pricePerUnit),
        minOrderQuantity: Number(form.minOrderQuantity || 1)
      });
      setForm({
        ...emptyListingForm,
        city: user?.city || "",
        state: user?.merchantState || ""
      });
      showNotice("Surplus listing published for merchant community");
      fetchListings();
      fetchMyListings();
      setActiveView("marketplace");
    } catch (error) {
      showNotice(error.response?.data?.message || "Unable to create listing");
    }
  };

  const updateListingStatus = async (listingId, status) => {
    try {
      await merchantCommunityAPI.updateListing(listingId, { status });
      showNotice("Listing status updated");
      fetchListings();
      fetchMyListings();
    } catch (error) {
      showNotice(error.response?.data?.message || "Unable to update listing");
    }
  };

  const startChat = async ({ merchantId, listing, customMessage }) => {
    try {
      const message =
        customMessage ||
        `Hi, I am interested in discussing ${listing.productName}. Is it still available for merchant trade?`;
      const response = await merchantCommunityAPI.createChat({
        merchantId,
        listingId: listing?._id,
        message
      });
      setSelectedChat(response.data.chat);
      setSelectedChatId(response.data.chat._id);
      setMessages(response.data.chat.messages || []);
      setActiveView("messages");
      fetchChats();
      showNotice(response.data.existing ? "Community chat opened" : "Community chat started");
    } catch (error) {
      showNotice(error.response?.data?.message || "Unable to start chat");
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!newMessage.trim() || !selectedChatId) return;

    try {
      const response = await merchantCommunityAPI.sendMessage(selectedChatId, {
        message: newMessage.trim()
      });
      setMessages((prev) => [...prev, response.data.message]);
      setNewMessage("");
      fetchChats();
    } catch (error) {
      showNotice(error.response?.data?.message || "Unable to send message");
    }
  };

  const getOtherMerchant = (chat) => {
    return chat.participants?.find((participant) => participant._id !== currentUserId);
  };

  const handleSelectChat = (chat) => {
    if (chat._id === selectedChatId) return;

    setSelectedChat(chat);
    setSelectedChatId(chat._id);
    setMessages([]);
    setNewMessage("");
  };

  const formatPrice = (listing) => `Rs ${Number(listing.pricePerUnit || 0).toLocaleString("en-IN")}/${listing.unit}`;

  const formatDate = (date) => new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short"
  });

  const handleFilterChange = (key, value) => {
    const nextFilters = { ...filters, [key]: value };
    setFilters(nextFilters);
    fetchListings(nextFilters);
  };

  const handleMerchantFilterChange = (key, value) => {
    const nextFilters = { ...merchantFilters, [key]: value };
    setMerchantFilters(nextFilters);
    fetchMerchants(nextFilters);
  };

  const renderMarketplace = () => (
    <>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Merchant Community</h1>
          <p className="text-gray-600">Trade surplus stock, discover nearby merchants, and move slow inventory faster.</p>
        </div>
        <button
          onClick={() => setActiveView("create")}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-green-700 px-4 py-2 font-semibold text-white hover:bg-green-800"
        >
          <Plus size={18} />
          Add Surplus Listing
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 rounded-lg bg-white p-5 shadow md:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Search stock</label>
          <input
            value={filters.search}
            onChange={(event) => handleFilterChange("search", event.target.value)}
            placeholder="Product, city, need"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
          <select
            value={filters.category}
            onChange={(event) => handleFilterChange("category", event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All categories</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">City</label>
          <input
            value={filters.city}
            onChange={(event) => handleFilterChange("city", event.target.value)}
            placeholder="Mumbai, Pune..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">State</label>
          <input
            value={filters.state}
            onChange={(event) => handleFilterChange("state", event.target.value)}
            placeholder="Maharashtra"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-600">Loading community stock...</div>
      ) : listings.length === 0 ? (
        <div className="rounded-lg bg-white p-10 text-center shadow">
          <Store className="mx-auto mb-3 text-gray-400" size={42} />
          <h3 className="text-lg font-semibold text-gray-900">No surplus listings found</h3>
          <p className="mt-1 text-gray-600">Create one or adjust filters to find merchant trade opportunities.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => {
            const isMine = listing.merchant?._id === currentUserId;
            return (
              <div key={listing._id} className="rounded-lg bg-white p-5 shadow transition hover:shadow-md">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{listing.productName}</h3>
                    <p className="text-sm text-gray-600">{listing.category} · {listing.qualityGrade}</p>
                  </div>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    {listing.status}
                  </span>
                </div>

                <div className="mb-4 space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between"><span>Available</span><strong>{listing.quantity} {listing.unit}</strong></div>
                  <div className="flex justify-between"><span>Price</span><strong className="text-green-700">{formatPrice(listing)}</strong></div>
                  <div className="flex justify-between"><span>Minimum order</span><strong>{listing.minOrderQuantity} {listing.unit}</strong></div>
                  <div className="flex justify-between"><span>Location</span><strong>{listing.city}, {listing.state}</strong></div>
                </div>

                {listing.description && <p className="mb-3 text-sm text-gray-600">{listing.description}</p>}
                {listing.preferredTrade && (
                  <p className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                    Looking for: {listing.preferredTrade}
                  </p>
                )}

                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-900">{listing.merchant?.businessName}</p>
                  <p className="text-xs text-gray-500">{listing.merchant?.businessType} · {listing.merchant?.city}, {listing.merchant?.merchantState}</p>
                </div>

                <button
                  disabled={isMine}
                  onClick={() => startChat({ merchantId: listing.merchant?._id, listing })}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  <MessageCircle size={16} />
                  {isMine ? "Your Listing" : "Discuss Trade"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  const renderMerchants = () => (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Merchant Directory</h1>
        <p className="text-gray-600">Find verified trade partners by business type, location, and buying interest.</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 rounded-lg bg-white p-5 shadow md:grid-cols-4">
        <input
          value={merchantFilters.search}
          onChange={(event) => handleMerchantFilterChange("search", event.target.value)}
          placeholder="Search business or products"
          className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <select
          value={merchantFilters.businessType}
          onChange={(event) => handleMerchantFilterChange("businessType", event.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">All business types</option>
          <option value="Retailer">Retailer</option>
          <option value="Wholesaler">Wholesaler</option>
        </select>
        <input
          value={merchantFilters.city}
          onChange={(event) => handleMerchantFilterChange("city", event.target.value)}
          placeholder="City"
          className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <input
          value={merchantFilters.state}
          onChange={(event) => handleMerchantFilterChange("state", event.target.value)}
          placeholder="State"
          className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {merchants.map((merchant) => (
          <div key={merchant._id} className="rounded-lg bg-white p-5 shadow">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 font-bold text-green-700">
                {merchant.businessName?.charAt(0)?.toUpperCase() || "M"}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{merchant.businessName}</h3>
                <p className="text-sm text-gray-600">{merchant.fullName} · {merchant.businessType}</p>
                <p className="text-xs text-gray-500">{merchant.city}, {merchant.merchantState}</p>
              </div>
            </div>
            <p className="mb-4 min-h-10 text-sm text-gray-600">
              Interested in: {merchant.productsOfInterest || "Agricultural products"}
            </p>
            <button
              onClick={() =>
                startChat({
                  merchantId: merchant._id,
                  customMessage: "Hi, I found your profile in the merchant community. Can we discuss possible trade opportunities?"
                })
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
            >
              <MessageCircle size={16} />
              Contact Merchant
            </button>
          </div>
        ))}
      </div>
    </>
  );

  const renderCreateListing = () => (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Add Surplus Listing</h1>
        <p className="text-gray-600">Post stock that is moving slowly so other merchants can buy or trade with you.</p>
      </div>

      <form onSubmit={handleListingSubmit} className="rounded-lg bg-white p-6 shadow">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <input required value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} placeholder="Product name" className="rounded-md border border-gray-300 px-3 py-2" />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2">
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>
          <select value={form.qualityGrade} onChange={(e) => setForm({ ...form, qualityGrade: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2">
            {qualityGrades.map((grade) => <option key={grade}>{grade}</option>)}
          </select>
          <input required type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="Available quantity" className="rounded-md border border-gray-300 px-3 py-2" />
          <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2">
            {units.map((unit) => <option key={unit}>{unit}</option>)}
          </select>
          <input required type="number" min="0" value={form.pricePerUnit} onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })} placeholder="Price per unit" className="rounded-md border border-gray-300 px-3 py-2" />
          <input type="number" min="0" value={form.minOrderQuantity} onChange={(e) => setForm({ ...form, minOrderQuantity: e.target.value })} placeholder="Minimum order quantity" className="rounded-md border border-gray-300 px-3 py-2" />
          <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" className="rounded-md border border-gray-300 px-3 py-2" />
          <input required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="State" className="rounded-md border border-gray-300 px-3 py-2" />
        </div>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Stock condition, packaging, expiry, transport details" className="mt-4 min-h-24 w-full rounded-md border border-gray-300 px-3 py-2" />
        <input value={form.preferredTrade} onChange={(e) => setForm({ ...form, preferredTrade: e.target.value })} placeholder="Preferred trade: cash, exchange, bulk buyer, nearby pickup..." className="mt-4 w-full rounded-md border border-gray-300 px-3 py-2" />
        <div className="mt-5 flex gap-3">
          <button type="submit" className="rounded-md bg-green-700 px-5 py-2 font-semibold text-white hover:bg-green-800">Publish Listing</button>
          <button type="button" onClick={() => setActiveView("marketplace")} className="rounded-md bg-gray-100 px-5 py-2 font-semibold text-gray-700 hover:bg-gray-200">Cancel</button>
        </div>
      </form>
    </div>
  );

  const renderMyListings = () => (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Community Listings</h1>
          <p className="text-gray-600">Keep your surplus stock status updated so merchants do not chase unavailable items.</p>
        </div>
        <button onClick={() => setActiveView("create")} className="rounded-md bg-green-700 px-4 py-2 font-semibold text-white hover:bg-green-800">Add Listing</button>
      </div>
      <div className="space-y-4">
        {myListings.map((listing) => (
          <div key={listing._id} className="flex flex-col gap-4 rounded-lg bg-white p-5 shadow lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{listing.productName}</h3>
              <p className="text-sm text-gray-600">{listing.quantity} {listing.unit} · {formatPrice(listing)} · {listing.city}, {listing.state}</p>
              <p className="text-xs text-gray-500">Created {formatDate(listing.createdAt)} · Status: {listing.status}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["active", "reserved", "sold", "closed"].map((status) => (
                <button
                  key={status}
                  onClick={() => updateListingStatus(listing._id, status)}
                  className={`rounded-md px-3 py-2 text-sm font-semibold ${listing.status === status ? "bg-green-700 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        ))}
        {myListings.length === 0 && <div className="rounded-lg bg-white p-8 text-center text-gray-600 shadow">No community listings yet.</div>}
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className="min-h-[620px] rounded-lg bg-white shadow lg:flex">
      <div className="border-b border-gray-200 lg:w-1/3 lg:border-b-0 lg:border-r">
        <div className="border-b p-4">
          <h2 className="font-semibold text-gray-900">Community Messages</h2>
          <p className="text-sm text-gray-500">Direct merchant-to-merchant conversations</p>
        </div>
        <div className="max-h-72 overflow-y-auto lg:max-h-[590px]">
          {chats.map((chat) => {
            const other = getOtherMerchant(chat);
            return (
              <button
                key={chat._id}
                onClick={() => handleSelectChat(chat)}
                className={`w-full border-b p-4 text-left hover:bg-green-50 ${selectedChatId === chat._id ? "bg-green-50" : ""}`}
              >
                <p className="font-medium text-gray-900">{other?.businessName || other?.fullName || "Merchant"}</p>
                <p className="text-xs text-gray-500">{chat.listing?.productName || "General trade discussion"}</p>
                {chat.lastMessage?.message && <p className="mt-1 truncate text-sm text-gray-600">{chat.lastMessage.message}</p>}
              </button>
            );
          })}
          {chats.length === 0 && <p className="p-5 text-sm text-gray-500">No community chats yet.</p>}
        </div>
      </div>

      <div className="flex min-h-[420px] flex-1 flex-col">
        {selectedChat ? (
          <>
            <div className="flex items-center justify-between gap-3 border-b bg-gray-50 p-4">
              <div>
                <h3 className="font-semibold text-gray-900">{getOtherMerchant(selectedChat)?.businessName || "Merchant"}</h3>
                <p className="text-sm text-gray-500">{selectedChat.listing?.productName || "General trade discussion"}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveView("marketplace")}
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-green-50"
              >
                Back
              </button>
            </div>
            <div ref={messagesListRef} className="h-[460px] flex-1 space-y-3 overflow-y-auto p-4">
              {messagesLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-500">
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-500">
                  No messages yet. Start the conversation.
                </div>
              ) : messages.map((message) => {
                const isMine = message.sender?._id === currentUserId;
                return (
                  <div key={message._id || message.timestamp} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-md rounded-lg px-4 py-2 ${isMine ? "bg-green-700 text-white" : "bg-gray-100 text-gray-900"}`}>
                      <p className="text-sm">{message.message}</p>
                      <p className={`mt-1 text-xs ${isMine ? "text-green-100" : "text-gray-500"}`}>{new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <form onSubmit={sendMessage} className="flex gap-2 border-t p-4">
              <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Discuss price, pickup, quantity, payment..." className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
              <button type="submit" className="rounded-md bg-green-700 px-5 py-2 font-semibold text-white hover:bg-green-800">Send</button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-center text-gray-500">
            <div>
              <MessageCircle className="mx-auto mb-3" size={42} />
              <p>Select a community chat or contact a merchant from the marketplace.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const viewButtons = [
    { id: "marketplace", label: "Marketplace", icon: Search },
    { id: "merchants", label: "Merchants", icon: Users },
    { id: "myListings", label: "My Listings", icon: Store },
    { id: "messages", label: "Messages", icon: MessageCircle }
  ];

  return (
    <div className="merchant-community-root">
      {notice && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">
          {notice}
        </div>
      )}

      <div className="sticky top-0 z-20 mb-6 flex flex-wrap gap-2 bg-gray-50 py-3">
        {viewButtons.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveView(id)}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold ${activeView === id ? "bg-green-700 text-white" : "bg-white text-gray-700 shadow hover:bg-green-50"}`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {activeView === "marketplace" && renderMarketplace()}
      {activeView === "merchants" && renderMerchants()}
      {activeView === "create" && renderCreateListing()}
      {activeView === "myListings" && renderMyListings()}
      {activeView === "messages" && renderMessages()}
    </div>
  );
};

export default MerchantCommunity;
