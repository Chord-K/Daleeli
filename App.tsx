
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Search, Globe, MapPin, Compass, Utensils, ShoppingBag, Landmark, Star, 
  Menu, X, AlertCircle, Map as MapIcon, Scissors, Dumbbell, 
  HeartPulse, History, Tent, Music, Sparkles, Filter, RotateCcw,
  Zap, TrendingUp, Gem, Moon, Stars, User, Mail, Lock, CheckCircle2,
  Sun, Heart, MessageSquare, Send, Clock, Camera, Trash2, Edit2, Save
} from 'lucide-react';
import { Language, Location, BusinessListing, CONTENT, SearchSuggestion, UserProfile } from './types';
import { getLocalRecommendations, getSearchSuggestions } from './services/geminiService';
import BusinessCard from './components/BusinessCard';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [isNightMode, setIsNightMode] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [countryCode, setCountryCode] = useState<string | null>(localStorage.getItem('daleeli_country'));
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ text: string; businesses: BusinessListing[]; directMatch?: BusinessListing } | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Autocomplete state
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);

  // Auth & Profile state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('daleeli_logged_in') === 'true');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Auth Form Inputs
  const [authInputs, setAuthInputs] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  const initialProfile: UserProfile = JSON.parse(
    localStorage.getItem('daleeli_user_profile') || 
    '{"name": "Explorer", "email": "explorer@daleeli.com", "avatar": null, "preferences": []}'
  );
  const [userProfile, setUserProfile] = useState<UserProfile>(initialProfile);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Feedback state
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'feedback' | 'bug' | 'suggestion'>('feedback');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);
  const [isFeedbackSuccess, setIsFeedbackSuccess] = useState(false);

  // Filters
  const [filterOpenNow, setFilterOpenNow] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'popularity' | null>(null);

  const categories = [
    { id: 'restaurants', label: { en: 'Food & Dining', ar: 'مطاعم ومأكولات' }, icon: Utensils },
    { id: 'shopping', label: { en: 'Shopping', ar: 'تسوق' }, icon: ShoppingBag },
    { id: 'culture', label: { en: 'Culture & History', ar: 'ثقافة وتاريخ' }, icon: History },
    { id: 'nature', label: { en: 'Nature & Sightseeing', ar: 'طبيعة ومعالم' }, icon: Landmark },
    { id: 'adventure', label: { en: 'Adventure', ar: 'مغامرة' }, icon: Tent },
    { id: 'nightlife', label: { en: 'Nightlife', ar: 'ترفيه ليلي' }, icon: Music },
    { id: 'beauty', label: { en: 'Beauty & Spa', ar: 'جمال وسبا' }, icon: Scissors },
    { id: 'fitness', label: { en: 'Gym & Fitness', ar: 'لياقة وبدنية' }, icon: Dumbbell },
    { id: 'health', label: { en: 'Hospitals', ar: 'مستشفيات' }, icon: HeartPulse },
    { id: 'heritage', label: { en: 'Heritage Sites', ar: 'مواقع تراثية' }, icon: Landmark },
  ];

  const content = CONTENT[lang];
  const isRtl = lang === 'ar';

  const handleSearch = useCallback(async (query: string, limit?: number, isDirectMatch: boolean = false) => {
    if (!query.trim()) return;
    setLoading(true);
    setShowSuggestions(false);
    setApiError(null);
    try {
      const data = await getLocalRecommendations(query, location, lang, countryCode, isDirectMatch);
      if (limit) {
        setResults({ ...data, businesses: data.businesses.slice(0, limit) });
      } else {
        setResults(data);
      }
      // Clear input and dropdown upon search submission or selection
      setSearchQuery('');
      setShowSuggestions(false);
    } catch (error: any) {
      console.error("Search Error:", error);
      const errorMsg = error?.message || JSON.stringify(error);
      if (errorMsg.includes("Requested entity was not found") || errorMsg.includes("404")) {
        setApiError("key_not_found");
      } else {
        setApiError("generic");
      }
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [location, lang, countryCode]);

  // Autocomplete debounced effect
  useEffect(() => {
    // Reset search state when input is cleared
    if (searchQuery.length === 0 && !isInitialLoad) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsInitialLoad(true);
      setResults(null);
      handleSearch(lang === 'en' ? "top tourist spots" : "أبرز المعالم السياحية", 4);
      return;
    }

    if (searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const fetchSuggestions = async () => {
      setIsSearchingSuggestions(true);
      const data = await getSearchSuggestions(searchQuery, location, lang, countryCode);
      setSuggestions(data);
      setShowSuggestions(data.length > 0);
      setIsSearchingSuggestions(false);
    };

    const timer = setTimeout(fetchSuggestions, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, location, lang, countryCode, isInitialLoad, handleSearch]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const loc = { latitude: position.coords.latitude, longitude: position.coords.longitude };
          setLocation(loc);
          try {
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${loc.latitude}&longitude=${loc.longitude}&localityLanguage=en`);
            const data = await response.json();
            if (data.countryCode) {
              setCountryCode(data.countryCode);
              localStorage.setItem('daleeli_country', data.countryCode);
            }
          } catch (err) { console.error("Country detection failed:", err); }
        },
        (error) => { console.error("Location error:", error); }
      );
    }
  }, []);

  useEffect(() => {
    if (location && isInitialLoad) {
      handleSearch(lang === 'en' ? "top tourist spots" : "أبرز المعالم السياحية", 4);
    }
  }, [location, isInitialLoad, handleSearch, lang]);

  const filteredResults = useMemo(() => {
    if (!results) return [];
    let list = [...results.businesses];
    list.sort((a, b) => (a.distanceNum || 0) - (b.distanceNum || 0));
    if (filterOpenNow) list = list.filter(b => b.isOpen);
    if (sortBy === 'rating') list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sortBy === 'popularity') list.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
    return list.slice(0, 4);
  }, [results, filterOpenNow, sortBy]);

  const aiNotification = useMemo(() => {
    if (!results || results.businesses.length === 0) return null;
    const gems = results.businesses.filter(b => b.tags?.includes('hiddenGem'));
    if (gems.length > 0) {
      return {
        type: 'hiddenGem',
        text: lang === 'en' ? `Celestial Discovery: ${gems[0].name}` : `اكتشاف سماوي: ${gems[0].name}`,
        icon: Stars
      };
    }
    const trending = results.businesses.filter(b => b.tags?.includes('trending'));
    if (trending.length > 0) {
      return {
        type: 'trending',
        text: lang === 'en' ? `${trending[0].name} glows bright tonight!` : `${trending[0].name} يتألق الليلة!`,
        icon: Moon
      };
    }
    return null;
  }, [results, lang]);

  const toggleLanguage = () => {
    setLang(prev => prev === 'en' ? 'ar' : 'en');
    setResults(null);
    setIsInitialLoad(true);
  };

  const getMapSrc = () => {
    const baseUrl = "https://www.google.com/maps";
    if (results?.directMatch?.mapUrl) {
      return `${results.directMatch.mapUrl}&output=embed`;
    }
    const q = searchQuery || (lang === 'en' ? "explore" : "استكشف");
    if (location) return `${baseUrl}?q=${encodeURIComponent(q)}&ll=${location.latitude},${location.longitude}&z=13&output=embed`;
    return `${baseUrl}?q=${encodeURIComponent(q + ' in ' + (countryCode || 'Middle East'))}&output=embed`;
  };

  const renderFlag = () => {
    if (!countryCode) return null;
    try {
      const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
      const flagEmoji = String.fromCodePoint(...codePoints);
      return (
        <div 
          className={`flex items-center justify-center ${isNightMode ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'} px-2.5 py-1.5 rounded-xl border shadow-lg backdrop-blur-md hover:border-teal-500/30 transition-colors cursor-help`}
          title={`Location: ${countryCode}`}
        >
          <span className="text-xl leading-none">{flagEmoji}</span>
        </div>
      );
    } catch (e) {
      return null;
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    
    // Simulate a user database in localStorage
    const users = JSON.parse(localStorage.getItem('daleeli_users') || '[]');

    if (authMode === 'signup') {
      if (authInputs.password !== authInputs.confirmPassword) {
        setAuthError(lang === 'en' ? "Passwords do not match." : "كلمات المرور غير متطابقة.");
        return;
      }
      
      const userExists = users.some((u: any) => u.email === authInputs.email);
      if (userExists) {
        setAuthError(lang === 'en' ? "User with this email already exists." : "المستخدم بهذا البريد الإلكتروني موجود بالفعل.");
        return;
      }

      const newProfile: UserProfile = {
        name: authInputs.name,
        email: authInputs.email,
        avatar: null,
        preferences: []
      };

      const newUser = { ...newProfile, password: authInputs.password };
      users.push(newUser);
      localStorage.setItem('daleeli_users', JSON.stringify(users));
      localStorage.setItem('daleeli_user_profile', JSON.stringify(newProfile));
      localStorage.setItem('daleeli_logged_in', 'true');
      
      setUserProfile(newProfile);
      setIsLoggedIn(true);
      setIsAuthModalOpen(false);
      setAuthInputs({ name: '', email: '', password: '', confirmPassword: '' });
    } else {
      // Login mode
      const user = users.find((u: any) => u.email === authInputs.email && u.password === authInputs.password);
      if (user) {
        const profile: UserProfile = {
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          preferences: user.preferences
        };
        localStorage.setItem('daleeli_user_profile', JSON.stringify(profile));
        localStorage.setItem('daleeli_logged_in', 'true');
        
        setUserProfile(profile);
        setIsLoggedIn(true);
        setIsAuthModalOpen(false);
        setAuthInputs({ name: '', email: '', password: '', confirmPassword: '' });
      } else {
        setAuthError(lang === 'en' ? "Invalid email or password." : "البريد الإلكتروني أو كلمة المرور غير صالحة.");
      }
    }
  };

  const handleSocialLogin = (platform: string) => {
    console.log(`Logging in with ${platform}`);
    const socialProfile: UserProfile = {
      name: `Explorer via ${platform}`,
      email: `user@${platform}.com`,
      avatar: null,
      preferences: []
    };
    localStorage.setItem('daleeli_user_profile', JSON.stringify(socialProfile));
    localStorage.setItem('daleeli_logged_in', 'true');
    setUserProfile(socialProfile);
    setIsLoggedIn(true);
    setIsAuthModalOpen(false);
  };

  const handleFavoritesClick = () => {
    if (!isLoggedIn) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
    } else {
      alert(lang === 'en' ? "Coming soon: Your personalized favorites collection!" : "قريباً: مجموعتك الشخصية من المفضلات!");
    }
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsFeedbackSubmitting(true);
    setTimeout(() => {
      setIsFeedbackSubmitting(false);
      setIsFeedbackSuccess(true);
      setTimeout(() => {
        setIsFeedbackModalOpen(false);
        setIsFeedbackSuccess(false);
        setFeedbackMessage('');
      }, 2000);
    }, 1000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setUserProfile(prev => ({ ...prev, avatar: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = () => {
    localStorage.setItem('daleeli_user_profile', JSON.stringify(userProfile));
    // Also update the simulated user database
    const users = JSON.parse(localStorage.getItem('daleeli_users') || '[]');
    const updatedUsers = users.map((u: any) => u.email === userProfile.email ? { ...u, name: userProfile.name, avatar: userProfile.avatar } : u);
    localStorage.setItem('daleeli_users', JSON.stringify(updatedUsers));
    setIsEditingProfile(false);
  };

  const handleAvatarClick = () => {
    if (isLoggedIn) {
      setIsProfileOpen(true);
    } else {
      setAuthMode('login');
      setIsAuthModalOpen(true);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-all duration-500 ${isNightMode ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'} ${isRtl ? 'arabic font-arabic' : 'font-sans'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b shadow-2xl transition-all duration-300 ${isNightMode ? 'bg-slate-950/80 border-white/5 shadow-black/50' : 'bg-white/80 border-slate-200 shadow-slate-200/50'}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 via-cyan-500 to-teal-600 rounded-xl flex items-center justify-center text-slate-950 shadow-[0_0_20px_rgba(20,184,166,0.3)] animate-pulse hover:scale-110 transition-transform cursor-pointer">
              <Compass size={24} className="animate-compass-dynamic" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className={`text-2xl font-black tracking-tight ${isNightMode ? 'text-white' : 'text-slate-900'}`}>{content.title}</h1>
              {renderFlag()}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div 
              onClick={() => setIsNightMode(!isNightMode)}
              className={`relative w-16 h-8 rounded-full cursor-pointer transition-all duration-300 p-1 border ${isNightMode ? 'bg-slate-900 border-white/10' : 'bg-slate-100 border-slate-200'}`}
              title={isNightMode ? 'Switch to Day Mode' : 'Switch to Night Mode'}
            >
              <div className="flex items-center justify-between h-full px-1">
                <Sun size={14} className={isNightMode ? 'text-slate-600' : 'text-teal-500'} />
                <Moon size={14} className={isNightMode ? 'text-teal-400' : 'text-slate-400'} />
              </div>
              <div 
                className={`absolute top-1 left-1 w-6 h-6 rounded-full transition-transform duration-300 flex items-center justify-center shadow-lg ${isNightMode ? 'translate-x-8 bg-teal-500' : 'translate-x-0 bg-teal-500'}`}
              >
                {isNightMode ? <Moon size={12} className="text-slate-950" /> : <Sun size={12} className="text-slate-950" />}
              </div>
            </div>

            <button 
              onClick={handleFavoritesClick}
              className={`relative p-2 rounded-full transition-all border flex items-center justify-center ${isNightMode ? 'bg-white/5 border-white/10 text-rose-400 hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-rose-500 hover:bg-slate-200'}`}
              title={lang === 'en' ? 'My Favorites' : 'مفضلاتي'}
            >
              <Heart size={20} className={isLoggedIn ? "fill-current" : ""} />
              {isLoggedIn && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center">3</span>
              )}
            </button>

            {isLoggedIn ? (
              <button 
                onClick={handleAvatarClick}
                className={`w-10 h-10 rounded-full border-2 overflow-hidden transition-transform hover:scale-110 active:scale-95 ${isNightMode ? 'border-teal-500/50' : 'border-teal-500'}`}
              >
                <img src={userProfile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name)}&background=14b8a6&color=0f172a`} alt="User" className="w-full h-full object-cover" />
              </button>
            ) : (
              <button 
                onClick={() => { setAuthMode('signup'); setIsAuthModalOpen(true); }}
                className="flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-slate-950 font-black transition-all text-sm shadow-[0_0_15px_rgba(20,184,166,0.2)] active:scale-95"
              >
                <User size={16} /> <span>{lang === 'en' ? 'Join Daleeli' : 'انضم لدليلي'}</span>
              </button>
            )}

            <button onClick={toggleLanguage} className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm font-bold ${isNightMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}>
              <Globe size={16} /> <span>{lang === 'en' ? 'العربية' : 'English'}</span>
            </button>
          </div>

          <button className={`md:hidden p-2 ${isNightMode ? 'text-white' : 'text-slate-900'}`} onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Profile Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsProfileOpen(false)}></div>
          <div className={`relative w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl border transition-all animate-in fade-in zoom-in duration-300 ${isNightMode ? 'bg-slate-900/90 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <button 
              onClick={() => setIsProfileOpen(false)}
              className="absolute top-8 right-8 text-slate-500 hover:text-teal-500 transition-colors"
            >
              <X size={28} />
            </button>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-black mb-2">{lang === 'en' ? 'My Profile' : 'ملفي الشخصي'}</h2>
              <p className="text-slate-500">{lang === 'en' ? 'Personalize your Daleeli experience' : 'خصص تجربتك في دليلي'}</p>
            </div>

            <div className="flex flex-col items-center gap-6">
              <div className="relative group">
                <div className={`w-32 h-32 rounded-full border-4 overflow-hidden shadow-2xl transition-transform ${isNightMode ? 'border-teal-500/50' : 'border-teal-500'}`}>
                  <img src={userProfile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name)}&background=14b8a6&color=0f172a`} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                {isEditingProfile && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <Camera size={24} className="text-white" />
                  </div>
                )}
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
              </div>

              <div className="w-full space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-teal-500 mb-2 block">{lang === 'en' ? 'Full Name' : 'الاسم الكامل'}</label>
                  {isEditingProfile ? (
                    <input 
                      type="text" 
                      value={userProfile.name}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                      className={`w-full border rounded-2xl py-4 px-6 outline-none focus:ring-4 transition-all ${isNightMode ? 'bg-slate-800/50 border-white/10 text-white focus:ring-teal-500/10' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-teal-500/10'}`}
                    />
                  ) : (
                    <p className="text-lg font-bold px-1">{userProfile.name}</p>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-teal-500 mb-2 block">{lang === 'en' ? 'Email Address' : 'البريد الإلكتروني'}</label>
                  <p className="text-sm text-slate-500 px-1">{userProfile.email}</p>
                </div>

                <div className="pt-6 flex gap-4">
                  {isEditingProfile ? (
                    <>
                      <button 
                        onClick={saveProfile}
                        className="flex-grow flex items-center justify-center gap-2 py-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-2xl transition-all shadow-lg uppercase tracking-widest text-xs"
                      >
                        <Save size={18} /> {lang === 'en' ? 'Save Changes' : 'حفظ التغييرات'}
                      </button>
                      <button 
                        onClick={() => setIsEditingProfile(false)}
                        className={`px-8 py-4 border rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isNightMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`}
                      >
                        {lang === 'en' ? 'Cancel' : 'إلغاء'}
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => setIsEditingProfile(true)}
                      className="w-full flex items-center justify-center gap-2 py-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-2xl transition-all shadow-lg uppercase tracking-widest text-xs"
                    >
                      <Edit2 size={18} /> {lang === 'en' ? 'Edit Profile' : 'تعديل الملف'}
                    </button>
                  )}
                </div>

                {!isEditingProfile && (
                  <button 
                    onClick={() => {
                      setIsLoggedIn(false);
                      localStorage.removeItem('daleeli_logged_in');
                      localStorage.removeItem('daleeli_user_profile');
                      setIsProfileOpen(false);
                      setUserProfile({ name: 'Explorer', email: 'explorer@daleeli.com', avatar: null, preferences: [] });
                    }}
                    className={`w-full py-4 mt-2 border border-rose-500/30 text-rose-500 font-black rounded-2xl transition-all hover:bg-rose-500/10 uppercase tracking-widest text-xs`}
                  >
                    {lang === 'en' ? 'Sign Out' : 'تسجيل الخروج'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsAuthModalOpen(false)}></div>
          <div className={`relative w-full max-md rounded-[2.5rem] p-8 shadow-2xl border transition-all animate-in fade-in zoom-in duration-300 ${isNightMode ? 'bg-slate-900/90 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <button 
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-6 right-6 text-slate-500 hover:text-teal-500 transition-colors"
            >
              <X size={24} />
            </button>

            <div className="mb-8 flex items-center justify-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 via-cyan-500 to-teal-600 rounded-xl flex items-center justify-center text-slate-950 shadow-xl">
                <Compass size={24} className="animate-compass-dynamic" />
              </div>
              <h2 className={`text-3xl font-black ${isNightMode ? 'text-white' : 'text-slate-900'}`}>{content.title}</h2>
            </div>

            <div className={`flex gap-2 p-1.5 rounded-2xl mb-8 ${isNightMode ? 'bg-white/5' : 'bg-slate-100'}`}>
              <button 
                onClick={() => { setAuthMode('login'); setAuthError(null); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${authMode === 'login' ? 'bg-teal-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-teal-500'}`}
              >
                {lang === 'en' ? 'Login' : 'تسجيل الدخول'}
              </button>
              <button 
                onClick={() => { setAuthMode('signup'); setAuthError(null); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${authMode === 'signup' ? 'bg-teal-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-teal-500'}`}
              >
                {lang === 'en' ? 'Sign Up' : 'إنشاء حساب'}
              </button>
            </div>

            {authError && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold animate-in fade-in slide-in-from-top-1">
                {authError}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleAuthSubmit}>
              {authMode === 'signup' && (
                <div className="relative group">
                  <User size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-500 transition-colors ${isRtl ? 'left-auto right-4' : 'left-4'}`} />
                  <input 
                    type="text" 
                    placeholder={lang === 'en' ? 'Username' : 'اسم المستخدم'}
                    value={authInputs.name}
                    onChange={(e) => setAuthInputs({...authInputs, name: e.target.value})}
                    className={`w-full border rounded-2xl py-4 ${isRtl ? 'pe-12 ps-4' : 'ps-12 pe-4'} outline-none focus:ring-4 transition-all ${isNightMode ? 'bg-slate-800/50 border-white/10 text-white focus:border-teal-500/50 focus:ring-teal-500/10' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-500/50 focus:ring-teal-500/10'}`}
                    required={authMode === 'signup'}
                  />
                </div>
              )}
              
              <div className="relative group">
                <Mail size={18} className={`absolute top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-500 transition-colors ${isRtl ? 'left-auto right-4' : 'left-4'}`} />
                <input 
                  type="email" 
                  placeholder={lang === 'en' ? 'Email address' : 'البريد الإلكتروني'}
                  value={authInputs.email}
                  onChange={(e) => setAuthInputs({...authInputs, email: e.target.value})}
                  className={`w-full border rounded-2xl py-4 ${isRtl ? 'pe-12 ps-4' : 'ps-12 pe-4'} outline-none focus:ring-4 transition-all ${isNightMode ? 'bg-slate-800/50 border-white/10 text-white focus:border-teal-500/50 focus:ring-teal-500/10' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-500/50 focus:ring-teal-500/10'}`}
                  required
                />
              </div>

              <div className="relative group">
                <Lock size={18} className={`absolute top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-500 transition-colors ${isRtl ? 'left-auto right-4' : 'left-4'}`} />
                <input 
                  type="password" 
                  placeholder={lang === 'en' ? 'Password' : 'كلمة المرور'}
                  value={authInputs.password}
                  onChange={(e) => setAuthInputs({...authInputs, password: e.target.value})}
                  className={`w-full border rounded-2xl py-4 ${isRtl ? 'pe-12 ps-4' : 'ps-12 pe-4'} outline-none focus:ring-4 transition-all ${isNightMode ? 'bg-slate-800/50 border-white/10 text-white focus:border-teal-500/50 focus:ring-teal-500/10' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-500/50 focus:ring-teal-500/10'}`}
                  required
                />
              </div>

              {authMode === 'signup' && (
                <>
                  <div className="relative group">
                    <Lock size={18} className={`absolute top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-500 transition-colors ${isRtl ? 'left-auto right-4' : 'left-4'}`} />
                    <input 
                      type="password" 
                      placeholder={lang === 'en' ? 'Re-type password' : 'إعادة كتابة كلمة المرور'}
                      value={authInputs.confirmPassword}
                      onChange={(e) => setAuthInputs({...authInputs, confirmPassword: e.target.value})}
                      className={`w-full border rounded-2xl py-4 ${isRtl ? 'pe-12 ps-4' : 'ps-12 pe-4'} outline-none focus:ring-4 transition-all ${isNightMode ? 'bg-slate-800/50 border-white/10 text-white focus:border-teal-500/50 focus:ring-teal-500/10' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-500/50 focus:ring-teal-500/10'}`}
                      required={authMode === 'signup'}
                    />
                  </div>
                  
                  <label className="flex items-center gap-3 cursor-pointer group mt-6">
                    <div className="relative flex items-center justify-center">
                      <input type="checkbox" className="peer sr-only" required />
                      <div className={`w-6 h-6 rounded-lg border-2 transition-all peer-checked:bg-teal-500 peer-checked:border-teal-500 ${isNightMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}></div>
                      <CheckCircle2 size={14} className="absolute text-slate-950 opacity-0 peer-checked:opacity-100 transition-all" />
                    </div>
                    <span className={`text-sm transition-colors ${isNightMode ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-600 group-hover:text-slate-900'}`}>
                      {lang === 'en' ? 'I agree to the Terms & Conditions' : 'أوافق على الشروط والأحكام'}
                    </span>
                  </label>
                </>
              )}

              <button 
                type="submit"
                className="w-full py-4 mt-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-2xl transition-all shadow-[0_0_25px_rgba(20,184,166,0.3)] active:scale-95 uppercase tracking-widest text-sm"
              >
                {authMode === 'login' 
                  ? (lang === 'en' ? 'Login' : 'دخول') 
                  : (lang === 'en' ? 'Create Account' : 'إنشاء حساب')
                }
              </button>
            </form>

            <div className="relative my-8">
              <div className={`absolute inset-0 flex items-center ${isNightMode ? 'opacity-10' : 'opacity-20'}`}>
                <div className="w-full border-t border-slate-500"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest">
                <span className={`px-4 font-bold ${isNightMode ? 'bg-slate-900 text-slate-500' : 'bg-white text-slate-400'}`}>
                  {lang === 'en' ? 'or continue with' : 'أو تابع عبر'}
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => handleSocialLogin('google')}
                className={`flex-1 py-3 rounded-2xl border flex items-center justify-center transition-all active:scale-95 ${isNightMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'}`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className={`text-xs font-bold ${isNightMode ? 'text-white' : 'text-slate-700'}`}>Google</span>
                </div>
              </button>
              
              <button 
                onClick={() => handleSocialLogin('facebook')}
                className="flex-1 py-3 rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] transition-all active:scale-95 flex items-center justify-center shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="text-xs font-bold text-white">Facebook</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal (omitted for brevity, same as existing) */}

      <main className="flex-grow flex flex-col">
        <section className={`h-[45vh] md:h-[55vh] relative border-b transition-all duration-300 overflow-hidden ${isNightMode ? 'border-white/5' : 'border-slate-200'}`}>
          <iframe 
            width="100%" 
            height="100%" 
            style={{ 
              border: 0,
              filter: isNightMode ? 'invert(90%) hue-rotate(180deg) brightness(0.9) contrast(1.1)' : 'none' 
            }} 
            loading="lazy" 
            src={getMapSrc()}
          ></iframe>
          
          <div className={`absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent transition-all duration-300 ${isNightMode ? 'to-slate-950/80' : 'to-white/80'}`}></div>

          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[92%] max-xl z-[60]">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-indigo-500 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder={content.searchPlaceholder}
                  className={`relative w-full ps-14 pe-14 py-5 rounded-2xl border shadow-2xl text-lg outline-none transition-all ${isNightMode ? 'bg-slate-900 border-white/10 text-white focus:ring-teal-500/20' : 'bg-white border-slate-200 text-slate-900 focus:ring-teal-500/10'}`}
                />
                <Search className={`absolute ${isRtl ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-teal-500`} size={24} />
                {isSearchingSuggestions && (
                  <div className={`absolute ${isRtl ? 'left-5' : 'right-5'} top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-teal-500/20 border-t-teal-500 rounded-full animate-spin`}></div>
                )}
              </div>

              {showSuggestions && (
                <div className={`absolute top-full left-0 right-0 mt-2 rounded-2xl border shadow-2xl overflow-hidden transition-all animate-in fade-in slide-in-from-top-2 duration-300 z-50 ${isNightMode ? 'bg-slate-900/95 border-white/10 backdrop-blur-xl' : 'bg-white/95 border-slate-200 backdrop-blur-xl'}`}>
                  <div className="py-2">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSearchQuery(suggestion.text);
                          handleSearch(suggestion.text, 4, suggestion.type === 'place');
                          setShowSuggestions(false);
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                        className={`w-full flex items-center gap-4 px-5 py-3.5 text-start transition-colors ${isNightMode ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}
                      >
                        {suggestion.type === 'place' ? <MapPin size={16} className="text-teal-500 shrink-0" /> : <Clock size={16} className="text-slate-500 shrink-0" />}
                        <div className="flex flex-col">
                          <span className="font-bold text-sm truncate">{suggestion.text}</span>
                          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-black">{suggestion.type === 'place' ? (lang === 'en' ? 'Place' : 'مكان') : (lang === 'en' ? 'Category' : 'فئة')}</span>
                        </div>
                        <Zap size={14} className="ms-auto text-teal-500 opacity-60" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {aiNotification && (
            <div className={`absolute bottom-6 ${isRtl ? 'right-6' : 'left-6'} z-20 animate-star-glow`}>
              <div className={`p-4 rounded-2xl shadow-xl flex items-center gap-4 max-w-sm border transition-all ${isNightMode ? 'bg-slate-900/90 border-white/10 shadow-black/30' : 'bg-white/90 border-slate-200 shadow-slate-200/50'}`}>
                <div className="p-3 bg-gradient-to-br from-teal-400 to-teal-600 text-slate-950 rounded-xl shadow-lg">
                  <aiNotification.icon size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-teal-500 uppercase tracking-widest mb-1">Celestial Insight</p>
                  <p className={`text-sm font-bold leading-tight ${isNightMode ? 'text-white' : 'text-slate-900'}`}>{aiNotification.text}</p>
                </div>
              </div>
            </div>
          )}
        </section>

        <div className="max-w-7xl mx-auto px-4 py-10 w-full space-y-12">
          {/* Categories Section (same as before) */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-2xl font-black flex items-center gap-3 ${isNightMode ? 'text-white' : 'text-slate-900'}`}>
                <Sparkles className="text-teal-400" size={24} /> {content.categoriesTitle}
              </h3>
            </div>
            <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); handleSearch(cat.label[lang], 4); }}
                  className={`flex-shrink-0 flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all duration-300 ${activeCategory === cat.id ? 'bg-teal-500 border-teal-400 text-slate-950 shadow-[0_0_20px_rgba(20,184,166,0.3)] scale-105' : `${isNightMode ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'} hover:border-teal-500/50 hover:text-teal-500`}`}
                >
                  <cat.icon size={20} className={activeCategory === cat.id ? 'text-slate-950' : 'text-teal-400'} />
                  <span className="font-black whitespace-nowrap text-sm">{cat.label[lang]}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Filter Bar (same as before) */}
          <section className={`p-3 rounded-2xl flex items-center gap-3 overflow-x-auto no-scrollbar shadow-lg border transition-all ${isNightMode ? 'bg-slate-900/50 border-white/10' : 'bg-slate-100/50 border-slate-200'}`}>
            <div className={`flex items-center gap-3 px-4 border-e ${isNightMode ? 'border-white/5' : 'border-slate-200'}`}>
              <Filter size={20} className="text-teal-400" />
            </div>
            <button onClick={() => setFilterOpenNow(!filterOpenNow)} className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${filterOpenNow ? 'bg-teal-500 text-slate-950' : `${isNightMode ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-white text-slate-500 hover:bg-slate-200'}`}`}>
              {content.filters.openNow}
            </button>
            <div className={`h-6 w-px ${isNightMode ? 'bg-white/5' : 'bg-slate-200'}`}></div>
            {['distance', 'rating', 'popularity'].map((f) => (
              <button key={f} onClick={() => setSortBy(f as any)} className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap capitalize ${sortBy === f ? 'bg-teal-500 text-slate-950' : `${isNightMode ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-white text-slate-500 hover:bg-slate-200'}`}`}>
                {content.filters[f as keyof typeof content.filters]}
              </button>
            ))}
            <button onClick={() => { setSortBy(null); setFilterOpenNow(false); }} className="ms-auto p-2.5 text-slate-500 hover:text-rose-500 transition-colors">
              <RotateCcw size={20} />
            </button>
          </section>

          {/* Results List (same logic, updated title handling) */}
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className={`text-3xl font-black ${isNightMode ? 'text-white' : 'text-slate-900'}`}>{results?.directMatch ? (lang === 'en' ? 'Direct Match' : 'النتيجة المباشرة') : content.nearbyTitle}</h3>
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-black text-[10px] uppercase tracking-widest shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                <Zap size={14} /> AI Tailored
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`animate-pulse rounded-3xl h-96 border ${isNightMode ? 'bg-slate-900 border-white/5' : 'bg-slate-100 border-slate-200'}`}></div>
                ))}
              </div>
            ) : filteredResults.length > 0 ? (
              <div className={`grid grid-cols-1 gap-8 ${results?.directMatch || filteredResults.length <= 1 ? 'max-w-xl mx-auto' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
                {filteredResults.map((biz) => (
                  <div key={biz.id} className="relative group">
                    <BusinessCard business={biz} lang={lang} />
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-center py-28 rounded-3xl border-dashed border-2 transition-all ${isNightMode ? 'bg-slate-900/30 border-white/10' : 'bg-slate-100/30 border-slate-200'}`}>
                <div className="bg-teal-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-teal-500 shadow-inner">
                  <MapPin size={40} />
                </div>
                <p className={`font-bold text-lg ${isNightMode ? 'text-slate-400' : 'text-slate-500'}`}>{content.noResults}</p>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className={`border-t py-16 mt-20 relative overflow-hidden transition-all duration-500 ${isNightMode ? 'bg-slate-950 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
        {/* Footer (same as before) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-start relative z-10">
          <div>
            <div className="flex items-center gap-3 justify-center md:justify-start mb-6 group cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 via-cyan-500 to-teal-600 rounded-xl flex items-center justify-center text-slate-950 shadow-lg group-hover:scale-110 transition-transform">
                <Compass size={24} className="animate-compass-dynamic" />
              </div>
              <h4 className={`text-2xl font-black ${isNightMode ? 'text-white' : 'text-slate-900'}`}>{content.title}</h4>
            </div>
            <p className={`text-sm leading-relaxed max-w-sm ${isNightMode ? 'text-slate-500' : 'text-slate-600'}`}>Navigating the Middle East with Celestial Intelligence. Explore authentic spots with verified live grounding.</p>
          </div>
          <div className="flex flex-col gap-4">
            <h5 className={`font-black text-sm uppercase tracking-widest mb-2 ${isNightMode ? 'text-white' : 'text-slate-900'}`}>Explore</h5>
            <a href="#" className={`text-sm transition-all ${isNightMode ? 'text-slate-500 hover:text-teal-400' : 'text-slate-600 hover:text-teal-600'}`}>Regional Insights</a>
            <a href="#" className={`text-sm transition-all ${isNightMode ? 'text-slate-500 hover:text-teal-400' : 'text-slate-600 hover:text-teal-600'}`}>List Your Business</a>
            <button onClick={() => setIsFeedbackModalOpen(true)} className={`text-sm transition-all text-start w-fit ${isNightMode ? 'text-slate-500 hover:text-teal-400' : 'text-slate-600 hover:text-teal-600'}`}>{lang === 'en' ? 'Send Feedback' : 'أرسل ملاحظاتك'}</button>
            <a href="#" className={`text-sm transition-all ${isNightMode ? 'text-slate-500 hover:text-teal-400' : 'text-slate-600 hover:text-teal-600'}`}>AI Safety & Privacy</a>
          </div>
          <div>
            <h5 className={`font-black text-sm uppercase tracking-widest mb-4 ${isNightMode ? 'text-white' : 'text-slate-900'}`}>Preference</h5>
            <button onClick={toggleLanguage} className={`px-6 py-3 rounded-2xl text-sm font-black flex items-center gap-3 mx-auto md:mx-0 transition-all border ${isNightMode ? 'bg-white/5 border-white/10 text-teal-400 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'}`}>
              <Globe size={18} /> {lang === 'en' ? 'Arabic Mode' : 'English Mode'}
            </button>
          </div>
        </div>
        <div className={`max-w-7xl mx-auto px-4 pt-12 mt-12 border-t text-center text-[10px] uppercase tracking-[0.2em] ${isNightMode ? 'border-white/5 text-slate-600' : 'border-slate-200 text-slate-400'}`}>{content.footerText}</div>
      </footer>
    </div>
  );
};

export default App;
