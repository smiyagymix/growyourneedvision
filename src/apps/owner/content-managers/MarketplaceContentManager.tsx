import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Card, Button, Icon, Modal, Badge } from '../../../components/shared/ui/CommonUI';
import { marketplaceBackendService, Product, Customer, Order } from '../../../services/marketplaceBackendService';
import { useToast } from '../../../hooks/useToast';
import { sanitizeText, sanitizeHtml } from '../../../utils/sanitization';
import { emailSchema } from '../../../validation/schemas';

const productSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
  description: z.string().max(2000, 'Description too long'),
  price: z.number().min(0, 'Price must be positive'),
  currency: z.enum(['USD', 'EUR', 'GBP']),
  stock: z.number().min(0, 'Stock must be positive'),
  category: z.string().min(1, 'Category is required').max(50, 'Category too long'),
  sku: z.string().max(50, 'SKU too long').optional(),
  is_active: z.boolean()
});

const customerSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  email: emailSchema,
  phone: z.string().max(20, 'Phone too long').optional(),
  status: z.enum(['Active', 'Inactive', 'Suspended'])
});

export const MarketplaceContentManager: React.FC = () => {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'customers' | 'analytics'>('products');
    const [loading, setLoading] = useState(false);
    
    // Data
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [stats, setStats] = useState<any>(null);

    // Modals
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    // Forms
    const [productForm, setProductForm] = useState<Partial<Product>>({
        title: '',
        description: '',
        price: 0,
        currency: 'USD',
        stock: 0,
        category: '',
        sku: '',
        is_active: true
    });

    const [customerForm, setCustomerForm] = useState<Partial<Customer>>({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        status: 'Active'
    });

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'products') {
                const data = await marketplaceBackendService.getProducts();
                setProducts(data);
            } else if (activeTab === 'orders') {
                const data = await marketplaceBackendService.getOrders();
                setOrders(data);
            } else if (activeTab === 'customers') {
                const data = await marketplaceBackendService.getCustomers();
                setCustomers(data);
            } else if (activeTab === 'analytics') {
                const data = await marketplaceBackendService.getStats();
                setStats(data);
            }
        } catch (error) {
            console.error(error);
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProduct = async () => {
        // Sanitize inputs
        const sanitized = {
            ...productForm,
            title: sanitizeText(productForm.title || ''),
            description: sanitizeHtml(productForm.description || '', 'BASIC'),
            category: sanitizeText(productForm.category || ''),
            sku: sanitizeText(productForm.sku || ''),
            price: productForm.price || 0,
            currency: productForm.currency || 'USD',
            stock: productForm.stock || 0,
            is_active: productForm.is_active ?? true
        };
        
        // Validate
        const result = productSchema.safeParse(sanitized);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }
        
        try {
            if (editingItem) {
                await marketplaceBackendService.updateProduct(editingItem.id, result.data);
                showToast('Product updated', 'success');
            } else {
                await marketplaceBackendService.createProduct(result.data);
                showToast('Product created', 'success');
            }
            setIsProductModalOpen(false);
            loadData();
        } catch (error) {
            showToast('Failed to save product', 'error');
        }
    };

    const handleSaveCustomer = async () => {
        // Sanitize inputs
        const sanitized = {
            ...customerForm,
            first_name: sanitizeText(customerForm.first_name || ''),
            last_name: sanitizeText(customerForm.last_name || ''),
            email: customerForm.email?.toLowerCase().trim() || '',
            phone: sanitizeText(customerForm.phone || ''),
            status: customerForm.status || 'Active'
        };
        
        // Validate
        const result = customerSchema.safeParse(sanitized);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }
        
        try {
            if (editingItem) {
                await marketplaceBackendService.updateCustomer(editingItem.id, result.data);
                showToast('Customer updated', 'success');
            } else {
                await marketplaceBackendService.createCustomer(result.data);
                showToast('Customer created', 'success');
            }
            setIsCustomerModalOpen(false);
            loadData();
        } catch (error) {
            showToast('Failed to save customer', 'error');
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (!window.confirm('Delete this product?')) return;
        try {
            await marketplaceBackendService.deleteProduct(id);
            showToast('Product deleted', 'success');
            loadData();
        } catch (error) {
            showToast('Failed to delete product', 'error');
        }
    };

    const openProductModal = (item?: Product) => {
        setEditingItem(item);
        setProductForm(item || {
            title: '',
            description: '',
            price: 0,
            currency: 'USD',
            stock: 0,
            category: '',
            sku: '',
            is_active: true
        });
        setIsProductModalOpen(true);
    };

    const openCustomerModal = (item?: Customer) => {
        setEditingItem(item);
        setCustomerForm(item || {
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            status: 'Active'
        });
        setIsCustomerModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Marketplace Manager</h2>
                    <p className="text-gray-500 dark:text-gray-400">Manage products, orders, and customers</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadData}>
                        <Icon name="ArrowPathIcon" className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    {activeTab === 'products' && (
                        <Button variant="primary" onClick={() => openProductModal()}>
                            <Icon name="PlusIcon" className="w-4 h-4 mr-2" />
                            Add Product
                        </Button>
                    )}
                    {activeTab === 'customers' && (
                        <Button variant="primary" onClick={() => openCustomerModal()}>
                            <Icon name="PlusIcon" className="w-4 h-4 mr-2" />
                            Add Customer
                        </Button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 pb-1">
                {[
                    { id: 'products', label: 'Products', icon: 'TagIcon' },
                    { id: 'orders', label: 'Orders', icon: 'ShoppingCartIcon' },
                    { id: 'customers', label: 'Customers (CRM)', icon: 'UsersIcon' },
                    { id: 'analytics', label: 'Analytics', icon: 'ChartBarIcon' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors relative ${
                            activeTab === tab.id
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                    >
                        <Icon name={tab.icon} className="w-4 h-4" />
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <Card className="p-6 min-h-[400px]">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'products' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                        <tr>
                                            <th className="p-3">Product</th>
                                            <th className="p-3">Price</th>
                                            <th className="p-3">Stock</th>
                                            <th className="p-3">Status</th>
                                            <th className="p-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {products.map(product => (
                                            <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="p-3">
                                                    <div className="font-medium text-gray-900 dark:text-white">{product.title}</div>
                                                    <div className="text-xs text-gray-500">{product.sku}</div>
                                                </td>
                                                <td className="p-3 font-mono">{product.currency} {product.price}</td>
                                                <td className="p-3">{product.stock}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {product.is_active ? 'Active' : 'Draft'}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => openProductModal(product)}>Edit</Button>
                                                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteProduct(product.id)}>Delete</Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {products.length === 0 && <div className="text-center py-8 text-gray-500">No products found.</div>}
                            </div>
                        )}

                        {activeTab === 'orders' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                        <tr>
                                            <th className="p-3">Order ID</th>
                                            <th className="p-3">Customer</th>
                                            <th className="p-3">Total</th>
                                            <th className="p-3">Status</th>
                                            <th className="p-3">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {orders.map(order => (
                                            <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="p-3 font-mono text-xs">{order.id.slice(0, 8)}</td>
                                                <td className="p-3">
                                                    {order.expand?.customer_id ? 
                                                        `${order.expand.customer_id.first_name} ${order.expand.customer_id.last_name}` : 
                                                        'Unknown Customer'}
                                                </td>
                                                <td className="p-3 font-bold">${order.total_amount}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                                        order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                                        order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-gray-500">{new Date(order.created).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {orders.length === 0 && <div className="text-center py-8 text-gray-500">No orders found.</div>}
                            </div>
                        )}

                        {activeTab === 'customers' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                        <tr>
                                            <th className="p-3">Name</th>
                                            <th className="p-3">Email</th>
                                            <th className="p-3">Status</th>
                                            <th className="p-3">Total Spent</th>
                                            <th className="p-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {customers.map(customer => (
                                            <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="p-3 font-medium">{customer.first_name} {customer.last_name}</td>
                                                <td className="p-3 text-gray-500">{customer.email}</td>
                                                <td className="p-3">
                                                    <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                                        {customer.status}
                                                    </span>
                                                </td>
                                                <td className="p-3">${customer.total_spent || 0}</td>
                                                <td className="p-3 text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => openCustomerModal(customer)}>Edit</Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {customers.length === 0 && <div className="text-center py-8 text-gray-500">No customers found.</div>}
                            </div>
                        )}

                        {activeTab === 'analytics' && stats && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-100 dark:border-green-800">
                                    <h3 className="text-green-800 dark:text-green-300 font-medium mb-2">Total Revenue</h3>
                                    <p className="text-3xl font-bold text-green-900 dark:text-white">${stats.totalRevenue.toLocaleString()}</p>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
                                    <h3 className="text-blue-800 dark:text-blue-300 font-medium mb-2">Total Orders</h3>
                                    <p className="text-3xl font-bold text-blue-900 dark:text-white">{stats.totalOrders}</p>
                                </div>
                                <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl border border-purple-100 dark:border-purple-800">
                                    <h3 className="text-purple-800 dark:text-purple-300 font-medium mb-2">Avg. Order Value</h3>
                                    <p className="text-3xl font-bold text-purple-900 dark:text-white">${stats.averageOrderValue.toFixed(2)}</p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Card>

            {/* Product Modal */}
            <Modal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                title={editingItem ? 'Edit Product' : 'Add Product'}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                            value={productForm.title}
                            onChange={e => setProductForm({...productForm, title: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Price</label>
                            <input 
                                type="number" 
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                value={productForm.price}
                                onChange={e => setProductForm({...productForm, price: parseFloat(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Stock</label>
                            <input 
                                type="number" 
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                value={productForm.stock}
                                onChange={e => setProductForm({...productForm, stock: parseInt(e.target.value)})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Category</label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                            value={productForm.category}
                            onChange={e => setProductForm({...productForm, category: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea 
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                            rows={3}
                            value={productForm.description}
                            onChange={e => setProductForm({...productForm, description: e.target.value})}
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <Button variant="ghost" onClick={() => setIsProductModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSaveProduct}>Save Product</Button>
                    </div>
                </div>
            </Modal>

            {/* Customer Modal */}
            <Modal
                isOpen={isCustomerModalOpen}
                onClose={() => setIsCustomerModalOpen(false)}
                title={editingItem ? 'Edit Customer' : 'Add Customer'}
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">First Name</label>
                            <input 
                                type="text" 
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                value={customerForm.first_name}
                                onChange={e => setCustomerForm({...customerForm, first_name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Last Name</label>
                            <input 
                                type="text" 
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                value={customerForm.last_name}
                                onChange={e => setCustomerForm({...customerForm, last_name: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input 
                            type="email" 
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                            value={customerForm.email}
                            onChange={e => setCustomerForm({...customerForm, email: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Phone</label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                            value={customerForm.phone}
                            onChange={e => setCustomerForm({...customerForm, phone: e.target.value})}
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <Button variant="ghost" onClick={() => setIsCustomerModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSaveCustomer}>Save Customer</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
