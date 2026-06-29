import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useCart } from '../context/CartContext'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [product, setProduct] = useState(null)
  const [allImages, setAllImages] = useState([])
  const [mainImage, setMainImage] = useState('')
  const [loading, setLoading] = useState(true)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(r => {
        const p = r.data
        setProduct(p)
        const imgs = [
          ...(p.image_url ? [{ id: '__main', image_url: p.image_url }] : []),
          ...(p.images || [])
        ]
        setAllImages(imgs)
        setMainImage(p.image_url || p.images?.[0]?.image_url || '')
      })
      .catch(() => navigate('/shop'))
      .finally(() => setLoading(false))
  }, [id])

  const handleAdd = () => {
    addItem(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-navy-800 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!product) return null

  const disc = product.original_price ? Math.round((1 - product.price / product.original_price) * 100) : 0
  const features = product.features ? product.features.split(',') : []

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-navy-800 mb-6 text-sm transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Shop
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Image Gallery */}
        <div className="flex gap-3">
          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex flex-col gap-2 w-16 flex-shrink-0">
              {allImages.map((img, i) => (
                <button
                  key={img.id || i}
                  onClick={() => setMainImage(img.image_url)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                    mainImage === img.image_url ? 'border-navy-800 shadow-sm' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img
                    src={img.image_url}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={e => { e.target.src = 'https://via.placeholder.com/64?text=?' }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Main Image */}
          <div className="flex-1 aspect-square bg-gray-100 rounded-2xl overflow-hidden">
            <img
              src={mainImage || 'https://via.placeholder.com/600?text=Eyewear'}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={e => { e.target.src = 'https://via.placeholder.com/600?text=Eyewear' }}
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-5">
          {/* Brand + badges */}
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {product.brand && (
                <span className="text-sm text-gray-400 uppercase tracking-wide font-medium">{product.brand}</span>
              )}
              {product.trending === 1 && (
                <span className="bg-gold-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Trending</span>
              )}
              {disc > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{disc}% OFF</span>
              )}
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900">{product.name}</h1>
          </div>

          {/* Category / Type pills */}
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-navy-50 text-navy-700 rounded-full text-sm capitalize">{product.category}</span>
            {product.frame_type && (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">{product.frame_type}</span>
            )}
            {product.lens_type && (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">{product.lens_type}</span>
            )}
            {product.gender && product.gender !== 'unisex' && (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm capitalize">{product.gender}</span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-navy-800">₹{Number(product.price).toLocaleString()}</span>
            {product.original_price && (
              <span className="text-lg text-gray-400 line-through">₹{Number(product.original_price).toLocaleString()}</span>
            )}
          </div>

          {/* Stock status */}
          <p className={`text-sm font-medium ${
            product.stock > 10 ? 'text-green-600' :
            product.stock > 0 ? 'text-orange-500' : 'text-red-500'
          }`}>
            {product.stock > 10 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} left!` : 'Out of Stock'}
          </p>

          {/* Description */}
          {product.description && (
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          )}

          {/* Features */}
          {features.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Features</h3>
              <div className="flex flex-wrap gap-2">
                {features.map(f => (
                  <span key={f} className="px-3 py-1 bg-gray-50 border border-gray-200 text-gray-600 rounded-full text-sm">
                    {f.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart */}
          <button
            onClick={handleAdd}
            disabled={product.stock === 0}
            className={`w-full py-3.5 rounded-xl font-semibold text-base transition-all duration-200 ${
              added
                ? 'bg-green-600 text-white'
                : product.stock === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-navy-800 hover:bg-navy-900 text-white'
            }`}
          >
            {added ? '✓ Added to Cart' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  )
}
