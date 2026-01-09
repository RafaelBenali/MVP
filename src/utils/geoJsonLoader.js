/**
 * GeoJSON Loading Utility
 *
 * Handles loading of GeoJSON facility data with two-tier loading strategy:
 * 1. Minimal GeoJSON (fast initial load) - contains coordinates, name, region, basic service flags
 * 2. Full GeoJSON (background load) - contains extended metadata, schedules, content sections
 *
 * Filters out invalid fallback coordinates [96.712933, 62.917018]
 */

/**
 * Fallback coordinates that should be filtered out
 * These are placeholder/invalid coordinates in the GeoJSON data
 */
const FALLBACK_COORDINATES = [96.712933, 62.917018];

/**
 * Tolerance for coordinate comparison (to handle floating point precision)
 */
const COORDINATE_TOLERANCE = 0.000001;

/**
 * Check if coordinates match the fallback coordinates
 *
 * @param {Array<number>} coordinates - [longitude, latitude]
 * @returns {boolean} True if coordinates are fallback coordinates
 */
function isFallbackCoordinate(coordinates) {
  if (!coordinates || coordinates.length !== 2) {
    return false;
  }

  const [lon, lat] = coordinates;
  const [fallbackLon, fallbackLat] = FALLBACK_COORDINATES;

  return (
    Math.abs(lon - fallbackLon) < COORDINATE_TOLERANCE &&
    Math.abs(lat - fallbackLat) < COORDINATE_TOLERANCE
  );
}

/**
 * Filter out features with invalid fallback coordinates
 *
 * @param {Object} geoJson - GeoJSON FeatureCollection
 * @returns {Object} Filtered GeoJSON with fallback coordinates removed
 */
function filterFallbackCoordinates(geoJson) {
  if (!geoJson || !geoJson.features) {
    console.warn('[GeoJSON] Invalid GeoJSON structure, no features array found');
    return geoJson;
  }

  const originalCount = geoJson.features.length;

  const filteredFeatures = geoJson.features.filter((feature) => {
    if (!feature.geometry || !feature.geometry.coordinates) {
      console.warn('[GeoJSON] Feature missing geometry or coordinates:', feature.properties?.name || 'Unknown');
      return false;
    }

    const coordinates = feature.geometry.coordinates;
    const isFallback = isFallbackCoordinate(coordinates);

    if (isFallback) {
      console.debug('[GeoJSON] Filtered out fallback coordinate for:', feature.properties?.name || 'Unknown');
    }

    return !isFallback;
  });

  const filteredCount = originalCount - filteredFeatures.length;

  if (filteredCount > 0) {
    console.warn(`[GeoJSON] Filtered out ${filteredCount} feature(s) with fallback coordinates [${FALLBACK_COORDINATES.join(', ')}]`);
  }

  return {
    ...geoJson,
    features: filteredFeatures
  };
}

/**
 * Load minimal GeoJSON data for fast initial render
 * Attempts to load from /min-services.geojson first, falls back to /unified_prisons.geojson
 *
 * @returns {Promise<Object>} GeoJSON FeatureCollection with fallback coordinates filtered
 * @throws {Error} If both minimal and full GeoJSON fail to load
 */
