import React from 'react';
import { Sparkles, Music, Crown, Tv, Award, Video, ArrowRight } from 'lucide-react';
import { CategoryInfo } from '../data/festivalData';

interface CategoryCardProps {
  category: CategoryInfo;
  onSelectCategory: (categoryId: CategoryInfo['id']) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onSelectCategory,
}) => {
  const getIcon = () => {
    switch (category.id) {
      case 'dance':
        return <Sparkles className="w-5 h-5 text-[#E6C57D]" />;
      case 'music':
        return <Music className="w-5 h-5 text-[#93C5FD]" />;
      case 'fashion':
        return <Crown className="w-5 h-5 text-[#E9D5FF]" />;
      case 'entertainment':
        return <Tv className="w-5 h-5 text-[#FDE047]" />;
      case 'media':
        return <Video className="w-5 h-5 text-[#F472B6]" />;
      case 'special':
        return <Award className="w-5 h-5 text-[#F59E0B]" />;
      default:
        return <Sparkles className="w-5 h-5 text-[#E6C57D]" />;
    }
  };

  return (
    <div
      onClick={() => onSelectCategory(category.id)}
      className="celestial-glass rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
    >
      {/* Subtle corner light */}
      <div 
        className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none"
        style={{ backgroundColor: category.accentColor }}
      />

      <div>
        <div className="w-10 h-10 rounded-lg bg-[#0C122D] border border-white/10 group-hover:border-[#D4AF37]/50 flex items-center justify-center mb-4 transition-colors">
          {getIcon()}
        </div>

        <div className="text-[11px] font-semibold tracking-widest uppercase text-[#D4AF37] mb-1">
          {category.subtitle}
        </div>

        <h3 className="font-cinzel text-xl font-bold text-white group-hover:text-[#F5E7C4] transition-colors mb-2">
          {category.title}
        </h3>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {category.description}
        </p>
      </div>

      <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-xs text-[#E6C57D] font-medium group-hover:text-white transition-colors">
        <span>Explore Competitions</span>
        <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};
