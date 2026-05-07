import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { useCart } from '../context/CartContext'

export default function Home() {
  const [trending, setTrending] = useState([])
  const { addItem } = useCart()
  const [added, setAdded] = useState({})

  useEffect(() => {
    api.get('/products?trending=true').then(r => setTrending(r.data.slice(0, 8))).catch(() => {})
  }, [])

  const handleAdd = (p) => {
    addItem(p)
    setAdded(prev => ({ ...prev, [p.id]: true }))
    setTimeout(() => setAdded(prev => ({ ...prev, [p.id]: false })), 1500)
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:"url('https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=1600&q=60')", backgroundSize:'cover', backgroundPosition:'center'}}></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-navy-700/50 border border-navy-600 rounded-full px-4 py-1.5 text-sm mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-navy-200">Open Today · 10 AM – 8 PM</span>
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              Netra Kiran<br/>
              <span className="text-gold-400">Optics</span>
            </h1>
            <p className="text-navy-200 text-lg sm:text-xl mb-3 leading-relaxed">
              Premium eyewear & expert optical services in Indirapuram, Ghaziabad.
            </p>
            <p className="text-navy-300 text-sm mb-8 flex items-start gap-1.5">
              <svg className="w-4 h-4 mt-0.5 text-gold-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
              LGF/3, Retailx Shopping Complex, Abhay Khand-3, Indirapuram
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/shop" className="btn-gold text-base px-7 py-3">Shop Now</Link>
              <Link to="/book-appointment" className="btn-secondary border-white text-white hover:bg-white hover:text-navy-900 text-base px-7 py-3">Book Eye Check</Link>
              <Link to="/signup" className="relative group inline-flex items-center gap-2 text-base px-7 py-3 rounded-lg font-semibold overflow-hidden"
                style={{background:'linear-gradient(135deg,#22c55e,#16a34a)', color:'white', boxShadow:'0 0 20px rgba(34,197,94,0.4)'}}>
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{background:'linear-gradient(135deg,#16a34a,#15803d)'}}></span>
                <svg className="relative w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
                <span className="relative">Register Free</span>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></span>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"></span>
              </Link>
            </div>
          </div>
        </div>
        {/* Decorative */}
        <div className="absolute right-0 top-0 w-96 h-full opacity-5 pointer-events-none">
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <circle cx="300" cy="200" r="180" fill="white"/>
            <circle cx="300" cy="200" r="120" fill="none" stroke="white" strokeWidth="20"/>
          </svg>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-gold-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-wrap justify-center sm:justify-between gap-6 text-center">
            {[['15+','Years of Trust'],['10,000+','Happy Customers'],['50+','Premium Brands'],['Free','Home Delivery Available']].map(([n,l]) => (
              <div key={l}>
                <div className="font-heading font-bold text-2xl">{n}</div>
                <div className="text-amber-100 text-xs">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="font-heading text-3xl font-bold text-navy-900 mb-2">What We Offer</h2>
          <p className="text-gray-500">Explore our complete range of eyewear & optical solutions</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { cat:'frame', icon:'👓', title:'Eyeglass Frames', desc:'Full Rim, Half Rim & Rimless – all top brands', color:'bg-blue-50 border-blue-100', btn:'bg-blue-600' },
            { cat:'sunglasses', icon:'🕶️', title:'Sunglasses', desc:'Polarized, UV400 & fashion sunglasses', color:'bg-amber-50 border-amber-100', btn:'bg-amber-600' },
            { cat:'lens', icon:'🔬', title:'Optical Lenses', desc:'Single Vision, Progressive, Bifocal & more', color:'bg-green-50 border-green-100', btn:'bg-green-600' },
          ].map(({ cat, icon, title, desc, color, btn }) => (
            <Link key={cat} to={`/shop?category=${cat}`} className={`card border-2 ${color} p-8 text-center hover:scale-105 transition-transform duration-200`}>
              <div className="text-5xl mb-4">{icon}</div>
              <h3 className="font-heading font-semibold text-xl text-navy-900 mb-2">{title}</h3>
              <p className="text-gray-500 text-sm mb-5">{desc}</p>
              <span className={`${btn} text-white text-sm px-5 py-2 rounded-lg inline-block`}>Browse →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Products */}
      {trending.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="font-heading text-3xl font-bold text-navy-900 mb-1">Trending Now</h2>
                <p className="text-gray-500 text-sm">Our most popular picks this season</p>
              </div>
              <Link to="/shop" className="text-navy-700 hover:text-navy-900 text-sm font-medium flex items-center gap-1">
                View All <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {trending.map(p => (
                <ProductCard key={p.id} product={p} onAdd={() => handleAdd(p)} added={added[p.id]} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="font-heading text-3xl font-bold text-navy-900 mb-2">Why Netra Kiran?</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { icon:'🏆', title:'Expert Opticians', desc:'15+ years of professional experience' },
            { icon:'🔬', title:'Precise Eye Testing', desc:'Advanced equipment & accurate results' },
            { icon:'💎', title:'Premium Brands', desc:'Ray-Ban, Oakley, Titan, Essilor & more' },
            { icon:'🚚', title:'Home Delivery', desc:'Fast delivery to your doorstep' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="card p-6">
              <div className="text-4xl mb-3">{icon}</div>
              <h4 className="font-semibold text-navy-900 mb-1 text-sm">{title}</h4>
              <p className="text-gray-500 text-xs">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-navy-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 text-center">
          <h2 className="font-heading text-3xl font-bold mb-3">Ready for Clearer Vision?</h2>
          <p className="text-navy-300 mb-8 max-w-xl mx-auto">Book a free eye check-up with our expert optician. Walk-in or appointment — we're here for you.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/book-appointment" className="btn-gold text-base px-8 py-3">Book Appointment</Link>
            <a href="tel:07011295507" className="btn-secondary border-white text-white hover:bg-white hover:text-navy-900 text-base px-8 py-3">
              Call: 070112 95507
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

function ProductCard({ product, onAdd, added }) {
  const disc = product.original_price ? Math.round((1 - product.price / product.original_price) * 100) : 0

  return (
    <div className="card overflow-hidden group">
      <div className="relative overflow-hidden bg-gray-100 h-48">
        <img src={product.image_url || 'https://via.placeholder.com/400x300?text=Product'} alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { e.target.src = 'https://via.placeholder.com/400x300?text=Eyewear' }}
        />
        {product.trending === 1 && (
          <span className="absolute top-2 left-2 bg-gold-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Trending</span>
        )}
        {disc > 0 && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{disc}% OFF</span>
        )}
      </div>
      <div className="p-3">
        <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-0.5">{product.brand}</p>
        <h4 className="font-medium text-gray-900 text-sm leading-snug mb-2 line-clamp-2">{product.name}</h4>
        <div className="flex items-center gap-2 mb-3">
          <span className="font-bold text-navy-800">₹{product.price.toLocaleString()}</span>
          {product.original_price && <span className="text-gray-400 text-xs line-through">₹{product.original_price.toLocaleString()}</span>}
        </div>
        <button onClick={onAdd} className={`w-full text-xs py-2 rounded-lg font-medium transition-all duration-200 ${added ? 'bg-green-600 text-white' : 'bg-navy-800 hover:bg-navy-900 text-white'}`}>
          {added ? '✓ Added to Cart' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}
