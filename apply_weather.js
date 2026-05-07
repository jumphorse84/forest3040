const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf-8');
const keyframes = `

/* Weather Animations */
@keyframes pulse-slow {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}
@keyframes pan-clouds {
  0% { transform: translateX(0) scale(1.2); }
  50% { transform: translateX(-5%) scale(1.25); }
  100% { transform: translateX(0) scale(1.2); }
}
@keyframes rain-fall {
  0% { transform: translateY(-20px) rotate(15deg); opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { transform: translateY(200px) rotate(15deg); opacity: 0; }
}
@keyframes snow-fall {
  0% { transform: translateY(-10px) translateX(0); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: translateY(200px) translateX(20px); opacity: 0; }
}
.animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
.animate-pan-clouds { animation: pan-clouds 20s ease-in-out infinite; }
`;

if (!css.includes('Weather Animations')) {
  fs.writeFileSync('src/index.css', css + keyframes);
}

const componentCode = `
const WeatherBackground = ({ weatherType }: { weatherType: string | null }) => {
  if (!weatherType) return <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {weatherType === 'clear' && (
        <div className="absolute -top-10 -right-10 w-[200px] h-[200px] bg-amber-300/30 rounded-full blur-[60px] animate-pulse-slow"></div>
      )}
      {weatherType === 'cloudy' && (
        <>
          <div className="absolute -top-10 -left-10 w-[200px] h-[200px] bg-white/10 rounded-full blur-[60px] animate-pan-clouds"></div>
          <div className="absolute top-10 -right-10 w-[250px] h-[250px] bg-white/5 rounded-full blur-[70px] animate-pan-clouds" style={{ animationDelay: '2s' }}></div>
        </>
      )}
      {weatherType === 'rain' && (
        <>
          <div className="absolute inset-0 bg-slate-900/10 mix-blend-multiply"></div>
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={\`rain-\${i}\`} className="absolute bg-blue-100/40 w-[1.5px] h-[25px] rounded-full" 
                 style={{
                   left: \`\${Math.random() * 100}%\`,
                   top: \`-\${Math.random() * 30 + 30}px\`,
                   animation: \`rain-fall \${Math.random() * 0.4 + 0.6}s linear infinite\`,
                   animationDelay: \`\${Math.random() * 2}s\`
                 }}
            />
          ))}
        </>
      )}
      {weatherType === 'snow' && (
        <>
          <div className="absolute inset-0 bg-slate-100/5"></div>
          {Array.from({ length: 25 }).map((_, i) => (
            <div key={\`snow-\${i}\`} className="absolute bg-white/80 rounded-full blur-[1px]" 
                 style={{
                   width: \`\${Math.random() * 4 + 2}px\`,
                   height: \`\${Math.random() * 4 + 2}px\`,
                   left: \`\${Math.random() * 100}%\`,
                   top: \`-10px\`,
                   animation: \`snow-fall \${Math.random() * 3 + 2}s linear infinite\`,
                   animationDelay: \`\${Math.random() * 3}s\`
                 }}
            />
          ))}
        </>
      )}
    </div>
  );
};
`;

let home = fs.readFileSync('src/views/HomeView.tsx', 'utf-8');

// Insert WeatherBackground Component
if (!home.includes('WeatherBackground')) {
  home = home.replace('const HomeView =', componentCode + '\nconst HomeView =');
}

// Ensure weather state
if (!home.includes('const [weatherType, setWeatherType]')) {
  home = home.replace('const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);', 
    'const [weatherType, setWeatherType] = useState<string | null>(null);\n  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);');
}

