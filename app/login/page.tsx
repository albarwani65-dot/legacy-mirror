"use client";

import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { ShieldCheck, LogIn } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError("");
        const provider = new GoogleAuthProvider();

        try {
            await signInWithPopup(auth, provider);
            router.push("/");
        } catch (err: any) {
            console.error("Login failed", err);
            setError(err.message || "Failed to sign in");
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
                <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                    <ShieldCheck className="w-8 h-8 text-emerald-400" />
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">Legacy Mirror</h1>
                <p className="text-slate-400 mb-8">Secure Access Required</p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <span>Signing in...</span>
                    ) : (
                        <>
                            <LogIn size={20} /> Sign in with Google
                        </>
                    )}
                </button>

                <p className="mt-8 text-xs text-slate-600 font-mono">
                    Debug: API Key Status = {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "Loaded" : "MISSING"}
                </p>
            </div>
        </main>
    );
}