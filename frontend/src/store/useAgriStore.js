import { create } from 'zustand'

const useAgriStore = create((set) => ({
  // ─── Language i18n ─────────────────────────────────
  language: 'en',
  setLanguage: (lang) => set({ language: lang }),

  // ─── Soil ──────────────────────────────────────────
  soilData: null,
  soilResult: null,
  setSoilData: (data) => set({ soilData: data }),
  setSoilResult: (result) => set({ soilResult: result }),

  // ─── Crop ──────────────────────────────────────────
  cropResult: null,
  setCropResult: (result) => set({ cropResult: result }),
  selectedCrop: null,
  setSelectedCrop: (crop) => set({ selectedCrop: crop }),

  // ─── Disease / Deficiency ──────────────────────────
  diseaseResult: null,
  deficiencyResult: null,
  uploadedImage: null,
  setDiseaseResult: (result) => set({ diseaseResult: result }),
  setDeficiencyResult: (result) => set({ deficiencyResult: result }),
  setUploadedImage: (img) => set({ uploadedImage: img }),

  // ─── Weather ───────────────────────────────────────
  weatherData: null,
  setWeatherData: (data) => set({ weatherData: data }),

  // ─── Full Recommendation ───────────────────────────
  recommendation: null,
  setRecommendation: (rec) => set({ recommendation: rec }),

  // ─── Chat History ──────────────────────────────────
  chatMessages: [],
  addChatMessage: (msg) => set((state) => ({
    chatMessages: [...state.chatMessages, msg]
  })),
  clearChat: () => set({ chatMessages: [] }),

  // ─── Global Loading ────────────────────────────────
  loading: {},
  setLoading: (key, val) => set((state) => ({
    loading: { ...state.loading, [key]: val }
  })),
}))

export default useAgriStore
