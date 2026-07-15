import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { useCart } from '../context/CartContext'
import { useInView, useCounter, useTypewriter, useScrollY } from '../utils/useInView'

const FLOATERS = [
  { emoji:'👓', left:'72%', top:'12%', size:'2rem',  delay:'0s',   duration:'6s'  },
  { emoji:'🕶️', left:'83%', top:'38%', size:'1.6rem', delay:'1.2s', duration:'7s'  },
  { emoji:'👓', left:'65%', top:'65%', size:'1rem',  delay:'2.1s', duration:'5.5s' },
  { emoji:'🔬', left:'88%', top:'72%', size:'1.4rem', delay:'0.6s', duration:'8s'  },
  { emoji:'🕶️', left:'76%', top:'50%', size:'1.2rem', delay:'1.8s', duration:'6.5s' },
]

function addRipple(e) {
  const btn = e.currentTarget
  const circle = document.createElement('span')
  const d = Math.max(btn.clientWidth, btn.clientHeight)
  const rect = btn.getBoundingClientRect()
  circle.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX-rect.left-d/2}px;top:${e.clientY-rect.top-d/2}px`
  circle.className = 'ripple-effect'
  btn.querySelector('.ripple-effect')?.remove()
  btn.appendChild(circle)
}

function Wave({ color = '#f9fafb' }) {
  return (
    <div className="wave-strip">
      <svg viewBox="0 0 1200 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,30 C200,60 400,0 600,30 C800,60 1000,0 1200,30 L1200,60 L0,60 Z" fill={color} />
        <path d="M0,30 C200,60 400,0 600,30 C800,60 1000,0 1200,30 L1200,60 L0,60 Z" fill={color} transform="translate(1200,0)" />
      </svg>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="shimmer-bg h-48 rounded-none" />
      <div className="p-3 space-y-2">
        <div className="shimmer-bg h-3 w-1/2 rounded" />
        <div className="shimmer-bg h-4 w-3/4 rounded" />
        <div className="shimmer-bg h-4 w-1/3 rounded" />
        <div className="shimmer-bg h-8 w-full rounded-lg mt-2" />
      </div>
    </div>
  )
}

export default function Home() {
  const [trending, setTrending] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const { addItem } = useCart()
  const [added, setAdded] = useState({})
  const scrollY = useScrollY()

  useEffect(() => {
    api.get('/products?trending=true')
      .then(r => setTrending(r.data.slice(0, 8)))
      .catch(() => {})
      .finally(() => setLoadingProducts(false))
  }, [])

  const handleAdd = (p) => {
    addItem(p)
    setAdded(prev => ({ ...prev, [p.id]: true }))
    setTimeout(() => setAdded(prev => ({ ...prev, [p.id]: false })), 1500)
  }

  const [statsRef, statsInView] = useInView(0.3)
  const [catsRef,  catsInView]  = useInView(0.1)
  const [whyRef,   whyInView]   = useInView(0.1)
  const [prodRef,  prodInView]  = useInView(0.05)
  const [ctaRef,   ctaInView]   = useInView(0.1)

  const years     = useCounter(15,    statsInView)
  const customers = useCounter(10000, statsInView)
  const brands    = useCounter(50,    statsInView)

  const typed = useTypewriter('NetraKiran', 70, 350)
  const showOptics = typed.length >= 'NetraKiran'.length

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative text-white overflow-hidden min-h-[520px] bg-navy-900">
        {/* Video background */}
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: `translateY(${scrollY * 0.15}px)`, willChange: 'transform' }}
        >
          <source src="https://videos.pexels.com/video-files/8136709/8136709-uhd_2732_1440_24fps.mp4" type="video/mp4" />
          <source src="https://videos.pexels.com/video-files/8136709/8136709-hd_1920_1080_24fps.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay */}
        <div className="absolute inset-0" style={{background:'linear-gradient(to right, rgba(8,18,36,0.82) 38%, rgba(8,18,36,0.25) 70%, rgba(8,18,36,0.05) 100%)'}} />

        {/* Floating glasses */}
        {FLOATERS.map((f, i) => (
          <span key={i} className="absolute pointer-events-none select-none animate-float hidden lg:block"
            style={{ left: f.left, top: f.top, fontSize: f.size, animationDelay: f.delay, animationDuration: f.duration, opacity: 0.13 }}>
            {f.emoji}
          </span>
        ))}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-navy-700/50 border border-navy-600 rounded-full px-4 py-1.5 text-sm mb-6 animate-fade-in" style={{animationDelay:'0.1s'}}>
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>
              <span className="text-navy-200">Open Today · 10 AM – 10 PM</span>
            </div>

            {/* Typewriter headline */}
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              <span>{typed}</span>
              <span className={`inline-block w-0.5 h-[0.9em] bg-white ml-1 align-middle transition-opacity duration-200 ${showOptics ? 'opacity-0' : 'opacity-100 animate-pulse'}`}/>
              <br/>
              <span className={`text-gold-400 transition-all duration-700 ${showOptics ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{display:'inline-block', transitionDelay:'0.1s'}}>
                Optics
              </span>
            </h1>

            <p className="text-navy-200 text-lg sm:text-xl mb-3 leading-relaxed animate-fade-in-up" style={{animationDelay:'0.5s'}}>
              Premium eyewear &amp; expert optical services in Indirapuram, Ghaziabad.
            </p>
            <p className="text-navy-300 text-sm mb-8 flex items-start gap-1.5 animate-fade-in-up" style={{animationDelay:'0.65s'}}>
              <svg className="w-4 h-4 mt-0.5 text-gold-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
              </svg>
              LGF/3, Retailx Shopping Complex, Abhay Khand-3, Indirapuram
            </p>

            <div className="flex flex-wrap gap-3 animate-fade-in-up" style={{animationDelay:'0.8s'}}>
              <Link to="/shop" className="btn-gold ripple-wrap text-base px-7 py-3" onClick={addRipple}>Shop Now</Link>
              <Link to="/book-appointment" className="ripple-wrap btn-secondary border-white text-white hover:bg-white hover:text-navy-900 text-base px-7 py-3" onClick={addRipple}>Book Eye Check</Link>
              <Link to="/customer-search"
                className="ripple-wrap relative group inline-flex items-center gap-2 text-base px-7 py-3 rounded-lg font-semibold overflow-hidden"
                style={{background:'linear-gradient(135deg,#22c55e,#16a34a)', color:'white', boxShadow:'0 0 22px rgba(34,197,94,0.45)'}}
                onClick={addRipple}>
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{background:'linear-gradient(135deg,#16a34a,#15803d)'}}/>
                <svg className="relative w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
                </svg>
                <span className="relative">Find Customer</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative ring */}
        <div className="absolute right-0 top-0 w-96 h-full opacity-5 pointer-events-none">
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <circle cx="300" cy="200" r="180" fill="white"/>
            <circle cx="300" cy="200" r="120" fill="none" stroke="white" strokeWidth="20"/>
          </svg>
        </div>
      </section>

      {/* Wave divider hero → stats */}
      <div className="bg-gold-600 -mt-1"><Wave color="#d97706" /></div>

      {/* ── Stats strip (count-up) ── */}
      <section className="bg-gold-600 text-white" ref={statsRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-wrap justify-center sm:justify-between gap-6 text-center">
            {[
              { label:'Years of Trust',           val: `${years}+` },
              { label:'Happy Customers',           val: `${customers.toLocaleString()}+` },
              { label:'Premium Brands',            val: `${brands}+` },
              { label:'Home Delivery Available',   val: 'Free' },
            ].map(({ label, val }, i) => (
              <div key={label} className={statsInView ? 'animate-fade-in-up' : 'opacity-0'} style={{animationDelay:`${i*0.15}s`}}>
                <div className="font-heading font-bold text-2xl">{statsInView ? val : '0'}</div>
                <div className="text-amber-100 text-xs">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories (scroll reveal + glow) ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="font-heading text-3xl font-bold text-navy-900 mb-2">What We Offer</h2>
          <p className="text-gray-500">Explore our complete range of eyewear &amp; optical solutions</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6" ref={catsRef}>
          {[
            { cat:'frame',      icon:'👓', title:'Eyeglass Frames', desc:'Full Rim, Half Rim & Rimless – all top brands', color:'bg-blue-50 border-blue-100',  btn:'bg-blue-600' },
            { cat:'sunglasses', icon:'🕶️', title:'Sunglasses',      desc:'Polarized, UV400 & fashion sunglasses',         color:'bg-amber-50 border-amber-100', btn:'bg-amber-600' },
            { cat:'lens',       icon:'🔬', title:'Optical Lenses',  desc:'Single Vision, Progressive, Bifocal & more',   color:'bg-green-50 border-green-100', btn:'bg-green-600' },
          ].map(({ cat, icon, title, desc, color, btn }, i) => (
            <Link key={cat} to={`/shop?category=${cat}`}
              className={`card card-glow border-2 ${color} p-8 text-center ${catsInView ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{animationDelay:`${i*0.15}s`, transition:'all 0.25s ease'}}>
              <div className="text-5xl mb-4">{icon}</div>
              <h3 className="font-heading font-semibold text-xl text-navy-900 mb-2">{title}</h3>
              <p className="text-gray-500 text-sm mb-5">{desc}</p>
              <span className={`${btn} text-white text-sm px-5 py-2 rounded-lg inline-block`}>Browse →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Wave divider */}
      <div className="bg-gray-50"><Wave color="white" /></div>

      {/* ── Trending Products (shimmer → pop-in) ── */}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5" ref={prodRef}>
            {loadingProducts
              ? Array.from({length: 8}).map((_, i) => <SkeletonCard key={i} />)
              : trending.map((p, i) => (
                <div key={p.id} className={prodInView ? 'animate-pop-in' : 'opacity-0'} style={{animationDelay:`${i*0.07}s`}}>
                  <ProductCard product={p} onAdd={() => handleAdd(p)} added={added[p.id]} />
                </div>
              ))
            }
          </div>
        </div>
      </section>

      {/* ── Why Choose Us (scroll reveal + glow) ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="font-heading text-3xl font-bold text-navy-900 mb-2">Why NetraKiran?</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center" ref={whyRef}>
          {[
            { icon:'🏆', title:'Expert Opticians',   desc:'15+ years of professional experience' },
            { icon:'🔬', title:'Precise Eye Testing', desc:'Advanced equipment & accurate results' },
            { icon:'💎', title:'Premium Brands',      desc:'Ray-Ban, Oakley, Titan, Essilor & more' },
            { icon:'🚚', title:'Home Delivery',       desc:'Fast delivery to your doorstep' },
          ].map(({ icon, title, desc }, i) => (
            <div key={title} className={`card card-glow p-6 ${whyInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{animationDelay:`${i*0.12}s`}}>
              <div className="text-4xl mb-3">{icon}</div>
              <h4 className="font-semibold text-navy-900 mb-1 text-sm">{title}</h4>
              <p className="text-gray-500 text-xs">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Customer Search CTA ── */}
      <section className="bg-navy-900 text-white" ref={ctaRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

            {/* Left: text */}
            <div className={`flex-1 text-center lg:text-left ${ctaInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
              <h2 className="font-heading text-3xl font-bold mb-3">Customer Lookup</h2>
              <p className="text-navy-300 mb-6 max-w-md mx-auto lg:mx-0">
                Search existing customer profiles by name, phone, or email. View their prescriptions, visit history, and personal discount — everything in one place.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                <Link to="/customer-search" className="ripple-wrap btn-gold text-base px-8 py-3" onClick={addRipple}>
                  Search Customer
                </Link>
                <Link to="/customer-register" className="ripple-wrap btn-secondary border-white text-white hover:bg-white hover:text-navy-900 text-base px-8 py-3" onClick={addRipple}>
                  Register New
                </Link>
              </div>
            </div>

            {/* Right: feature cards */}
            <div className={`flex-shrink-0 grid grid-cols-2 gap-3 w-full max-w-xs ${ctaInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{animationDelay:'0.15s'}}>
              {[
                { icon:'🔍', label:'Find by Name / Phone' },
                { icon:'🔬', label:'View Prescriptions' },
                { icon:'📋', label:'Visit History' },
                { icon:'🏷️', label:'Personal Discount' },
              ].map(({ icon, label }) => (
                <div key={label} className="bg-navy-800/60 border border-navy-700 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1.5">{icon}</div>
                  <p className="text-xs text-navy-200 font-medium leading-snug">{label}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* Bottom call strip */}
      <section className="bg-gold-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-medium text-sm">Need to reach us? Call during store hours (10 AM – 10 PM)</p>
          <a href="tel:07011295507" className="inline-flex items-center gap-2 bg-white text-gold-700 font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-amber-50 transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
            070112 95507
          </a>
        </div>
      </section>
    </div>
  )
}

function ProductCard({ product, onAdd, added }) {
  const disc = product.original_price ? Math.round((1 - product.price / product.original_price) * 100) : 0
  return (
    <div className="card card-glow overflow-hidden group h-full" style={{transition:'all 0.25s ease'}}>
      <div className="relative overflow-hidden bg-gray-100 h-48">
        <img src={product.image_url || 'https://via.placeholder.com/400x300?text=Product'} alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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
        <button onClick={e => { addRipple(e); onAdd() }}
          className={`ripple-wrap w-full text-xs py-2 rounded-lg font-medium transition-all duration-200 ${added ? 'bg-green-600 text-white' : 'bg-navy-800 hover:bg-navy-900 text-white'}`}>
          {added ? '✓ Added to Cart' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}
