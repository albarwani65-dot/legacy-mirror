"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  Plus,
  Home as HomeIcon,
  Bitcoin,
  Car,
  Briefcase,
  LogOut,
  CreditCard,
  type LucideIcon
} from 'lucide-react';


import AddAssetForm from './components/AddAssetForm';
import { Asset, AssetCategory } from '@/lib/types';
import { subscribeToAssets, addAssetToFirestore } from '@/lib/client-db';
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

// Helper to map category to icon and color
const getCategoryDetails = (category: AssetCategory): { icon: LucideIcon, color: string } => {
  switch (category) {
    case 'CASH': return { icon: Wallet, color: 'text-emerald-400' };
    case 'EQUITY': return { icon: TrendingUp, color: 'text-blue-400' };
    case 'REAL_ESTATE': return { icon: HomeIcon, color: 'text-yellow-400' };
    case 'CRYPTO': return { icon: Bitcoin, color: 'text-orange-400' };
    case 'VEHICLE': return { icon: Car, color: 'text-red-400' };
    case 'EOSB': return { icon: Briefcase, color: 'text-purple-400' };
    case 'LIABILITY': return { icon: CreditCard, color: 'text-rose-500' };
    default: return { icon: Wallet, color: 'text-slate-400' };
  }
};

function AssetCard({ asset }: { asset: Asset }) {
  const { icon: Icon, color } = getCategoryDetails(asset.category);

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-colors">
      <div className={`flex items-center gap-4 mb-4 ${color}`}>
        <Icon size={24} />
        <h2 className="text-xl font-semibold text-white truncate">{asset.name}</h2>
      </div>
      <p className="text-3xl font-mono">
        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED' }).format(asset.value / 100)}
      </p>
      {asset.ticker && (
        <p className="text-sm text-slate-500 mt-2 font-mono">{asset.ticker}</p>
      )}
      {asset.category === 'REAL_ESTATE' && asset.marketValue && (
        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-slate-500">Market Value</p>
            <p className="text-slate-300">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED' }).format(asset.marketValue / 100)}</p>
          </div>
          {asset.loanValue && (
            <div className="text-right">
              <p className="text-slate-500">Outstanding Loan</p>
              <p className="text-red-400">-{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED' }).format(asset.loanValue / 100)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

}



export default function Home() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push("/login");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  // Subscribe to Firestore updates (only when user is logged in)
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToAssets(user.uid, (newAssets) => {
      setAssets(newAssets);
    });
    return () => unsubscribe();
  }, [user]);

  // Computed Values
  const { totalAssets, totalLiabilities, totalNetWorth } = useMemo(() => {
    const assetsOnly = assets.filter(a => a.category !== 'LIABILITY');
    const liabilitiesOnly = assets.filter(a => a.category === 'LIABILITY');

    const tAssets = assetsOnly.reduce((sum, asset) => sum + asset.value, 0);
    const tLiabilities = liabilitiesOnly.reduce((sum, asset) => sum + asset.value, 0);

    return {
      totalAssets: tAssets,
      totalLiabilities: tLiabilities,
      totalNetWorth: tAssets - tLiabilities
    };
  }, [assets]);

  // Chart Data
  const debtVsAssetData = useMemo(() => [
    { name: 'Assets', value: totalAssets / 100 },
    { name: 'Debt', value: totalLiabilities / 100 }
  ], [totalAssets, totalLiabilities]);

  const handleAddAsset = async (newAsset: Asset) => {
    if (!user) return;
    try {
      // Ensure the asset is tagged with the correct user ID
      const assetWithId = { ...newAsset, userId: user.uid };
      await addAssetToFirestore(user.uid, assetWithId);
      setIsFormOpen(false);
    } catch (error: any) {
      console.error("Failed to add asset full error:", error);
      alert(`Failed to add asset: ${error.message} (Code: ${error.code})`);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login"); // Explicit redirect mostly redundant due to auth listener but good for UX
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-500">Loading Legacy...</div>;
  }

  if (!user) return null; // Will redirect

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8 relative">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-slate-400 text-sm uppercase tracking-widest">Net Worth</h1>
            <p className="text-xs text-emerald-500/80 mb-2 font-mono">For my son</p>
            <p className="text-5xl font-bold text-emerald-400 mt-2">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED' }).format(totalNetWorth / 100)}
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleSignOut}
              className="text-slate-500 hover:text-white transition-colors"
              title="Sign Out"
            >
              <LogOut size={20} />
            </button>
            <button
              onClick={() => setIsFormOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all"
            >
              <Plus size={20} /> Add Asset
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}

          {assets.length === 0 && (
            <div className="col-span-full text-center text-slate-500 py-12 border border-dashed border-slate-800 rounded-2xl">
              Ready to build your legacy. Add your first asset.
            </div>
          )}
        </section>

        {/* Debt vs Asset Chart */}
        {assets.length > 0 && (
          <section className="mt-12 bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
            <h2 className="text-xl font-medium text-slate-300 mb-8 flex items-center gap-2">
              <TrendingUp size={20} className="text-emerald-500" />
              Assets vs. Liabilities
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50">
                <p className="text-slate-400 mb-2 uppercase tracking-wider text-xs font-semibold">Total Assets</p>
                <p className="text-3xl font-mono text-emerald-400">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED' }).format(totalAssets / 100)}
                </p>
              </div>
              <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50">
                <p className="text-slate-400 mb-2 uppercase tracking-wider text-xs font-semibold">Total Debt</p>
                <p className="text-3xl font-mono text-rose-500">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED' }).format(totalLiabilities / 100)}
                </p>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Modal Overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <AddAssetForm
            onAddAsset={handleAddAsset}
            onClose={() => setIsFormOpen(false)}
          />
        </div>
      )}
    </main>
  );
}