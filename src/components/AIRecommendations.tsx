import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bike, MapPin, Battery, Star, Sparkles, Zap, TrendingUp, Clock, Heart } from 'lucide-react';
import { aiAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface Recommendation {
  cycle: {
    _id: string;
    code: string;
    model: string;
    batteryLevel?: number;
    location: {
      coordinates: [number, number];
    };
    station?: {
      _id: string;
      name: string;
    };
  };
  score: number;
  distance: number;
  reasons: string[];
}

export const AIRecommendations: React.FC = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number]>([28.6667, 77.2167]); // Default to Delhi
  const [userPreferences, setUserPreferences] = useState({
    favoriteStations: [] as string[],
    maxDistance: 2, // km
    minBatteryLevel: 30, // percentage
    preferredModels: [] as string[]
  });

  // Initialize user preferences from user context
  useEffect(() => {
    if (user && user.preferences) {
      setUserPreferences({
        favoriteStations: user.preferences.favoriteStations || [],
        maxDistance: 2, // Default value
        minBatteryLevel: 30, // Default value
        preferredModels: [] // Could be extended based on user history
      });
    }
  }, [user]);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setIsLoading(true);
      
      // Get user's current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation([latitude, longitude]);
            await fetchRecommendations(latitude, longitude);
          },
          (error) => {
            console.warn('Could not get location:', error);
            fetchRecommendations(userLocation[0], userLocation[1]);
          }
        );
      } else {
        await fetchRecommendations(userLocation[0], userLocation[1]);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
      toast.error('Failed to load AI recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecommendations = async (lat: number, lng: number) => {
    try {
      // Use user preferences if available, otherwise use defaults
      const minBatteryLevel = userPreferences.minBatteryLevel || 30;
      const maxDistance = userPreferences.maxDistance || 2;
      
      const response = await aiAPI.getRecommendations({
        latitude: lat,
        longitude: lng,
        preferences: {
          batteryLevel: minBatteryLevel,
          maxDistance: maxDistance
        }
      });
      
      // Filter recommendations to show only top 3
      const topRecommendations = response.data.recommendations.slice(0, 3);
      setRecommendations(topRecommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast.error('Failed to get AI recommendations');
      
      // Show fallback recommendations if API fails
      // Personalize fallback recommendations based on user preferences
      const favoriteStation = userPreferences.favoriteStations.length > 0 
        ? userPreferences.favoriteStations[0] 
        : 'Main Campus Station';
      
      setRecommendations([
        {
          cycle: {
            _id: 'fallback-1',
            code: 'CYC 001',
            model: 'Model X-200',
            batteryLevel: 85,
            location: {
              coordinates: [lat, lng]
            },
            station: {
              _id: 'station-1',
              name: favoriteStation
            }
          },
          score: 92,
          distance: 1200,
          reasons: ['High battery', 'Close to you', `Preferred station: ${favoriteStation}`]
        },
        {
          cycle: {
            _id: 'fallback-2',
            code: 'CYC 002',
            model: 'Model Y-150',
            batteryLevel: 72,
            location: {
              coordinates: [lat + 0.001, lng + 0.001]
            },
            station: {
              _id: 'station-2',
              name: 'Library Station'
            }
          },
          score: 85,
          distance: 850,
          reasons: ['Good battery', 'Popular model', 'Nearby station']
        },
        {
          cycle: {
            _id: 'fallback-3',
            code: 'CYC 003',
            model: 'Model Z-300',
            batteryLevel: 95,
            location: {
              coordinates: [lat - 0.001, lng - 0.001]
            },
            station: {
              _id: 'station-3',
              name: 'Canteen Station'
            }
          },
          score: 95,
          distance: 2100,
          reasons: ['Excellent battery', 'Premium model', 'Low usage']
        }
      ]);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-400 to-emerald-500';
    if (score >= 60) return 'from-yellow-400 to-orange-500';
    return 'from-red-400 to-pink-500';
  };

  const getScoreText = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Fair';
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-6 border border-purple-200 dark:border-gray-700 shadow-lg">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">AI Recommendations</h3>
            <p className="text-sm text-slate-600 dark:text-indigo-200">Finding the best cycles for you...</p>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-gray-700 dark:to-gray-800 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-6 border border-purple-200 dark:border-gray-700 shadow-lg">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">AI Recommendations</h3>
            <p className="text-sm text-slate-600 dark:text-indigo-200">No recommendations available</p>
          </div>
        </div>
        <div className="text-center py-8">
          <Bike className="h-12 w-12 text-purple-300 dark:text-purple-400 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-gray-300">No cycles available nearby</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-6 border border-purple-200 dark:border-gray-700 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">AI Recommendations</h3>
            <p className="text-sm text-slate-600 dark:text-indigo-200">Smart suggestions based on your location</p>
          </div>
        </div>
        <button
          onClick={loadRecommendations}
          className="p-2 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-gray-700 dark:to-gray-800 text-purple-600 dark:text-purple-300 rounded-lg hover:from-purple-200 hover:to-indigo-200 dark:hover:from-gray-600 dark:hover:to-gray-700 transition-all duration-200"
        >
          <Zap className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <div
            key={rec.cycle._id}
            className="bg-white rounded-2xl p-4 shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Bike className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white">{rec.cycle.code}</h4>
                  <p className="text-sm text-slate-600 dark:text-gray-300">{rec.cycle.model}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-gradient-to-r ${getScoreColor(rec.score)} text-white text-xs font-medium`}>
                  <Star className="h-3 w-3" />
                  <span>{rec.score}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-gray-300 mt-1">{getScoreText(rec.score)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-gray-400">Distance</p>
                  <p className="text-sm font-medium text-slate-800 dark:text-white">{rec.distance}m</p>
                </div>
              </div>
              
              {rec.cycle.batteryLevel && (
                <div className="flex items-center space-x-2">
                  <Battery className="h-4 w-4 text-emerald-500" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-gray-400">Battery</p>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{rec.cycle.batteryLevel}%</p>
                  </div>
                </div>
              )}
            </div>

            {rec.cycle.station && (
              <div className="flex items-center space-x-2 mb-3">
                <MapPin className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                <p className="text-sm text-slate-600 dark:text-gray-300">{rec.cycle.station.name}</p>
              </div>
            )}

            <div className="mb-4">
              <p className="text-xs font-medium text-slate-600 dark:text-gray-300 mb-2">Why this cycle?</p>
              <div className="flex flex-wrap gap-2">
                {rec.reasons.map((reason, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-gray-700 dark:to-gray-800 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full border border-purple-200 dark:border-gray-600"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex space-x-2">
              <Link
                to={`/user/book/${rec.cycle._id}`}
                className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-center py-2 px-4 rounded-xl text-sm font-medium hover:from-purple-600 hover:to-indigo-600 dark:hover:from-purple-600 dark:hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Book Now
              </Link>
              <button className="p-2 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-gray-700 dark:to-gray-800 text-purple-600 dark:text-purple-300 rounded-xl hover:from-purple-200 hover:to-indigo-200 dark:hover:from-gray-600 dark:hover:to-gray-700 transition-all duration-200">
                <Heart className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-purple-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-gray-300">
          <span>Recommendations updated</span>
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>Just now</span>
          </div>
        </div>
      </div>
    </div>
  );
};
