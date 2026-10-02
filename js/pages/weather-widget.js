// ===== HAVA DURUMU WIDGET'I =====
const DEFAULT_LAT = 39.93;
const DEFAULT_LON = 32.86;

const WEATHER_CODES = {
  0: { desc: 'Açık', icon: '☀️' }, 1: { desc: 'Az Bulutlu', icon: '🌤️' }, 2: { desc: 'Parçalı Bulutlu', icon: '⛅' },
  3: { desc: 'Bulutlu', icon: '☁️' }, 45: { desc: 'Sisli', icon: '🌫️' }, 48: { desc: 'Kırağılı Sis', icon: '🌫️' },
  51: { desc: 'Hafif Çiseleme', icon: '🌦️' }, 53: { desc: 'Çiseleme', icon: '🌦️' }, 55: { desc: 'Yoğun Çiseleme', icon: '🌧️' },
  61: { desc: 'Hafif Yağmur', icon: '🌧️' }, 63: { desc: 'Yağmur', icon: '🌧️' }, 65: { desc: 'Şiddetli Yağmur', icon: '🌧️' },
  71: { desc: 'Hafif Kar', icon: '🌨️' }, 73: { desc: 'Kar', icon: '🌨️' }, 75: { desc: 'Yoğun Kar', icon: '❄️' },
  80: { desc: 'Hafif Sağanak', icon: '🌦️' }, 81: { desc: 'Sağanak', icon: '⛈️' }, 82: { desc: 'Şiddetli Sağanak', icon: '⛈️' },
  95: { desc: 'Gök Gürültülü Fırtına', icon: '⛈️' }, 96: { desc: 'Dolu Fırtınası', icon: '⛈️' }, 99: { desc: 'Şiddetli Dolu', icon: '⛈️' },
};

let weatherCache = null;
let weatherCacheTime = 0;

export async function fetchWeather(lat, lon) {
  const now = Date.now();
  if (weatherCache && now - weatherCacheTime < 30 * 60 * 1000) return weatherCache;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat||DEFAULT_LAT}&longitude=${lon||DEFAULT_LON}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe/Istanbul&forecast_days=5`;
    const res = await fetch(url);
    const data = await res.json();
    weatherCache = data;
    weatherCacheTime = now;
    return data;
  } catch { return null; }
}

export function weatherWidgetHTML(data) {
  if (!data || !data.current) return '';
  const c = data.current;
  const wc = WEATHER_CODES[c.weather_code] || { desc: 'Bilinmiyor', icon: '🌡️' };
  return `
    <div class="rounded-xl bg-gradient-to-br from-sky-500/10 to-blue-600/5 border border-sky-500/20 p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-sky-300">🌤️ Hava Durumu</p>
          <p class="text-3xl font-bold text-white">${Math.round(c.temperature_2m)}°C</p>
          <p class="text-sm text-slate-300">${wc.icon} ${wc.desc}</p>
        </div>
        <div class="text-right text-xs text-slate-400 space-y-1">
          <p>💧 Nem: ${c.relative_humidity_2m}%</p>
          <p>💨 Rüzgar: ${c.wind_speed_10m} km/h</p>
        </div>
      </div>
      ${data.daily ? `
        <div class="flex gap-2 mt-3 pt-3 border-t border-white/5">
          ${data.daily.time.slice(1, 5).map((d, i) => {
            const dayWC = WEATHER_CODES[data.daily.weather_code[i+1]] || { icon: '🌡️' };
            const dayName = new Date(d + 'T12:00:00').toLocaleDateString('tr-TR', { weekday: 'short' });
            return `<div class="flex-1 text-center">
              <p class="text-[10px] text-slate-500">${dayName}</p>
              <p class="text-lg">${dayWC.icon}</p>
              <p class="text-xs text-white font-medium">${Math.round(data.daily.temperature_2m_max[i+1])}°</p>
              <p class="text-[10px] text-slate-500">${Math.round(data.daily.temperature_2m_min[i+1])}°</p>
            </div>`;
          }).join('')}
        </div>` : ''}
      ${c.temperature_2m >= 30 ? '<p class="text-xs text-amber-400 mt-2">⚠️ Sıcaklık yüksek, su tüketimine dikkat edin!</p>' :
        c.temperature_2m <= 0 ? '<p class="text-xs text-blue-400 mt-2">❄️ Don riski, buzlanma uyarısı!</p>' : ''}
    </div>`;
}

export async function renderWeatherDashboard(container) {
  if (!container) return;
  container.innerHTML = '<div class="rounded-xl bg-white/5 p-4 skeleton-bar" style="height:120px"></div>';
  const data = await fetchWeather();
  container.innerHTML = weatherWidgetHTML(data);
}
