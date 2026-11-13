# PROMPTS.md

**Agentic IDE / AI coding agent:** [OpenCode](https://opencode.ai)

This file records the prompts that were actually used while building WeatherBoard. It is a
verbatim log of the two user messages sent in the project session, in chronological order. No
prompt history has been invented or reworded.

The first message carried the full project brief (including the pasted Edspire challenge text).


---

## Prompt 1 — Project brief and build instructions

````text
# PROJECT: WEATHERBOARD
## Edspire Frontend (React) Developer Technical Challenge — November 2026

Act as a senior frontend engineer, React architect, UI/UX designer, API integration specialist, and QA engineer.

Your responsibility is to design, develop, test, and deliver a complete, polished, fully functional WeatherBoard application that satisfies every requirement in the provided Edspire Technical Challenge PDF.

This is a real technical assessment. Code quality, functional correctness, design decisions, responsiveness, error handling, and implementation quality are equally important.

Do not create a static mockup, tutorial project, or partially working prototype.

Build a complete working application.

---

# 1. FIRST: UNDERSTAND THE ASSIGNMENT

Before writing code:

1. Read the entire attached Edspire technical challenge PDF.
2. Extract every mandatory requirement, technical constraint, and submission requirement.
3. Inspect the existing project directory before modifying anything.
4. Inspect the Dribbble screenshot/reference image I provide.
5. Understand the design inspiration without copying it.
6. Create an internal implementation checklist covering every requirement.
7. Identify technical dependencies and limitations.

The PDF is the primary source of truth.

Do not silently skip requirements or replace required functionality with a visual imitation.

If something cannot be implemented exactly under the client-side-only constraint, investigate the best technically honest solution and document the limitation.

Do not stop after presenting a plan. Proceed with implementation once the initial architecture is established.

---

# 2. PROJECT OBJECTIVE

Build WeatherBoard, a simple, modern, responsive, installable weather dashboard.

Users must be able to:

- Search for any city.
- Receive live city autocomplete suggestions.
- View real current weather information.
- View a five-day weather forecast.
- Save up to five favourite cities.
- Quickly switch between favourite cities.
- Configure a daily morning weather reminder.
- Install the application as a PWA.
- Access the last viewed city's cached weather while offline.

The application should feel like a real consumer product: simple, useful, intuitive, and professionally designed.

Avoid unnecessary features, clutter, excessive animations, and complicated navigation.

Prioritize usability over visual decoration.

---

# 3. DESIGN AND UI/UX DIRECTION

Use my provided Dribbble weather dashboard screenshot as visual inspiration only.

IMPORTANT:
- Do not reproduce the screenshot exactly.
- Do not copy its complete layout, branding, illustrations, or components.
- Do not create a clone.
- Understand the visual principles and create an original WeatherBoard design.
- Keep the interface simple and practical.
- Do not sacrifice usability for visual effects.

Study these design references and apply their principles:

LINEAR:
Clean layouts, typography hierarchy, spacing, and empty states.

VERCEL:
Status indicators, subtle interactions, and organized information density.

STRIPE:
Form validation, error messages, and clear user feedback.

MERCURY:
Dashboard cards, information hierarchy, and balanced colour palettes.

DRIBBBLE:
Modern weather card designs, forecast presentation, and visual inspiration.

MOBBIN:
Mobile search patterns, settings, notifications, and responsive interactions.

Create an original design combining these principles.

## Visual style

Use:
- A clean, modern dashboard layout.
- A balanced and consistent colour palette.
- Professional typography.
- Clear visual hierarchy.
- Consistent spacing.
- Well-designed weather cards.
- Subtle shadows and borders.
- Rounded corners used consistently.
- Small, meaningful animations only.
- Clear icons.
- Excellent contrast and readability.

A dark navy/blue weather-inspired theme is preferred, but keep the interface calm and professional.

Avoid:
- Excessive glassmorphism.
- Too many gradients.
- Huge decorative illustrations.
- Unnecessary charts.
- Excessive empty space.
- Overloaded dashboards.
- Random colours.
- Emoji used as a replacement for proper icons.
- Generic AI-generated website appearance.

## Main dashboard structure

Create a practical layout containing:

1. Header:
   - WeatherBoard logo/name.
   - Current date.
   - City search.
   - Theme toggle if implemented.

2. Main weather section:
   - Selected city and country.
   - Current date and local time where available.
   - Current temperature.
   - Weather condition.
   - Appropriate weather icon.
   - Feels-like temperature if available.
   - Humidity.
   - Wind speed.
   - Loading and error states.

3. Five-day forecast:
   - Day and date.
   - Weather icon.
   - Weather description.
   - Minimum temperature.
   - Maximum temperature.

4. Favourite cities:
   - List of saved cities.
   - Quick access.
   - Add and remove actions.
   - Clear visual indication of the selected city.

5. Notification settings:
   - Enable/disable reminder.
   - Time selection.
   - Permission explanation.
   - Notification status and fallback.

Keep the dashboard organized and avoid unnecessary sections.

---

# 4. TECHNOLOGY STACK

Use the following technologies:

Frontend:
- React.js
- Vite
- JavaScript
- HTML5
- CSS3

Icons:
- Lucide React

APIs:
- OpenWeatherMap
- Open-Meteo
- GeoDB Cities API through RapidAPI

Browser functionality:
- localStorage
- Notifications API
- Service Workers
- Web App Manifest
- Cache API

Deployment:
- GitHub
- Vercel or Netlify

Use free tools and free-tier services wherever possible.

Do not introduce paid libraries, paid UI kits, paid templates, or unnecessary dependencies.

Prefer native browser functionality and lightweight libraries.

Do not introduce TypeScript unless the existing project already uses it or there is a strong technical reason.

---

# 5. FUNCTIONAL REQUIREMENTS

## FEATURE 1: CITY SEARCH WITH AUTOCOMPLETE

Implement real city autocomplete using the GeoDB Cities API through RapidAPI.

Requirements:

- Search while the user types.
- Show live city suggestions.
- Debounce requests by 300ms.
- Display city name, region/state, and country where available.
- Selecting a suggestion should load its weather.
- Support keyboard navigation.
- Support Enter and Escape.
- Close suggestions when clicking outside.
- Prevent unnecessary duplicate API requests.
- Handle loading states.
- Handle no-result states.
- Handle API errors visibly.

The search field must not be a simple unvalidated text input.

Do not call the API on every keystroke without debouncing.

Validate the search field on blur as well as submission.

Handle:
- Empty city input.
- Invalid or unavailable cities.
- No autocomplete results.
- Network failures.
- API rate limits.

Never show fake city suggestions as real API results.

## FEATURE 2: REAL WEATHER DATA

Use OpenWeatherMap as the primary weather provider and Open-Meteo as the fallback.

Implement real API integration.

OpenWeatherMap should provide:

- Current temperature.
- Feels-like temperature.
- Humidity.
- Wind speed.
- Weather condition.
- Weather icon.
- Five-day forecast.

Use appropriate endpoints and correctly process their response structures.

If using Open-Meteo:
- Convert selected city coordinates into the required weather query.
- Map weather codes to readable conditions.
- Convert units correctly.
- Aggregate forecast data into five daily forecasts.
- Ensure local dates and timezone handling are correct.

Important:
Do not mix values from different providers without identifying the provider and ensuring consistent units.

Implement:
- Loading state.
- Successful response state.
- Error state.
- Retry action.
- Fallback provider handling.

Handle:
- Invalid API key.
- API rate limits.
- Network errors.
- Server errors.
- Missing response fields.
- Timeout.

Do not use hardcoded or mocked weather data in production.

If credentials are unavailable during development, use a clearly labelled development-only fixture and never present it as live weather.

## FEATURE 3: FORM VALIDATION

Implement meaningful client-side validation.

Requirements:
- Validate when the field loses focus.
- Validate on submission.
- Display inline error messages.
- Remove errors when the input becomes valid.
- Provide accessible error messages.
- Do not use generic messages such as "Something went wrong."

Examples:

Empty city:
"Please enter a city name."

No matching city:
"No matching city found. Try another spelling."

Network failure:
"Unable to connect to the city service. Check your internet connection and try again."

Weather API failure:
"Weather information could not be loaded. Please retry."

Do not block the rest of the dashboard when one API fails.

## FEATURE 4: FAVOURITE CITIES

Implement favourite cities using localStorage.

Requirements:
- Maximum five favourite cities.
- Add a selected city to favourites.
- Prevent duplicate favourites.
- Display saved cities.
- Quickly switch between saved cities.
- Remove favourites only after confirmation.
- Persist favourites across browser sessions.
- Restore favourites when the application reloads.

Handle unavailable or blocked localStorage gracefully.

Do not crash the application if storage access fails.

Persist only the necessary city information, such as:
- City name.
- Country.
- Latitude.
- Longitude.
- Unique identifier where available.

## FEATURE 5: PROGRESSIVE WEB APP

Make the application installable as a PWA.

Implement:

A. Web manifest:
- Correct application name.
- Short name.
- Start URL.
- Theme colour.
- Background colour.
- Display mode: standalone.
- 192x192 icon.
- 512x512 icon.

B. Service worker:
- Register correctly.
- Cache the application shell.
- Cache static assets.
- Cache the last successfully viewed city's weather.
- Update cached data when a successful network response arrives.
- Handle cache updates without breaking the application.

C. Offline mode:
- Detect online/offline changes.
- Show a visible offline banner.
- Display the last cached city's weather.
- Clearly indicate that the displayed data is cached.
- Handle the situation where no cached weather exists.

Do not pretend live weather is available offline.

Ensure the PWA can be installed on supported browsers.

## FEATURE 6: DAILY WEATHER REMINDER

Implement notification preferences using the browser Notifications API and service worker.

Requirements:

- Explain why notifications are requested before displaying the browser permission prompt.
- Let users select their preferred reminder time.
- Let users enable and disable reminders.
- Request notification permission only after a clear user action.
- Handle granted, denied, default, and unsupported states.
- Show a clear fallback if notifications are unsupported.
- Never break the dashboard if permission is denied.

IMPORTANT TECHNICAL CONSTRAINT:

A browser-only service worker cannot independently guarantee an arbitrary daily scheduled notification while the browser is completely closed.

Investigate available browser capabilities and the assignment's client-side-only restriction.

Implement the best feasible solution without pretending that an in-page timer or local scheduling logic provides true background push delivery.

If true scheduled Web Push requires a backend:
- Explain why.
- Identify what is missing.
- Keep the client-side implementation functional.
- Document the limitation honestly in README.md.

Do not silently claim full background push support if it does not work.

## FEATURE 7: RESPONSIVE DESIGN

The same React application must work at:

- Mobile: 375px.
- Tablet: 768px.
- Desktop: 1280px.

Requirements:

- No horizontal overflow.
- No overlapping cards.
- Proper text wrapping.
- Responsive navigation.
- Responsive search field.
- Proper card stacking.
- Readable typography.
- Consistent spacing.
- Minimum 44x44px mobile touch targets.
- Usable forecast layout.

Use responsive CSS and media queries.

Do not build three separate applications.

Actually test the layout at the specified widths.

---

# 6. PROJECT ARCHITECTURE AND CODE QUALITY

Use a clean and maintainable folder structure.

Suggested architecture:

src/
  assets/
  components/
    Header.jsx
    SearchBar.jsx
    WeatherCard.jsx
    WeatherDetails.jsx
    Forecast.jsx
    ForecastDay.jsx
    Favorites.jsx
    NotificationSettings.jsx
    OfflineBanner.jsx
    LoadingState.jsx
    ErrorState.jsx

  hooks/
    useWeather.js
    useFavorites.js
    useCitySearch.js
    useOnlineStatus.js

  services/
    weatherService.js
    geoDbService.js
    openMeteoService.js

  utils/
    weatherHelpers.js
    dateHelpers.js
    storage.js
    validation.js

  styles/
    global.css
    variables.css
    responsive.css

  App.jsx
  main.jsx

public/
  icons/
  manifest.webmanifest
  service-worker.js

Adjust the architecture when technically appropriate.

Code quality requirements:

- Use functional React components.
- Use hooks correctly.
- Keep components focused and reusable.
- Avoid huge components.
- Avoid duplicate code.
- Avoid unnecessary dependencies.
- Avoid unnecessary re-renders.
- Use meaningful variable and function names.
- Keep API calls outside UI components.
- Handle asynchronous operations safely.
- Prevent race conditions in search requests.
- Clean up event listeners and timers.
- Avoid memory leaks.
- Handle component unmounting.
- Use consistent formatting.
- Keep CSS organized.
- Avoid unnecessary comments.
- Add comments where technical decisions need explanation.
- Never suppress errors simply to make the application appear functional.

Do not rewrite working code unnecessarily.

Inspect existing files before replacing them.

---

# 7. ACCESSIBILITY AND USER EXPERIENCE

Ensure:

- Semantic HTML.
- Accessible form labels.
- Keyboard-friendly navigation.
- Visible focus indicators.
- Sufficient colour contrast.
- Accessible error messages.
- Appropriate ARIA attributes where necessary.
- Descriptive icon labels.
- Clear button labels.
- Good empty states.
- Useful loading indicators.

Every interactive control must perform its advertised action.

Avoid buttons that are only decorative.

---

# 8. OPTIONAL ENHANCEMENTS

Only after all seven mandatory requirements are implemented and tested, consider:

1. Dark/light theme toggle.
2. Celsius/Fahrenheit toggle.
3. Animated weather icons.

These are optional. Do not sacrifice mandatory features or code quality to implement them.

Persist user preferences where appropriate.

---

# 9. TESTING AND QUALITY ASSURANCE

Do not consider the application complete simply because it compiles.

Run the project and verify the actual functionality.

Test:

CITY SEARCH:
- Valid city.
- Empty input.
- No matching city.
- API unavailable.
- Rapid typing.
- Keyboard navigation.

WEATHER:
- Current conditions.
- Five-day forecast.
- Invalid API key.
- Network failure.
- Fallback provider.
- Loading state.
- Retry functionality.

FAVOURITES:
- Add city.
- Duplicate city.
- Sixth city.
- Remove city.
- Confirmation.
- Refresh persistence.
- Storage unavailable.

PWA:
- Manifest validity.
- Icon availability.
- Service worker registration.
- App-shell caching.
- Last-weather caching.
- Offline banner.
- Offline cached weather.
- No cached data.

NOTIFICATIONS:
- Unsupported browser.
- Permission granted.
- Permission denied.
- Reminder time selection.
- Enable and disable preferences.
- Actual scheduling limitations.

RESPONSIVE:
- 375px.
- 768px.
- 1280px.
- Horizontal overflow.
- Touch targets.
- Navigation.
- Text and card layout.

Use available browser testing tools if configured.

Run:
- npm run build
- Appropriate lint commands if configured.
- Additional tests where practical.

Fix all discovered errors before declaring completion.

Do not claim a test passed unless it was actually executed.

---

# 10. SECURITY AND CONFIGURATION

- Keep API configuration organized.
- Use environment variables for configurable credentials.
- Provide a .env.example file.
- Never commit actual secrets.
- Add .env to .gitignore.
- Never expose private server credentials in frontend code.
- Explain that Vite client-side environment variables are publicly accessible in the browser.
- Do not introduce an unnecessary backend.

If a public API requires a client-side key, document its exposure and usage limitations honestly.

---

# 11. DOCUMENTATION AND SUBMISSION

Create a complete README.md containing:

1. Project overview.
2. Features.
3. Technologies used.
4. Project folder structure.
5. Installation instructions.
6. Environment variable setup.
7. API setup instructions.
8. How to run locally.
9. How to build for production.
10. Architecture decisions.
11. API integration details.
12. PWA and offline implementation.
13. Notification implementation.
14. Known limitations.
15. Deployment instructions.
16. Live URL placeholder.

Create PROMPTS.md containing:
- The AI coding agent used: OpenCode.
- Complete prompts used during development.
- Prompts in chronological order.
- Important debugging prompts.
- Refactoring and testing prompts.
- Changes made after reviewing AI-generated code.

Maintain PROMPTS.md throughout development, not just at the end.

Do not invent prompt history.

Prepare the project for:
- Public GitHub repository.
- Vercel or Netlify deployment.
- Live application URL.

---

# 12. IMPLEMENTATION WORKFLOW

Work systematically.

PHASE 1:
Inspect the challenge PDF, existing project, and design inspiration.
Establish architecture and implementation checklist.

PHASE 2:
Build the complete responsive UI using real reusable components.

PHASE 3:
Integrate city autocomplete and real weather APIs.

PHASE 4:
Implement validation, loading, errors, and favourites.

PHASE 5:
Implement PWA, service worker, caching, and offline support.

PHASE 6:
Implement notification preferences and the best technically feasible notification functionality.

PHASE 7:
Implement optional enhancements if time permits.

PHASE 8:
Perform functional testing, responsive testing, and production build.

PHASE 9:
Write documentation and prepare deployment.

After each phase:
- Inspect the generated code.
- Run the application.
- Check the browser console.
- Fix problems before moving forward.
- Update the implementation checklist.
- Update PROMPTS.md.

Do not leave incomplete TODOs for mandatory features.

If something is blocked by missing credentials, tell me exactly what account, key, or configuration is needed and continue implementing all independent features.

Do not repeatedly ask for permission for ordinary development decisions.

Ask only when an important external decision or credential is required.

---

# 13. FINAL ACCEPTANCE CRITERIA

The project is complete only when:

- All seven mandatory requirements have been implemented.
- Weather information comes from real APIs.
- Search autocomplete works.
- Validation works correctly.
- Favourites persist.
- PWA installation works on supported browsers.
- Offline caching works.
- Notification functionality and limitations are accurately represented.
- The application works at all three required screen widths.
- No horizontal overflow exists.
- The production build succeeds.
- README.md is complete.
- PROMPTS.md contains the real development prompt history.
- The GitHub and deployment preparation is complete.

At the end, provide a concise implementation report with:

1. Features completed.
2. Features tested.
3. Build status.
4. API configuration still needed.
5. Known limitations.
6. Files created or modified.
7. Remaining deployment steps.

FINAL INSTRUCTION:

Build a simple, useful, reliable, professional WeatherBoard application.

Prioritize working functionality, clean code, good UX, and genuine technical quality.

Do not prioritize flashy visuals over correctness.

Do not stop at a plan, mockup, or partial implementation. Complete the actual project.
````
