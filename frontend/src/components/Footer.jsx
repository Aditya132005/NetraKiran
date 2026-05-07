import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-navy-900 text-navy-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-gold-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">NK</div>
              <div>
                <div className="font-heading font-bold text-white text-base leading-tight">Netra Kiran</div>
                <div className="text-[10px] text-navy-300 tracking-widest uppercase">Optics</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-navy-300 mb-4">Your vision is our passion. Premium eyewear and expert optical services in Indirapuram.</p>
            <div className="flex items-center gap-1.5 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-navy-300">Open Today 10 AM – 8 PM</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[['/', 'Home'], ['/shop', 'Shop'], ['/shop?category=frame', 'Frames'], ['/shop?category=sunglasses', 'Sunglasses'], ['/shop?category=lens', 'Lenses'], ['/book-appointment', 'Book Appointment']].map(([to, label]) => (
                <li key={to}><Link to={to} className="hover:text-gold-400 transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* My Account */}
          <div>
            <h4 className="text-white font-semibold mb-4">Account</h4>
            <ul className="space-y-2 text-sm">
              {[['/login', 'Login'], ['/signup', 'Create Account'], ['/dashboard', 'My Dashboard'], ['/my-orders', 'My Orders'], ['/my-prescriptions', 'My Prescriptions']].map(([to, label]) => (
                <li key={to}><Link to={to} className="hover:text-gold-400 transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-gold-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>LGF/3, Retailx Shopping Complex, Near Sophia Apartment, Abhay Khand-3, Indirapuram, Ghaziabad 201010</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gold-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                <a href="tel:07011295507" className="hover:text-gold-400 transition-colors">070112 95507</a>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gold-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <a href="mailto:admin@netrakiran.com" className="hover:text-gold-400 transition-colors">admin@netrakiran.com</a>
              </li>
              <li>
                <a href="https://maps.app.goo.gl/pSrvNAzrKFApMMeN6" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-gold-400 hover:text-gold-300 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                  View on Google Maps
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-navy-700 mt-10 pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-navy-400">
            <p>© {new Date().getFullYear()} Netra Kiran Optics. All rights reserved.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <span className="hover:text-gold-400 cursor-default transition-colors">Privacy Policy</span>
              <span className="hover:text-gold-400 cursor-default transition-colors">Terms of Use</span>
              <span className="hover:text-gold-400 cursor-default transition-colors">Refund Policy</span>
              <span className="hover:text-gold-400 cursor-default transition-colors">Disclaimer</span>
            </div>
          </div>
          <p className="text-[10px] text-navy-500 text-center leading-relaxed max-w-4xl mx-auto">
            Netra Kiran Optics is a registered optical retail business. All product images, brand names, and trademarks belong to their respective owners and are used for identification purposes only.
            Prices are subject to change without notice. Prescriptions dispensed are based on professional examination and customer-provided information — Netra Kiran Optics is not liable for errors arising from
            incorrect information provided by customers. Eye check-up appointments are advisory in nature and do not replace a certified ophthalmologist consultation for medical conditions.
            This website is operated for informational and e-commerce purposes only. Governed by the laws of India under the Consumer Protection Act 2019, Information Technology Act 2000, and applicable GST regulations.
            GST Registration: As applicable · Shop Reg: LGF/3, Retailx Shopping Complex, Indirapuram, Ghaziabad 201010.
          </p>
        </div>
      </div>
    </footer>
  )
}
