# API Client Documentation

**File:** `src/utils/api.js`
**Created:** 2026-01-10
**Purpose:** OVD-Info API integration for Prison Map Web Application

---

## Overview

This module provides a complete client for the OVD-Info API (api.repression.info), handling all data fetching operations for detention facilities and political prisoner information.

## Architecture

### Environment Configuration

The API client automatically detects the environment and uses the appropriate base URL:

- **Development Mode** (`npm run dev`):
  - Base URL: `/api`
  - Proxied by Vite to `https://api.repression.info/v1`
  - Configured in `vite.config.js`

- **Production Mode** (deployed):
  - Base URL: `VITE_API_BASE_URL` environment variable
  - Fallback: `https://api.repression.info/v1`

### Request/Response Interceptors

**Request Interceptor:**
- Logs all outgoing requests with method and URL
- Format: `[API Request] GET /api/locations`

**Response Interceptor:**
- Logs successful responses with status code
- Catches and handles errors with detailed logging
- Provides user-friendly Russian error messages

## Functions

### `fetchLocations()`

Fetches all detention facilities from the API.

**Endpoint:** `GET /locations?language=ru&subset=full`

**Returns:** `Promise<Array>` - Array of location objects

**Response Structure:**
```javascript
[
  {
    id: "rec123",
    type: "locations",
    attributes: {
      name: "Учреждение...",
      address: "Адрес...",
      type: "СИЗО",
      // ... other attributes
    },
    references: {
      imprisonment: { total: 5, ids: [...] },
      restraint: { total: 3, ids: [...] }
    }
  },
  // ... more locations
]
```

**Error Handling:**
- Throws user-friendly Russian error message
- Logs technical details to console

**Usage:**
```javascript
import { fetchLocations } from '@/utils/api';

try {
  const locations = await fetchLocations();
  console.log(`Loaded ${locations.length} locations`);
} catch (error) {
  console.error('Failed to load locations:', error.message);
}
```

---

### `fetchPersonsByIds(ids, idType)`

Fetches multiple persons by their imprisonment or restraint IDs in a single batch request.

**Endpoint:** `GET /persons?filter={"imprisonment_ids":[...] OR "restraint_ids":[...]}&subset=detailed`

**Parameters:**
- `ids` (Array<string>) - Array of imprisonment or restraint IDs
- `idType` (string) - Either `'imprisonment_ids'` or `'restraint_ids'` (default: `'imprisonment_ids'`)

**Returns:** `Promise<Array>` - Array of person objects

**Special Behavior:**
- Returns empty array if no IDs provided
- Returns empty array (not error) on 404 response
- Batches all IDs into single request for efficiency

**Response Structure:**
```javascript
[
  {
    id: "rec456",
    type: "persons",
    attributes: {
      name: "Иван Петров",
      birth_year: 1990,
      gender: "male",
      citizenship: "Russia",
      persecution_story_ru: "...",
      // ... other attributes
    }
  },
  // ... more persons
]
```

**Usage:**
```javascript
import { fetchPersonsByIds } from '@/utils/api';

const imprisonmentIds = ['rec1', 'rec2', 'rec3'];
const persons = await fetchPersonsByIds(imprisonmentIds, 'imprisonment_ids');

// Or for restraints:
const restraintIds = ['rec4', 'rec5'];
const restrainedPersons = await fetchPersonsByIds(restraintIds, 'restraint_ids');
```

---

### `fetchPersonDetails(id)`

Fetches detailed information for a single person.

**Endpoint:** `GET /persons/{id}?subset=detailed`

**Parameters:**
- `id` (string) - Person ID (required)

**Returns:** `Promise<Object>` - Person object with detailed attributes

**Error Handling:**
- 404: Throws "Данные о человеке не найдены"
- Other errors: Generic Russian error message

**Response Structure:**
```javascript
{
  id: "rec456",
  type: "persons",
  attributes: {
    name: "Иван Петров",
    birth_year: 1990,
    age: 36,
    gender: "male",
    citizenship: "Russia",
    persecution_story_ru: "История преследования...",
    // ... all available person attributes
  }
}
```

**Usage:**
```javascript
import { fetchPersonDetails } from '@/utils/api';

try {
  const person = await fetchPersonDetails('rec456');
  console.log(person.attributes.name);
} catch (error) {
  // Handle "Данные о человеке не найдены" or other errors
  console.error(error.message);
}
```

---

### `fetchFlatPersonData(personId)`

Fetches extended flat data for a person, including full persecution information.

**Endpoint:** `GET /data?filter={"person_id":"..."}&subset=full&language=ru`

**Parameters:**
- `personId` (string) - Person ID (required)

**Returns:** `Promise<Array>` - Array of flat data records (may contain multiple records)

**Special Behavior:**
- Returns empty array (not error) on 404 response
- Each person may have multiple data records

**Response Structure:**
```javascript
[
  {
    person_id: "rec456",
    name: "Иван Петров",
    birth_year: 1990,
    persecution_story_extended_ru: "Расширенная история...",
    case_type: "...",
    location_name: "...",
    // ... all flattened fields
  },
  // ... potentially more records
]
```

