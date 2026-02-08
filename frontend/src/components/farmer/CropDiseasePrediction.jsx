import React, { useState } from 'react';
import { Upload, Loader, AlertCircle, CheckCircle, Info, Leaf, Activity, Eye, TrendingUp } from 'lucide-react';

const CropDiseasePrediction = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const cropOptions = [
    { value: '', label: 'Select a crop', icon: '🌾' },
    { value: 'tomato', label: 'Tomato', icon: '🍅' },
    { value: 'potato', label: 'Potato', icon: '🥔' },
    { value: 'rice', label: 'Rice', icon: '🌾' },
    { value: 'wheat', label: 'Wheat', icon: '🌾' },
    { value: 'cotton', label: 'Cotton', icon: '☁️' }
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    setError('');
    setResult(null);

    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid image file (JPG, JPEG, or PNG)');
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setError('File size must be less than 5MB');
        return;
      }

      setSelectedImage(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropChange = (e) => {
    setSelectedCrop(e.target.value);
    setError('');
    setResult(null);
  };

  const handleScanCrop = async () => {
    setIsLoading(true);
    setError('');

    try {
      // const formData = new FormData();
      // formData.append('image', selectedImage);
      // formData.append('crop', selectedCrop);
      // 
      // const response = await fetch('YOUR_API_ENDPOINT', {
      //   method: 'POST',
      //   body: formData
      // });
      // 
      // const data = await response.json();
      // setResult(data);

      await new Promise(resolve => setTimeout(resolve, 2000));
      setError('API integration pending. Please connect your ML model endpoint.');
    } catch (err) {
      setError('Failed to analyze image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonDisabled = !selectedImage || !selectedCrop || isLoading;

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a5928 0%, #2d7a3e 25%, #4caf50 50%, #66bb6a 75%, #a5d6a7 100%)',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    },
    backgroundPattern: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0.05,
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 30c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10zm-20 0c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
      pointerEvents: 'none'
    },
    pageHeader: {
      textAlign: 'center',
      marginBottom: '3rem',
      position: 'relative',
      zIndex: 1
    },
    headerBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      background: 'rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)',
      padding: '0.5rem 1.5rem',
      borderRadius: '50px',
      color: 'white',
      fontSize: '0.875rem',
      fontWeight: '500',
      marginBottom: '1rem',
      border: '1px solid rgba(255, 255, 255, 0.3)'
    },
    title: {
      color: 'white',
      fontSize: '2.5rem',
      fontWeight: '800',
      marginBottom: '0.75rem',
      textShadow: '0 2px 20px rgba(0,0,0,0.2)',
      letterSpacing: '-0.5px'
    },
    subtitle: {
      color: 'rgba(255, 255, 255, 0.95)',
      fontSize: '1.1rem',
      fontWeight: '400',
      maxWidth: '600px',
      margin: '0 auto'
    },
    contentWrapper: {
      maxWidth: '1400px',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '2rem',
      alignItems: 'start',
      position: 'relative',
      zIndex: 1
    },
    uploadSection: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    },
    card: {
      background: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      padding: '2rem',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.5)',
      border: '1px solid rgba(255, 255, 255, 0.8)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease'
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      marginBottom: '1.5rem'
    },
    cardIcon: {
      width: '40px',
      height: '40px',
      background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white'
    },
    cardTitle: {
      color: '#1b5e20',
      fontSize: '1.25rem',
      fontWeight: '700',
      margin: 0
    },
    fileInput: {
      display: 'none'
    },
    uploadLabel: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 2rem',
      border: '3px dashed #81c784',
      borderRadius: '16px',
      background: 'linear-gradient(135deg, #f1f8f4 0%, #e8f5e9 100%)',
      cursor: 'pointer',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'hidden'
    },
    uploadIcon: {
      color: '#4caf50',
      marginBottom: '1rem',
      filter: 'drop-shadow(0 4px 12px rgba(76, 175, 80, 0.3))'
    },
    uploadText: {
      color: '#1b5e20',
      fontSize: '1.1rem',
      fontWeight: '600',
      margin: 0
    },
    uploadSubtext: {
      color: '#558b2f',
      fontSize: '0.9rem',
      margin: '0.5rem 0 0 0',
      fontWeight: '500'
    },
    imagePreview: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1.5rem'
    },
    previewImageWrapper: {
      position: 'relative',
      maxWidth: '100%',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
    },
    previewImage: {
      maxWidth: '100%',
      maxHeight: '300px',
      borderRadius: '12px',
      objectFit: 'contain',
      display: 'block'
    },
    changeImageBtn: {
      padding: '0.75rem 2rem',
      background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '0.95rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)'
    },
    errorMessage: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '1rem 1.25rem',
      background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
      border: '2px solid #ef5350',
      borderRadius: '12px',
      color: '#c62828',
      fontSize: '0.9rem',
      marginTop: '1rem',
      fontWeight: '500',
      animation: 'shake 0.5s ease'
    },
    select: {
      width: '100%',
      padding: '1rem 1.25rem',
      fontSize: '1rem',
      color: '#1b5e20',
      background: 'linear-gradient(135deg, #f1f8f4 0%, #e8f5e9 100%)',
      border: '2px solid #a5d6a7',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontWeight: '500',
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%234caf50' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 1rem center',
      backgroundSize: '20px',
      paddingRight: '3rem'
    },
    scanButton: {
      width: '100%',
      padding: '1.25rem',
      background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '16px',
      fontSize: '1.2rem',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      boxShadow: '0 10px 30px rgba(76, 175, 80, 0.4)',
      position: 'relative',
      overflow: 'hidden',
      letterSpacing: '0.5px'
    },
    scanButtonDisabled: {
      background: 'linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%)',
      cursor: 'not-allowed',
      boxShadow: 'none',
      opacity: 0.7
    },
    spinner: {
      animation: 'spin 1s linear infinite'
    },
    resultSection: {
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideInRight 0.5s ease-out'
    },
    resultHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
      paddingBottom: '1rem',
      borderBottom: '2px solid #e8f5e9'
    },
    urgencyBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1.25rem',
      borderRadius: '50px',
      fontSize: '0.8rem',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
      animation: 'bounceIn 0.6s ease-out'
    },
    urgencyHigh: {
      background: 'linear-gradient(135deg, #ff5252 0%, #d32f2f 100%)',
      color: 'white',
      boxShadow: '0 4px 20px rgba(244, 67, 54, 0.4)'
    },
    urgencyMedium: {
      background: 'linear-gradient(135deg, #ffa726 0%, #f57c00 100%)',
      color: 'white',
      boxShadow: '0 4px 20px rgba(255, 152, 0, 0.4)'
    },
    urgencyLow: {
      background: 'linear-gradient(135deg, #66bb6a 0%, #43a047 100%)',
      color: 'white',
      boxShadow: '0 4px 20px rgba(76, 175, 80, 0.4)'
    },
    resultContent: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem'
    },
    resultItem: {
      padding: '1.5rem',
      background: 'linear-gradient(135deg, #f1f8f4 0%, #e8f5e9 100%)',
      borderRadius: '12px',
      border: '1px solid #c8e6c9',
      transition: 'transform 0.3s ease'
    },
    resultItemTitle: {
      color: '#1b5e20',
      fontSize: '0.85rem',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      marginBottom: '0.75rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    resultItemText: {
      color: '#2e7d32',
      fontSize: '1.1rem',
      lineHeight: '1.7',
      margin: 0,
      fontWeight: '500'
    },
    stepsList: {
      margin: 0,
      paddingLeft: 0,
      listStyle: 'none'
    },
    stepsListItem: {
      color: '#2e7d32',
      fontSize: '1rem',
      lineHeight: '1.8',
      marginBottom: '0.75rem',
      paddingLeft: '2rem',
      position: 'relative',
      fontWeight: '500'
    },
    disclaimer: {
      display: 'flex',
      gap: '1rem',
      padding: '1.5rem',
      background: 'linear-gradient(135deg, #fff9e6 0%, #fff3d9 100%)',
      border: '2px solid #ffd54f',
      borderRadius: '12px',
      marginTop: '1rem',
      boxShadow: '0 4px 15px rgba(255, 193, 7, 0.2)'
    },
    disclaimerIcon: {
      color: '#f57f17',
      flexShrink: 0,
      marginTop: '0.25rem',
      filter: 'drop-shadow(0 2px 4px rgba(245, 127, 23, 0.3))'
    },
    disclaimerText: {
      color: '#6d4c00',
      fontSize: '0.9rem',
      lineHeight: '1.6',
      margin: 0,
      fontWeight: '500'
    },
    disclaimerStrong: {
      color: '#f57f17',
      fontWeight: '700'
    }
  };

  // Inject animations
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(30px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    @keyframes bounceIn {
      0% {
        opacity: 0;
        transform: scale(0.3);
      }
      50% {
        transform: scale(1.05);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-10px); }
      75% { transform: translateX(10px); }
    }
    @media (max-width: 968px) {
      .content-wrapper-responsive { 
        grid-template-columns: 1fr !important; 
      }
    }
    @media (max-width: 640px) {
      .container-responsive { 
        padding: 1rem !important; 
      }
      .page-header-responsive h1 { 
        font-size: 1.8rem !important; 
      }
      .card-responsive { 
        padding: 1.5rem !important; 
      }
      .result-header-responsive {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 1rem !important;
      }
    }
  `;
  if (!document.head.querySelector('#crop-disease-enhanced-styles')) {
    styleSheet.id = 'crop-disease-enhanced-styles';
    document.head.appendChild(styleSheet);
  }

  const getUrgencyStyle = (level) => {
    if (level === 'high') return { ...styles.urgencyBadge, ...styles.urgencyHigh };
    if (level === 'medium') return { ...styles.urgencyBadge, ...styles.urgencyMedium };
    return { ...styles.urgencyBadge, ...styles.urgencyLow };
  };

  return (
    <div style={styles.container} className="container-responsive">
      <div style={styles.backgroundPattern}></div>
      
      <div style={styles.pageHeader} className="page-header-responsive">
        <div style={styles.headerBadge}>
          <Leaf size={16} />
          <span>AI-Powered Diagnosis</span>
        </div>
        <h1 style={styles.title}>🌱 Crop Disease Prediction</h1>
        <p style={styles.subtitle}>Upload an image of your crop and let AI detect potential diseases instantly</p>
      </div>

      <div style={styles.contentWrapper} className="content-wrapper-responsive">
        {/* Upload Section */}
        <div style={styles.uploadSection}>
          <div 
            style={styles.card} 
            className="card-responsive"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 25px 70px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.5)';
            }}
          >
            <div style={styles.cardHeader}>
              <div style={styles.cardIcon}>
                <Upload size={20} />
              </div>
              <h2 style={styles.cardTitle}>Upload Crop Image</h2>
            </div>
            
            <div>
              <input
                type="file"
                id="crop-image"
                accept=".jpg,.jpeg,.png"
                onChange={handleImageUpload}
                style={styles.fileInput}
              />
              <label 
                htmlFor="crop-image" 
                style={styles.uploadLabel}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#4caf50';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#81c784';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #f1f8f4 0%, #e8f5e9 100%)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {!imagePreview ? (
                  <>
                    <Upload size={56} style={styles.uploadIcon} />
                    <p style={styles.uploadText}>Click to upload image</p>
                    <p style={styles.uploadSubtext}>JPG, JPEG or PNG • Max 5MB</p>
                  </>
                ) : (
                  <div style={styles.imagePreview}>
                    <div style={styles.previewImageWrapper}>
                      <img src={imagePreview} alt="Crop preview" style={styles.previewImage} />
                    </div>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedImage(null);
                        setImagePreview(null);
                        setResult(null);
                      }}
                      style={styles.changeImageBtn}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.3)';
                      }}
                    >
                      Change Image
                    </button>
                  </div>
                )}
              </label>
            </div>

            {error && (
              <div style={styles.errorMessage}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Crop Selection */}
          <div 
            style={styles.card} 
            className="card-responsive"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 25px 70px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.5)';
            }}
          >
            <div style={styles.cardHeader}>
              <div style={styles.cardIcon}>
                <Leaf size={20} />
              </div>
              <h2 style={styles.cardTitle}>Select Crop Type</h2>
            </div>
            <select 
              value={selectedCrop} 
              onChange={handleCropChange}
              style={styles.select}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#4caf50';
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(76, 175, 80, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#a5d6a7';
                e.currentTarget.style.background = 'linear-gradient(135deg, #f1f8f4 0%, #e8f5e9 100%)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {cropOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Scan Button */}
          <button
            onClick={handleScanCrop}
            disabled={isButtonDisabled}
            style={isButtonDisabled ? {...styles.scanButton, ...styles.scanButtonDisabled} : styles.scanButton}
            onMouseEnter={(e) => {
              if (!isButtonDisabled) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #388e3c 0%, #1b5e20 100%)';
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(76, 175, 80, 0.5)';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isButtonDisabled) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(76, 175, 80, 0.4)';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {isLoading ? (
              <>
                <Loader style={styles.spinner} size={24} />
                <span>Analyzing Your Crop...</span>
              </>
            ) : (
              <>
                <Activity size={24} />
                <span>Scan Crop Now</span>
              </>
            )}
          </button>
        </div>

        {/* Result Section */}
        {result && (
          <div style={styles.resultSection}>
            <div 
              style={styles.card} 
              className="card-responsive"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 25px 70px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.5)';
              }}
            >
              <div style={styles.resultHeader} className="result-header-responsive">
                <div style={styles.cardHeader}>
                  <div style={styles.cardIcon}>
                    <Eye size={20} />
                  </div>
                  <h2 style={styles.cardTitle}>Analysis Result</h2>
                </div>
                <div style={getUrgencyStyle(result.urgencyLevel)}>
                  {result.urgencyLevel === 'high' && <AlertCircle size={16} />}
                  {result.urgencyLevel === 'medium' && <Info size={16} />}
                  {result.urgencyLevel === 'low' && <CheckCircle size={16} />}
                  <span>{result.urgencyLevel}</span>
                </div>
              </div>

              <div style={styles.resultContent}>
                <div style={styles.resultItem}>
                  <h3 style={styles.resultItemTitle}>
                    <Leaf size={16} />
                    Crop Name
                  </h3>
                  <p style={styles.resultItemText}>{result.cropName}</p>
                </div>

                <div style={styles.resultItem}>
                  <h3 style={styles.resultItemTitle}>
                    <AlertCircle size={16} />
                    Possible Issue
                  </h3>
                  <p style={styles.resultItemText}>{result.possibleIssue}</p>
                </div>

                <div style={styles.resultItem}>
                  <h3 style={styles.resultItemTitle}>
                    <TrendingUp size={16} />
                    Immediate Steps
                  </h3>
                  <ul style={styles.stepsList}>
                    {result.immediateSteps.map((step, index) => (
                      <li key={index} style={styles.stepsListItem}>
                        <span style={{
                          position: 'c',
                          left: '0',
                          top: '0.5rem',
                          width: '8px',
                          height: '8px',
                          background: '#4caf50',
                          borderRadius: '50%',
                          boxShadow: '0 0 8px rgba(76, 175, 80, 0.6)'
                        }}></span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={styles.disclaimer}>
                  <Info size={20} style={styles.disclaimerIcon} />
                  <p style={styles.disclaimerText}>
                    <strong style={styles.disclaimerStrong}>Disclaimer:</strong> This prediction is based on AI analysis and should be used as a guide only. 
                    For accurate diagnosis, please consult with an agricultural expert or local extension officer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CropDiseasePrediction;