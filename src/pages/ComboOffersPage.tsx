import React, { useState } from 'react';
import { 
  Sparkles, 
  Tag, 
  Check, 
  ArrowRight, 
  Zap, 
  Crown, 
  Gift, 
  Music, 
  Tv, 
  Video
} from 'lucide-react';
import { COMBO_OFFERS, ComboOffer, ComboCategory, getEventComboType } from '../data/comboOffersData';
import { EVENTS_DATA, EventItem } from '../data/festivalData';

interface ComboOffersPageProps {
  onSelectComboForWizard: (combo: ComboOffer, selectedEvents: EventItem[]) => void;
  onNavigateHome: () => void;
}

export const ComboOffersPage: React.FC<ComboOffersPageProps> = ({
  onSelectComboForWizard,
  onNavigateHome,
}) => {
  const [activeTab, setActiveTab] = useState<ComboCategory | 'all'>('all');

  // Filter offers based on tab
  const filteredOffers = COMBO_OFFERS.filter(offer => {
    if (activeTab === 'all') return true;
    return offer.category === activeTab;
  });

  // Helper to compute smart default selected events for any combo
  const getDefaultEventIdsForCombo = (combo: ComboOffer): string[] => {
    if (combo.id === 'viral-takeover') {
      return ['mememania', 'cineverse'];
    }
    if (combo.id === 'fashion-royale') {
      return ['silhouette', 'elaris'];
    }

    // Packages
    if (combo.packageStructure) {
      const { majorCount = 0, minorCount = 0, soloCount = 0 } = combo.packageStructure;
      const defaults: string[] = [];
      if (majorCount > 0) {
        defaults.push(...['reflexia', 'starfusion', 'silhouette'].slice(0, majorCount));
      }
      if (minorCount > 0) {
        defaults.push(...['adblitz', 'stellar-bid', 'twin-flare'].slice(0, minorCount));
      }
      if (soloCount > 0) {
        defaults.push(...['seraphia', 'symphora', 'nrityara', 'cosmic-switch', 'eclipse', 'elaris', 'stellar-bid'].slice(0, soloCount));
      }
      return defaults;
    }

    // Standard Min/Max Count Combos
    const eligible = combo.eligibleEventIds
      ? EVENTS_DATA.filter(e => combo.eligibleEventIds?.includes(e.id))
      : EVENTS_DATA;
    const targetCount = combo.minEventsToSelect || combo.maxEventsToSelect || 1;
    return eligible.slice(0, targetCount).map((e: EventItem) => e.id);
  };

  const handleDirectComboSelection = (combo: ComboOffer) => {
    const defaultIds = getDefaultEventIdsForCombo(combo);
    const initialEvents = EVENTS_DATA.filter(e => defaultIds.includes(e.id));
    onSelectComboForWizard(combo, initialEvents);
  };



  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-white">
      {/* Header Banner */}
      <div className="text-center mb-12 relative">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-cyan-500/20 border border-amber-500/40 text-amber-300 text-sm font-semibold mb-4 shadow-lg backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>CELESTIA ’26 EXCLUSIVE PACKAGES</span>
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent mb-4">
          More Events. More Savings.
        </h1>
        
        <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Choose your events, unlock exclusive combo offers, and make the most of Celestia’26.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10">
        {[
          { id: 'all', label: 'All Combos', icon: Zap },
          { id: 'solo', label: 'Solo Events', icon: Music },
          { id: 'digital', label: 'Digital Events', icon: Video },
          { id: 'minor', label: 'Minor Events', icon: Tv },
          { id: 'major', label: 'Major Events', icon: Crown },
          { id: 'package', label: 'Combined Packages', icon: Gift },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ComboCategory | 'all')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${
                isActive 
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/25 scale-105' 
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Combos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {filteredOffers.map(offer => {
          return (
            <div
              key={offer.id}
              className="group relative bg-slate-900/90 rounded-2xl border border-slate-700/80 hover:border-amber-500/60 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1"
            >
              {/* Card Badge */}
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs uppercase tracking-wider font-bold text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-500/30">
                    {offer.categoryTitle}
                  </span>
                  
                  {offer.savingsAmount && (
                    <span className="text-xs font-extrabold text-emerald-400 bg-emerald-950/70 px-3 py-1 rounded-full border border-emerald-500/40 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      Save ₹{offer.savingsAmount}
                    </span>
                  )}
                  {offer.discountPercentage && (
                    <span className="text-xs font-extrabold text-emerald-400 bg-emerald-950/70 px-3 py-1 rounded-full border border-emerald-500/40 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {offer.discountPercentage}% OFF
                    </span>
                  )}
                </div>

                {/* Offer Name & Short Desc */}
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                  {offer.name}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">
                  {offer.shortDescription}
                </p>

                {/* Main Price Tag */}
                <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 mb-4 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-semibold block mb-0.5">Offer Price</span>
                    <div className="flex items-baseline gap-2">
                      {offer.comboPriceFormatted ? (
                        <span className="text-3xl font-extrabold text-amber-400">
                          {offer.comboPriceFormatted}
                        </span>
                      ) : offer.priceType === 'fixed_price' ? (
                        <span className="text-3xl font-extrabold text-amber-400">
                          ₹{offer.comboPrice.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-3xl font-extrabold text-emerald-400">
                          {offer.discountPercentage}% OFF
                        </span>
                      )}

                      {offer.originalEstimatedValue && (
                        <span className="text-sm text-slate-500 line-through">
                          ₹{offer.originalEstimatedValue.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Eligibility</span>
                    <span className="text-xs font-semibold text-cyan-400">
                      {offer.eligibleCategoryType?.toUpperCase() || 'MULTI-EVENT'}
                    </span>
                  </div>
                </div>

                {/* Highlight Rules */}
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {offer.eligibilityConditions.slice(0, 2).map((cond, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{cond}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Footer */}
              <div className="p-6 pt-0 mt-2">
                <button
                  onClick={() => handleDirectComboSelection(offer)}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>{offer.buttonText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Back to Home CTA */}
      <div className="text-center pt-6">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium cursor-pointer"
        >
          <span>← Back to Home Page</span>
        </button>
      </div>
    </div>
  );
};
