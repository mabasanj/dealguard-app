'use client';

import { useState } from 'react';
import { sep10ServerApi, sep12Api, Sep12CustomerFields, Sep12CustomerRecord } from '@/lib/api-services/stellar';

type KycStep = 'lookup' | 'form' | 'result';
type Sep10Step = 'idle' | 'challenge' | 'done';

export default function KycPage() {
  // ── SEP-10 auth state ─────────────────────────────────────────────────────
  const [sep10Account, setSep10Account] = useState('');
  const [sep10Challenge, setSep10Challenge] = useState('');
  const [sep10SignedXdr, setSep10SignedXdr] = useState('');
  const [sep10Token, setSep10Token] = useState('');
  const [sep10Step, setSep10Step] = useState<Sep10Step>('idle');
  const [sep10Error, setSep10Error] = useState('');
  const [sep10Loading, setSep10Loading] = useState(false);

  // ── SEP-12 KYC form state ─────────────────────────────────────────────────
  const [kycStep, setKycStep] = useState<KycStep>('lookup');
  const [lookupAccount, setLookupAccount] = useState('');
  const [kycRecord, setKycRecord] = useState<Sep12CustomerRecord | null>(null);
  const [kycError, setKycError] = useState('');
  const [kycLoading, setKycLoading] = useState(false);

  const [form, setForm] = useState<Sep12CustomerFields>({
    account: '',
    first_name: '',
    last_name: '',
    email_address: '',
    phone_number: '',
    birth_date: '',
    address: '',
    city: '',
    country_code: '',
    postal_code: '',
    id_type: undefined,
    id_number: '',
    id_expiration: '',
  });
  const [submitMsg, setSubmitMsg] = useState('');

  // ── Helpers ───────────────────────────────────────────────────────────────
  const statusColour = (s?: string) => {
    switch (s) {
      case 'ACCEPTED': return 'text-green-400';
      case 'REJECTED': return 'text-red-400';
      case 'PENDING': case 'PROCESSING': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  // ── SEP-10: generate challenge ────────────────────────────────────────────
  const handleGetChallenge = async () => {
    if (!sep10Account.trim()) return;
    setSep10Loading(true);
    setSep10Error('');
    try {
      const { transaction } = await sep10ServerApi.getChallenge(sep10Account.trim());
      setSep10Challenge(transaction);
      setSep10Step('challenge');
    } catch (e: any) {
      setSep10Error(e?.error || 'Failed to get challenge');
    } finally {
      setSep10Loading(false);
    }
  };

  // ── SEP-10: verify signed challenge ──────────────────────────────────────
  const handleVerifyChallenge = async () => {
    if (!sep10SignedXdr.trim()) return;
    setSep10Loading(true);
    setSep10Error('');
    try {
      const { token, account } = await sep10ServerApi.auth(sep10SignedXdr.trim());
      setSep10Token(token);
      setSep10Step('done');
      setSep10Account(account);
    } catch (e: any) {
      setSep10Error(e?.error || 'Verification failed');
    } finally {
      setSep10Loading(false);
    }
  };

  // ── SEP-12: look up KYC status ────────────────────────────────────────────
  const handleLookup = async () => {
    if (!lookupAccount.trim()) return;
    setKycLoading(true);
    setKycError('');
    try {
      const record = await sep12Api.getCustomer(lookupAccount.trim());
      setKycRecord(record);
      setForm((f) => ({ ...f, account: lookupAccount.trim() }));
      setKycStep('result');
    } catch (e: any) {
      if (e?.statusCode === 404) {
        setKycRecord({ id: '', status: 'NEEDS_INFO', message: 'No record yet — submit KYC below.' });
        setForm((f) => ({ ...f, account: lookupAccount.trim() }));
        setKycStep('form');
      } else {
        setKycError(e?.error || 'Lookup failed');
      }
    } finally {
      setKycLoading(false);
    }
  };

  // ── SEP-12: submit / update KYC ──────────────────────────────────────────
  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    setKycLoading(true);
    setKycError('');
    setSubmitMsg('');
    try {
      const result = await sep12Api.putCustomer(form);
      setSubmitMsg(`Saved — status: ${result.status}`);
      const updated = await sep12Api.getCustomer(form.account);
      setKycRecord(updated);
      setKycStep('result');
    } catch (e: any) {
      setKycError(e?.error || 'Failed to save KYC');
    } finally {
      setKycLoading(false);
    }
  };

  // ── SEP-12: delete KYC ───────────────────────────────────────────────────
  const handleDeleteKyc = async () => {
    if (!lookupAccount && !form.account) return;
    if (!confirm('Delete your KYC record from the platform?')) return;
    setKycLoading(true);
    try {
      await sep12Api.deleteCustomer(lookupAccount || form.account);
      setKycRecord(null);
      setKycStep('lookup');
      setLookupAccount('');
    } catch (e: any) {
      setKycError(e?.error || 'Failed to delete record');
    } finally {
      setKycLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">KYC & Identity Verification</h1>
          <p className="text-gray-400 mt-1 text-sm">
            SEP-10 Web Authentication · SEP-12 Customer KYC
          </p>
        </div>

        {/* ── SEP-10 Web Authentication ──────────────────────────────────── */}
        <section className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-1">SEP-10 Web Authentication</h2>
          <p className="text-gray-400 text-sm mb-4">
            Prove ownership of a Stellar account by signing a platform challenge.
          </p>

          {sep10Step === 'idle' && (
            <div className="space-y-3">
              <input
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Stellar public key (G…)"
                value={sep10Account}
                onChange={(e) => setSep10Account(e.target.value)}
              />
              <button
                onClick={handleGetChallenge}
                disabled={sep10Loading || !sep10Account.trim()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm font-medium transition"
              >
                {sep10Loading ? 'Loading…' : 'Get Challenge'}
              </button>
              {sep10Error && <p className="text-red-400 text-sm">{sep10Error}</p>}
            </div>
          )}

          {sep10Step === 'challenge' && (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Challenge XDR (copy to wallet for signing)</p>
                <textarea
                  readOnly
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono resize-none"
                  value={sep10Challenge}
                />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Paste signed XDR here</p>
                <textarea
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Base64 encoded signed transaction XDR…"
                  value={sep10SignedXdr}
                  onChange={(e) => setSep10SignedXdr(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleVerifyChallenge}
                  disabled={sep10Loading || !sep10SignedXdr.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm font-medium transition"
                >
                  {sep10Loading ? 'Verifying…' : 'Verify & Get JWT'}
                </button>
                <button
                  onClick={() => { setSep10Step('idle'); setSep10Challenge(''); setSep10SignedXdr(''); }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition"
                >
                  Reset
                </button>
              </div>
              {sep10Error && <p className="text-red-400 text-sm">{sep10Error}</p>}
            </div>
          )}

          {sep10Step === 'done' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-400 font-medium">
                <span>✓</span>
                <span>Authenticated as <code className="bg-gray-800 px-1 rounded text-xs">{sep10Account}</code></span>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Platform JWT (use as Bearer token)</p>
                <textarea
                  readOnly
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono resize-none"
                  value={sep10Token}
                />
              </div>
              <button
                onClick={() => { setSep10Step('idle'); setSep10Token(''); setSep10Challenge(''); setSep10SignedXdr(''); }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition"
              >
                Reset
              </button>
            </div>
          )}
        </section>

        {/* ── SEP-12 KYC ────────────────────────────────────────────────────── */}
        <section className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-1">SEP-12 KYC</h2>
          <p className="text-gray-400 text-sm mb-4">
            Submit identity information required by the platform and ZARP anchor.
          </p>

          {/* Lookup */}
          {kycStep === 'lookup' && (
            <div className="space-y-3">
              <input
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Stellar public key (G…)"
                value={lookupAccount}
                onChange={(e) => setLookupAccount(e.target.value)}
              />
              <button
                onClick={handleLookup}
                disabled={kycLoading || !lookupAccount.trim()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm font-medium transition"
              >
                {kycLoading ? 'Looking up…' : 'Check KYC Status'}
              </button>
              {kycError && <p className="text-red-400 text-sm">{kycError}</p>}
            </div>
          )}

          {/* Result view */}
          {kycStep === 'result' && kycRecord && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gray-400 text-sm">Status: </span>
                  <span className={`font-semibold ${statusColour(kycRecord.status)}`}>{kycRecord.status}</span>
                  {kycRecord.message && <p className="text-gray-400 text-xs mt-1">{kycRecord.message}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setKycStep('form')}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDeleteKyc}
                    className="px-3 py-1 bg-red-700 hover:bg-red-600 rounded-lg text-xs transition"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => { setKycStep('lookup'); setKycRecord(null); setLookupAccount(''); }}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs transition"
                  >
                    Back
                  </button>
                </div>
              </div>

              {kycRecord.provided_fields && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Provided fields</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(kycRecord.provided_fields).map(([k, v]) => (
                      <div key={k} className="bg-gray-800 rounded-lg px-3 py-2">
                        <span className="text-xs text-gray-400">{k}</span>
                        <span className={`ml-2 text-xs font-medium ${v.status === 'ACCEPTED' ? 'text-green-400' : 'text-yellow-400'}`}>
                          {v.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {kycError && <p className="text-red-400 text-sm">{kycError}</p>}
            </div>
          )}

          {/* KYC form */}
          {kycStep === 'form' && (
            <form onSubmit={handleSubmitKyc} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">Stellar Public Key *</label>
                  <input
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.account}
                    onChange={(e) => setForm({ ...form, account: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">First Name</label>
                  <input
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.first_name || ''}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Last Name</label>
                  <input
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.last_name || ''}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.email_address || ''}
                    onChange={(e) => setForm({ ...form, email_address: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Phone Number</label>
                  <input
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.phone_number || ''}
                    onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.birth_date || ''}
                    onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Country Code (ISO)</label>
                  <input
                    maxLength={3}
                    placeholder="e.g. ZAF"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.country_code || ''}
                    onChange={(e) => setForm({ ...form, country_code: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">Street Address</label>
                  <input
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.address || ''}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">City</label>
                  <input
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.city || ''}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Postal Code</label>
                  <input
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.postal_code || ''}
                    onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">ID Type</label>
                  <select
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.id_type || ''}
                    onChange={(e) => setForm({ ...form, id_type: e.target.value as Sep12CustomerFields['id_type'] || undefined })}
                  >
                    <option value="">Select…</option>
                    <option value="passport">Passport</option>
                    <option value="id_document">ID Document</option>
                    <option value="drivers_license">Driver&apos;s License</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">ID Number</label>
                  <input
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.id_number || ''}
                    onChange={(e) => setForm({ ...form, id_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">ID Expiry Date</label>
                  <input
                    type="date"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.id_expiration || ''}
                    onChange={(e) => setForm({ ...form, id_expiration: e.target.value })}
                  />
                </div>
              </div>

              {submitMsg && <p className="text-green-400 text-sm">{submitMsg}</p>}
              {kycError && <p className="text-red-400 text-sm">{kycError}</p>}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={kycLoading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm font-medium transition"
                >
                  {kycLoading ? 'Saving…' : 'Submit KYC'}
                </button>
                <button
                  type="button"
                  onClick={() => { setKycStep('lookup'); setKycRecord(null); }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>

        {/* ── Info panel ───────────────────────────────────────────────────── */}
        <section className="bg-gray-900 rounded-2xl p-6 border border-gray-800 text-sm text-gray-400 space-y-2">
          <h3 className="text-white font-medium">How it works</h3>
          <ul className="list-disc list-inside space-y-1">
            <li><span className="text-white">SEP-10</span> — Authenticate your Stellar account with DealGuard. Sign a one-time challenge with your wallet to receive a JWT used for anchor operations.</li>
            <li><span className="text-white">SEP-12 (Platform)</span> — Store your KYC identity data on DealGuard. Required before depositing or withdrawing via the ZARP anchor.</li>
            <li><span className="text-white">SEP-12 (Anchor Proxy)</span> — Once you have a SEP-10 JWT, use the API directly to check/submit your KYC status at the ZARP anchor (<code className="text-xs bg-gray-800 px-1 rounded">/api/stellar/sep12/anchor/customer</code>).</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
