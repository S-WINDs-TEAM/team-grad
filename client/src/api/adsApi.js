import axiosInstance from "./axiosInstance";

// params: { lat, lng, condition?, fatigue?, radiusKm? }
const getAdsRecommendationsApi= (params)=> axiosInstance.get('/ads/recommendations', {params});

export {getAdsRecommendationsApi}