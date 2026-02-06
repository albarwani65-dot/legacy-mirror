"use client";

import { useState, useEffect } from "react";
import { AssetSchema, AssetCategoryEnum, AssetCategory } from "@/lib/types";
import { calculateUAE_EOSB } from "@/lib/logic/eosb";
import {
    Banknote,
    TrendingUp,
    Home,
    Bitcoin,
    Car,
    Briefcase,
    Check,
    ChevronRight,
    ChevronLeft,
    X
} from "lucide-react";
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { fetchStockPrice } from "@/lib/logic/stock-api";

export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

export default function AddAssetForm({ onAddAsset, onClose }: { onAddAsset: (asset: any) => void; onClose: () => void }) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<Partial<any>>({});

    // EOSB State
    const [eosbInputs, setEosbInputs] = useState({
        basicSalary: 0,
        startDate: "",
        endDate: new Date().toISOString().split('T')[0] // Defaults to today
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const categories: { id: AssetCategory; label: string; icon: any }[] = [
        { id: "CASH", label: "Cash", icon: Banknote },
        { id: "EQUITY", label: "Stocks", icon: TrendingUp },
        { id: "REAL_ESTATE", label: "Real Estate", icon: Home },
        { id: "CRYPTO", label: "Crypto", icon: Bitcoin },
        { id: "VEHICLE", label: "Vehicle", icon: Car },
        { id: "EOSB", label: "UAE Gratuity", icon: Briefcase },
    ];

    const handleCategorySelect = (category: AssetCategory) => {
        setFormData({ ...formData, category });
        setStep(2);
        setErrors({});
    };

    const calculateYearsOfService = (start: string, end: string) => {
        if (!start || !end) return 0;
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
        return diffYears;
    };

    const handleDetailsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = { ...formData };

        // EOSB Logic
        if (formData.category === "EOSB") {
            const years = calculateYearsOfService(eosbInputs.startDate, eosbInputs.endDate);
            // Basic Salary input is usually in main currency, but we store in smallest unit (cents/fils)
            // Assuming the input is AED, we multiply by 100 for storage/calculation if required by logic
            // The `calculateUAE_EOSB` expects basicSalaryMonthly in smallest unit if the output is expected in smallest unit.
            // Let's assume input needs to be converted to cents/fils.
            const gratuity = calculateUAE_EOSB(eosbInputs.basicSalary * 100, years);

            data.value = gratuity;
            // storing extra metadata could be useful, but for now we just need value
        }

        try {
            // Basic validation before full schema parse
            if (!data.name) throw new Error("Name is required");
            if (formData.category !== 'EOSB' && !data.value) throw new Error("Value is required");
            if (formData.category === 'EOSB') {
                if (!eosbInputs.startDate) throw new Error("Start Date is required");
                if (!eosbInputs.basicSalary) throw new Error("Basic Salary is required");
            }

            // Temporary ID and timestamp for validation
            const tempAsset = {
                id: crypto.randomUUID(),
                userId: "user-1", // Placeholder
                category: data.category,
                name: data.name,
                // If EOSB, value is already in cents from calculation.
                // If Other, value is in Currency Units (from input), so * 100.
                value: data.category === 'EOSB' ? Number(data.value) : Math.round(Number(data.value) * 100),
                qty: data.qty ? Number(data.qty) : undefined,
                ticker: data.ticker,
                lastUpdated: Date.now(),
                // Real Estate Fields
                marketValue: data.marketValue,
                loanValue: data.loanValue,
                accountNumber: data.accountNumber,
                notes: data.notes
            };

            const result = AssetSchema.safeParse(tempAsset);

            if (!result.success) {
                const formattedErrors: Record<string, string> = {};
                (result.error as any).errors.forEach((err: any) => {
                    if (err.path[0]) {
                        formattedErrors[String(err.path[0])] = err.message;
                    }
                });
                setErrors(formattedErrors);
                return;
            }

            setFormData(tempAsset);
            setStep(3);
            setErrors({});
        } catch (err: any) {
            setErrors({ form: err.message });
        }
    };

    const finalSubmit = () => {
        onAddAsset(formData);
        // We don't Reset here because we probably want to close the form
        // But if the user keeps it open, we should reset.
        // Let's reset state in case the parent doesn't unmount
        setStep(1);
        setFormData({});
        setEosbInputs({
            basicSalary: 0,
            startDate: "",
            endDate: new Date().toISOString().split('T')[0]
        });
        onClose();
    };

    return (
        <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl relative">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
            >
                <X size={20} />
            </button>

            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-medium text-emerald-400">Add New Asset</h2>
                <div className="flex gap-2 mr-8">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className={cn("h-1 w-8 rounded-full transition-all", step >= s ? "bg-emerald-500" : "bg-zinc-700")} />
                    ))}
                </div>
            </div>

            {step === 1 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategorySelect(cat.id)}
                            className="flex flex-col items-center justify-center p-6 bg-zinc-950 border border-zinc-800 rounded-lg hover:border-emerald-500/50 hover:bg-emerald-950/10 transition-all group"
                        >
                            <cat.icon className="w-8 h-8 text-zinc-400 group-hover:text-emerald-400 mb-3" />
                            <span className="text-sm text-zinc-300 font-medium">{cat.label}</span>
                        </button>
                    ))}
                </div>
            )}

            {step === 2 && (
                <form onSubmit={handleDetailsSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Asset Name</label>
                        <input
                            type="text"
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                            placeholder="e.g., Main Savings, Tesla Stock"
                            autoFocus
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    {formData.category === 'EOSB' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Monthly Basic Salary (AED)</label>
                                <input
                                    type="number"
                                    value={eosbInputs.basicSalary || ''}
                                    onChange={e => setEosbInputs({ ...eosbInputs, basicSalary: Number(e.target.value) })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                    placeholder="Basic Salary"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Start Date</label>
                                    <input
                                        type="date"
                                        value={eosbInputs.startDate}
                                        onChange={e => setEosbInputs({ ...eosbInputs, startDate: e.target.value })}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">End Date</label>
                                    <input
                                        type="date"
                                        value={eosbInputs.endDate}
                                        onChange={e => setEosbInputs({ ...eosbInputs, endDate: e.target.value })}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                            </div>

                            {errors.form && <p className="text-red-500 text-xs mt-1">{errors.form}</p>}
                        </div>
                    )}
                    {(formData.category === 'EQUITY' || formData.category === 'CRYPTO') && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Ticker</label>
                                    <input
                                        type="text"
                                        value={formData.ticker || ''}
                                        onChange={e => setFormData({ ...formData, ticker: e.target.value })}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors uppercase"
                                        placeholder="e.g. NVDA"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Quantity</label>
                                    <input
                                        type="number"
                                        value={formData.qty || ''}
                                        onChange={e => setFormData({ ...formData, qty: e.target.value })}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!formData.ticker) {
                                        setErrors({ form: "Please enter a ticker first" });
                                        return;
                                    }
                                    setErrors({}); // Clear errors
                                    // Use public key
                                    const key = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || "";
                                    const price = await fetchStockPrice(formData.ticker, key);

                                    if (price !== null) {
                                        const qty = Number(formData.qty) || 1;
                                        // Store as currency units (e.g. 150.00) for the input field
                                        setFormData(prev => ({ ...prev, value: (price * qty) / 100 }));
                                    } else {
                                        setErrors({ form: "Could not fetch price. Please enter value manually." });
                                    }
                                }}
                                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 rounded-lg transition-colors border border-zinc-700 hover:border-zinc-600"
                            >
                                ✨ Auto-Fetch Current Price
                            </button>
                        </div>
                    )}

                    {formData.category === 'REAL_ESTATE' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Market Value</label>
                                    <input
                                        type="number"
                                        // Display as units
                                        value={formData.marketValue ? formData.marketValue / 100 : ''}
                                        onChange={e => {
                                            const mVal = Number(e.target.value) * 100; // Store as cents
                                            const lVal = formData.loanValue || 0; // Assume loanValue is already in cents
                                            const netCents = mVal - lVal;
                                            setFormData(prev => ({ ...prev, marketValue: mVal, value: netCents })); // Value in Cents
                                        }}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                        placeholder="0.00"
                                    />
                                    {errors.marketValue && <p className="text-red-500 text-xs mt-1">{errors.marketValue}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Outstanding Loan</label>
                                    <input
                                        type="number"
                                        value={formData.loanValue ? formData.loanValue / 100 : ''}
                                        onChange={e => {
                                            const lVal = Number(e.target.value) * 100; // Cents
                                            const mVal = formData.marketValue || 0; // Assume marketValue is already in cents
                                            const netCents = mVal - lVal;
                                            setFormData(prev => ({ ...prev, loanValue: lVal, value: netCents })); // Value in Cents
                                        }}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Account # (Optional)</label>
                                    <input
                                        type="text"
                                        value={formData.accountNumber || ''}
                                        onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                        placeholder="XXXX"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Notes (Optional)</label>
                                    <input
                                        type="text"
                                        value={formData.notes || ''}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                        placeholder="Details..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Value Field - Always visible for non-EOSB, and serves as the primary input or override */}
                    {formData.category !== 'EOSB' && (
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">
                                Total Value {(formData.category === 'EQUITY' || formData.category === 'CRYPTO') ? '(Auto-Calculated or Manual)' : '(Base Currency)'}
                            </label>
                            <input
                                type="number"
                                value={formData.value || ''}
                                onChange={e => setFormData({ ...formData, value: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                placeholder="0.00"
                            />
                            {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value}</p>}
                        </div>
                    )}

                    <div className="flex justify-between pt-4">
                        <button type="button" onClick={() => setStep(1)} className="text-zinc-400 hover:text-white flex items-center">
                            <ChevronLeft className="w-4 h-4 mr-1" /> Back
                        </button>
                        <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center">
                            Continue <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                </form>
            )}

            {step === 3 && (
                <div className="space-y-6 text-center">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                        <Check className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-1">{formData.name}</h3>
                        <p className="text-zinc-400">{formData.category}</p>
                    </div>
                    <div className="text-4xl font-light text-emerald-400">
                        {/* formData.value is now potentially big integer (cents/fils) */}
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED' }).format(formData.value / 100)}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-left bg-zinc-950 p-4 rounded-lg">
                        {formData.ticker && (
                            <div>
                                <p className="text-xs text-zinc-500 uppercase">Ticker</p>
                                <p className="text-white">{formData.ticker}</p>
                            </div>
                        )}
                        {formData.qty && (
                            <div>
                                <p className="text-xs text-zinc-500 uppercase">Quantity</p>
                                <p className="text-white">{formData.qty}</p>
                            </div>
                        )}
                        {formData.category === 'EOSB' && (
                            <div>
                                <p className="text-xs text-zinc-500 uppercase">Est. Years</p>
                                <p className="text-white">{calculateYearsOfService(eosbInputs.startDate, eosbInputs.endDate).toFixed(2)}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between pt-4">
                        <button type="button" onClick={() => setStep(2)} className="text-zinc-400 hover:text-white flex items-center">
                            <ChevronLeft className="w-4 h-4 mr-1" /> Back
                        </button>
                        <button onClick={finalSubmit} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-medium transition-colors w-full ml-4">
                            Confirm & Add Asset
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
