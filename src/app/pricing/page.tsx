import Link from 'next/link';

const plans = [
  {
    name: 'Starter',
    idealFor: 'New and occasional traders',
    monthlyPrice: 'Free',
    escrowFee: '3% per transaction',
    features: [
      'Create and manage escrow transactions',
      'Buyer and seller status tracking',
      'Secure payout release workflow',
      'In-app transaction history'
    ]
  },
  {
    name: 'Business',
    idealFor: 'Frequent B2B and marketplace sellers',
    monthlyPrice: 'Contact sales',
    escrowFee: '3% per transaction',
    features: [
      'Everything in Starter',
      'Priority dispute handling',
      'Dedicated onboarding support',
      'Operational reporting and summaries'
    ]
  }
];

export default function PricingPage() {
  return (
    <main className="app-container py-12 md:py-16">
      <section className="container-max">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-4 py-1.5 text-sm font-semibold mb-4">
            Simple and transparent pricing
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Pricing</h1>
          <p className="text-lg text-gray-600">
            DealGuard charges a fixed 3% transaction fee per escrow transaction.
          </p>
          <p className="text-sm text-gray-500 mt-3">
            The 3% fee excludes third-party processing costs such as card network, bank, or wallet-provider charges.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <article key={plan.name} className="card-lg border border-gray-100">
              <p className="text-sm text-primary font-semibold mb-2">{plan.idealFor}</p>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{plan.name}</h2>

              <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 mb-5">
                <p className="text-sm text-gray-500 mb-1">Monthly price</p>
                <p className="text-xl font-bold text-gray-900">{plan.monthlyPrice}</p>
              </div>

              <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 mb-5">
                <p className="text-sm text-gray-600 mb-1">Escrow fee</p>
                <p className="text-xl font-bold text-primary">{plan.escrowFee}</p>
              </div>

              <ul className="space-y-3 text-sm text-gray-700 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href="/auth/register" className="btn-primary btn w-full">
                Start with {plan.name}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