**Usage:**
```javascript
import { fetchFlatPersonData } from '@/utils/api';

const flatData = await fetchFlatPersonData('rec456');
if (flatData.length > 0) {
  console.log('Extended persecution story:', flatData[0].persecution_story_extended_ru);
}
```

---

## Error Handling

### HTTP Status Codes

The API client handles specific HTTP error codes:

| Code | Handling | Message |
|------|----------|---------|
| 404 | Logged as warning, may return empty array | "Resource not found" (logged) |
| 429 | Logged as error | "Rate limit exceeded. Please wait before making more requests." |
| 500-504 | Logged as error | "Server error. The API may be temporarily unavailable." |
| Network | Logged as error | "No response received from server" |

### Russian Error Messages

All user-facing errors are in Russian:

- "Не удалось загрузить список учреждений. Проверьте подключение к интернету."
- "Не удалось загрузить информацию о лицах. Попробуйте позже."
- "Данные о человеке не найдены"
- "Не удалось загрузить данные о человеке. Попробуйте позже."
- "Не удалось загрузить полную информацию о человеке. Попробуйте позже."

### Console Logging

All operations are logged to console for debugging:

**Request Logs:**
```
[API Request] GET /api/locations
```

**Success Logs:**
```
[API Response] GET /locations - Status: 200
[API] Fetched 432 locations
```

**Error Logs:**
```
[API Error] GET /persons/rec999 - Status: 404
[API 404] Resource not found: /persons/rec999
[fetchPersonDetails] Failed to fetch person details
```

---

## Integration with Pinia Store

The API client is designed to be called from Pinia store actions:

```javascript
// In locationsStore.js
import { fetchLocations, fetchPersonsByIds } from '@/utils/api';

const actions = {
  async fetchInitialData() {
    this.isLoading = true;
    this.error = null;

    try {
      const locations = await fetchLocations();
      this.apiLocations = locations;
      // ... merge with GeoJSON data
    } catch (error) {
      this.error = error.message;
      console.error('Store: Failed to load data', error);
    } finally {
      this.isLoading = false;
    }
  },

  async loadPersonsForLocation(locationId) {
    const location = this.apiLocations.find(loc => loc.id === locationId);
    if (!location) return;

    const imprisonmentIds = location.references.imprisonment.ids || [];
    const restraintIds = location.references.restraint.ids || [];

    try {
      const [imprisoned, restrained] = await Promise.all([
        fetchPersonsByIds(imprisonmentIds, 'imprisonment_ids'),
        fetchPersonsByIds(restraintIds, 'restraint_ids')
      ]);

      this.currentPeopleList = [...imprisoned, ...restrained];
    } catch (error) {
      this.modalError = error.message;
    }
  }
};
```

---

## Rate Limiting

**API Rate Limit:** Minimum 2 seconds between requests

**Implementation Strategy:**
- Rate limiting should be handled at the **store level**, not in this utility
- The store should queue requests and enforce delays
- Batch requests where possible (e.g., `fetchPersonsByIds` for multiple persons)

**Example Store-Level Rate Limiting:**
```javascript
// In store
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds

async function rateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const delay = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  lastRequestTime = Date.now();
}

// Use before API calls
await rateLimit();
const data = await fetchLocations();
```

---

## Testing

### Manual Testing

Test the API client in browser console after starting dev server:

```javascript
// Import the module
import { fetchLocations, fetchPersonsByIds, fetchPersonDetails, fetchFlatPersonData } from './src/utils/api.js';

// Test locations fetch
const locations = await fetchLocations();
console.log(`Loaded ${locations.length} locations`);

// Test persons fetch
const persons = await fetchPersonsByIds(['rec1', 'rec2'], 'imprisonment_ids');
console.log(`Loaded ${persons.length} persons`);

// Test person details
const person = await fetchPersonDetails('rec456');
console.log(person.attributes.name);

// Test flat data
const flatData = await fetchFlatPersonData('rec456');
console.log(`Loaded ${flatData.length} flat records`);
```

### Integration Testing

Once the Pinia store is implemented, test through store actions:

```javascript
// In Vue component or console
import { useLocationsStore } from '@/stores/locationsStore';

const store = useLocationsStore();
await store.fetchInitialData();
console.log('Locations loaded:', store.mergedData.length);
```

---

## Dependencies

- **axios** (^1.6.0) - HTTP client for API requests
- Vite proxy configuration (development only)

---

## Environment Variables

Required in production (optional in development):

```env
# Optional: Override API base URL
VITE_API_BASE_URL=https://api.repression.info/v1
```

---

## Future Enhancements

Potential improvements not in current scope:

1. **Request Caching:** Cache responses in memory to avoid duplicate requests
2. **Retry Logic:** Automatic retry for failed requests with exponential backoff
3. **Request Cancellation:** Cancel in-flight requests when user navigates away
4. **Request Queue:** Queue system with priority for critical requests
5. **Offline Support:** Service worker integration for offline data access

---

## References

- **API Documentation:** https://repression.net/en/api
- **Specification:** `openspec/changes/prison-map-webapp/specs/data-integration/spec.md`
- **Roadmap:** `plans/roadmap.md` - Phase 1.2

---

*Last Updated: 2026-01-10*
