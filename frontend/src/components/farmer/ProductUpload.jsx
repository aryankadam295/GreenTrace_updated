import React, { useState, useRef } from 'react';
import api from '../../utils/api';
import ProductList from './ProductList';

const ProductUpload = ({ onSuccess, showProducts = false, productRefreshKey = 0 }) => {
  const [activeView, setActiveView] = useState('upload');
  const [formData, setFormData] = useState({
    productName: '',
    category: '',
    quantity: '',
    unit: '',
    price: '',
    qualityGrade: '',
    harvestDate: '',
    description: '',
    expiryDate: ''
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  const categories = ['Grains', 'Fruits', 'Vegetables', 'Pulses', 'Dairy', 'Spices', 'Others'];
  const units = ['kg', 'quintal', 'ton', 'pieces', 'liters', 'bags'];
  const qualityGrades = ['Premium', 'Grade A', 'Grade B', 'Standard'];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        alert(`${file.name} is not a valid image file. Only JPEG, PNG, GIF, and WebP are allowed.`);
        return false;
      }

      if (file.size > maxSize) {
        alert(`${file.name} is too large. Maximum file size is 5MB.`);
        return false;
      }

      return true;
    });

    // Limit to 5 images
    const totalImages = images.length + validFiles.length;
    if (totalImages > 5) {
      alert('You can upload a maximum of 5 images.');
      return;
    }

    setImages(prev => [...prev, ...validFiles]);

    // Create preview URLs
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    // Revoke object URL to free memory
    URL.revokeObjectURL(imagePreviews[index]);

    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Create FormData for file upload
      const submitData = new FormData();

      // Add form fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          submitData.append(key, formData[key]);
        }
      });

      // Convert numeric fields
      submitData.set('quantity', parseFloat(formData.quantity).toString());
      submitData.set('price', parseFloat(formData.price).toString());

      // Add images
      images.forEach((image, index) => {
        submitData.append('images', image);
      });

      const response = await api.post('/products', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage('Product uploaded successfully!');

      // Reset form
      setFormData({
        productName: '',
        category: '',
        quantity: '',
        unit: '',
        price: '',
        qualityGrade: '',
        harvestDate: '',
        description: '',
        expiryDate: ''
      });

      // Clear images
      imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
      setImages([]);
      setImagePreviews([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error uploading product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {activeView === 'products' ? 'My Products' : 'Upload New Product'}
          </h1>
          <p className="text-gray-600">
            {activeView === 'products'
              ? 'Manage products you have already uploaded.'
              : 'Add your agricultural products to the marketplace'}
          </p>
        </div>

        {showProducts && (
          <button
            type="button"
            onClick={() => setActiveView(activeView === 'products' ? 'upload' : 'products')}
            className="self-start rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {activeView === 'products' ? 'Upload Product' : 'My Products'}
          </button>
        )}
      </div>

      {activeView === 'products' && showProducts ? (
        <ProductList embedded refreshKey={productRefreshKey} />
      ) : (
      <div className="bg-white rounded-lg shadow p-6">
        {message && (
          <div className={`mb-4 p-4 rounded ${
            message.includes('successfully') 
              ? 'bg-green-100 text-green-700 border border-green-300' 
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="productName"
                value={formData.productName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., Fresh Tomatoes"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="100"
              />
            </div>

            {/* Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit *
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select Unit</option>
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price per Unit (₹) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="25.00"
              />
            </div>

            {/* Quality Grade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quality Grade *
              </label>
              <select
                name="qualityGrade"
                value={formData.qualityGrade}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select Quality Grade</option>
                {qualityGrades.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>

            {/* Harvest Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Harvest Date *
              </label>
              <input
                type="date"
                name="harvestDate"
                value={formData.harvestDate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Describe your product, farming methods, certifications, etc."
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Images (Optional) - Max 5 images, 5MB each
            </label>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <div className="text-gray-400">
                  <span className="text-4xl">📷</span>
                  <p className="mt-2 text-gray-600">
                    Click to upload images or drag and drop
                  </p>
                  <p className="text-sm text-gray-500">
                    PNG, JPG, GIF, WebP up to 5MB each (max 5 images)
                  </p>
                </div>
              </label>
            </div>

            {images.length > 0 && (
              <p className="mt-2 text-sm text-gray-600">
                {images.length} image{images.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Uploading...' : 'Upload Product'}
            </button>
          </div>
        </form>
      </div>
      )}
    </div>
  );
};

export default ProductUpload;