// Add weather fetch hook
const weatherHook = `
  useEffect(() => {
    const cachedWeather = sessionStorage.getItem('weatherType');
    if (cachedWeather) {
      setWeatherType(cachedWeather);
      return;
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(\`https://api.open-meteo.com/v1/forecast?latitude=\${latitude}&longitude=\${longitude}&current_weather=true\`);
            const data = await res.json();
            if (data?.current_weather?.weathercode !== undefined) {
              const code = data.current_weather.weathercode;
              let type = 'clear';
              if (code === 2 || code === 3) type = 'cloudy';
              else if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code)) type = 'rain';
              else if ([71, 73, 75, 77, 85, 86].includes(code)) type = 'snow';
              
              setWeatherType(type);
              sessionStorage.setItem('weatherType', type);
            }
          } catch (e) {
            console.error("Weather fetch error", e);
          }
        },
        () => { setWeatherType('clear'); },
        { timeout: 10000, maximumAge: 600000 }
      );
    }
  }, []);
`;

if (!home.includes('https://api.open-meteo.com')) {
  home = home.replace('const getDynamicGreeting = () => {', weatherHook + '\n  const getDynamicGreeting = () => {');
}

// Replace the Hero Card Background
const heroOriginal = \`<section className="relative overflow-hidden squircle p-8 bg-gradient-to-br from-[#0F6045] to-[#1a7858] text-white shadow-[0_15px_40px_rgba(15,96,69,0.2)] group">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>\`;

const heroDynamicWrapper = \`<section className={\`relative overflow-hidden squircle p-8 text-white shadow-[0_15px_40px_rgba(15,96,69,0.2)] group transition-colors duration-1000 \${
        weatherType === 'cloudy' ? 'bg-gradient-to-br from-[#4b5b56] to-[#2c3d36]' :
        weatherType === 'rain' ? 'bg-gradient-to-br from-[#2a3e4c] to-[#14232c]' :
        weatherType === 'snow' ? 'bg-gradient-to-br from-[#6b8c8f] to-[#456366]' :
        'bg-gradient-to-br from-[#0F6045] to-[#1a7858]'
      }\`}>
        <WeatherBackground weatherType={weatherType} />\`;

if (home.includes(heroOriginal)) {
  home = home.replace(heroOriginal, heroDynamicWrapper);
}

// Ensure the Greeting and verse texts have glassmorphism for readability
const bibleVerseBox = \`<div className="mb-8 border-l-2 border-white/30 pl-4">
            <p className="text-[14px] font-medium leading-relaxed text-white/90 break-keep">
              {todaysVerse}
            </p>
          </div>\`;

const bibleVerseGlass = \`<div className="mb-8 border-l-[3px] border-white/60 pl-4 py-2 pr-2 bg-black/5 backdrop-blur-md rounded-r-xl shadow-sm">
            <p className="text-[14px] font-medium leading-relaxed text-white break-keep drop-shadow-md">
              {todaysVerse}
            </p>
          </div>\`;

if (home.includes(bibleVerseBox)) {
  home = home.replace(bibleVerseBox, bibleVerseGlass);
}

// Make username greeting glassed 
const greetingOriginal = \`<div className="mb-6">
            <h2 className="text-[22px] font-extrabold font-headline mb-1 tracking-tight">
              {user.name} <span className="opacity-80 text-lg font-medium">님,</span>
            </h2>
            <p className="text-[13px] font-medium opacity-90 leading-tight">
              {getDynamicGreeting()}
            </p>
          </div>\`;

const greetingGlass = \`<div className="mb-6 block bg-black/5 backdrop-blur-md rounded-2xl py-3 px-4 shadow-sm border border-white/10 relative overflow-hidden -mx-2">
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
            <h2 className="relative text-[22px] font-extrabold font-headline mb-1 tracking-tight drop-shadow-sm">
              {user.name} <span className="opacity-90 text-lg font-medium">님,</span>
            </h2>
            <p className="relative text-[13px] font-bold opacity-100 leading-tight drop-shadow-sm">
              {getDynamicGreeting()}
            </p>
          </div>\`;

if (home.includes(greetingOriginal)) {
  home = home.replace(greetingOriginal, greetingGlass);
}

fs.writeFileSync('src/views/HomeView.tsx', home);
console.log('Successfully added weather animation wrapper!');
