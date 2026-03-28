import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import './LandVerification.css';

const statusOptions = [
    { id: 'all', label: 'All Listings' },
    { id: 'pending', label: 'Pending' },
    { id: 'verified', label: 'Verified' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'reported', label: 'Reported' }
];

const LandVerification = ({ embedded = false }) => {
    const [lands, setLands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [documentBlobUrls, setDocumentBlobUrls] = useState({});
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchAdminLands();
    }, []);

    useEffect(() => {
        return () => {
            Object.values(documentBlobUrls).forEach((blobUrl) => {
                if (blobUrl) {
                    URL.revokeObjectURL(blobUrl);
                }
            });
        };
    }, [documentBlobUrls]);

    const getFileExtension = (docUrl) => {
        if (!docUrl) return '';
        const cleanUrl = docUrl.split('?')[0].split('#')[0];
        return cleanUrl.split('.').pop()?.toLowerCase() || '';
    };

    const isImageDocument = (docUrl) => {
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(getFileExtension(docUrl));
    };

    const isPdfDocument = (docUrl) => {
        return getFileExtension(docUrl) === 'pdf';
    };

    const getDocumentUrl = (docUrl) => {
        if (!docUrl) return '#';
        const apiBaseUrl = api.defaults.baseURL || '';
        return `${apiBaseUrl}/land/document?docUrl=${encodeURIComponent(docUrl)}`;
    };

    const loadDocumentBlobs = async (landItems) => {
        const nextBlobUrls = {};

        await Promise.all(
            landItems.flatMap((land) =>
                (land.documents || []).map(async (doc) => {
                    try {
                        const response = await api.get('/land/document', {
                            params: { docUrl: doc.url },
                            responseType: 'blob'
                        });
                        nextBlobUrls[doc.url] = URL.createObjectURL(response.data);
                    } catch (blobError) {
                        console.error('Failed to load document preview:', doc.url, blobError);
                    }
                })
            )
        );

        setDocumentBlobUrls((prev) => {
            Object.values(prev).forEach((blobUrl) => {
                if (blobUrl) {
                    URL.revokeObjectURL(blobUrl);
                }
            });
            return nextBlobUrls;
        });
    };

    const fetchAdminLands = async () => {
        try {
            const response = await api.get('/land/admin/all');
            setLands(response.data);
            await loadDocumentBlobs(response.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch land listings. Ensure you are an Admin.');
            setLoading(false);
        }
    };

    const handleVerifyDecision = async (landId, decision) => {
        if (!window.confirm(`Are you sure you want to ${decision} this listing?`)) return;

        try {
            const response = await api.put(`/land/${landId}/verify`, { status: decision });
            setLands((prev) =>
                prev.map((land) =>
                    land._id === landId ? { ...land, status: response.data.status } : land
                )
            );
        } catch (err) {
            console.error(err);
            alert('Error updating status.');
        }
    };

    const filteredLands = lands.filter((land) => {
        if (statusFilter === 'reported') return land.reportCount > 0;
        if (statusFilter === 'all') return true;
        return land.status === statusFilter;
    });

    if (loading) return <div className="admin-loading">Loading Land Listings...</div>;

    return (
        <div className={embedded ? 'admin-verify-container embedded' : 'admin-verify-container'}>
            <div className="land-verify-header">
                <div>
                    <h2>Land Verification Dashboard</h2>
                    <p className="subtitle">Review all land listings, investigate reports, and update approvals at any time.</p>
                </div>
                <button className="refresh-btn" onClick={fetchAdminLands}>
                    Refresh Listings
                </button>
            </div>

            {error && <div className="error-alert">{error}</div>}

            <div className="land-filter-bar">
                {statusOptions.map((option) => (
                    <button
                        key={option.id}
                        className={statusFilter === option.id ? 'filter-btn active' : 'filter-btn'}
                        onClick={() => setStatusFilter(option.id)}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            {filteredLands.length === 0 && !loading && !error && (
                <div className="no-pending">
                    No land listings match this filter.
                </div>
            )}

            <div className="verification-list">
                {filteredLands.map((land) => (
                    <div key={land._id} className="verification-card">
                        <div className="info-section">
                            <h3>{land.title}</h3>
                            <div className="meta-info">
                                <p><strong>Owner:</strong> {land.owner?.fullName}</p>
                                <p><strong>Phone:</strong> {land.owner?.phoneNumber}</p>
                                <p><strong>Self-Declared:</strong> {land.selfDeclaration ? 'Yes' : 'No'}</p>
                                <p><strong>Status:</strong> {land.status}</p>
                                <p><strong>Location:</strong> {land.village}, {land.district}, {land.state}</p>
                                <p><strong>Rent:</strong> INR {land.rentPrice} / {land.rentDuration === 'monthly' ? 'month' : 'year'}</p>
                                <p><strong>Reports:</strong> {land.reportCount}</p>
                            </div>

                            {land.reportCount > 0 && (
                                <div className="reports-panel">
                                    <h4>Reported Reasons</h4>
                                    {land.reports.map((report, index) => (
                                        <div key={`${land._id}-report-${index}`} className="report-item">
                                            <p><strong>Reason:</strong> {report.reason || 'No reason provided'}</p>
                                            <p><strong>Reported By:</strong> {report.user?.fullName || 'Unknown user'}</p>
                                            <p><strong>Contact:</strong> {report.user?.phoneNumber || report.user?.email || 'Unavailable'}</p>
                                            <p><strong>Date:</strong> {new Date(report.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="docs-section">
                            <h4>Uploaded Documents</h4>
                            <div className="docs-grid">
                                {land.documents && land.documents.length > 0 ? land.documents.map((doc, index) => (
                                    <div key={index} className="doc-item">
                                        <div className="doc-preview-section">
                                            <span className="doc-type">{doc.type}</span>
                                            {isImageDocument(doc.url) ? (
                                                <a href={documentBlobUrls[doc.url] || getDocumentUrl(doc.url)} target="_blank" rel="noopener noreferrer" className="doc-preview-link">
                                                    <img
                                                        src={documentBlobUrls[doc.url] || ''}
                                                        alt={`${doc.type} preview`}
                                                        className="doc-preview-image"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                        }}
                                                    />
                                                </a>
                                            ) : (
                                                <div className={`doc-file-badge ${isPdfDocument(doc.url) ? 'pdf-badge' : 'generic-badge'}`}>
                                                    {isPdfDocument(doc.url) ? 'PDF Document' : `${getFileExtension(doc.url).toUpperCase() || 'FILE'} Document`}
                                                </div>
                                            )}
                                        </div>
                                        <a
                                            href={documentBlobUrls[doc.url] || getDocumentUrl(doc.url)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="view-doc-btn"
                                        >
                                            Open Document
                                        </a>
                                    </div>
                                )) : <p>No documents uploaded.</p>}
                            </div>
                        </div>

                        <div className="action-section">
                            <button className="btn-approve" onClick={() => handleVerifyDecision(land._id, 'verified')}>
                                Approve
                            </button>
                            <button className="btn-reject" onClick={() => handleVerifyDecision(land._id, 'rejected')}>
                                Reject
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LandVerification;
