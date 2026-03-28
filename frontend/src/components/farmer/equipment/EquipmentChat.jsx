import React, { useState, useEffect, useRef } from 'react';
import { equipmentAPI } from '../../../utils/api';
import { useAuth } from '../../../contexts/AuthContext';
import { getMediaUrl } from '../../../utils/media';

const EquipmentChat = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat._id);
    }
  }, [selectedChat?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChats = async () => {
    setLoading(true);
    try {
      const response = await equipmentAPI.getEquipmentChats();
      setChats(response.data.chats || []);
    } catch (err) {
      console.error('Failed to load chats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId) => {
    setMessagesLoading(true);
    try {
      const response = await equipmentAPI.getChatMessages(chatId);
      setMessages(response.data.chat?.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || sendingMessage) return;

    setSendingMessage(true);
    try {
      const response = await equipmentAPI.sendMessage(selectedChat._id, { message: newMessage.trim() });
      if (response.data.message) {
        setMessages(prev => [...prev, response.data.message]);
        setNewMessage('');
        // Update chat list to reflect new message
        fetchChats();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const getOtherParticipant = (chat) => {
    return chat.participants?.find(p => p._id !== user?.id);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-IN', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getUnreadCount = (chat) => {
    return chat.messages?.filter(
      msg => msg.sender?._id !== user?.id && !msg.read
    ).length || 0;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[600px] flex">
      {/* Chat List */}
      <div className={`w-full md:w-80 border-r border-gray-200 flex flex-col ${
        selectedChat ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">💬 Equipment Messages</h2>
          <p className="text-sm text-gray-500">{chats.length} conversation{chats.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <span className="text-4xl mb-2 block">💬</span>
              <p>No conversations yet</p>
              <p className="text-sm mt-1">Start a chat from equipment details</p>
            </div>
          ) : (
            chats.map((chat) => {
              const otherUser = getOtherParticipant(chat);
              const unread = getUnreadCount(chat);
              
              return (
                <button
                  key={chat._id}
                  onClick={() => setSelectedChat(chat)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 text-left ${
                    selectedChat?._id === chat._id ? 'bg-green-50' : ''
                  }`}
                >
                  {/* Equipment Image */}
                  <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={chat.equipment?.images?.[0]
                        ? getMediaUrl(chat.equipment.images[0], 'equipment')
                        : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23e5e7eb" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="30">🚜</text></svg>'
                      }
                      alt={chat.equipment?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">
                        {otherUser?.fullName || 'Unknown User'}
                      </h3>
                      {chat.lastMessage?.timestamp && (
                        <span className="text-xs text-gray-500">
                          {formatTime(chat.lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {chat.equipment?.name}
                    </p>
                    {chat.lastMessage?.message && (
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {chat.lastMessage.sender?._id === user?.id ? 'You: ' : ''}
                        {chat.lastMessage.message}
                      </p>
                    )}
                  </div>

                  {/* Unread Badge */}
                  {unread > 0 && (
                    <span className="bg-green-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                      {unread}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className={`flex-1 flex flex-col ${
        selectedChat ? 'flex' : 'hidden md:flex'
      }`}>
        {!selectedChat ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <span className="text-6xl mb-4 block">💬</span>
              <p className="text-lg">Select a conversation</p>
              <p className="text-sm mt-1">Choose from your conversations to start messaging</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center gap-3">
              <button
                onClick={() => setSelectedChat(null)}
                className="md:hidden text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={selectedChat.equipment?.images?.[0]
                    ? getMediaUrl(selectedChat.equipment.images[0], 'equipment')
                    : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23e5e7eb" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="30">🚜</text></svg>'
                  }
                  alt={selectedChat.equipment?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">
                  {getOtherParticipant(selectedChat)?.fullName}
                </h3>
                <p className="text-sm text-gray-500 truncate">
                  {selectedChat.equipment?.name} • {selectedChat.equipment?.category}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messagesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No messages yet</p>
                  <p className="text-sm mt-1">Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isOwn = msg.sender?._id === user?.id;
                  const showDate = index === 0 || 
                    new Date(msg.timestamp).toDateString() !== 
                    new Date(messages[index - 1]?.timestamp).toDateString();

                  return (
                    <React.Fragment key={msg._id || index}>
                      {showDate && (
                        <div className="text-center">
                          <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
                            {new Date(msg.timestamp).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                      
                      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] ${
                          isOwn 
                            ? 'bg-green-600 text-white rounded-l-lg rounded-tr-lg' 
                            : 'bg-white text-gray-900 rounded-r-lg rounded-tl-lg shadow-sm'
                        } px-4 py-2`}>
                          {!isOwn && (
                            <p className="text-xs font-medium text-green-600 mb-1">
                              {msg.sender?.fullName}
                            </p>
                          )}
                          <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                          <p className={`text-xs mt-1 ${
                            isOwn ? 'text-green-200' : 'text-gray-400'
                          }`}>
                            {formatMessageTime(msg.timestamp)}
                            {isOwn && msg.read && ' ✓✓'}
                          </p>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendingMessage}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {sendingMessage ? (
                    <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    '➤'
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default EquipmentChat;