export async function loadMinimalGeoJSON() {
  console.log('[GeoJSON] Loading minimal GeoJSON data...');

  try {
    // First, try to load minimal GeoJSON (if it exists)
    try {
      const response = await fetch('/min-services.geojson');

      if (response.ok) {
        const geoJson = await response.json();
        console.log(`[GeoJSON] Loaded minimal GeoJSON: ${geoJson.features?.length || 0} features`);

        const filtered = filterFallbackCoordinates(geoJson);
        console.log(`[GeoJSON] Minimal GeoJSON ready: ${filtered.features?.length || 0} valid features`);

        return filtered;
      } else if (response.status === 404) {
        console.info('[GeoJSON] Minimal GeoJSON not found (min-services.geojson), falling back to full GeoJSON');
      } else {
        console.warn(`[GeoJSON] Failed to load minimal GeoJSON (status ${response.status}), falling back to full GeoJSON`);
      }
    } catch (minimalError) {
      console.info('[GeoJSON] Minimal GeoJSON not available, falling back to full GeoJSON:', minimalError.message);
    }

    // Fallback to full GeoJSON
    const response = await fetch('/unified_prisons.geojson');

    if (!response.ok) {
      throw new Error(`Failed to fetch GeoJSON: ${response.status} ${response.statusText}`);
    }

    const geoJson = await response.json();
    console.log(`[GeoJSON] Loaded full GeoJSON as fallback: ${geoJson.features?.length || 0} features`);

    const filtered = filterFallbackCoordinates(geoJson);
    console.log(`[GeoJSON] Full GeoJSON ready: ${filtered.features?.length || 0} valid features`);

    return filtered;
  } catch (error) {
    console.error('[GeoJSON] Failed to load GeoJSON data:', error);
    throw new Error('Не удалось загрузить данные о расположении учреждений. Проверьте подключение к интернету.');
  }
}

/**
 * Load full GeoJSON data with extended metadata
 * Should be called in background after initial map render
 *
 * @returns {Promise<Object>} GeoJSON FeatureCollection with fallback coordinates filtered
 * @throws {Error} If GeoJSON fails to load
 */
export async function loadFullGeoJSON() {
  console.log('[GeoJSON] Loading full GeoJSON data...');

  try {
    const response = await fetch('/unified_prisons.geojson');

    if (!response.ok) {
      throw new Error(`Failed to fetch full GeoJSON: ${response.status} ${response.statusText}`);
    }

    const geoJson = await response.json();
    console.log(`[GeoJSON] Loaded full GeoJSON: ${geoJson.features?.length || 0} features`);

    const filtered = filterFallbackCoordinates(geoJson);
    console.log(`[GeoJSON] Full GeoJSON ready: ${filtered.features?.length || 0} valid features`);

    return filtered;
  } catch (error) {
    console.error('[GeoJSON] Failed to load full GeoJSON data:', error);
    throw new Error('Не удалось загрузить полные данные о расположении учреждений. Проверьте подключение к интернету.');
  }
}

/**
 * Validate GeoJSON structure
 *
 * @param {Object} geoJson - GeoJSON object to validate
 * @returns {boolean} True if valid GeoJSON FeatureCollection
 */
export function validateGeoJSON(geoJson) {
  if (!geoJson) {
    console.error('[GeoJSON] Validation failed: GeoJSON is null or undefined');
    return false;
  }

  if (geoJson.type !== 'FeatureCollection') {
    console.error('[GeoJSON] Validation failed: Not a FeatureCollection (type:', geoJson.type, ')');
    return false;
  }

  if (!Array.isArray(geoJson.features)) {
    console.error('[GeoJSON] Validation failed: features is not an array');
    return false;
  }

  console.log(`[GeoJSON] Validation passed: ${geoJson.features.length} features`);
  return true;
}

/**
 * Get statistics about GeoJSON data
 *
 * @param {Object} geoJson - GeoJSON FeatureCollection
 * @returns {Object} Statistics object with counts and summary
 */
export function getGeoJSONStats(geoJson) {
  if (!geoJson || !geoJson.features) {
    return {
      totalFeatures: 0,
      featuresWithCoordinates: 0,
      featuresWithFallbackCoordinates: 0,
      featuresWithoutCoordinates: 0
    };
  }

  const stats = {
    totalFeatures: geoJson.features.length,
    featuresWithCoordinates: 0,
    featuresWithFallbackCoordinates: 0,
    featuresWithoutCoordinates: 0
  };

  geoJson.features.forEach((feature) => {
    if (!feature.geometry || !feature.geometry.coordinates) {
      stats.featuresWithoutCoordinates++;
    } else if (isFallbackCoordinate(feature.geometry.coordinates)) {
      stats.featuresWithFallbackCoordinates++;
    } else {
      stats.featuresWithCoordinates++;
    }
  });

  return stats;
}
