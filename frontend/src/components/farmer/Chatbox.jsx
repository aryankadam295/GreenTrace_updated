import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../../utils/api';

const Chatbox = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat._id);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChats = async () => {
    try {
      const response = await chatAPI.getUserChats();
      setChats(response.data.chats);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const response = await chatAPI.getChatMessages(chatId);
      setMessages(response.data.chat.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || sending) return;

    setSending(true);
    try {
      const response = await chatAPI.sendMessage(selectedChat._id, {
        message: newMessage.trim()
      });

      // Add the new message to the current messages
      setMessages(prev => [...prev, response.data.message]);

      // Update the chat's last message in the chat list
      setChats(prev => prev.map(chat =>
        chat._id === selectedChat._id
          ? { ...chat, lastMessage: response.data.message }
          : chat
      ));

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOtherParticipant = (chat) => {
    // For farmers, the other participant is the merchant
    return chat.participants.find(p => p.role === 'merchant');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[600px] flex bg-white rounded-lg shadow">
      {/* Chat List */}
      <div className="w-1/3 border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Chats</h2>
        </div>

        <div className="overflow-y-auto h-full">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No chats yet. Chats will appear here when merchants contact you about your products.
            </div>
          ) : (
            chats.map((chat) => {
              const otherParticipant = getOtherParticipant(chat);
              return (
                <div
                  key={chat._id}
                  onClick={() => setSelectedChat(chat)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedChat?._id === chat._id ? 'bg-green-50 border-r-4 border-green-600' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-green-600 font-semibold">
                        {otherParticipant?.fullName?.charAt(0)?.toUpperCase() || 'M'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {otherParticipant?.fullName || 'Merchant'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {chat.product?.productName || 'Product'}
                      </p>
                      {chat.lastMessage && (
                        <p className="text-xs text-gray-600 truncate mt-1">
                          {chat.lastMessage.message}
                        </p>
                      )}
                    </div>
                    {chat.lastMessage && (
                      <div className="text-xs text-gray-400">
                        {formatTime(chat.lastMessage.timestamp)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-semibold text-sm">
                    {getOtherParticipant(selectedChat)?.fullName?.charAt(0)?.toUpperCase() || 'M'}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {getOtherParticipant(selectedChat)?.fullName || 'Merchant'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {selectedChat.product?.productName || 'Product'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.sender.role === 'farmer' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender.role === 'farmer'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender.role === 'farmer' ? 'text-green-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <form onSubmit={sendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-4">💬</div>
              <p>Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chatbox;
