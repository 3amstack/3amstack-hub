import { useState, useEffect, useRef } from 'react';
import { Radio, Play, Pause, Volume2, VolumeX, Search, Globe, Heart } from 'lucide-react';

export default function WorldRadioPlayer() {
  const [stations, setStations] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [currentStation, setCurrentStation] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [filterCountry, setFilterCountry] = useState('');
  const [countries, setCountries] = useState([]);
  
  const audioRef = useRef(null);

  useEffect(() => {
    fetchPopularStations();
    fetchCountries();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    filterStations();
  }, [searchTerm, filterCountry, stations]);

  const fetchPopularStations = async () => {
    try {
      const response = await fetch('/api/radio?endpoint=/json/stations/topvote/100');
      const data = await response.json();

      // ✅ filter only stations with valid https URLs
      const validStations = data.filter(
        s =>
          s.url_resolved?.startsWith('https://') &&
          !s.url_resolved.endsWith('.m3u') &&
          !s.url_resolved.endsWith('.pls')
      );

      setStations(validStations);
      setFilteredStations(validStations);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stations:', error);
      setLoading(false);
    }
  };

  const fetchCountries = async () => {
    try {
      const response = await fetch('/api/radio?endpoint=/json/stations/topvote/100');
      const data = await response.json();
      const sortedCountries = data
        .filter(c => c.stationcount > 0)
        .sort((a, b) => b.stationcount - a.stationcount)
        .slice(0, 50);
      setCountries(sortedCountries);
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  const filterStations = () => {
    let filtered = stations;

    if (searchTerm) {
      filtered = filtered.filter(station =>
        station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (station.tags && station.tags.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterCountry) {
      filtered = filtered.filter(station =>
        station.country.toLowerCase() === filterCountry.toLowerCase()
      );
    }

    setFilteredStations(filtered);
  };

  const playStation = (station) => {
    if (currentStation?.stationuuid === station.stationuuid && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setCurrentStation(station);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current.load();

        const streamUrl = station.url_resolved || station.url;
        audioRef.current.src = streamUrl;

        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.error("Playback failed:", err);
            alert("This station's stream is unavailable or blocked.");
            setIsPlaying(false);
          });
      }
      
      fetch(`/api/radio?endpoint=/json/url/${station.stationuuid}`);
    }
  };

  const toggleFavorite = (station) => {
    setFavorites(prev => {
      const isFav = prev.some(fav => fav.stationuuid === station.stationuuid);
      if (isFav) {
        return prev.filter(fav => fav.stationuuid !== station.stationuuid);
      } else {
        return [...prev, station];
      }
    });
  };

  const isFavorite = (station) => {
    return favorites.some(fav => fav.stationuuid === station.stationuuid);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Radio className="w-12 h-12 text-purple-300" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              World Radio
            </h1>
          </div>
          <p className="text-purple-200 text-lg">Listen to thousands of stations worldwide</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 shadow-2xl">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 w-5 h-5" />
              <input
                type="text"
                placeholder="Search stations, countries, or genres..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/20 rounded-xl border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400 text-white placeholder-gray-300"
              />
            </div>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 w-5 h-5" />
              <select
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
                className="pl-10 pr-8 py-3 bg-white/20 rounded-xl border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400 text-white appearance-none cursor-pointer min-w-[200px]"
              >
                <option value="" className="bg-purple-900">All Countries</option>
                {countries.map(country => (
                  <option key={country.name} value={country.name} className="bg-purple-900">
                    {country.name} ({country.stationcount})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Current Playing */}
        {currentStation && (
          <div className="bg-gradient-to-r from-purple-500/30 to-pink-500/30 backdrop-blur-lg rounded-2xl p-6 mb-6 shadow-2xl border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                  {currentStation.favicon ? (
                    <img src={currentStation.favicon} alt="" className="w-12 h-12 rounded-lg" />
                  ) : (
                    <Radio className="w-8 h-8 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-1">{currentStation.name}</h3>
                  <p className="text-purple-200">{currentStation.country} • {currentStation.tags}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-3 hover:bg-white/20 rounded-xl transition"
                >
                  {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-24"
                />
              </div>
            </div>
          </div>
        )}

        {/* Stations Grid */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-purple-200">Loading stations...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2">
              {filteredStations.map((station) => (
                <div
                  key={station.stationuuid}
                  className="bg-white/10 rounded-xl p-4 hover:bg-white/20 transition cursor-pointer border border-white/10"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      {station.favicon ? (
                        <img src={station.favicon} alt="" className="w-10 h-10 rounded-lg" />
                      ) : (
                        <Radio className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold mb-1 truncate">{station.name}</h4>
                      <p className="text-sm text-purple-200 mb-2 truncate">
                        {station.country}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => playStation(station)}
                          className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 rounded-lg text-sm font-medium transition flex items-center gap-1"
                        >
                          {currentStation?.stationuuid === station.stationuuid && isPlaying ? (
                            <><Pause className="w-4 h-4" /> Pause</>
                          ) : (
                            <><Play className="w-4 h-4" /> Play</>
                          )}
                        </button>
                        <button
                          onClick={() => toggleFavorite(station)}
                          className={`p-1.5 rounded-lg transition ${
                            isFavorite(station)
                              ? 'bg-pink-500 hover:bg-pink-600'
                              : 'bg-white/20 hover:bg-white/30'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isFavorite(station) ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audio Element */}
        <audio
          ref={audioRef}
          onError={() => {
            console.error('Error playing station');
            setIsPlaying(false);
          }}
        />
      </div>
    </div>
  );
}