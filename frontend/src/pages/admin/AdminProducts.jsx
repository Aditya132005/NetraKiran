import { useState, useEffect, useRef } from 'react'
import api from '../../utils/api'

const EMPTY = { name:'', category:'frame', brand:'', frame_type:'Full Rim', lens_type:'', price:'', original_price:'', image_url:'', description:'', features:'', stock:100, trending:false, gender:'unisex' }
const CATEGORIES = ['frame','sunglasses','lens','accessory']
const FRAME_TYPES = ['Full Rim','Half Rim','Rimless']
const LENS_TYPES = ['Single Vision','Progressive','Bifocal','Trifocal','Photochromic','Blue Cut','Tinted']

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ ...EMPTY })
  const [editId, setEditId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const load = () => {
    setLoading(true)
    api.get('/products').then(r => setProducts(r.data)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const filtered = filter === 'all' ? products : products.filter(p => p.category === filter)

  const set = k => e => setForm(p => ({ ...p, [k]: e.type === 'checkbox' ? e.checked : e.target.value }))

  const openEdit = (p) => {
    setForm({ ...p, trending: p.trending === 1 })
    setEditId(p.id)
    setShowForm(true)
  }

  const openAdd = () => { setForm({ ...EMPTY }); setEditId(null); setShowForm(true) }

  const save = async (e) => {
    e.preventDefault()
    if (editId) await api.put(`/products/${editId}`, form)
    else await api.post('/products', form)
    load()
    setShowForm(false)
  }

  const del = async (id) => {
    if (!confirm('Delete this product?')) return
    await api.delete(`/products/${id}`)
    load()
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const { data } = await api.post('/products/upload-image', fd)
      setForm(p => ({ ...p, image_url: data.url }))
    } catch (err) {
      alert(err.response?.data?.error || 'Image upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap">
          {['all',...CATEGORIES].map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className={`px-4 py-1.5 rounded-full text-sm capitalize transition-colors border ${filter===c ? 'bg-navy-800 text-white border-navy-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
              {c}
              <span className="ml-1 text-xs opacity-70">({c==='all'?products.length:products.filter(p=>p.category===c).length})</span>
            </button>
          ))}
        </div>
        <button onClick={openAdd} className="btn-primary text-sm py-2">+ Add Product</button>
      </div>

      {loading ? <p className="text-gray-400 text-sm text-center py-12">Loading…</p> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.length === 0 && <p className="text-gray-400 text-sm col-span-full text-center py-12">No products found</p>}
          {filtered.map(p => (
            <div key={p.id} className="card overflow-hidden group">
              <div className="relative h-44 bg-gray-100 overflow-hidden">
                <img src={p.image_url || 'https://via.placeholder.com/400x300?text=Product'} alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={e => { e.target.src = 'https://via.placeholder.com/400x300?text=Eyewear' }}
                />
                {p.trending === 1 && <span className="absolute top-2 left-2 bg-gold-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Trending</span>}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => openEdit(p)} className="bg-white text-gray-800 rounded-lg px-3 py-1.5 text-xs font-medium">Edit</button>
                  <button onClick={() => del(p.id)} className="bg-red-500 text-white rounded-lg px-3 py-1.5 text-xs font-medium">Delete</button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-[11px] text-gray-400 uppercase tracking-wide">{p.brand}</p>
                <p className="text-sm font-medium text-gray-800 leading-snug mt-0.5 line-clamp-2">{p.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-bold text-navy-800 text-sm">₹{p.price?.toLocaleString()}</span>
                  {p.original_price && <span className="text-gray-400 text-xs line-through">₹{p.original_price?.toLocaleString()}</span>}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-400 capitalize">{p.category}</span>
                  <span className="text-xs text-gray-400">Stock: {p.stock}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading font-bold text-lg">{editId ? 'Edit Product' : 'Add Product'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={save} className="space-y-3">
              <div><label className="label">Product Name *</label><input className="input" required value={form.name} onChange={set('name')}/></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Category *</label>
                  <select className="input" value={form.category} onChange={set('category')}>
                    {CATEGORIES.map(c => <option key={c} className="capitalize" value={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="label">Brand</label><input className="input" value={form.brand} onChange={set('brand')}/></div>
              </div>

              {(form.category === 'frame' || form.category === 'sunglasses') && (
                <div>
                  <label className="label">Frame Type</label>
                  <select className="input" value={form.frame_type} onChange={set('frame_type')}>
                    {FRAME_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              )}
              {form.category === 'lens' && (
                <div>
                  <label className="label">Lens Type</label>
                  <select className="input" value={form.lens_type} onChange={set('lens_type')}>
                    <option value="">Select…</option>
                    {LENS_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Price (₹) *</label><input className="input" type="number" required value={form.price} onChange={set('price')}/></div>
                <div><label className="label">Original Price (₹)</label><input className="input" type="number" value={form.original_price} onChange={set('original_price')}/></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Stock</label><input className="input" type="number" value={form.stock} onChange={set('stock')}/></div>
                <div>
                  <label className="label">Gender</label>
                  <select className="input" value={form.gender} onChange={set('gender')}>
                    {['unisex','male','female'].map(g => <option key={g} className="capitalize" value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              {/* Image URL + Upload */}
              <div>
                <label className="label">Product Image</label>
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    type="url"
                    placeholder="https://… or upload below"
                    value={form.image_url}
                    onChange={set('image_url')}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex-shrink-0 px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-colors disabled:opacity-50 whitespace-nowrap flex items-center gap-1.5">
                    {uploading ? (
                      <><div className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin"/><span>Uploading…</span></>
                    ) : (
                      <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg><span>Upload</span></>
                    )}
                  </button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                {form.image_url && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={form.image_url} alt="Preview" className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                      onError={e => { e.target.style.display = 'none' }}/>
                    <p className="text-xs text-gray-400 truncate">{form.image_url}</p>
                  </div>
                )}
              </div>

              <div><label className="label">Description</label><textarea className="input resize-none" rows="2" value={form.description} onChange={set('description')}/></div>
              <div><label className="label">Features (comma-separated)</label><input className="input" placeholder="UV400,Anti-Glare,Lightweight" value={form.features} onChange={set('features')}/></div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.trending} onChange={e => setForm(p => ({ ...p, trending: e.target.checked }))} className="w-4 h-4 accent-navy-800"/>
                <span className="text-sm font-medium text-gray-700">Mark as Trending</span>
              </label>

              <button type="submit" className="btn-primary w-full py-3">
                {editId ? 'Save Changes' : 'Add Product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
