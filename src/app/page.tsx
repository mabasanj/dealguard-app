'use client';

import Link from "next/link";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function Home() {
  const { data: session } = useSession();

  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen font-sans">

      {/* HERO — dark background, massive headline */}
      <section className="relative bg-[#0D0D0D] text-white pt-20 pb-0 md:pt-28 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(255,99,20,0.22),transparent_32%),radial-gradient(circle_at_85%_8%,rgba(255,255,255,0.08),transparent_28%)] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative max-w-4xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 text-white/70 text-xs font-medium px-4 py-1.5 rounded-full mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block"></span>
              Trusted escrow rails for South African commerce
            </div>
            <h1 className="text-6xl md:text-[84px] font-bold leading-[1.01] tracking-tight mb-7">
              Secure Every<br />
              <span className="text-primary">Deal</span> You Make
            </h1>
            <p className="text-lg md:text-xl text-white/60 max-w-xl mx-auto mb-10 leading-relaxed">
              DealGuard places buyer funds in controlled escrow and releases only when agreed delivery terms are satisfied.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/auth/register" className="btn bg-primary text-white hover:bg-primary-dark px-8 py-3.5 text-base rounded-full font-semibold transition">
                Get started free
              </Link>
              <Link href="/auth/login" className="btn px-8 py-3.5 text-base rounded-full border border-white/20 text-white hover:bg-white/10 transition font-medium">
                Log in
              </Link>
            </div>
            <p className="text-white/30 text-sm mt-5">No monthly subscription &middot; 7% fee only when a deal is completed &middot; If a dispute is raised, funds stay in escrow until resolution</p>
          </div>

          {/* Hero visual mockup */}
          <div className="relative mx-auto max-w-2xl">
            <div className="bg-[#1A1A1A] border border-white/10 rounded-t-3xl p-6 md:p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-white/40 text-xs">Escrow Balance</p>
                  <p className="text-white text-3xl font-bold mt-1">ZAR 24,500.00</p>
                </div>
                <span className="bg-primary/10 text-primary border border-primary/20 text-xs font-semibold px-3 py-1.5 rounded-full">
                  Active deal
                </span>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Bulk electronics — Cape Town', amount: 'ZAR 18,500', status: 'Released', color: 'text-green-400 bg-green-400/10' },
                  { label: 'WhatsApp phone deal — Durban', amount: 'ZAR 3,200', status: 'Pending', color: 'text-yellow-400 bg-yellow-400/10' },
                  { label: 'Facebook Marketplace — JHB', amount: 'ZAR 2,800', status: 'In escrow', color: 'text-primary bg-primary/10' },
                ].map((deal, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-3">
                    <div>
                      <p className="text-white text-sm font-medium">{deal.label}</p>
                      <p className="text-white/40 text-xs mt-0.5">{deal.amount}</p>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${deal.color}`}>{deal.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="bg-[#0D0D0D] border-t border-white/10 border-b border-white/10 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-white/45 text-xs md:text-sm uppercase tracking-[0.18em] font-medium">
            <span>Facebook Marketplace</span>
            <span>WhatsApp Trading</span>
            <span>TikTok Commerce</span>
            <span>P2P Resale</span>
            <span>B2B Bulk Orders</span>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="bg-white border-b border-gray-100 py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { num: 'ZAR 0', label: 'To create an escrow' },
              { num: '7%', label: 'Fee only on successful release' },
              { num: '100%', label: 'Escrow-controlled payment flow' },
              { num: '24/7', label: 'Deal monitoring and support' },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-3xl md:text-4xl font-bold text-[#0D0D0D] tracking-tight">{s.num}</p>
                <p className="text-gray-500 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE 1 — Create escrow instantly */}
      <section className="bg-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-primary text-sm font-semibold uppercase tracking-widest">Create Escrow</span>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-4 mb-6 leading-tight tracking-tight">
                Lock funds before<br />any goods move
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-8">
                Replace risky direct transfers with a controlled escrow flow. Funds remain protected until delivery is confirmed, reducing fraud for both buyer and seller.
              </p>
              <Link href="/auth/register" className="btn bg-primary text-white hover:bg-primary-dark px-7 py-3 text-sm rounded-full font-semibold transition inline-flex">
                Create your first escrow
              </Link>
            </div>
            <div className="bg-[#F7F8FA] rounded-3xl p-6 md:p-8 border border-gray-100">
              <div className="space-y-4">
                {[
                  { step: '1', text: 'Enter buyer and seller details', done: true },
                  { step: '2', text: 'Set deal amount and delivery terms', done: true },
                  { step: '3', text: 'Funds locked in DealGuard escrow', done: false },
                  { step: '4', text: 'Release on buyer confirmation', done: false },
                ].map((row, i) => (
                  <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl ${row.done ? 'bg-primary/5 border border-primary/15' : 'bg-white border border-gray-100'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${row.done ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {row.done ? '✓' : row.step}
                    </div>
                    <p className={`text-sm font-medium ${row.done ? 'text-gray-900' : 'text-gray-400'}`}>{row.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE 2 — Release on delivery */}
      <section className="bg-[#F7F8FA] py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 order-2 md:order-1">
              <p className="text-xs text-gray-400 font-medium mb-4 uppercase tracking-widest">Escrow Release Flow</p>
              <div className="space-y-3">
                {[
                  { icon: '📦', title: 'Goods shipped', sub: 'Seller marks delivery dispatched' },
                  { icon: '📸', title: 'Proof uploaded', sub: 'Photo or video evidence required' },
                  { icon: '✅', title: 'Buyer confirms', sub: 'Buyer approves the delivery' },
                  { icon: '💸', title: 'Funds released', sub: 'Seller receives payment instantly' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-400">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 md:order-2">
              <span className="text-primary text-sm font-semibold uppercase tracking-widest">Protected Release</span>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-4 mb-6 leading-tight tracking-tight">
                Release funds only<br />on proof of delivery
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-8">
                Keep every transaction auditable from payment lock to final release. Built for WhatsApp, TikTok, Facebook Marketplace, and private B2B trade flows.
              </p>
              <Link href="/auth/register" className="btn bg-primary text-white hover:bg-primary-dark px-7 py-3 text-sm rounded-full font-semibold transition inline-flex">
                Start protecting deals
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="bg-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">Built for every trade</h2>
            <p className="text-gray-500 text-lg mt-4 max-w-xl mx-auto">DealGuard works wherever deals happen in informal commerce</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { emoji: '📱', title: 'Facebook Marketplace', desc: 'List goods, share your DealGuard link, get paid securely before dispatch.' },
              { emoji: '💬', title: 'WhatsApp Traders', desc: 'Stop accepting risky EFT payments. Lock funds in escrow via link before you ship.' },
              { emoji: '🎵', title: 'TikTok Shop Sellers', desc: 'Live-sell with confidence — buyers pay into escrow, you release after delivery.' },
              { emoji: '🏢', title: 'B2B Bulk Deals', desc: 'Protect large stock orders. Milestone-based release for instalments.' },
              { emoji: '🛵', title: 'Gig and Service Workers', desc: 'Freelancers and service providers — lock payment before work begins.' },
              { emoji: '🤝', title: 'P2P Resellers', desc: 'Sneakers, phones, electronics, furniture — every resale deal protected.' },
            ].map((uc, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="text-3xl mb-4">{uc.emoji}</div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{uc.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-[#F7F8FA] py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">Traders love DealGuard</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { stars: 5, quote: 'Finally a way to sell on Marketplace without getting scammed. I have done 12 deals and zero problems.', name: 'Thabo M.', location: 'Johannesburg' },
              { stars: 5, quote: 'I use it for every bulk deal now. The escrow release flow is exactly what I needed for my electronics business.', name: 'Priya N.', location: 'Durban' },
              { stars: 5, quote: 'Buyers trust me more now that I use DealGuard. No more lengthy back-and-forth before they send money.', name: 'Sipho K.', location: 'Cape Town' },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <svg key={j} className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">How DealGuard works</h2>
            <p className="text-gray-500 text-lg mt-4">Four steps to a fully protected trade</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { num: '01', title: 'Create account', desc: 'Sign up free in under 2 minutes' },
              { num: '02', title: 'Set up escrow', desc: 'Add counterparty, amount, and deal terms' },
              { num: '03', title: 'Funds locked', desc: 'Payment sits safely in escrow while trade proceeds' },
              { num: '04', title: 'Release', desc: 'Buyer confirms, seller receives. Everyone wins.' },
            ].map((step, i) => (
              <div key={i} className="flex flex-col">
                <p className="text-5xl font-bold text-primary/20 mb-4 tracking-tight">{step.num}</p>
                <h3 className="text-base font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER — orange */}
      <section className="bg-primary py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_50%,rgba(255,255,255,0.14),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(0,0,0,0.12),transparent_40%)] pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="relative text-4xl md:text-5xl font-bold text-white mb-5 tracking-tight">
            Protect your next deal today
          </h2>
          <p className="relative text-white/80 text-xl mb-10 max-w-xl mx-auto">
            Join buyers and sellers using DealGuard to reduce fraud exposure and close higher-trust deals across South Africa.
          </p>
          <Link
            href="/auth/register"
            className="relative btn px-10 py-4 text-base bg-white text-primary font-bold rounded-full hover:bg-gray-50 transition inline-flex items-center gap-2"
          >
            Create free account
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* FOOTER — dark */}
      <footer className="bg-[#0D0D0D] text-white pt-16 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 md:col-span-2">
              <div className="flex items-center gap-1.5 mb-4">
                <svg className="w-6 h-6 text-primary" viewBox="0 0 32 32" fill="currentColor">
                  <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2zm0 4a3 3 0 110 6 3 3 0 010-6zm0 20c-3.5 0-6.612-1.79-8.5-4.5.044-2.82 5.667-4.375 8.5-4.375s8.456 1.555 8.5 4.375C22.612 24.21 19.5 26 16 26z"/>
                </svg>
                <span className="font-bold text-base">Deal<span className="text-primary">Guard</span></span>
              </div>
              <p className="text-white/40 text-sm max-w-xs leading-relaxed">
                Escrow infrastructure for social commerce, resale, and private B2B trade across South Africa.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm text-white/60">
                <li><Link href="/send" className="hover:text-white transition">Create Escrow</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition">Pricing</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm text-white/60">
                <li><Link href="/" className="hover:text-white transition">About</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition">Pricing</Link></li>
                <li><Link href="/auth/register" className="hover:text-white transition">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm text-white/60">
                <li><Link href="/auth/register" className="hover:text-white transition">Privacy</Link></li>
                <li><Link href="/auth/register" className="hover:text-white transition">Terms</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-white/30 text-xs">&copy; 2026 DealGuard. All rights reserved.</p>
            <p className="text-white/30 text-xs">Made for South Africa 🇿🇦</p>
          </div>
        </div>
      </footer>

    </main>
  );
}
