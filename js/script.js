// DOM Elements
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle.querySelector('i');
const body = document.body;
const currentYear = document.getElementById('current-year');
const visitorGreeting = document.getElementById('visitor-greeting');
const weatherData = document.getElementById('weather-data');
const projectsContainer = document.getElementById('projects-container');
const filterButtons = document.querySelectorAll('.filter-btn');
const contactForm = document.getElementById('contact-form');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const messageInput = document.getElementById('message');

// State
const state = {
    theme: localStorage.getItem('theme') || 'light',
    visitorName: localStorage.getItem('visitorName') || '',
    projects: [],
    filteredProjects: [],
    activeFilter: 'all',
    visitStartTime: new Date().getTime(),
    visitDuration: 0
};

// Initialize the application
function init() {
    setTheme(state.theme);
    updateVisitorGreeting();
    setCurrentYear();
    setupEventListeners();
    fetchWeather();
    fetchGitHubProjects();
    startVisitTimer();
}

// Set up event listeners
function setupEventListeners() {
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', () => filterProjects(button.dataset.filter));
    });
    
    // Contact form submission
    contactForm.addEventListener('submit', handleFormSubmit);
    
    // Input validation
    nameInput.addEventListener('blur', () => validateInput(nameInput, 'name'));
    emailInput.addEventListener('blur', () => validateEmail(emailInput));
    messageInput.addEventListener('blur', () => validateInput(messageInput, 'message'));
    
    // Save visitor's name if provided in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('name');
    if (name && !state.visitorName) {
        state.visitorName = name;
        localStorage.setItem('visitorName', name);
        updateVisitorGreeting();
    }
}

// Theme functionality
function setTheme(theme) {
    state.theme = theme;
    body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Update icon
    if (theme === 'dark') {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    } else {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    }
}

function toggleTheme() {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

// Visitor greeting
function updateVisitorGreeting() {
    if (state.visitorName) {
        visitorGreeting.textContent = `Hello, ${state.visitorName}! I'm a web developer passionate about creating amazing experiences.`;
    }
}

// Set current year in footer
function setCurrentYear() {
    currentYear.textContent = new Date().getFullYear();
}

// Visit timer
function startVisitTimer() {
    setInterval(() => {
        const now = new Date().getTime();
        state.visitDuration = Math.floor((now - state.visitStartTime) / 1000);
        // Update UI with visit duration if needed
    }, 1000);
}

// Weather API integration using Open-Meteo (no API key required)
async function fetchWeather() {
    // Dammam's coordinates
    const latitude = 26.4207;
    const longitude = 50.0888;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=celsius&windspeed_unit=ms&timezone=auto`;
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        updateWeatherUI(data);
    } catch (error) {
        console.error('Error fetching weather:', error);
        // Fallback weather data in case of API failure
        const fallbackData = {
            current_weather: {
                temperature: '--',
                weathercode: 0,
                windspeed: '--',
                time: new Date().toISOString()
            }
        };
        updateWeatherUI(fallbackData);
    }
}

function updateWeatherUI(data) {
    // Weather code to description mapping (WMO Weather interpretation codes)
    const weatherDescriptions = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        56: 'Light freezing drizzle',
        57: 'Dense freezing drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        66: 'Light freezing rain',
        67: 'Heavy freezing rain',
        71: 'Slight snow fall',
        73: 'Moderate snow fall',
        75: 'Heavy snow fall',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        85: 'Slight snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with slight hail',
        99: 'Thunderstorm with heavy hail'
    };

    const weatherCode = data.current_weather?.weathercode || 0;
    const description = weatherDescriptions[weatherCode] || 'Weather data unavailable';
    const time = data.current_weather?.time ? new Date(data.current_weather.time).toLocaleTimeString() : new Date().toLocaleTimeString();
    
    weatherData.innerHTML = `
        <div class="weather-card">
            <h3>Weather in Dammam</h3>
            <div class="weather-main">
                <span class="temperature">${data.current_weather?.temperature || '--'}°C</span>
                <span class="description">${description}</span>
            </div>
            <div class="weather-details">
                <div><i class="fas fa-wind"></i> Wind: ${data.current_weather?.windspeed || '--'} m/s</div>
                <div><i class="far fa-clock"></i> Updated: ${time}</div>
            </div>
            ${!data.current_weather?.temperature ? '<p class="weather-note">Using fallback weather data</p>' : ''}
        </div>
    `;
}

// GitHub API integration
async function fetchGitHubProjects() {
    const username = 'shaheer821'; // Replace with your GitHub username
    const url = `https://api.github.com/users/${username}/repos?sort=updated&per_page=6`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch projects');
        
        const data = await response.json();
        state.projects = data.map(repo => ({
            id: repo.id,
            name: repo.name,
            description: repo.description || 'No description provided',
            html_url: repo.html_url,
            homepage: repo.homepage,
            language: repo.language || 'Other',
            created_at: new Date(repo.created_at).toLocaleDateString(),
            updated_at: new Date(repo.updated_at).toLocaleDateString(),
            topics: repo.topics || [],
            category: repo.topics && repo.topics.length > 0 ? repo.topics[0] : 'web'
        }));
        
        state.filteredProjects = [...state.projects];
        renderProjects();
    } catch (error) {
        console.error('Error fetching GitHub projects:', error);
        projectsContainer.innerHTML = '<p class="error">Unable to load projects. Please try again later.</p>';
    }
}

