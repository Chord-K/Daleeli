
export type Language = 'en' | 'ar';

export interface Location {
  latitude: number;
  longitude: number;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string | null;
  preferences: string[];
}

export interface GroundingChunk {
  maps?: {
    uri: string;
    title: string;
  };
  web?: {
    uri: string;
    title: string;
  };
}

export interface SearchSuggestion {
  text: string;
  type: 'place' | 'category';
}

export interface BusinessListing {
  id: string;
  name: string;
  description: string;
  category: string;
  rating?: number;
  reviewsCount?: number;
  address?: string;
  mapUrl?: string;
  imageUrl?: string;
  priceLevel?: string;
  isOpen?: boolean;
  phoneNumber?: string;
  website?: string;
  openingHours?: string[];
  reviewSnippet?: string;
  distance?: string;
  distanceNum?: number; // For sorting
  tags?: string[]; // AI tags like 'Hidden Gem', 'Trending'
}

export interface AppContent {
  title: string;
  searchPlaceholder: string;
  nearbyTitle: string;
  categoriesTitle: string;
  eventsTitle: string;
  loading: string;
  noResults: string;
  locationError: string;
  footerText: string;
  filters: {
    distance: string;
    rating: string;
    openNow: string;
    popularity: string;
    reset: string;
  };
  aiSuggestions: {
    trending: string;
    hiddenGem: string;
    popular: string;
    personalized: string;
  };
}

export const CONTENT: Record<Language, AppContent> = {
  en: {
    title: "Daleeli",
    searchPlaceholder: "Search for restaurants, malls, or places...",
    nearbyTitle: "Recommended Nearby",
    categoriesTitle: "Explore Categories",
    eventsTitle: "Upcoming Events",
    loading: "Finding live spots using Google Places...",
    noResults: "No places found matching your search nearby.",
    locationError: "Please enable location to see spots near you.",
    footerText: "© 2024 Daleeli. Your guide to the Middle East.",
    filters: {
      distance: "Distance",
      rating: "Rating",
      openNow: "Open Now",
      popularity: "Popularity",
      reset: "Reset"
    },
    aiSuggestions: {
      trending: "Trending Today",
      hiddenGem: "Hidden Gem",
      popular: "Traveler Favorite",
      personalized: "Recommended for You"
    }
  },
  ar: {
    title: "دليلي",
    searchPlaceholder: "ابحث عن مطاعم، مراكز تسوق، أو أماكن...",
    nearbyTitle: "مقترح بالقرب منك",
    categoriesTitle: "استكشف الفئات",
    eventsTitle: "الفعاليات القادمة",
    loading: "جاري البحث عن أماكن مباشرة عبر خرائط جوجل...",
    noResults: "لم يتم العثور على أماكن تطابق بحثك بالقرب منك.",
    locationError: "يرجى تفعيل الموقع لرؤية الأماكن القريبة منك.",
    footerText: "© 2024 دليلي. دليلك في الشرق الأوسط.",
    filters: {
      distance: "المسافة",
      rating: "التقييم",
      openNow: "مفتوح الآن",
      popularity: "الأكثر شعبية",
      reset: "إعادة تعيين"
    },
    aiSuggestions: {
      trending: "رائج اليوم",
      hiddenGem: "جوهرة مخفية",
      popular: "مفضل لدى المسافرين",
      personalized: "مقترح لك"
    }
  }
};
