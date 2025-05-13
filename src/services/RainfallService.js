import Papa from 'papaparse';

// Load CSV file
const loadCsvFile = async (fileName) => {
  try {
    // In a web environment, we fetch the file from the public folder
    const response = await fetch(`/${fileName}`);
    const fileContent = await response.text();
    
    // Parse CSV
    return new Promise((resolve) => {
      Papa.parse(fileContent, {
        header: true,
        dynamicTyping: true, // Convert numbers from strings to numbers
        complete: (results) => {
          resolve(results.data);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          resolve([]);
        }
      });
    });
  } catch (error) {
    console.error('Error loading CSV file:', error);
    return [];
  }
};

// Extract 4-figure grid reference from 10-figure grid reference
const extract4FigureGridRef = (tenFigureRef) => {
  if (!tenFigureRef || tenFigureRef.length < 10) return "";
  return tenFigureRef.substring(0, 4) + tenFigureRef.substring(7, 9);
};

// Get rainfall data for a specific grid reference
const getRainfallData = async (gridReference) => {
  // Load rainfall data
  const rainfallData = await loadCsvFile('rainfall_data.csv');
  
  // Find matching grid reference
  return rainfallData.find(item => item.grid_reference === gridReference);
};

// Get settings
const getSettings = async () => {
  const settings = await loadCsvFile('settings.csv');
  
  // Convert to object
  const settingsObj = {};
  settings.forEach(item => {
    settingsObj[item.setting_name] = item.setting_value;
  });
  
  return settingsObj;
};

// Calculate adjusted rainfall
const calculateAdjustedRainfall = (gridRefRainfall, ownRainfall) => {
  if (ownRainfall && ownRainfall > 0) {
    return ownRainfall * 1.25; // 25% increase for own rainfall
  } else {
    return gridRefRainfall * 1.15; // 15% increase for grid reference rainfall
  }
};

// Calculate maximum likely 2-day rainfall
const calculateMaxLikely2DayRainfall = async (totalAdjustedRainfall) => {
  // Get settings
  const settings = await getSettings();
  
  // Get upper and lower limits
  const upperLimit = settings.upper_rainfall_limit || 100;
  const lowerLimit = settings.lower_rainfall_limit || 50;
  
  // Calculate value using the formula from Excel
  let calculatedValue = (totalAdjustedRainfall * 0.046) + 25;
  
  // Apply limits
  if (calculatedValue > upperLimit) {
    return upperLimit;
  } else if (calculatedValue < lowerLimit) {
    return lowerLimit;
  } else {
    return calculatedValue;
  }
};

// Calculate storage requirements based on rainfall
const calculateStorageRequirements = (adjustedRainfall, uncoveredYardArea, slurryStoreArea, roofArea) => {
  const uncoveredYardRainfall = (uncoveredYardArea * adjustedRainfall) / 1000;
  const slurryStoreRainfall = (slurryStoreArea * adjustedRainfall) / 1000;
  const roofRainfall = (roofArea * adjustedRainfall) / 1000;
  
  return {
    uncoveredYardRainfall,
    slurryStoreRainfall,
    roofRainfall,
    totalRainfall: uncoveredYardRainfall + slurryStoreRainfall + roofRainfall
  };
};

const RainfallService = {
  extract4FigureGridRef,
  getRainfallData,
  getSettings,
  calculateAdjustedRainfall,
  calculateMaxLikely2DayRainfall,
  calculateStorageRequirements
};

export default RainfallService;
