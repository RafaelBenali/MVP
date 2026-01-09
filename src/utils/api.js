/**
 * OVD-Info API Client Utility
 *
 * Provides functions to interact with the OVD-Info API (api.repression.info)
 * Handles environment-based configuration, error handling, and logging.
 *
 * API Documentation: https://repression.net/en/api
 * Rate Limit: Minimum 2 seconds between requests (handled at store level)
 */

import axios from 'axios';

/**
 * Get the base URL for API requests based on environment
 * - Development: Uses '/api' (proxied by Vite to https://api.repression.info/v1)
 * - Production: Uses VITE_API_BASE_URL env var or defaults to https://api.repression.info/v1
 */
function getBaseURL() {
  // In development mode, use the Vite proxy
  if (import.meta.env.DEV) {
    return '/api';
  }

  // In production, use environment variable or fallback to default
  return import.meta.env.VITE_API_BASE_URL || 'https://api.repression.info/v1';
}

/**
 * Create axios instance with base configuration
 */
const apiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor for logging
 */
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for error handling and logging
 */
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.method.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, config } = error.response;
      console.error(`[API Error] ${config.method.toUpperCase()} ${config.url} - Status: ${status}`, error.response.data);

      // Handle specific error codes
      switch (status) {
        case 404:
          console.warn(`[API 404] Resource not found: ${config.url}`);
          break;
        case 429:
          console.error('[API 429] Rate limit exceeded. Please wait before making more requests.');
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          console.error(`[API ${status}] Server error. The API may be temporarily unavailable.`);
          break;
        default:
          console.error(`[API ${status}] Unexpected error occurred.`);
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('[API Network Error] No response received from server', error.message);
    } else {
      // Error in request setup
      console.error('[API Setup Error]', error.message);
    }

    return Promise.reject(error);
  }
);

/**
 * Fetch all detention facility locations from the API
 *
 * GET /locations?language=ru&subset=full
 *
 * @returns {Promise<Array>} Array of location objects with attributes and references
 * @throws {Error} On network error, timeout, or API error
 */
export async function fetchLocations() {
  try {
    const response = await apiClient.get('/locations', {
      params: {
        language: 'ru',
        subset: 'full'
      }
    });

    // The API returns an array of location objects
    const locations = response.data;
    console.log(`[API] Fetched ${locations.length} locations`);

    return locations;
  } catch (error) {
    console.error('[fetchLocations] Failed to fetch locations', error);
    throw new Error('Не удалось загрузить список учреждений. Проверьте подключение к интернету.');
  }
}

/**
 * Fetch multiple persons by their imprisonment/restraint IDs
 *
 * GET /persons?filter={"imprisonment_ids":[...] OR "restraint_ids":[...]}&subset=detailed
 *
 * @param {Array<string>} ids - Array of imprisonment or restraint IDs
 * @param {string} idType - Type of IDs: 'imprisonment_ids' or 'restraint_ids'
 * @returns {Promise<Array>} Array of person objects with detailed information
 * @throws {Error} On network error, timeout, or API error
 */
export async function fetchPersonsByIds(ids, idType = 'imprisonment_ids') {
  if (!ids || ids.length === 0) {
    console.warn('[fetchPersonsByIds] No IDs provided, returning empty array');
    return [];
  }

  try {
    // Build filter object based on ID type
    const filter = {};
    filter[idType] = ids;

    const response = await apiClient.get('/persons', {
      params: {
        filter: JSON.stringify(filter),
        subset: 'detailed'
      }
    });

    const persons = response.data;
    console.log(`[API] Fetched ${persons.length} persons for ${ids.length} ${idType}`);

    return persons;
  } catch (error) {
    console.error('[fetchPersonsByIds] Failed to fetch persons', error);

    // Handle 404 specifically - may mean no persons found
    if (error.response && error.response.status === 404) {
      console.warn('[fetchPersonsByIds] No persons found for provided IDs');
      return [];
    }

    throw new Error('Не удалось загрузить информацию о лицах. Попробуйте позже.');
  }
}

/**
 * Fetch detailed information for a single person
 *
 * GET /persons/{id}?subset=detailed
 *
 * @param {string} id - Person ID (e.g., "rec123")
 * @returns {Promise<Object>} Person object with detailed attributes
 * @throws {Error} On network error, timeout, or API error (including 404)
 */
export async function fetchPersonDetails(id) {
  if (!id) {
    throw new Error('Person ID is required');
  }

  try {
    const response = await apiClient.get(`/persons/${id}`, {
      params: {
        subset: 'detailed'
      }
    });

    const person = response.data;
    console.log(`[API] Fetched details for person: ${id}`);

    return person;
  } catch (error) {
    console.error('[fetchPersonDetails] Failed to fetch person details', error);

    // Handle 404 - person not found
    if (error.response && error.response.status === 404) {
      throw new Error('Данные о человеке не найдены');
    }

    throw new Error('Не удалось загрузить данные о человеке. Попробуйте позже.');
  }
}

/**
 * Fetch flat (extended) person data with full persecution information
 *
 * GET /data?filter={"person_id":"..."}&subset=full&language=ru
 *
 * @param {string} personId - Person ID to fetch extended data for
 * @returns {Promise<Array>} Array of flat data records (may contain multiple records per person)
 * @throws {Error} On network error, timeout, or API error
 */
export async function fetchFlatPersonData(personId) {
  if (!personId) {
    throw new Error('Person ID is required');
  }

  try {
    const filter = {
      person_id: personId
    };

    const response = await apiClient.get('/data', {
      params: {
        filter: JSON.stringify(filter),
        subset: 'full',
        language: 'ru'
      }
    });

    const data = response.data;
    console.log(`[API] Fetched flat data for person: ${personId} (${data.length} records)`);

    return data;
  } catch (error) {
    console.error('[fetchFlatPersonData] Failed to fetch flat person data', error);

    // Handle 404 - no flat data found
    if (error.response && error.response.status === 404) {
      console.warn('[fetchFlatPersonData] No flat data found for person:', personId);
      return [];
    }

    throw new Error('Не удалось загрузить полную информацию о человеке. Попробуйте позже.');
  }
}

/**
 * Export the configured axios instance for advanced use cases
 */
export { apiClient };
