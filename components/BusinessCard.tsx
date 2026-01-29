
import React, { useState } from 'react';
import { Star, MapPin, Clock, Quote, Share2, Gem, TrendingUp, Phone, Globe, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { BusinessListing, Language } from '../types';

interface BusinessCardProps {
  business: BusinessListing;
  lang: Language;
}

const BusinessCard: React.FC<BusinessCardProps> = ({ business, lang }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [showHours, setShowHours] = useState(false);
  const isRtl = lang === 'ar';

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: business.name,
          text: business.reviewSnippet || business.description || `Explore ${business.name} on Daleeli!`,
          url: business.mapUrl || window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(business.mapUrl || window.location.href);
        alert(lang === 'en' ? 'Link copied to clipboard!' : 'تم نسخ الرابط!');
      } catch (err) {
        console.error('Could not copy text: ', err);
      }
    }
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={12}
            className={`${
              star <= Math.round(rating)
                ? 'fill-teal-500 text-teal-500'
                : 'fill-white/10 text-white/10'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={`glass-panel rounded-[2rem] overflow-hidden hover:border-teal-500/40 transition-all duration-500 flex flex-col h-full group relative ${isRtl ? 'text-right' : 'text-left'}`}>
      {/* AI Tag Labels on Card */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 items-end">
        {business.tags?.includes('hiddenGem') && (
          <div className="bg-teal-400 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
            <Gem size={12} /> {lang === 'en' ? 'Hidden Gem' : 'جوهرة مخفية'}
          </div>
        )}
        {business.tags?.includes('trending') && (
          <div className="bg-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
            <TrendingUp size={12} /> {lang === 'en' ? 'Trending' : 'رائج'}
          </div>
        )}
      </div>

      <div className="relative h-52 w-full overflow-hidden shrink-0">
        <img 
          src={business.imageUrl} 
          alt={business.name}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-90 group-hover:opacity-100"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&h=400';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
        
        <div className="absolute top-4 left-4 flex gap-2">
          {business.isOpen !== undefined && (
            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-xl text-white shadow-lg border border-white/10 ${business.isOpen ? 'bg-emerald-500/50' : 'bg-rose-500/50'}`}>
              {business.isOpen ? (lang === 'en' ? 'Live Now' : 'مفتوح الآن') : (lang === 'en' ? 'Closed' : 'مغلق')}
            </div>
          )}
        </div>
        
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
          <span className="text-[10px] font-bold bg-white/10 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
            {business.category}
          </span>
          {business.distance && (
            <div className="flex items-center gap-1 text-[10px] font-black text-teal-400">
              <MapPin size={10} />
              {business.distance}
            </div>
          )}
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-black text-inherit mb-1 leading-tight line-clamp-1 group-hover:text-teal-500 transition-colors">{business.name}</h3>
        
        <div className="flex items-center gap-3 mb-4">
          {business.rating !== undefined && (
            <>
              {renderStars(business.rating)}
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black">{business.rating}</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">({business.reviewsCount?.toLocaleString() || 0})</span>
              </div>
            </>
          )}
        </div>

        {/* Action Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {business.phoneNumber && (
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 hover:text-teal-500 transition-colors cursor-pointer">
              <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600">
                <Phone size={12} />
              </div>
              <span className="truncate">{business.phoneNumber}</span>
            </div>
          )}
          {business.website && (
            <a 
              href={business.website} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-2 text-[11px] font-bold text-slate-500 hover:text-teal-500 transition-colors"
            >
              <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600">
                <Globe size={12} />
              </div>
              <span className="truncate">{lang === 'en' ? 'Website' : 'الموقع'}</span>
            </a>
          )}
        </div>

        <div className="flex items-start gap-2 mb-4 text-slate-400">
          <MapPin size={14} className="shrink-0 mt-0.5 text-teal-500/50" />
          <span className="text-[11px] font-medium leading-relaxed line-clamp-1">{business.address}</span>
        </div>

        {/* Collapsible Opening Hours */}
        {business.openingHours && (
          <div className="mb-4">
            <button 
              onClick={() => setShowHours(!showHours)}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-teal-600 hover:text-teal-500 transition-colors"
            >
              <Clock size={12} />
              <span>{lang === 'en' ? 'Opening Hours' : 'ساعات العمل'}</span>
              {showHours ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {showHours && (
              <div className="mt-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                {business.openingHours.map((hour, idx) => (
                  <p key={idx} className="text-[10px] text-slate-500 font-medium">{hour}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {business.reviewSnippet && (
          <div className="bg-slate-500/5 rounded-2xl p-4 mb-6 border border-slate-500/5 relative group/quote">
            <Quote size={12} className="text-teal-500/30 absolute -top-2 -left-2 transform -scale-x-100" />
            <p className="text-[12px] text-inherit italic font-medium leading-relaxed line-clamp-2 ps-2">
              "{business.reviewSnippet}"
            </p>
          </div>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between gap-4">
          <a 
            href={business.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-grow inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black rounded-[1.25rem] transition-all duration-300 shadow-[0_10px_20px_-10px_rgba(20,184,166,0.5)] active:scale-95 uppercase tracking-widest"
          >
            {lang === 'en' ? 'Navigate' : 'انتقل للخرائط'}
            <ExternalLink size={14} />
          </a>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleShare}
              className="p-3.5 bg-slate-500/5 hover:bg-slate-500/10 rounded-[1.25rem] text-slate-400 hover:text-teal-500 transition-all border border-slate-500/5"
              title={lang === 'en' ? 'Share' : 'مشاركة'}
            >
              <Share2 size={18} />
            </button>
            <button 
              onClick={toggleFavorite}
              className={`p-3.5 rounded-[1.25rem] transition-all border ${isFavorite ? 'bg-teal-500/10 border-teal-500/40 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.1)]' : 'bg-slate-500/5 border-slate-500/5 text-slate-500 hover:text-teal-500'}`}
              title={lang === 'en' ? 'Add to Favorites' : 'إضافة إلى المفضلات'}
            >
              <Star size={18} className={isFavorite ? 'fill-current' : ''} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessCard;
