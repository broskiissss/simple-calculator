// OpenWeatherMap API key - Get a free key from https://openweathermap.org/api
const API_KEY = 'YOUR_API_KEY_HERE'; // Replace with your actual API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const errorMessage = document.getElementById('errorMessage');
const currentWeatherSection = document.getElementById('currentWeather');
const forecastSection = document.getElementById('forecastSection');
const favoritesSection = document.getElementById('favoritesSection');
const addFavoriteBtn = document.getElementById('addFavoriteBtn');

// Local storage for favorites
const STORAGE_KEY = 'weatherFavorites';

// Current city data
let currentCityData = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadFavorites();
    // Load default city
    searchWeather('London');
});

// Event listeners
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});
addFavoriteBtn.addEventListener('click', addCurrentCityToFavorites);

function handleSearch() {
    const city = searchInput.value.trim();
    if (city) {
        searchWeather(city);
        searchInput.value = '';
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 5000);
}

async function searchWeather(city) {
    try {
        if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
            showError('⚠️ Please set your OpenWeatherMap API key in script.js');
            return;
        }

        // Get current weather
        const weatherResponse = await fetch(
            `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`
        );

        if (!weatherResponse.ok) {
            throw new Error('City not found');
        }

        const weatherData = await weatherResponse.json();
        currentCityData = weatherData;

        // Get 5-day forecast
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric`
        );
        const forecastData = await forecastResponse.json();

        displayCurrentWeather(weatherData);
        displayForecast(forecastData);
    } catch (error) {
        showError(`Error: ${error.message}`);
    }
}

function displayCurrentWeather(data) {
    const { name, sys, main, weather, wind, clouds, visibility, dt } = data;

    // Update header
    document.getElementById('cityName').textContent = `${name}, ${sys.country}`;
    document.getElementById('weatherDate').textContent = new Date(dt * 1000).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Update weather icon
    const iconUrl = `https://openweathermap.org/img/wn/${weather[0].icon}@4x.png`;
    document.getElementById('weatherIcon').src = iconUrl;

    // Update temperature
    document.getElementById('temperature').textContent = Math.round(main.temp);
    document.getElementById('description').textContent = weather[0].main;
    document.getElementById('feelsLike').textContent = `Feels like ${Math.round(main.feels_like)}°C`;

    // Update details
    document.getElementById('humidity').textContent = `${main.humidity}%`;
    document.getElementById('windSpeed').textContent = `${wind.speed.toFixed(1)} m/s`;
    document.getElementById('pressure').textContent = `${main.pressure} hPa`;
    document.getElementById('visibility').textContent = `${(visibility / 1000).toFixed(1)} km`;
}

function displayForecast(data) {
    const forecastContainer = document.getElementById('forecast');
    forecastContainer.innerHTML = '';

    // Group forecast by day (get one forecast per day at 12:00)
    const dailyForecasts = {};

    data.list.forEach((forecast) => {
        const date = new Date(forecast.dt * 1000).toLocaleDateString();
        const hour = new Date(forecast.dt * 1000).getHours();

        // Get forecast closest to noon
        if (!dailyForecasts[date] || Math.abs(hour - 12) < Math.abs(new Date(dailyForecasts[date].dt * 1000).getHours() - 12)) {
            dailyForecasts[date] = forecast;
        }
    });

    // Display up to 5 days
    Object.values(dailyForecasts).slice(0, 5).forEach((forecast) => {
        const card = createForecastCard(forecast);
        forecastContainer.appendChild(card);
    });
}

function createForecastCard(forecast) {
    const { dt, main, weather, wind } = forecast;
    const date = new Date(dt * 1000);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const iconUrl = `https://openweathermap.org/img/wn/${weather[0].icon}@2x.png`;

    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.innerHTML = `
        <div class="forecast-date">${dateStr}</div>
        <img src="${iconUrl}" alt="Weather icon" class="forecast-icon">
        <div class="forecast-description">${weather[0].main}</div>
        <div class="forecast-temp">
            <span class="forecast-temp-max">${Math.round(main.temp_max)}°</span>
            <span class="forecast-temp-min">${Math.round(main.temp_min)}°</span>
        </div>
        <div class="forecast-details">
            <span>💧 ${main.humidity}%</span>
            <span>💨 ${wind.speed.toFixed(1)}</span>
        </div>
    `;

    return card;
}

function addCurrentCityToFavorites() {
    if (!currentCityData) {
        showError('Please search for a city first');
        return;
    }

    const favorites = getFavorites();
    const cityKey = `${currentCityData.name}-${currentCityData.sys.country}`;

    if (favorites.some(fav => fav.key === cityKey)) {
        showError('This city is already in favorites');
        return;
    }

    favorites.push({
        key: cityKey,
        name: currentCityData.name,
        country: currentCityData.sys.country,
        lat: currentCityData.coord.lat,
        lon: currentCityData.coord.lon
    });

    saveFavorites(favorites);
    loadFavorites();
}

function getFavorites() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

function saveFavorites(favorites) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
}

async function loadFavorites() {
    const favorites = getFavorites();
    const container = document.getElementById('favorites');
    container.innerHTML = '';

    if (favorites.length === 0) {
        container.innerHTML = '<div class="empty-message">No favorite cities yet. Add one to get started!</div>';
        return;
    }

    for (const favorite of favorites) {
        try {
            const response = await fetch(
                `${BASE_URL}/weather?lat=${favorite.lat}&lon=${favorite.lon}&appid=${API_KEY}&units=metric`
            );
            const data = await response.json();

            const card = document.createElement('div');
            card.className = 'favorite-card';
            const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

            card.innerHTML = `
                <button class="remove-favorite" onclick="removeFavorite('${favorite.key}')">✕</button>
                <div class="favorite-name">${favorite.name}, ${favorite.country}</div>
                <img src="${iconUrl}" alt="Weather icon" style="width: 50px; height: 50px; margin: 10px auto;">
                <div class="favorite-temp">${Math.round(data.main.temp)}°C</div>
                <div class="favorite-description">${data.weather[0].main}</div>
            `;

            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('remove-favorite')) {
                    searchWeather(favorite.name);
                }
            });

            container.appendChild(card);
        } catch (error) {
            console.error(`Error loading favorite ${favorite.name}:`, error);
        }
    }
}

function removeFavorite(key) {
    const favorites = getFavorites().filter(fav => fav.key !== key);
    saveFavorites(favorites);
    loadFavorites();
    showError('City removed from favorites');
}