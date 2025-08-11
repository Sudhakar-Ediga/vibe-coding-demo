# Daily Boost

A small, colorful, mobile-friendly web app that gives you a daily boost: tasks, weather, and motivational quotes.

## Features
- Tasks: add, complete, delete (saved in your browser with localStorage)
- Weather: current temperature and conditions (OpenWeatherMap)
- Quotes: daily motivation (ZenQuotes with Quotable fallback)

## Setup
1. Open `app.js` and replace the placeholder:
   ```js
   const OPENWEATHER_API_KEY = 'YOUR_OPENWEATHER_API_KEY';
   ```
   with your real API key from OpenWeatherMap.

2. Open `index.html` in a browser. No server required.

## Notes
- Weather requires an API key and a city name. Your last city is saved locally.
- If ZenQuotes is unavailable due to CORS or rate limits, the app falls back to the Quotable API.
- The UI is responsive and optimized for mobile.
