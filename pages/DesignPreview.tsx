import React, { useState } from 'react';
import { Heart, Shield, MapPin, MessageCircle, ChevronRight, Search, Plus, Home, User, Check, AlertCircle, Loader2, Package, Sparkles } from 'lucide-react';

/**
 * Pipit Design System v2.0 Preview
 *
 * Warm. Distinctive. Human. Memorable.
 * Like a cozy neighborhood coffee shop, not a sterile tech product.
 *
 * Key elements:
 * - Recoleta/Fraunces for headlines (warm rounded serif)
 * - DM Sans for body (warm humanist sans)
 * - Warm cream backgrounds (#FFFCF9, not white)
 * - Sand neutrals instead of cold grays
 * - Warm teal primary (#2D9B8C)
 * - Coral accent (#E8725C)
 * - Honey highlights (#E8B44C)
 */

const DesignPreview = () => {
  const [activeTab, setActiveTab] = useState<'foundation' | 'components' | 'cards' | 'mobile'>('foundation');
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [donationOption, setDonationOption] = useState('round_up');

  const handleLoadingDemo = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: "'DM Sans', system-ui, sans-serif",
        backgroundColor: '#FFFCF9' // Warm cream, NOT white
      }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-50"
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #F5EDE6'
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#2D9B8C' }}
            >
              <span className="text-white text-lg">🐦</span>
            </div>
            <div>
              <h1
                className="text-xl font-semibold"
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  color: '#4A3F37'
                }}
              >
                pipit
              </h1>
              <p className="text-xs" style={{ color: '#B8A395' }}>Design System v2.0</p>
            </div>
          </div>
          <span
            className="text-sm px-3 py-1 rounded-full"
            style={{ backgroundColor: '#FFF5ED', color: '#E8725C' }}
          >
            Preview Mode
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-6 pt-6">
        <div className="flex gap-1" style={{ borderBottom: '1px solid #F5EDE6' }}>
          {(['foundation', 'components', 'cards', 'mobile'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-5 py-3 text-sm font-medium capitalize transition-all -mb-px"
              style={{
                color: activeTab === tab ? '#2D9B8C' : '#6B5D52',
                borderBottom: activeTab === tab ? '2px solid #2D9B8C' : '2px solid transparent',
                backgroundColor: activeTab === tab ? '#F0FAF8' : 'transparent',
                borderRadius: '8px 8px 0 0'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === 'foundation' && (
          <div className="space-y-16">
            {/* Philosophy */}
            <section
              className="p-8 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, #FFE8E2 0%, #FFF4D9 100%)'
              }}
            >
              <h2
                className="text-3xl font-semibold mb-4"
                style={{ fontFamily: "'Fraunces', Georgia, serif", color: '#4A3F37' }}
              >
                Warm. Distinctive. Human. 💛
              </h2>
              <p className="text-lg leading-relaxed max-w-2xl" style={{ color: '#6B5D52' }}>
                Pipit should feel like your favorite local shop run by people who genuinely care.
                Like a cozy neighborhood coffee shop, not a sterile tech product.
                The kind of place you tell your friends about.
              </p>
            </section>

            {/* Colors */}
            <section>
              <h2
                className="text-2xl font-semibold mb-6"
                style={{ fontFamily: "'Fraunces', Georgia, serif", color: '#4A3F37' }}
              >
                Color Palette
              </h2>

              {/* Backgrounds */}
              <h3 className="text-sm font-medium mb-3" style={{ color: '#B8A395' }}>BACKGROUNDS — The Foundation of Warmth</h3>
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="space-y-2">
                  <div className="h-24 rounded-xl border" style={{ backgroundColor: '#FFFCF9', borderColor: '#F5EDE6' }} />
                  <p className="text-sm font-medium" style={{ color: '#4A3F37' }}>Base</p>
                  <p className="text-xs" style={{ color: '#B8A395' }}>#FFFCF9 — Warm cream</p>
                </div>
                <div className="space-y-2">
                  <div className="h-24 rounded-xl" style={{ backgroundColor: '#FFF8F3' }} />
                  <p className="text-sm font-medium" style={{ color: '#4A3F37' }}>Warm</p>
                  <p className="text-xs" style={{ color: '#B8A395' }}>#FFF8F3 — Warmer sections</p>
                </div>
                <div className="space-y-2">
                  <div className="h-24 rounded-xl" style={{ backgroundColor: '#FFF5ED' }} />
                  <p className="text-sm font-medium" style={{ color: '#4A3F37' }}>Cozy</p>
                  <p className="text-xs" style={{ color: '#B8A395' }}>#FFF5ED — Hero/CTA areas</p>
                </div>
              </div>

              {/* Brand Colors */}
              <h3 className="text-sm font-medium mb-3" style={{ color: '#B8A395' }}>BRAND COLORS</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="space-y-2">
                  <div className="h-20 rounded-xl" style={{ backgroundColor: '#2D9B8C' }} />
                  <p className="text-sm font-medium" style={{ color: '#4A3F37' }}>Primary Teal</p>
                  <p className="text-xs" style={{ color: '#B8A395' }}>#2D9B8C — Trust & Action</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-xl" style={{ backgroundColor: '#E8725C' }} />
                  <p className="text-sm font-medium" style={{ color: '#4A3F37' }}>Coral</p>
                  <p className="text-xs" style={{ color: '#B8A395' }}>#E8725C — Energy & Warmth</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-xl" style={{ backgroundColor: '#E8B44C' }} />
                  <p className="text-sm font-medium" style={{ color: '#4A3F37' }}>Honey</p>
                  <p className="text-xs" style={{ color: '#B8A395' }}>#E8B44C — Highlights</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-xl" style={{ backgroundColor: '#4A3F37' }} />
                  <p className="text-sm font-medium" style={{ color: '#4A3F37' }}>Text</p>
                  <p className="text-xs" style={{ color: '#B8A395' }}>#4A3F37 — Warm brown</p>
                </div>
              </div>

              {/* Sand Neutrals */}
              <h3 className="text-sm font-medium mb-3" style={{ color: '#B8A395' }}>SAND NEUTRALS — Warm, not cold gray</h3>
              <div className="flex gap-2">
                {[
                  { color: '#FFFCF9', name: '50' },
                  { color: '#FFF8F3', name: '100' },
                  { color: '#F5EDE6', name: '200' },
                  { color: '#E8DDD4', name: '300' },
                  { color: '#D4C4B8', name: '400' },
                  { color: '#B8A395', name: '500' },
                  { color: '#9A8578', name: '600' },
                  { color: '#6B5D52', name: '700' },
                  { color: '#4A3F37', name: '800' },
                  { color: '#2D2622', name: '900' },
                ].map((swatch) => (
                  <div key={swatch.name} className="flex-1">
                    <div
                      className="h-12 rounded-lg mb-1 border"
                      style={{ backgroundColor: swatch.color, borderColor: swatch.name === '50' ? '#F5EDE6' : 'transparent' }}
                    />
                    <p className="text-xs text-center" style={{ color: '#B8A395' }}>{swatch.name}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Typography */}
            <section>
              <h2
                className="text-2xl font-semibold mb-6"
                style={{ fontFamily: "'Fraunces', Georgia, serif", color: '#4A3F37' }}
              >
                Typography
              </h2>
              <div
                className="rounded-2xl p-8 space-y-6"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #F5EDE6' }}
              >
                <div>
                  <p className="text-xs mb-2" style={{ color: '#B8A395' }}>Display / Fraunces (Recoleta alternative)</p>
                  <p
                    className="text-5xl font-bold"
                    style={{ fontFamily: "'Fraunces', Georgia, serif", color: '#4A3F37', letterSpacing: '-0.02em' }}
                  >
                    Pass it on. 💛
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-2" style={{ color: '#B8A395' }}>Heading 1 / Fraunces</p>
                  <p
                    className="text-3xl font-semibold"
                    style={{ fontFamily: "'Fraunces', Georgia, serif", color: '#4A3F37' }}
                  >
                    Find trusted gear for your family
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-2" style={{ color: '#B8A395' }}>Heading 2 / Fraunces</p>
                  <p
                    className="text-2xl font-semibold"
                    style={{ fontFamily: "'Fraunces', Georgia, serif", color: '#4A3F37' }}
                  >
                    Near you in Auburn
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-2" style={{ color: '#B8A395' }}>Body / DM Sans</p>
                  <p className="text-base leading-relaxed" style={{ color: '#6B5D52' }}>
                    Pipit is a hyper-local marketplace for baby and kids gear that solves the trust and safety problems parents face. We're parents helping parents.
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-2" style={{ color: '#B8A395' }}>Price / DM Mono</p>
                  <p
                    className="text-2xl font-semibold"
                    style={{ fontFamily: "'DM Mono', monospace", color: '#4A3F37' }}
                  >
                    $275
                  </p>
                </div>
              </div>
            </section>

            {/* Gradients */}
            <section>
              <h2
                className="text-2xl font-semibold mb-6"
                style={{ fontFamily: "'Fraunces', Georgia, serif", color: '#4A3F37' }}
              >
                Gradients
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div
                    className="h-32 rounded-xl"
                    style={{ background: 'linear-gradient(135deg, #FFE8E2 0%, #FFF4D9 100%)' }}
                  />
                  <p className="text-sm font-medium" style={{ color: '#4A3F37' }}>Sunset</p>
                  <p className="text-xs" style={{ color: '#B8A395' }}>Coral to Honey — Special moments</p>
                </div>
                <div className="space-y-2">
                  <div
                    className="h-32 rounded-xl"
                    style={{ background: 'radial-gradient(ellipse at top center, #FFF5ED 0%, #FFFCF9 70%)' }}
                  />
                  <p className="text-sm font-medium" style={{ color: '#4A3F37' }}>Radial Warm</p>
                  <p className="text-xs" style={{ color: '#B8A395' }}>Hero sections</p>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'components' && (
          <div className="space-y-12">
            {/* Buttons */}
            <section>
              <h2
                className="text-2xl font-semibold mb-6"
                style={{ fontFamily: "'Fraunces', Georgia, serif", color: '#4A3F37' }}
              >
                Buttons
              </h2>
              <div
                className="rounded-2xl p-8"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #F5EDE6' }}
              >
                <div className="flex flex-wrap gap-4 items-center mb-8">
                  {/* Primary */}
                  <button
                    onClick={handleLoadingDemo}
                    className="px-6 py-3 text-white font-semibold rounded-lg transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                    style={{
                      backgroundColor: '#2D9B8C',
                      boxShadow: '0 4px 12px rgba(45, 155, 140, 0.25), inset 0 1px 0 rgba(255,255,255,0.15)'
                    }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Primary Button'
                    )}
                  </button>

                  {/* Secondary */}
                  <button
                    className="px-6 py-3 font-semibold rounded-lg transition-all"
                    style={{
                      color: '#2D9B8C',
                      border: '2px solid #A8E4DA',
                      backgroundColor: 'transparent'
                    }}
                  >
                    Secondary
                  </button>

                  {/* Warm/Sunset */}
                  <button
                    className="px-6 py-3 font-semibold rounded-lg transition-all hover:-translate-y-0.5"
                    style={{
                      background: 'linear-gradient(135deg, #FFE8E2 0%, #FFF4D9 100%)',
                      color: '#4A3F37',
                      boxShadow: '0 2px 8px rgba(232, 114, 92, 0.15)'
                    }}
                  >
                    Warm CTA
                  </button>

                  {/* Heart/Save */}
                  <button
                    onClick={() => setIsSaved(!isSaved)}
                    className="p-3 rounded-xl transition-all duration-200"
                    style={{
                      backgroundColor: isSaved ? '#E8725C' : '#FFFFFF',
                      border: isSaved ? 'none' : '1px solid #E8DDD4',
                      color: isSaved ? '#FFFFFF' : '#B8A395'
                    }}
                  >
                    <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* States */}
                <p className="text-sm mb-3" style={{ color: '#B8A395' }}>States</p>
                <div className="flex flex-wrap gap-4">
                  <button
                    className="px-6 py-3 text-white font-semibold rounded-lg opacity-50 cursor-not-allowed"
                    style={{ backgroundColor: '#2D9B8C' }}
                  >
                    Disabled
                  </button>
                  <button
                    className="px-6 py-3 text-white font-semibold rounded-lg flex items-center gap-2"
                    style={{ backgroundColor: '#10B981' }}
                  >
                    <Check className="w-4 h-4" /> Success
                  </button>
                  <button
                    className="px-6 py-3 text-white font-semibold rounded-lg flex items-center gap-2"
                    style={{ backgroundColor: '#E55B5B' }}
                  >
                    <AlertCircle className="w-4 h-4" /> Error
                  </button>
                </div>
              </div>
            </section>

            {/* Badges */}
            <section>
              <h2
                className="text-2xl font-semibold mb-6"
                style={{ fontFamily: "'Fraunces', Georgia, serif", color: '#4A3F37' }}
              >
                Badges
              </h2>
              <div
                className="rounded-2xl p-8"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #F5EDE6' }}
              >
                <div className="flex flex-wrap gap-3">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full"
                    style={{ backgroundColor: '#ECFDF5', color: '#047857' }}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Safety Verified
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full"
                    style={{ backgroundColor: '#F0FAF8', color: '#257E72' }}
                  >
                    <Check className="w-3.5 h-3.5" />
                    No Recalls
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full"
                    style={{ backgroundColor: '#FFF5F2', color: '#E8725C' }}
                  >
                    <Heart className="w-3.5 h-3.5" />
                    Popular
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full"
                    style={{ backgroundColor: '#FFF4D9', color: '#B45309' }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Like New
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full"
                    style={{ backgroundColor: '#F5EDE6', color: '#6B5D52' }}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    2.3 mi
                  </span>
                </div>
              </div>
            </section>

            {/* Forms */}
            <section>
              <h2
                className="text-2xl font-semibold mb-6"
                style={{ fontFamily: "'Fraunces', Georgia, serif", color: '#4A3F37' }}
              >
                Form Inputs
              </h2>
              <div
                className="rounded-2xl p-8 space-y-6 max-w-md"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #F5EDE6' }}
              >
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#6B5D52' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-lg transition-all focus:outline-none"
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '2px solid #E8DDD4',
                      color: '#4A3F37'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#6B5D52' }}>
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#D4C4B8' }} />
                    <input
                      type="text"
                      placeholder="Search for strollers, bikes..."
                      className="w-full pl-12 pr-4 py-3 rounded-lg transition-all focus:outline-none"
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '2px solid #E8DDD4',
                        color: '#4A3F37'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#6B5D52' }}>
                    Phone (Verified)
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value="(555) 123-4567"
                      readOnly
                      className="w-full px-4 py-3 pr-12 rounded-lg"
                      style={{
                        backgroundColor: '#ECFDF5',
                        border: '2px solid #10B981',
                        color: '#4A3F37'
                      }}
                    />
                    <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#10B981' }} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#6B5D52' }}>
                    Price (Error)
                  </label>
                  <input
                    type="text"
                    value="abc"
                    className="w-full px-4 py-3 rounded-lg focus:outline-none"
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '2px solid #E55B5B',
                      color: '#4A3F37'
                    }}
                  />
                  <p className="mt-2 text-sm flex items-center gap-1" style={{ color: '#E55B5B' }}>
                    <AlertCircle className="w-4 h-4" />
                    Please enter a valid price
                  </p>
                </div>
              </div>
            </section>

            {/* Charity Donation */}
            <section>
              <h2
                className="text-2xl font-semibold mb-6"
                style={{ fontFamily: "'Fraunces', Georgia, serif", color: '#4A3F37' }}
              >
                Charity Donation (Checkout)
              </h2>
              <div
                className="rounded-2xl p-6 max-w-md"
                style={{ backgroundColor: '#FFF4D9', border: '1px solid #E8B44C' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">💛</span>
                  <span className="font-semibold" style={{ color: '#4A3F37' }}>Help local families</span>
                </div>

                <div className="space-y-2">
                  {[
                    { id: 'round_up', label: 'Round up', amount: '$0.25' },
                    { id: 'percent_2', label: 'Add 2%', amount: '$3.50' },
                    { id: 'percent_5', label: 'Add 5%', amount: '$8.75' },
                    { id: 'none', label: 'No thanks', amount: '' },
                  ].map((option) => (
                    <label
                      key={option.id}
                      className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all"
                      style={{
                        backgroundColor: donationOption === option.id ? '#FFFCF9' : '#FFFBF0',
                        border: donationOption === option.id ? '2px solid #E8B44C' : '2px solid transparent'
                      }}
                      onClick={() => setDonationOption(option.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                          style={{
                            borderColor: donationOption === option.id ? '#E8B44C' : '#D4C4B8',
                            backgroundColor: donationOption === option.id ? '#E8B44C' : 'transparent'
                          }}
                        >
                          {donationOption === option.id && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <span style={{ color: '#4A3F37' }}>{option.label}</span>
                      </div>
                      {option.amount && (
                        <span className="text-sm" style={{ color: '#6B5D52' }}>{option.amount}</span>
                      )}
                    </label>
                  ))}
                </div>

                <div
                  className="mt-4 p-3 rounded-xl"
                  style={{ backgroundColor: '#FFFBF0' }}
                >
                  <p className="text-sm" style={{ color: '#6B5D52' }}>
                    Your donation goes to:<br />
                    <span className="font-medium" style={{ color: '#4A3F37' }}>Auburn Food Bank</span> — Kids Backpack Program 🎒
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'cards' && (
          <div className="space-y-12">
            {/* Desktop Cards */}
            <section>
              <h2
                className="text-2xl font-semibold mb-6"
                style={{ fontFamily: "'Fraunces', Georgia, serif", color: '#4A3F37' }}
              >
                Listing Cards (Desktop)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { title: 'UppaBaby Vista V2', price: 275, originalPrice: 450, condition: 'Like New', distance: 2.1 },
                  { title: 'Woom 3 Kids Bike', price: 199, originalPrice: 349, condition: 'Gently Used', distance: 0.8 },
                  { title: 'Bugaboo Fox 3', price: 425, originalPrice: 1299, condition: 'Like New', distance: 5.2 },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 group"
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #F5EDE6',
                      boxShadow: '0 2px 8px rgba(30, 25, 20, 0.04), 0 4px 16px rgba(30, 25, 20, 0.04)'
                    }}
                  >
                    {/* Image */}
                    <div className="aspect-[4/3] relative overflow-hidden" style={{ backgroundColor: '#FFF8F3' }}>
                      <div className="absolute inset-0 flex items-center justify-center" style={{ color: '#D4C4B8' }}>
                        <Package className="w-16 h-16" />
                      </div>
                      {/* Price Badge */}
                      <div
                        className="absolute bottom-3 left-3 px-3 py-1 rounded-full font-semibold"
                        style={{
                          backgroundColor: '#FFFFFF',
                          fontFamily: "'DM Mono', monospace",
                          color: '#4A3F37',
                          boxShadow: '0 2px 8px rgba(30, 25, 20, 0.1)'
                        }}
                      >
                        ${item.price}
                      </div>
                      {/* Safety Badge */}
                      <div
                        className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                        style={{ backgroundColor: '#10B981', color: 'white' }}
                      >
                        <Shield className="w-3 h-3" />
                        Verified
                      </div>
                      {/* Save Button */}
                      <button className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                        <Heart className="w-4 h-4" style={{ color: '#B8A395' }} />
                      </button>
                    </div>
                    {/* Content */}
                    <div className="p-4">
                      <h3
                        className="font-semibold truncate group-hover:text-[#2D9B8C] transition-colors"
                        style={{ color: '#4A3F37' }}
                      >
                        {item.title}
                      </h3>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-sm line-through" style={{ color: '#B8A395' }}>${item.originalPrice}</span>
                        <span className="text-xs font-medium" style={{ color: '#10B981' }}>
                          {Math.round((1 - item.price / item.originalPrice) * 100)}% off
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-sm" style={{ color: '#9A8578' }}>
                        <span
                          className="px-2 py-0.5 rounded text-xs"
                          style={{ backgroundColor: '#FFF4D9', color: '#B45309' }}
                        >
                          {item.condition}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {item.distance} mi
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Mobile Cards */}
            <section>
              <h2
                className="text-2xl font-semibold mb-6"
                style={{ fontFamily: "'Fraunces', Georgia, serif", color: '#4A3F37' }}
              >
                Listing Cards (Mobile)
              </h2>
              <div className="max-w-md space-y-3">
                {[
                  { title: 'UppaBaby Vista V2', price: 275, distance: 2.1, seller: 'Sarah M.', rating: 4.9 },
                  { title: 'Woom 3 Kids Bike', price: 199, distance: 0.8, seller: 'Mike T.', rating: 5.0 },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-3 flex gap-4 cursor-pointer active:scale-[0.98] transition-transform"
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #F5EDE6'
                    }}
                  >
                    <div
                      className="w-24 h-24 rounded-xl flex-shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: '#FFF8F3' }}
                    >
                      <Package className="w-10 h-10" style={{ color: '#D4C4B8' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate" style={{ color: '#4A3F37' }}>{item.title}</h3>
                      <p
                        className="text-lg font-bold"
                        style={{ fontFamily: "'DM Mono', monospace", color: '#4A3F37' }}
                      >
                        ${item.price}
                      </p>
                      <div className="flex items-center gap-2 text-xs mt-1" style={{ color: '#9A8578' }}>
                        <span className="flex items-center gap-0.5">
                          <Shield className="w-3 h-3" style={{ color: '#10B981' }} />
                          Safe
                        </span>
                        <span>·</span>
                        <span>{item.distance} mi</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs mt-1" style={{ color: '#9A8578' }}>
                        <span>{item.seller}</span>
                        <span>★ {item.rating}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 self-center" style={{ color: '#E8DDD4' }} />
                  </div>
                ))}
              </div>
            </section>

            {/* Skeleton Loading */}
            <section>
              <h2
                className="text-2xl font-semibold mb-6"
                style={{ fontFamily: "'Fraunces', Georgia, serif", color: '#4A3F37' }}
              >
                Skeleton Loading
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-2xl overflow-hidden"
                    style={{ backgroundColor: '#FFFFFF', border: '1px solid #F5EDE6' }}
                  >
                    <div
                      className="aspect-[4/3]"
                      style={{
                        background: 'linear-gradient(90deg, #FFF8F3 0%, #FFFCF9 50%, #FFF8F3 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.5s ease-in-out infinite'
                      }}
                    />
                    <div className="p-4 space-y-3">
                      <div className="h-4 rounded-full w-3/4" style={{ backgroundColor: '#F5EDE6' }} />
                      <div className="h-5 rounded-full w-1/3" style={{ backgroundColor: '#F5EDE6' }} />
                      <div className="h-3 rounded-full w-1/2" style={{ backgroundColor: '#F5EDE6' }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'mobile' && (
          <div className="space-y-12">
            {/* Phone Frame */}
            <section>
              <h2
                className="text-2xl font-semibold mb-6"
                style={{ fontFamily: "'Fraunces', Georgia, serif", color: '#4A3F37' }}
              >
                Mobile Preview (375px)
              </h2>
              <div className="flex justify-center">
                <div
                  className="w-[375px] rounded-[3rem] p-3 shadow-2xl"
                  style={{ backgroundColor: '#2D2622' }}
                >
                  <div
                    className="rounded-[2.5rem] overflow-hidden h-[700px] relative"
                    style={{ backgroundColor: '#FFFCF9' }}
                  >
                    {/* Status Bar */}
                    <div className="h-12 flex items-center justify-center" style={{ backgroundColor: '#FFFFFF' }}>
                      <div className="w-32 h-6 rounded-full" style={{ backgroundColor: '#2D2622' }} />
                    </div>

                    {/* Header */}
                    <div
                      className="px-4 py-3 flex items-center justify-between"
                      style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #F5EDE6' }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: '#2D9B8C' }}
                        >
                          <span className="text-white text-sm">🐦</span>
                        </div>
                        <span
                          className="font-semibold"
                          style={{ fontFamily: "'Fraunces', Georgia, serif", color: '#4A3F37' }}
                        >
                          pipit
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Search className="w-5 h-5" style={{ color: '#9A8578' }} />
                        <MessageCircle className="w-5 h-5" style={{ color: '#9A8578' }} />
                      </div>
                    </div>

                    {/* Hero */}
                    <div
                      className="px-4 py-6 text-center"
                      style={{ background: 'radial-gradient(ellipse at top center, #FFF5ED 0%, #FFFCF9 100%)' }}
                    >
                      <p className="text-sm flex items-center justify-center gap-1 mb-2" style={{ color: '#9A8578' }}>
                        <MapPin className="w-4 h-4" />
                        Auburn, WA · 12 nearby
                      </p>
                      <h2
                        className="text-xl font-semibold"
                        style={{ fontFamily: "'Fraunces', Georgia, serif", color: '#4A3F37' }}
                      >
                        Find trusted gear 💛
                      </h2>
                    </div>

                    {/* Content */}
                    <div className="px-4 py-4 space-y-3 overflow-y-auto h-[380px]">
                      <h3 className="text-sm font-medium" style={{ color: '#9A8578' }}>Near you</h3>

                      {[
                        { title: 'UppaBaby Vista V2', price: 275, distance: 2.1, seller: 'Sarah M.' },
                        { title: 'Woom 3 Bike - Red', price: 199, distance: 0.8, seller: 'Mike T.' },
                        { title: 'Chicco KeyFit 30', price: 85, distance: 3.2, seller: 'Lisa K.' },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="rounded-xl p-3 flex gap-3"
                          style={{ backgroundColor: '#FFFFFF', border: '1px solid #F5EDE6' }}
                        >
                          <div
                            className="w-20 h-20 rounded-lg flex-shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: '#FFF8F3' }}
                          >
                            <Package className="w-8 h-8" style={{ color: '#D4C4B8' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate" style={{ color: '#4A3F37' }}>{item.title}</h4>
                            <p className="font-bold" style={{ fontFamily: "'DM Mono', monospace", color: '#4A3F37' }}>${item.price}</p>
                            <p className="text-xs mt-1" style={{ color: '#9A8578' }}>
                              ✓ Safe · {item.distance} mi · {item.seller}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bottom Navigation */}
                    <div
                      className="absolute bottom-0 left-0 right-0 px-6 py-2 flex justify-around items-center"
                      style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid #F5EDE6' }}
                    >
                      {[
                        { icon: Home, label: 'Home', active: true },
                        { icon: Search, label: 'Browse', active: false },
                        { icon: Plus, label: 'Sell', active: false, accent: true },
                        { icon: MessageCircle, label: 'Chat', active: false },
                        { icon: User, label: 'Profile', active: false },
                      ].map((item, i) => (
                        <button key={i} className="flex flex-col items-center gap-0.5 py-2">
                          {item.accent ? (
                            <div
                              className="w-12 h-12 -mt-6 rounded-full flex items-center justify-center shadow-lg"
                              style={{ backgroundColor: '#2D9B8C' }}
                            >
                              <item.icon className="w-6 h-6 text-white" />
                            </div>
                          ) : (
                            <>
                              <item.icon
                                className="w-6 h-6"
                                style={{ color: item.active ? '#2D9B8C' : '#B8A395' }}
                              />
                              <span
                                className="text-[10px]"
                                style={{
                                  color: item.active ? '#2D9B8C' : '#B8A395',
                                  fontWeight: item.active ? 500 : 400
                                }}
                              >
                                {item.label}
                              </span>
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Bottom Sheet */}
            <section>
              <h2
                className="text-2xl font-semibold mb-6"
                style={{ fontFamily: "'Fraunces', Georgia, serif", color: '#4A3F37' }}
              >
                Bottom Sheet
              </h2>
              <div className="max-w-md mx-auto">
                <div
                  className="rounded-t-3xl p-6 shadow-xl"
                  style={{ backgroundColor: '#FFFFFF', border: '1px solid #F5EDE6', borderBottom: 'none' }}
                >
                  {/* Handle */}
                  <div className="w-10 h-1 rounded-full mx-auto mb-6" style={{ backgroundColor: '#E8DDD4' }} />

                  <h3
                    className="text-xl font-semibold mb-2"
                    style={{ fontFamily: "'Fraunces', Georgia, serif", color: '#4A3F37' }}
                  >
                    Buy This Item
                  </h3>
                  <p className="mb-6" style={{ color: '#9A8578' }}>
                    Your payment is held safely until you inspect and accept.
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#9A8578' }}>Item price</span>
                      <span style={{ color: '#4A3F37' }}>$275.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#9A8578' }}>Platform fee</span>
                      <span style={{ color: '#4A3F37' }}>$17.88</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#9A8578' }}>Donation (Round up)</span>
                      <span style={{ color: '#2D9B8C' }}>$0.12</span>
                    </div>
                    <div
                      className="pt-3 flex justify-between font-semibold"
                      style={{ borderTop: '1px solid #F5EDE6' }}
                    >
                      <span style={{ color: '#4A3F37' }}>Total</span>
                      <span style={{ color: '#4A3F37' }}>$293.00</span>
                    </div>
                  </div>

                  <button
                    className="w-full py-4 text-white font-semibold rounded-xl transition-colors"
                    style={{ backgroundColor: '#2D9B8C' }}
                  >
                    Pay $293.00
                  </button>

                  <p
                    className="text-xs text-center mt-4 flex items-center justify-center gap-1"
                    style={{ color: '#B8A395' }}
                  >
                    <Shield className="w-3 h-3" />
                    Secure checkout powered by Stripe
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&display=swap');

        /* Focus states */
        input:focus {
          border-color: #2D9B8C !important;
          box-shadow: 0 0 0 3px rgba(45, 155, 140, 0.15);
        }

        /* Warm button hover glow */
        button:hover {
          box-shadow: 0 4px 12px rgba(45, 155, 140, 0.25), inset 0 1px 0 rgba(255,255,255,0.15);
        }
      `}</style>
    </div>
  );
};

export default DesignPreview;