// Project filtering
function filterProjects(category) {
    state.activeFilter = category;
    
    // Update active button
    filterButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === category);
    });
    
    // Filter projects
    if (category === 'all') {
        state.filteredProjects = [...state.projects];
    } else {
        state.filteredProjects = state.projects.filter(
            project => project.category === category
        );
    }
    
    renderProjects();
}

// Render projects to the DOM
function renderProjects() {
    if (state.filteredProjects.length === 0) {
        projectsContainer.innerHTML = '<p class="no-projects">No projects found in this category.</p>';
        return;
    }
    
    projectsContainer.innerHTML = state.filteredProjects.map(project => `
        <div class="project-card fade-in">
            <div class="project-info">
                <h3>${project.name}</h3>
                <p>${project.description}</p>
                <div class="project-meta">
                    <span class="language">${project.language}</span>
                    <span class="date">Updated: ${project.updated_at}</span>
                </div>
                <div class="project-links">
                    <a href="${project.html_url}" target="_blank" class="btn">
                        <i class="fab fa-github"></i> Code
                    </a>
                    ${project.homepage ? `
                        <a href="${project.homepage}" target="_blank" class="btn btn-outline">
                            <i class="fas fa-external-link-alt"></i> Live Demo
                        </a>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// Form validation and submission
function validateInput(input, field) {
    const errorElement = document.getElementById(`${field}-error`);
    
    if (!input.value.trim()) {
        showError(errorElement, `${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
        return false;
    }
    
    hideError(errorElement);
    return true;
}

function validateEmail(input) {
    const errorElement = document.getElementById('email-error');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!input.value.trim()) {
        showError(errorElement, 'Email is required');
        return false;
    }
    
    if (!emailRegex.test(input.value)) {
        showError(errorElement, 'Please enter a valid email address');
        return false;
    }
    
    hideError(errorElement);
    return true;
}

function showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
}

function hideError(element) {
    element.style.display = 'none';
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Validate all fields
    const isNameValid = validateInput(nameInput, 'name');
    const isEmailValid = validateEmail(emailInput);
    const isMessageValid = validateInput(messageInput, 'message');
    
    if (isNameValid && isEmailValid && isMessageValid) {
        // Simulate form submission
        const formData = {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            message: messageInput.value.trim(),
            timestamp: new Date().toISOString()
        };
        
        // In a real app, you would send this to a server
        console.log('Form submitted:', formData);
        
        // Show success message
        alert('Thank you for your message! I will get back to you soon.');
        
        // Reset form
        contactForm.reset();
        
        // Save visitor's name for personalization
        if (!state.visitorName) {
            state.visitorName = formData.name;
            localStorage.setItem('visitorName', formData.name);
            updateVisitorGreeting();
        }
    }
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80, // Account for fixed header
                behavior: 'smooth'
            });
        }
    });
});

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
