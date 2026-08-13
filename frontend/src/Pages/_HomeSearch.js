import { ArrowRight, CheckCircle, Search } from "lucide-react";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import ResultPPDB from "./_ResultPPDB";

export const HomeSearch = () => {
  const [resultToggle, setResultToggle] = useState(false);

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
      <div className="p-8 md:p-12">
        {/* Section Header */}
        <div className="text-center mb-10">
          <div
            onClick={() => setResultToggle(true)}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl mb-6">
            <Search className="w-5 h-5" />
            <span className="font-semibold">Cek Status Penerimaan</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Status Penerimaan
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Masukkan data untuk cek status penerimaan Anda
          </p>
        </div>

        {/* Form */}
        {resultToggle && <ResultPPDB />}
      </div>

      {/* Bottom CTA */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <CheckCircle className="w-6 h-6" />
            <span className="text-xl font-semibold">
              Lihat Semua Hasil Penerimaan
            </span>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105">
            <span>Klik di sini</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
