import { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../../../components/feature/AdminLayout';
import { supabase } from '../../../../lib/supabase';

const ADMIN_EDGE_URL = 'https://kweuhmazeiehftxvxabx.supabase.co/functions/v1/admin-operations';
const ADMIN_TOKEN = 'admin-secret-2024';

interface Code {
  id: string;
  code: string;
  product_id: string;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
  product?: { name_en: string; name_ar: string; image_url?: string; price?: number; description_en?: string; description_ar?: string };
  user?: { email: string };
}

interface Product {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  price: number;
  image_url: string;
}

export default function AdminCodesPage() {
  const [codes, setCodes] = useState<Code[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editUploading, setEditUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteProductConfirm, setDeleteProductConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Add Codes to existing product state
  const [showAddCodesModal, setShowAddCodesModal] = useState(false);
  const [addCodesProduct, setAddCodesProduct] = useState<Product | null>(null);
  const [addCodesValues, setAddCodesValues] = useState('');
  const [addCodesLoading, setAddCodesLoading] = useState(false);

  // Add form state
  const [nameEn, setNameEn] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [codeValues, setCodeValues] = useState('');

  // Edit form state
  const [editNameEn, setEditNameEn] = useState('');
  const [editDescEn, setEditDescEn] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [codesRes, productsRes] = await Promise.all([
      supabase.from('codes').select(`*, product:products(name_en, name_ar, image_url, price, description_en, description_ar)`).order('created_at', { ascending: false }),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
    ]);
    if (!codesRes.error && codesRes.data) setCodes(codesRes.data);
    if (!productsRes.error && productsRes.data) setProducts(productsRes.data);
    setLoading(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setEditImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadImageViaEdge = async (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const res = await fetch(ADMIN_EDGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_TOKEN },
          body: JSON.stringify({ action: 'upload_image', base64, fileName: file.name, mimeType: file.type }),
        });
        const data = await res.json();
        resolve(data.url || null);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddProduct = async () => {
    if (!nameEn || !descriptionEn || !price || !imageFile || !codeValues.trim()) {
      showToast('Please fill in all required fields and upload an image', 'error');
      return;
    }
    setUploading(true);
    const imageUrl = await uploadImageViaEdge(imageFile);
    if (!imageUrl) { showToast('Failed to upload image. Please try again.', 'error'); setUploading(false); return; }

    const codeLines = codeValues.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (codeLines.length === 0) { showToast('No valid codes found', 'error'); setUploading(false); return; }

    const res = await fetch(ADMIN_EDGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_TOKEN },
      body: JSON.stringify({
        action: 'create_product',
        name_en: nameEn, name_ar: nameEn,
        description_en: descriptionEn, description_ar: descriptionEn,
        price: parseFloat(price), image_url: imageUrl, codes: codeLines,
      }),
    });
    const result = await res.json();
    if (result.success) {
      showToast(`Product added with ${codeLines.length} codes!`, 'success');
      resetForm(); setShowAddModal(false); fetchData();
    } else {
      showToast(`Error: ${result.error || 'Unknown error'}`, 'error');
    }
    setUploading(false);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setEditNameEn(product.name_en);
    setEditDescEn(product.description_en);
    setEditPrice(String(product.price));
    setEditImagePreview(product.image_url);
    setEditImageFile(null);
    setShowEditModal(true);
  };

  const handleEditProduct = async () => {
    if (!editingProduct) return;
    if (!editNameEn || !editDescEn || !editPrice) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    setEditUploading(true);

    let imageUrl = editingProduct.image_url;
    if (editImageFile) {
      const uploaded = await uploadImageViaEdge(editImageFile);
      if (!uploaded) { showToast('Failed to upload image. Please try again.', 'error'); setEditUploading(false); return; }
      imageUrl = uploaded;
    }

    const res = await fetch(ADMIN_EDGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_TOKEN },
      body: JSON.stringify({
        action: 'update_product',
        product_id: editingProduct.id,
        name_en: editNameEn, name_ar: editNameEn,
        description_en: editDescEn, description_ar: editDescEn,
        price: parseFloat(editPrice), image_url: imageUrl,
      }),
    });
    const result = await res.json();
    if (result.success) {
      showToast('Product updated successfully!', 'success');
      setShowEditModal(false); setEditingProduct(null); fetchData();
    } else {
      showToast(`Error: ${result.error || 'Unknown error'}`, 'error');
    }
    setEditUploading(false);
  };

  const resetForm = () => {
    setNameEn(''); setDescriptionEn('');
    setPrice(''); setImageFile(null); setImagePreview(''); setCodeValues('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteCode = async (codeId: string) => {
    const res = await fetch(ADMIN_EDGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_TOKEN },
      body: JSON.stringify({ action: 'delete_code', code_id: codeId }),
    });
    const result = await res.json();
    if (result.success) { showToast('Code deleted', 'success'); setDeleteConfirm(null); fetchData(); }
    else showToast(`Error: ${result.error}`, 'error');
  };

  const handleDeleteProduct = async (productId: string) => {
    const res = await fetch(ADMIN_EDGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_TOKEN },
      body: JSON.stringify({ action: 'delete_product', product_id: productId }),
    });
    const result = await res.json();
    if (result.success) {
      showToast('Product and all its codes deleted', 'success');
      setDeleteProductConfirm(null);
      fetchData();
    } else {
      showToast(`Error: ${result.error}`, 'error');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const openAddCodesModal = (product: Product) => {
    setAddCodesProduct(product);
    setAddCodesValues('');
    setShowAddCodesModal(true);
  };

  const handleAddCodesToProduct = async () => {
    if (!addCodesProduct) return;
    const codeLines = addCodesValues.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (codeLines.length === 0) {
      showToast('No valid codes found', 'error');
      return;
    }
    setAddCodesLoading(true);
    const res = await fetch(ADMIN_EDGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_TOKEN },
      body: JSON.stringify({
        action: 'add_codes',
        product_id: addCodesProduct.id,
        codes: codeLines,
      }),
    });
    const result = await res.json();
    if (result.success) {
      showToast(`${codeLines.length} codes added successfully!`, 'success');
      setShowAddCodesModal(false);
      setAddCodesProduct(null);
      setAddCodesValues('');
      fetchData();
    } else {
      showToast(`Error: ${result.error || 'Unknown error'}`, 'error');
    }
    setAddCodesLoading(false);
  };

  const filteredCodes = codes.filter((code) => {
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'used' && code.is_used) ||
      (filterStatus === 'unused' && !code.is_used);

    const matchesSearch = searchQuery === '' ||
      code.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      code.product?.name_en.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const totalCodes = codes.length;
  const usedCodes = codes.filter((c) => c.is_used).length;
  const availableCodes = codes.filter((c) => !c.is_used).length;

  return (
    <AdminLayout>
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Codes Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage products and codes</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer flex items-center gap-2"
        >
          <i className="ri-add-line text-base"></i>
          Add Product &amp; Codes
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium flex items-center gap-2 transition-all ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          <i className={`${toast.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'} text-lg`}></i>
          {toast.msg}
        </div>
      )}

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Codes</p>
              <p className="text-3xl font-bold text-gray-900">{totalCodes}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100 text-gray-700">
              <i className="ri-key-line text-2xl"></i>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Available Codes</p>
              <p className="text-3xl font-bold text-green-600">{availableCodes}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100 text-green-600">
              <i className="ri-inbox-line text-2xl"></i>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Used Codes</p>
              <p className="text-3xl font-bold text-red-600">{usedCodes}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-100 text-red-600">
              <i className="ri-check-line text-2xl"></i>
            </div>
          </div>
        </div>

        {/* Products List */}
        {products.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <i className="ri-box-3-line text-xl"></i> Products
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => {
                const productCodes = codes.filter((c) => c.product_id === product.id);
                const availableCount = productCodes.filter((c) => !c.is_used).length;
                const totalCount = productCodes.length;
                return (
                  <div key={product.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-all hover:shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name_en} className="w-full h-full object-cover object-top" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <i className="ri-image-line text-gray-400 text-2xl"></i>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-bold text-gray-900 mb-1 truncate">{product.name_en}</h4>
                        <p className="text-sm font-semibold text-gray-700 mb-2">${product.price}</p>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${availableCount > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {availableCount}/{totalCount} available
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => openAddCodesModal(product)}
                        className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <i className="ri-add-circle-line text-base"></i>
                        Add Codes
                      </button>
                      <button
                        onClick={() => openEditModal(product)}
                        className="flex-1 px-3 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <i className="ri-edit-line text-base"></i>
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteProductConfirm(product.id)}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <i className="ri-delete-bin-line text-base"></i>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code or product name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
            >
              <option value="all">All</option>
              <option value="unused">Available</option>
              <option value="used">Used</option>
            </select>
          </div>
        </div>

        {/* Codes Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Product', 'Code', 'Status', 'Used By', 'Used At', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                      <i className="ri-loader-4-line animate-spin text-2xl block mb-2"></i>
                      Loading codes...
                    </td>
                  </tr>
                ) : filteredCodes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                      <i className="ri-inbox-line text-3xl block mb-2"></i>
                      No codes found
                    </td>
                  </tr>
                ) : (
                  filteredCodes.map((code) => (
                    <tr key={code.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                            {code.product?.image_url ? (
                              <img src={code.product.image_url} alt={code.product.name_en} className="w-full h-full object-cover object-top" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <i className="ri-image-line text-gray-400 text-sm"></i>
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{code.product?.name_en || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative inline-block">
                          <button
                            onClick={() => handleCopyCode(code.code)}
                            className="font-mono text-sm text-gray-900 bg-gray-100 px-3 py-1.5 rounded hover:bg-gray-200 transition-colors cursor-pointer flex items-center gap-2"
                          >
                            {code.code}
                            <i className="ri-file-copy-line text-xs text-gray-500"></i>
                          </button>
                          {copiedCode === code.code && (
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                              Copied!
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${code.is_used ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {code.is_used ? 'Used' : 'Available'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{code.user?.email || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {code.used_at ? new Date(code.used_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setDeleteConfirm(code.id)}
                          className="flex items-center justify-center w-8 h-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <i className="ri-delete-bin-line text-base"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Add Product Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 my-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add Product &amp; Codes</h3>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <div className="space-y-5 max-h-[72vh] overflow-y-auto pr-1">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Image *</label>
                <div className="flex items-start gap-4">
                  {imagePreview && (
                    <div className="w-28 h-28 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover object-top" />
                    </div>
                  )}
                  <label className="flex-1 cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-500 transition-colors">
                      <i className="ri-image-add-line text-3xl text-gray-400 mb-2 block"></i>
                      <p className="text-sm text-gray-500">{imageFile ? imageFile.name : 'Click to upload image'}</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP, GIF, BMP, AVIF, HEIC up to 10MB</p>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
              </div>
              {/* Name EN */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name *</label>
                <input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="e.g., Apple TV+ 1 Month" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black" />
              </div>
              {/* Description EN */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                <textarea value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} placeholder="Enter product description" rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none" />
              </div>
              {/* Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Price ($) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold select-none">$</span>
                  <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="29.99" step="0.01" min="0" className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
              </div>
              {/* Codes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Codes (one per line) *</label>
                <textarea value={codeValues} onChange={(e) => setCodeValues(e.target.value)} placeholder={'ABC123XYZ\nDEF456UVW\nGHI789RST'} rows={7} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black resize-none" />
                <p className="text-xs text-gray-400 mt-1">{codeValues.split('\n').filter((l) => l.trim()).length} codes entered</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm whitespace-nowrap cursor-pointer">Cancel</button>
              <button onClick={handleAddProduct} disabled={uploading} className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {uploading ? <><i className="ri-loader-4-line animate-spin"></i> Adding...</> : <><i className="ri-add-line"></i> Add Product</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Product Modal ── */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 my-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Edit Product</h3>
                <p className="text-sm text-gray-400 mt-0.5">Update product details</p>
              </div>
              <button onClick={() => { setShowEditModal(false); setEditingProduct(null); }} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="space-y-5 max-h-[72vh] overflow-y-auto pr-1">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Image</label>
                <div className="flex items-start gap-4">
                  <div className="w-28 h-28 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-50">
                    {editImagePreview ? (
                      <img src={editImagePreview} alt="Preview" className="w-full h-full object-cover object-top" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="ri-image-line text-gray-400 text-2xl"></i>
                      </div>
                    )}
                  </div>
                  <label className="flex-1 cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center hover:border-gray-500 transition-colors">
                      <i className="ri-image-edit-line text-3xl text-gray-400 mb-2 block"></i>
                      <p className="text-sm text-gray-500">{editImageFile ? editImageFile.name : 'Click to replace image'}</p>
                      <p className="text-xs text-gray-400 mt-1">Leave empty to keep current</p>
                    </div>
                    <input ref={editFileInputRef} type="file" accept="image/*" onChange={handleEditImageChange} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Name EN */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name *</label>
                <input type="text" value={editNameEn} onChange={(e) => setEditNameEn(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black" />
              </div>

              {/* Description EN */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                <textarea value={editDescEn} onChange={(e) => setEditDescEn(e.target.value)} rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none" />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Price ($) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold select-none">$</span>
                  <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} step="0.01" min="0" className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button onClick={() => { setShowEditModal(false); setEditingProduct(null); }} className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm whitespace-nowrap cursor-pointer">Cancel</button>
              <button onClick={handleEditProduct} disabled={editUploading} className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {editUploading ? <><i className="ri-loader-4-line animate-spin"></i> Saving...</> : <><i className="ri-save-line"></i> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Code Confirmation ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-alert-line text-2xl text-red-600"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Code</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm whitespace-nowrap cursor-pointer">Cancel</button>
              <button onClick={() => handleDeleteCode(deleteConfirm)} className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm whitespace-nowrap cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Product Confirmation ── */}
      {deleteProductConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-alert-line text-2xl text-red-600"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Product</h3>
            <p className="text-sm text-gray-500 mb-6">This will permanently delete the product <strong>and all its codes</strong>. This action cannot be undone.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteProductConfirm(null)} className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm whitespace-nowrap cursor-pointer">Cancel</button>
              <button onClick={() => handleDeleteProduct(deleteProductConfirm)} className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm whitespace-nowrap cursor-pointer">Delete Product</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Codes to Existing Product Modal ── */}
      {showAddCodesModal && addCodesProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Add Codes</h3>
                <p className="text-sm text-gray-400 mt-0.5">Adding to: <span className="font-semibold text-gray-700">{addCodesProduct.name_en}</span></p>
              </div>
              <button
                onClick={() => { setShowAddCodesModal(false); setAddCodesProduct(null); setAddCodesValues(''); }}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 mb-5">
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                {addCodesProduct.image_url ? (
                  <img src={addCodesProduct.image_url} alt={addCodesProduct.name_en} className="w-full h-full object-cover object-top" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <i className="ri-image-line text-gray-400"></i>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{addCodesProduct.name_en}</p>
                <p className="text-xs text-gray-500">${addCodesProduct.price} &bull; {codes.filter((c) => c.product_id === addCodesProduct.id && !c.is_used).length} codes available</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">New Codes (one per line) *</label>
              <textarea
                value={addCodesValues}
                onChange={(e) => setAddCodesValues(e.target.value)}
                placeholder={'ABC123XYZ\nDEF456UVW\nGHI789RST'}
                rows={8}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{addCodesValues.split('\n').filter((l) => l.trim()).length} codes entered</p>
            </div>

            <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
              <button
                onClick={() => { setShowAddCodesModal(false); setAddCodesProduct(null); setAddCodesValues(''); }}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm whitespace-nowrap cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCodesToProduct}
                disabled={addCodesLoading}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {addCodesLoading
                  ? <><i className="ri-loader-4-line animate-spin"></i> Adding...</>
                  : <><i className="ri-add-circle-line"></i> Add Codes</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
