import { useEffect, useState } from 'react';
import AdminLayout from '../../../../components/feature/AdminLayout';
import { supabase } from '../../../../lib/supabase';

interface Product {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  price: number;
  image_url: string;
  stock: number;
  created_at: string;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name_en: '',
    name_ar: '',
    description_en: '',
    description_ar: '',
    price: '',
    image_url: '',
    stock: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const { error } = await supabase.from('products').insert([
        {
          name_en: formData.name_en,
          name_ar: formData.name_ar,
          description_en: formData.description_en,
          description_ar: formData.description_ar,
          price: parseFloat(formData.price),
          image_url: formData.image_url,
          stock: parseInt(formData.stock),
        },
      ]);

      if (error) throw error;

      setShowAddModal(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('products')
        .update({
          name_en: formData.name_en,
          name_ar: formData.name_ar,
          description_en: formData.description_en,
          description_ar: formData.description_ar,
          price: parseFloat(formData.price),
          image_url: formData.image_url,
          stock: parseInt(formData.stock),
        })
        .eq('id', editingProduct.id);

      if (error) throw error;

      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product? This will also delete all associated codes.')) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name_en: product.name_en,
      name_ar: product.name_ar,
      description_en: product.description_en,
      description_ar: product.description_ar,
      price: product.price.toString(),
      image_url: product.image_url,
      stock: product.stock.toString(),
    });
  };

  const resetForm = () => {
    setFormData({
      name_en: '',
      name_ar: '',
      description_en: '',
      description_ar: '',
      price: '',
      image_url: '',
      stock: '',
    });
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingProduct(null);
    resetForm();
  };

  return (
    <AdminLayout title="Products" subtitle="Manage your products and inventory">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">All Products</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <i className="ri-add-line"></i>
            Add Product
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <i className="ri-box-3-line text-5xl mb-4 block"></i>
            <p>No products yet. Add your first product to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image_url}
                          alt={product.name_en}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{product.name_en}</div>
                          <div className="text-sm text-gray-500">{product.name_ar}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">${product.price}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        product.stock > 10 ? 'bg-green-100 text-green-800' : 
                        product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {product.stock} available
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(product.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(product)}
                        className="inline-flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors mr-2 cursor-pointer"
                      >
                        <i className="ri-edit-line text-base"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="inline-flex items-center justify-center w-8 h-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <i className="ri-delete-bin-line text-base"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingProduct) && (
        <div className="fixed inset-0 bg-black bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <form onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name (English)</label>
                  <input
                    type="text"
                    required
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                    placeholder="Product name in English"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name (Arabic)</label>
                  <input
                    type="text"
                    required
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                    placeholder="اسم المنتج بالعربية"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (English)</label>
                  <textarea
                    required
                    value={formData.description_en}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                    rows={3}
                    placeholder="Product description in English"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Arabic)</label>
                  <textarea
                    required
                    value={formData.description_ar}
                    onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                    rows={3}
                    placeholder="وصف المنتج بالعربية"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                    placeholder="9.99"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    required
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {formData.image_url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image Preview</label>
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                >
                  {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
