import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useLocationsStore = defineStore('locations', () => {
  // ==================== DATA STATE ====================

  // API data from OVD-Info API (/locations endpoint)
  const apiLocations = ref([])

  // Minimal GeoJSON features (loaded first for fast initial render)
  const geoJsonFeatures = ref([])

  // Full GeoJSON features (loaded in background after initial render)
  const fullGeoJsonFeatures = ref([])

  // Loading state for initial data fetch
  const isLoading = ref(false)

  // Error state for data loading failures
  const error = ref(null)


  // ==================== FILTER STATE ====================

  // Service filter flags (17+ boolean flags for each service)
  const filters = ref({
    // Letters
    fpismo: false,                    // Ф-Письмо
    zt_maintenance: false,            // ZT
    rodnayasvyaz: false,              // Родная связь (Письма)
    prisonmail: false,                // Prisonmail

    // Money transfers
    fsinzak: false,                   // Fsinzak
    fdengi: false,                    // Ф-Деньги
    skladsizo_payment: false,         // Склад СИЗО (Перевод)

    // Calls
    rodnayasvyaz_video: false,        // Родная связь (Аудио и Видео звонки)
    ariadna: false,                   // Ариадна

    // Products/Deliveries
    skladsizo_food: false,            // Склад СИЗО (Заказ еды)
    skladsizo_delivery: false,        // Склад СИЗО (Доставка продуктов)
    ao: false,                        // АО
    promservice: false,               // Промсервис
    pochtaRTS: false,                 // Почта РТС
    sidim: false,                     // сидим-едим

    // Other services
    f_okno_peredacha: false,          // Ф-Окно (Передачи)
    f_okno_svidaniye: false,          // Ф-Окно (Свидания)
    fsinpress: false,                 // ФСИН Пресса
    fapteka: false,                   // Ф-Аптека
  })

  // Search query for facility name search (case-insensitive)
  const searchQuery = ref('')

  // Selected regions for region filter (array of ISO codes like ["RU-MOW", "RU-SPE"])
  const selectedRegions = ref([])


  // ==================== SELECTION STATE ====================

  // Currently selected location ID (for location modal)
  const selectedLocationId = ref(null)

  // Current location details (fetched when location is selected)
  const currentLocationDetails = ref(null)

  // List of people at the current location (for location modal)
  const currentPeopleList = ref([])

  // Current person details (when viewing a specific person)
  const currentPersonDetails = ref(null)


  // ==================== UI STATE ====================

  // Loading state for modal data fetching
  const isModalLoading = ref(false)

  // Error state for modal operations
  const modalError = ref(null)


  // ==================== ACTIONS (Placeholders) ====================

  /**
   * Fetch initial data (API locations + minimal GeoJSON)
   * This will be implemented in Phase 1.5
   */
  async function fetchInitialData() {
    console.log('[locationsStore] fetchInitialData called - placeholder')
    // TODO: Implement in Phase 1.5
    // - Parallel fetch: API locations + minimal GeoJSON
    // - Call merging logic after fetch completes
    // - Set isLoading state during fetch
    // - Handle errors and set error state
    // - Trigger background load of full GeoJSON
  }

  /**
   * Select a location by ID
   * This will be implemented in Phase 4.1
   * @param {string|number} locationId - The location ID to select
   */
  async function selectLocation(locationId) {
    console.log(`[locationsStore] selectLocation called with ID: ${locationId} - placeholder`)
    // TODO: Implement in Phase 4.1
    // - Set selectedLocationId
    // - Fetch location details from API if needed
    // - Fetch persons at this location
    // - Set isModalLoading during fetch
    // - Handle errors and set modalError
  }

  /**
   * Set a single filter value
   * This will be implemented in Phase 3.1
   * @param {string} filterName - The filter key (e.g., 'fpismo', 'zt_maintenance')
   * @param {boolean} value - The filter value (true/false)
   */
  function setFilter(filterName, value) {
    console.log(`[locationsStore] setFilter called: ${filterName} = ${value} - placeholder`)
    // TODO: Implement in Phase 3.1
    // - Update filters[filterName] = value
    // - Trigger map layer updates
  }

  /**
   * Batch update multiple filters at once
   * This will be implemented in Phase 3.1
   * @param {Object} updates - Object with filter keys and values (e.g., {fpismo: true, zt_maintenance: true})
   */
  function batchUpdateFilters(updates) {
    console.log('[locationsStore] batchUpdateFilters called - placeholder', updates)
    // TODO: Implement in Phase 3.1
    // - Update multiple filters in one operation
    // - Trigger map layer update once (not for each filter)
  }

  /**
   * Reset all filters to default state
   * This will be implemented in Phase 3.1
   */
  function resetAllFilters() {
    console.log('[locationsStore] resetAllFilters called - placeholder')
    // TODO: Implement in Phase 3.1
    // - Reset all service filters to false
    // - Clear selectedRegions array
    // - Clear searchQuery
    // - Trigger map reset to initial view
  }


  // ==================== COMPUTED GETTERS (Placeholders) ====================

  /**
   * Merged data combining API locations with GeoJSON features
   * This will be implemented in Phase 1.4
   */
  const mergedData = computed(() => {
    // TODO: Implement in Phase 1.4
    // - Merge apiLocations with geoJsonFeatures
    // - Add caseCount property from API data
    // - Handle ID resolution fallback chain
    // - Log warnings for unmatched records
    return []
  })

  /**
   * Filtered locations based on current filter state
   * This will be implemented in Phase 3.2
   */
  const filteredLocations = computed(() => {
    // TODO: Implement in Phase 3.2
    // - Apply region filter (OR within regions)
    // - Apply service filters (AND for multiple services)
    // - Apply name search filter (case-insensitive)
    // - Combine filters with AND at top level
    return mergedData.value
  })

  /**
   * Active locations (pass all filters)
   * This will be implemented in Phase 3.2
   */
  const activeLocations = computed(() => {
    // TODO: Implement in Phase 3.2
    return filteredLocations.value
  })

  /**
   * Inactive locations (fail filters)
   * This will be implemented in Phase 3.2
   */
  const inactiveLocations = computed(() => {
    // TODO: Implement in Phase 3.2
    // - Return locations that don't pass current filters
    return []
  })


  // ==================== EXPORT ====================

  return {
    // Data state
    apiLocations,
    geoJsonFeatures,
    fullGeoJsonFeatures,
    isLoading,
    error,

    // Filter state
    filters,
    searchQuery,
    selectedRegions,

    // Selection state
    selectedLocationId,
    currentLocationDetails,
    currentPeopleList,
    currentPersonDetails,

    // UI state
    isModalLoading,
    modalError,

    // Actions
    fetchInitialData,
    selectLocation,
    setFilter,
    batchUpdateFilters,
    resetAllFilters,

    // Computed getters
    mergedData,
    filteredLocations,
    activeLocations,
    inactiveLocations,
  }
})
