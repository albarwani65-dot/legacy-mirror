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
  type LucideIcon
} from 'lucide-react';
import AddAssetForm from './components/AddAssetForm';
import { Asset, AssetCategory } from '@/lib/types';
import { subscribeToAssets, addAssetToFirestore } from '@/lib/client-db';

// Helper to map category to icon and color
const getCategoryDetails = (category: AssetCategory): { icon: LucideIcon, color: string } => {
  switch (category) {
    case 'CASH': return { icon: Wallet, color: 'text-emerald-400' };
    case 'EQUITY': return { icon: TrendingUp, color: 'text-blue-400' };
    case 'REAL_ESTATE': return { icon: HomeIcon, color: 'text-yellow-400' };
    case 'CRYPTO': return { icon: Bitcoin, color: 'text-orange-400' };
    case 'VEHICLE': return { icon: Car, color: 'text-red-400' };
    case 'EOSB': return { icon: Briefcase, color: 'text-purple-400' };
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
    </div>
  );
}

export default function Home() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const userId = "user-1"; // Hardcoded for this personalized mirror

  // Subscribe to Firestore updates
  useEffect(() => {
    const unsubscribe = subscribeToAssets(userId, (newAssets) => {
      setAssets(newAssets);
    });
    return () => unsubscribe();
  }, [userId]);

  // Computed Total Net Worth
  const totalNetWorth = useMemo(() => {
    return assets.reduce((sum, asset) => sum + asset.value, 0);
  }, [assets]);

  const handleAddAsset = async (newAsset: Asset) => {
    // Optimistic update could go here, but Firestore is fast enough for local feel usually.
    // We just write to DB, and the subscription will update the UI.
    try {
      await addAssetToFirestore(userId, newAsset);
      setIsFormOpen(false);
    } catch (error: any) {
      console.error("Failed to add asset full error:", error);
      alert(`Failed to add asset: ${error.message} (Code: ${error.code})`);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8 relative">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-slate-400 text-sm uppercase tracking-widest">Legacy Mirror</h1>
            <p className="text-xs text-emerald-500/80 mb-2 font-mono">For my son</p>
            <p className="text-5xl font-bold text-emerald-400 mt-2">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED' }).format(totalNetWorth / 100)}
            </p>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all"
          >
            <Plus size={20} /> Add Asset
          </button>
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