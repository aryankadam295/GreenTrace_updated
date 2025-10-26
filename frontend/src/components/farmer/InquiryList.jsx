import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const InquiryList = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchInquiries();
  }, [filter]);

  const fetchInquiries = async () => {
    try {
      const statusParam = filter !== 'all' ? `?status=${filter}` : '';
      const response = await api.get(`/inquiries/farmer${statusParam}`);
      setInquiries(response.data.inquiries);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      setMessage('Error loading inquiries');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (inquiryId, status = 'responded') => {
    try {
      await api.put(`/inquiries/${inquiryId}/respond`, {
        farmerResponse: responseText,
        status
      });
      setMessage('Response sent successfully');
      setSelectedInquiry(null);
      setResponseText('');
      fetchInquiries();
    } catch (error) {
      setMessage('Error sending response');
    }
  };

  const handleStatusUpdate = async (inquiryId, status) => {
    try {
      await api.put(`/inquiries/${inquiryId}/status`, { status });
      setMessage('Inquiry status updated successfully');
      fetchInquiries();
    } catch (error) {
      setMessage('Error updating inquiry status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'responded': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2">Loading inquiries...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Inquiries</h1>
        <p className="text-gray-600">Manage inquiries from merchants</p>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded ${
          message.includes('successfully') 
            ? 'bg-green-100 text-green-700 border border-green-300' 
            : 'bg-red-100 text-red-700 border border-red-300'
        }`}>
          {message}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'all', label: 'All Inquiries' },
              { key: 'pending', label: 'Pending' },
              { key: 'responded', label: 'Responded' },
              { key: 'accepted', label: 'Accepted' },
              { key: 'rejected', label: 'Rejected' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === tab.key
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Inquiries List */}
      {inquiries.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No inquiries found</h3>
          <p className="text-gray-600">Inquiries from merchants will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map(inquiry => (
            <div key={inquiry._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {inquiry.subject}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                      {inquiry.status}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Product:</strong> {inquiry.productId?.productName}</p>
                    <p><strong>From:</strong> {inquiry.merchantName}</p>
                    <p><strong>Contact:</strong> {inquiry.merchantContact}</p>
                    <p><strong>Date:</strong> {formatDate(inquiry.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Inquiry Details */}
              <div className="bg-gray-50 rounded p-4 mb-4">
                <p className="text-gray-700 mb-3">{inquiry.message}</p>
                
                {inquiry.requestedQuantity && (
                  <div className="flex space-x-6 text-sm">
                    <span><strong>Requested Quantity:</strong> {inquiry.requestedQuantity}</span>
                    {inquiry.offeredPrice && (
                      <span><strong>Offered Price:</strong> ₹{inquiry.offeredPrice}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Farmer Response */}
              {inquiry.farmerResponse && (
                <div className="bg-green-50 rounded p-4 mb-4">
                  <p className="text-sm font-medium text-green-800 mb-1">Your Response:</p>
                  <p className="text-green-700">{inquiry.farmerResponse}</p>
                  <p className="text-xs text-green-600 mt-2">
                    Responded on {formatDate(inquiry.responseDate)}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                {inquiry.status === 'pending' && (
                  <>
                    <button
                      onClick={() => setSelectedInquiry(inquiry)}
                      className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Respond
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(inquiry._id, 'accepted')}
                      className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(inquiry._id, 'rejected')}
                      className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors"
                    >
                      Reject
                    </button>
                  </>
                )}
                
                {inquiry.status === 'responded' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(inquiry._id, 'accepted')}
                      className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(inquiry._id, 'rejected')}
                      className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors"
                    >
                      Reject
                    </button>
                  </>
                )}
                
                {(inquiry.status === 'accepted' || inquiry.status === 'rejected') && (
                  <button
                    onClick={() => handleStatusUpdate(inquiry._id, 'closed')}
                    className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Response Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-semibold mb-4">Respond to Inquiry</h3>
            
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600 mb-1">
                <strong>Subject:</strong> {selectedInquiry.subject}
              </p>
              <p className="text-sm text-gray-600">
                <strong>From:</strong> {selectedInquiry.merchantName}
              </p>
            </div>

            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Type your response here..."
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
            />

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setSelectedInquiry(null);
                  setResponseText('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRespond(selectedInquiry._id)}
                disabled={!responseText.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InquiryList;
