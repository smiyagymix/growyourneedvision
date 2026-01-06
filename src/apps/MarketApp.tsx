import React, { useState, useEffect } from 'react';
import { Icon, Card, Button, Badge, Modal, Input, EmptyState, SkeletonCard } from '../components/shared/ui/CommonUI';
import { marketService, Product, ProductVariant } from '../services/marketService';
import { AIContentGeneratorModal } from '../components/shared/modals/AIContentGeneratorModal';
import pb from '../lib/pocketbase';
import { useToast } from '../hooks/useToast';

interface MarketAppProps {
  activeTab: string;
  activeSubNav: string;
}

interface CartItem {
    variantId: string;
    productId: string;
    title: string;
    variantTitle: string;
    price: number;
    quantity: number;
    thumbnail: string | null;
}

const MarketApp: React.FC<MarketAppProps> = ({ activeTab, activeSubNav }) => {
  const { addToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  
  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Shipping, 2: Payment, 3: Confirm

  // Product Details State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const result = await marketService.getProducts();
      setProducts(result || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      addToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product, variant: ProductVariant) => {
      const price = variant.prices[0]?.amount ? variant.prices[0].amount / 100 : 0;
      
      setCart(prev => {
          const existing = prev.find(item => item.variantId === variant.id);
          if (existing) {
              return prev.map(item => 
                  item.variantId === variant.id 
                      ? { ...item, quantity: item.quantity + 1 }
                      : item
              );
          }
          return [...prev, {
              variantId: variant.id,
              productId: product.id,
              title: product.title,
              variantTitle: variant.title,
              price,
              quantity: 1,
              thumbnail: product.thumbnail
          }];
      });
      addToast('Added to cart', 'success');
      setIsCartOpen(true);
  };

  const removeFromCart = (variantId: string) => {
      setCart(prev => prev.filter(item => item.variantId !== variantId));
  };

  const updateQuantity = (variantId: string, delta: number) => {
      setCart(prev => prev.map(item => {
          if (item.variantId === variantId) {
              const newQty = Math.max(1, item.quantity + delta);
              return { ...item, quantity: newQty };
          }
          return item;
      }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
      try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Clear cart
          setCart([]);
          setIsCheckoutOpen(false);
          setCheckoutStep(1);
          addToast('Order placed successfully! Check your email for details.', 'success');
      } catch (error) {
          addToast('Checkout failed. Please try again.', 'error');
      }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn text-gray-800 dark:text-white relative">
      {/* Promo Banner */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-xl p-8 text-white shadow-lg flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Summer Sale Live!</h2>
          <p className="text-teal-100 mb-4">Up to 50% off on electronics and home goods.</p>
          <Button variant="secondary" className="bg-white text-teal-600 hover:bg-teal-50 border-none">Shop Now</Button>
        </div>
        <Icon name="MarketIcon3D" className="w-32 h-32 opacity-20 absolute right-0 bottom-0 transform translate-x-4 translate-y-4" />
      </div>

      {/* Category Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-700 pb-4 sticky top-0 bg-gray-50/95 dark:bg-slate-900/95 backdrop-blur z-20 py-2">
        <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">{activeTab} - {activeSubNav}</h1>
            <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsAIModalOpen(true)}
                className="hidden md:flex items-center gap-2 text-purple-600 border-purple-200 hover:bg-purple-50"
            >
                <Icon name="Sparkles" className="w-4 h-4" />
                Personal Shopper
            </Button>
        </div>
        <div className="flex gap-4 items-center">
            <div className="flex gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Sort by:</span>
            <select className="border-none bg-transparent font-bold text-gray-800 dark:text-white focus:outline-none cursor-pointer">
                <option>Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
            </select>
            </div>
            <Button 
                variant="primary" 
                className="relative"
                onClick={() => setIsCartOpen(true)}
            >
                <Icon name="ShoppingCartIcon" className="w-5 h-5" />
                {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {cart.reduce((a, b) => a + b.quantity, 0)}
                    </span>
                )}
            </Button>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))
        ) : products.length === 0 ? (
          <div className="col-span-full">
            <EmptyState 
              title="No products found" 
              description="Try adjusting your search or filters to find what you're looking for."
              icon="MagnifyingGlassIcon"
            />
          </div>
        ) : (
          products.map(product => {
            const price = product.variants[0]?.prices[0]?.amount ? product.variants[0].prices[0].amount / 100 : 0;
            return (
            <Card key={product.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white dark:bg-slate-800">
                <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-slate-900">
                {product.thumbnail ? (
                    <img src={product.thumbnail} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Icon name="PhotoIcon" className="w-12 h-12" />
                    </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button 
                        variant="secondary" 
                        className="rounded-full w-10 h-10 p-0 flex items-center justify-center bg-white text-gray-900 hover:bg-gray-100"
                        onClick={() => {
                            setSelectedProduct(product);
                            setSelectedVariant(product.variants[0]);
                        }}
                    >
                        <Icon name="EyeIcon" className="w-5 h-5" />
                    </Button>
                    <Button 
                        variant="primary" 
                        className="rounded-full w-10 h-10 p-0 flex items-center justify-center"
                        onClick={() => addToCart(product, product.variants[0])}
                    >
                        <Icon name="ShoppingCartIcon" className="w-5 h-5" />
                    </Button>
                </div>
                </div>
                <div className="p-4">
                <h3 className="font-bold text-lg mb-1 truncate" title={product.title}>{product.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 h-10">{product.description}</p>
                <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">${price.toFixed(2)}</span>
                    <div className="flex gap-1">
                    {product.variants.length > 1 && (
                        <Badge variant="outline" size="sm">+{product.variants.length - 1} options</Badge>
                    )}
                    </div>
                </div>
                </div>
            </Card>
            );
        }))}
      </div>

      {/* Cart Drawer */}
      {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
              <div className="relative w-full max-w-md bg-white dark:bg-slate-800 h-full shadow-2xl flex flex-col animate-slideInRight">
                  <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                          <Icon name="ShoppingCartIcon" className="w-6 h-6" />
                          Your Cart ({cart.reduce((a,b) => a + b.quantity, 0)})
                      </h2>
                      <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full">
                          <Icon name="XMarkIcon" className="w-5 h-5" />
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      {cart.length === 0 ? (
                          <div className="text-center py-20 text-gray-400">
                              <Icon name="ShoppingCartIcon" className="w-16 h-16 mx-auto mb-4 opacity-20" />
                              <p>Your cart is empty</p>
                              <Button variant="outline" className="mt-4" onClick={() => setIsCartOpen(false)}>Start Shopping</Button>
                          </div>
                      ) : (
                          cart.map(item => (
                              <div key={item.variantId} className="flex gap-4">
                                  <div className="w-20 h-20 bg-gray-100 dark:bg-slate-900 rounded-lg overflow-hidden shrink-0">
                                      {item.thumbnail && <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />}
                                  </div>
                                  <div className="flex-1">
                                      <h4 className="font-bold line-clamp-1">{item.title}</h4>
                                      <p className="text-sm text-gray-500 mb-2">{item.variantTitle}</p>
                                      <div className="flex justify-between items-center">
                                          <div className="font-bold text-emerald-600">${item.price.toFixed(2)}</div>
                                          <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-900 rounded-lg p-1">
                                              <button onClick={() => updateQuantity(item.variantId, -1)} className="w-6 h-6 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 rounded shadow-sm">-</button>
                                              <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                              <button onClick={() => updateQuantity(item.variantId, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 rounded shadow-sm">+</button>
                                          </div>
                                      </div>
                                  </div>
                                  <button onClick={() => removeFromCart(item.variantId)} className="text-gray-400 hover:text-red-500 self-start">
                                      <Icon name="TrashIcon" className="w-5 h-5" />
                                  </button>
                              </div>
                          ))
                      )}
                  </div>

                  <div className="p-6 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                      <div className="flex justify-between mb-4 text-lg font-bold">
                          <span>Total</span>
                          <span>${cartTotal.toFixed(2)}</span>
                      </div>
                      <Button 
                        variant="primary" 
                        className="w-full py-3 text-lg" 
                        disabled={cart.length === 0}
                        onClick={() => {
                            setIsCartOpen(false);
                            setIsCheckoutOpen(true);
                        }}
                      >
                          Checkout
                      </Button>
                  </div>
              </div>
          </div>
      )}

      {/* Checkout Modal */}
      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title="Checkout"
        size="lg"
      >
          <div className="p-6">
              {checkoutStep === 1 && (
                  <div className="space-y-4 animate-fadeIn">
                      <h3 className="font-bold text-lg mb-4">Shipping Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                          <Input label="First Name" placeholder="John" />
                          <Input label="Last Name" placeholder="Doe" />
                      </div>
                      <Input label="Address" placeholder="123 Main St" />
                      <div className="grid grid-cols-2 gap-4">
                          <Input label="City" placeholder="New York" />
                          <Input label="Zip Code" placeholder="10001" />
                      </div>
                      <div className="mt-6 flex justify-end">
                          <Button variant="primary" onClick={() => setCheckoutStep(2)}>Continue to Payment</Button>
                      </div>
                  </div>
              )}

              {checkoutStep === 2 && (
                  <div className="space-y-4 animate-fadeIn">
                      <h3 className="font-bold text-lg mb-4">Payment Method</h3>
                      <div className="p-4 border border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center gap-4 cursor-pointer">
                          <div className="w-5 h-5 rounded-full border-4 border-blue-500"></div>
                          <Icon name="CreditCardIcon" className="w-6 h-6 text-blue-600" />
                          <span className="font-bold">Credit Card (Stripe Test)</span>
                      </div>
                      <div className="p-4 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center gap-4 opacity-50 cursor-not-allowed">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                          <Icon name="BanknotesIcon" className="w-6 h-6" />
                          <span>Cash on Delivery</span>
                      </div>
                      
                      <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-900 rounded-xl">
                          <div className="flex justify-between mb-2">
                              <span className="text-gray-500">Subtotal</span>
                              <span>${cartTotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between mb-2">
                              <span className="text-gray-500">Shipping</span>
                              <span>Free</span>
                          </div>
                          <div className="flex justify-between font-bold text-lg border-t border-gray-200 dark:border-slate-700 pt-2 mt-2">
                              <span>Total</span>
                              <span>${cartTotal.toFixed(2)}</span>
                          </div>
                      </div>

                      <div className="mt-6 flex justify-between">
                          <Button variant="ghost" onClick={() => setCheckoutStep(1)}>Back</Button>
                          <Button variant="primary" onClick={handleCheckout}>Place Order</Button>
                      </div>
                  </div>
              )}
          </div>
      </Modal>

      {/* Product Details Modal */}
      <Modal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct?.title || 'Product Details'}
        size="xl"
      >
          {selectedProduct && selectedVariant && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
                  <div className="aspect-square bg-gray-100 dark:bg-slate-900 rounded-xl overflow-hidden">
                      {selectedProduct.thumbnail ? (
                          <img src={selectedProduct.thumbnail} alt={selectedProduct.title} className="w-full h-full object-cover" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Icon name="PhotoIcon" className="w-20 h-20" />
                          </div>
                      )}
                  </div>
                  <div className="space-y-6">
                      <div>
                          <h2 className="text-3xl font-black mb-2">{selectedProduct.title}</h2>
                          <p className="text-2xl font-bold text-emerald-600">
                              ${(selectedVariant.prices[0]?.amount / 100).toFixed(2)}
                          </p>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                          {selectedProduct.description}
                      </p>

                      <div>
                          <label className="block text-sm font-bold mb-2 text-gray-500">Select Option</label>
                          <div className="flex flex-wrap gap-2">
                              {selectedProduct.variants.map(variant => (
                                  <button
                                    key={variant.id}
                                    onClick={() => setSelectedVariant(variant)}
                                    className={`px-4 py-2 rounded-lg border-2 font-bold transition-all ${
                                        selectedVariant.id === variant.id 
                                        ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' 
                                        : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
                                    }`}
                                  >
                                      {variant.title}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="pt-6 border-t border-gray-100 dark:border-slate-700 flex gap-4">
                          <Button 
                            variant="primary" 
                            size="lg" 
                            className="flex-1"
                            onClick={() => {
                                addToCart(selectedProduct, selectedVariant);
                                setSelectedProduct(null);
                            }}
                          >
                              Add to Cart
                          </Button>
                          <Button variant="outline" size="lg" icon="HeartIcon" />
                      </div>
                  </div>
              </div>
          )}
      </Modal>

      <AIContentGeneratorModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        title="Generate Product Description"
        promptTemplate="Write a product description for {topic}"
        onSuccess={(content) => console.log(content)}
      />
    </div>
  );
};


export default MarketApp;
