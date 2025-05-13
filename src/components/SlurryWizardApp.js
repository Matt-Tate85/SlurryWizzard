import React, { useState, useEffect } from 'react';
import AHDBLogo from '../assets/ahdb-logo.png';
import { 
  livestockReferenceData, 
  bankSlopeFactors
  // Remove rainfallData from here
} from '../data/referenceData';
import RainfallService from '../services/RainfallService'; // Add this import
import './SlurryWizardApp.css';

/**
 * Main component for the Slurry Wizard application
 */
function SlurryWizardApp() {
  // State to store all form data
  const [formData, setFormData] = useState({
    // Farm details
    farmName: "",
    farmableArea: 0,
    gridReference10Fig: "",
    gridReference4Fig: "",
    maxRainfall: "", // If blank, will be calculated based on grid reference
    cattleInHerd: 0,
    cowsInMilk: 0,
    milkYield: 0,
    
    // Financial settings
    depreciation: 2.5,
    interestRate: 5,
    waterCost: 1.5,
    slurrySpreadingCost: 2,
    waterStorageCost: 85,
    divertWaterCost: 35,
    roofingCost: 60,
    slurryStoreCost: 75,
    
    // Earth bank stores
    earthBankStores: [
      { bankSlope: "Bank slope of 1:2.5 (21.8 degrees)", length: 0, width: 0, depth: 0, volume: 0 }
    ],
    
    // Tower stores (rectangular & circular)
    towerStores: [
      { length: 0, width: 0, depth: 0, diameter: 0, volume: 0 }
    ],
    
    // Slurry bags
    slurryBags: [
      { volume: 0 }
    ],
    
    // Slurry separator
    useSeparator: false,
    separatorReduction: 30, // Percentage reduction in slurry volume
    
    // Parlour washings
    includeParlourWashings: false,
    parlourWashingsPerCow: 20, // litres per cow per day
    
    // Pig wash water
    includePigWashWater: false,
    usePresetNVZValues: true,
    pigWashWaterValues: { // litres per place per day
      sowIncLitters: 7,
      drySow: 7,
      weaner7to13kg: 7,
      weaner13to31kg: 7,
      growerDryFed: 7,
      growerLiquidFed: 7,
      finisherDryFed: 7,
      finisherLiquidFed: 7,
      maidenGilt: 7,
      boar66to150kg: 7,
      boarOver150kg: 7
    },
    pigWashWaterTotal: 0, // If not using preset values
    
    // Yards
    yards: [
      { area: 0, description: "" }
    ],
    
    // Roofs
    roofs: [
      { area: 0, description: "" }
    ],
    
    // Livestock data
    livestock: [
      { 
        type: "Dairy Cow", 
        age: "After first calf", 
        yield: "Medium (6000-9000)", 
        number: 0, 
        slurryPercent: 100,
        dailyExcreta: 53, // Litres per day
        annualNitrogen: 101 // kg/year
      }
    ]
  });
  
  // State to store calculated results
  const [results, setResults] = useState({
    // Storage capacity
    totalEarthBankVolume: 0,
    totalTowerVolume: 0,
    totalBagVolume: 0,
    totalStorageCapacity: 0,
    
    // Livestock excreta
    totalDailyExcreta: 0,
    totalAnnualSlurry: 0,
    totalNitrogen: 0,
    
    // Rainfall and washings
    predictedRainfall: 0,
    totalYardArea: 0,
    totalRoofArea: 0,
    rainwaterCollected: 0,
    parlourWashings: 0,
    pigWashings: 0,
    
    // Monthly breakdown
    monthlyProduction: [],
    monthlyCapacity: [],
    storageMonths: 0,
    
    // Results
    nitrogenLoading: 0,
    receptionPitSize: 0,
    complianceStatus: "",
    recommendations: []
  });
  
  // Active tab state
  const [activeTab, setActiveTab] = useState(0);
  
  // Rainfall constants
  const MAX_RAINFALL = 100; // Upper likely maximum 2 day rainfall (mm)
  const MIN_RAINFALL = 50;  // Lower likely maximum 2 day rainfall (mm)
  
  // Calculate total storage capacity
  const calculateStorageCapacity = () => {
    // Calculate earth bank store volumes
    let totalEarthBankVolume = 0;
    formData.earthBankStores.forEach(store => {
      if (store.volume > 0) {
        totalEarthBankVolume += parseFloat(store.volume);
      } else if (store.length > 0 && store.width > 0 && store.depth > 0) {
        // Use the bank slope factor in the calculation
        const bankSlopeFactor = bankSlopeFactors[store.bankSlope] || 5; // Default to 1:2.5 slope
        // Volume calculation based on formula from Excel: MAX(0,(E27-(C27*(IF(D27="Bank slope of 1:0.5 (63 degrees)",1,...
        const volume = Math.max(0, (store.depth - (store.length * bankSlopeFactor)) * store.length * store.width);
        totalEarthBankVolume += volume;
      }
    });
    
    // Calculate tower store volumes
    let totalTowerVolume = 0;
    formData.towerStores.forEach(store => {
      if (store.volume > 0) {
        totalTowerVolume += parseFloat(store.volume);
      } else if (store.diameter > 0 && store.depth > 0) {
        // Circular tower calculation
        const radius = store.diameter / 2;
        const volume = Math.PI * radius * radius * store.depth;
        totalTowerVolume += volume;
      } else if (store.length > 0 && store.width > 0 && store.depth > 0) {
        // Rectangular tower calculation
        const volume = store.length * store.width * store.depth;
        totalTowerVolume += volume;
      }
    });
    
    // Calculate slurry bag volumes
    let totalBagVolume = 0;
    formData.slurryBags.forEach(bag => {
      if (bag.volume > 0) {
        totalBagVolume += parseFloat(bag.volume);
      }
    });
    
    // Total storage capacity is the sum of all volumes
    const totalStorageCapacity = totalEarthBankVolume + totalTowerVolume + totalBagVolume;
    
    return {
      totalEarthBankVolume,
      totalTowerVolume,
      totalBagVolume,
      totalStorageCapacity
    };
  };
  
  // Calculate livestock excreta and nitrogen
  const calculateLivestockValues = () => {
    let totalDailyExcreta = 0;
    let totalNitrogen = 0;
    
    formData.livestock.forEach(animal => {
      if (animal.number > 0) {
        // Daily excreta calculation
        const dailyExcreta = animal.dailyExcreta * animal.number * (animal.slurryPercent / 100);
        totalDailyExcreta += dailyExcreta;
        
        // Annual nitrogen calculation
        const annualNitrogen = animal.annualNitrogen * animal.number;
        totalNitrogen += annualNitrogen;
      }
    });
    
    // Calculate annual slurry volume in cubic meters
    const totalAnnualSlurry = totalDailyExcreta * 365 / 1000; // Convert to m³
    
    return {
      totalDailyExcreta,
      totalAnnualSlurry,
      totalNitrogen
    };
  };
  
  // Calculate rainfall contributions
  const calculateRainwaterContribution = () => {
    // Calculate total yard area
    const totalYardArea = formData.yards.reduce((sum, yard) => sum + parseFloat(yard.area || 0), 0);
    
    // Calculate total roof area
    const totalRoofArea = formData.roofs.reduce((sum, roof) => sum + parseFloat(roof.area || 0), 0);
    
    // Get or calculate the maximum likely 2-day rainfall
    let maxRainfall = parseFloat(formData.maxRainfall);
    if (!maxRainfall) {
      // Look up rainfall based on grid reference
      const gridRef = formData.gridReference4Fig;
      
      // Simplified calculation based on Excel formula:
      // IF((((SUM(D32:O32))*0.046)+25)>Lists!E3,Lists!E3,IF((((SUM(D32:O32))*0.046)+25)<Lists!E4,Lists!E4,(((SUM(D32:O32))*0.046)+25)))
      const rainfallArr = rainfallData[gridRef] || rainfallData.DEFAULT;
      const annualRainfall = rainfallArr.reduce((sum, val) => sum + val, 0);
      const calculatedRainfall = (annualRainfall * 0.046) + 25;
      
      // Limit to the valid range
      maxRainfall = Math.min(Math.max(calculatedRainfall, MIN_RAINFALL), MAX_RAINFALL);
    }
    
    // Calculate rainwater collected
    // Convert mm of rainfall to cubic meters of water per area
    const rainwaterCollected = (totalYardArea + totalRoofArea) * (maxRainfall / 1000);
    
    return {
      totalYardArea,
      totalRoofArea,
      maxRainfall,
      rainwaterCollected
    };
  };
  
  // Calculate parlour and pig washings
  const calculateWashings = () => {
    // Calculate parlour washings
    let parlourWashings = 0;
    if (formData.includeParlourWashings) {
      parlourWashings = formData.cowsInMilk * formData.parlourWashingsPerCow * 365 / 1000; // Convert to m³/year
    }
    
    // Calculate pig washings
    let pigWashings = 0;
    if (formData.includePigWashWater) {
      if (formData.usePresetNVZValues) {
        // Use the preset values and number of pigs
        // This is a simplified approximation
        const washPerPig = 7; // litres per pig per day (using a default value)
        pigWashings = formData.cattleInHerd * washPerPig * 365 / 1000; // Convert to m³/year
      } else {
        // Use the total specified
        pigWashings = formData.pigWashWaterTotal * 365 / 1000; // Convert to m³/year
      }
    }
    
    return {
      parlourWashings,
      pigWashings
    };
  };
  
  // Calculate monthly breakdown of slurry production and storage capacity
  const calculateMonthlyBreakdown = (livestockValues, rainwaterValues, washingValues, storageCapacity) => {
    const months = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
    const daysInMonth = [30, 31, 30, 31, 31, 28, 31, 30, 31, 30, 31, 31];
    
    // Calculate daily production in cubic meters
    const dailySlurry = livestockValues.totalDailyExcreta / 1000; // Convert from litres to m³
    
    // Apply separator reduction if used
    const separatorFactor = formData.useSeparator ? (1 - (formData.separatorReduction / 100)) : 1;
    
    // Calculate monthly production and remaining capacity
    let remainingCapacity = storageCapacity.totalStorageCapacity;
    const monthlyProduction = [];
    const monthlyCapacity = [];
    
    for (let i = 0; i < months.length; i++) {
      // Calculate production for this month
      const daysThisMonth = daysInMonth[i];
      const livestockSlurry = dailySlurry * daysThisMonth * separatorFactor;
      
      // Add rainfall and washings contribution for this month
      // This is a simplified approach - the actual Excel might distribute these differently
      const rainwaterThisMonth = rainwaterValues.rainwaterCollected / 12;
      const washingsThisMonth = (washingValues.parlourWashings + washingValues.pigWashings) / 12;
      
      // Total production for this month
      const totalMonthlyProduction = livestockSlurry + rainwaterThisMonth + washingsThisMonth;
      monthlyProduction.push(totalMonthlyProduction);
      
      // Update remaining capacity
      remainingCapacity -= totalMonthlyProduction;
      monthlyCapacity.push(remainingCapacity);
    }
    
    // Calculate months of storage
    // In the Excel, this seems to be calculated as the count of months where capacity is positive
    const storageMonths = monthlyCapacity.filter(cap => cap > 0).length;
    
    return {
      months,
      monthlyProduction,
      monthlyCapacity,
      storageMonths
    };
  };
  
  // Calculate nitrogen loading
  const calculateNitrogenLoading = (totalNitrogen, farmableArea) => {
    if (!farmableArea || farmableArea <= 0) return 0;
    
    // Simple N loading calculation (kg/ha)
    return totalNitrogen / farmableArea;
  };
  
  // Generate recommendations based on calculated values
  const generateRecommendations = (storageMonths, nitrogenLoading, rainwaterCollected) => {
    const recommendations = [];
    
    // Storage capacity recommendations
    if (storageMonths < 4) {
      recommendations.push("Insufficient storage capacity. Consider expanding your slurry stores.");
    } else if (storageMonths < 6) {
      recommendations.push("Storage capacity is marginal. Additional capacity would be beneficial.");
    } else {
      recommendations.push("You comply with the guidance for minimum storage of 6 months.");
    }
    
    // Nitrogen loading recommendations
    if (nitrogenLoading > 170) {
      recommendations.push("Nitrogen loading exceeds the recommended 170 kg/ha limit for NVZs.");
    }
    
    // Rainwater recommendations
    if (storageMonths < 6 && rainwaterCollected > 0) {
      recommendations.push("Consider collecting roof water and/or diverting to a clean drain.");
    }
    
    // Slurry cover recommendations
    if (storageMonths < 6) {
      recommendations.push("Consider covering slurry storage with an impermeable cover.");
    }
    
    return recommendations;
  };
  
  // Calculate reception pit size
  const calculateReceptionPitSize = (dailyExcreta, rainwaterValues) => {
    // Based on formula from Excel:
    // IF('1. Slurry Data Entry'!C10<>"",(SUM(((H24+H26+H27)/31)*2)+(C36*('1. Slurry Data Entry'!C10/1000)+(C38*('1. Slurry Data Entry'!C10/1000))))
    
    // This is a simplified approximation
    const dailyVolume = dailyExcreta / 1000; // Convert to m³/day
    const maxRainfall = rainwaterValues.maxRainfall;
    const totalYardArea = rainwaterValues.totalYardArea;
    const totalRoofArea = rainwaterValues.totalRoofArea;
    
    // Calculate reception pit size for 2 days of production plus rainfall
    const receptionPitSize = (dailyVolume * 2) + 
                            (totalYardArea * (maxRainfall / 1000)) + 
                            (totalRoofArea * (maxRainfall / 1000));
    
    return receptionPitSize;
  };
  
  // Main calculation function that ties everything together
  const performCalculations = () => {
    // Calculate storage capacity
    const storageCapacity = calculateStorageCapacity();
    
    // Calculate livestock values
    const livestockValues = calculateLivestockValues();
    
    // Calculate rainfall contribution
    const rainwaterValues = calculateRainwaterContribution();
    
    // Calculate washings
    const washingValues = calculateWashings();
    
    // Calculate monthly breakdown
    const monthlyData = calculateMonthlyBreakdown(
      livestockValues, 
      rainwaterValues, 
      washingValues, 
      storageCapacity
    );
    
    // Calculate nitrogen loading
    const nitrogenLoading = calculateNitrogenLoading(
      livestockValues.totalNitrogen, 
      parseFloat(formData.farmableArea)
    );
    
    // Calculate reception pit size
    const receptionPitSize = calculateReceptionPitSize(
      livestockValues.totalDailyExcreta,
      rainwaterValues
    );
    
    // Generate recommendations
    const recommendations = generateRecommendations(
      monthlyData.storageMonths,
      nitrogenLoading,
      rainwaterValues.rainwaterCollected
    );
    
    // Determine compliance status
    const complianceStatus = monthlyData.storageMonths >= 6 
      ? "You comply with the guidance for minimum storage of 6 months."
      : "You do not have at least 6 months storage. Consider whether you can comply with FRfW requirements and increase storage capacity if not.";
    
    // Update the results state
    setResults({
      ...storageCapacity,
      ...livestockValues,
      ...rainwaterValues,
      ...washingValues,
      months: monthlyData.months,
      monthlyProduction: monthlyData.monthlyProduction,
      monthlyCapacity: monthlyData.monthlyCapacity,
      storageMonths: monthlyData.storageMonths,
      nitrogenLoading,
      receptionPitSize,
      complianceStatus,
      recommendations
    });
  };
  
  // Handle form field changes
  const handleFormChange = (section, field, value, index = null) => {
    if (index !== null) {
      // Handle array fields
      setFormData(prevData => {
        const newArray = [...prevData[section]];
        newArray[index] = { ...newArray[index], [field]: value };
        return { ...prevData, [section]: newArray };
      });
    } else {
      // Handle simple fields
      setFormData(prevData => ({ ...prevData, [field]: value }));
    }
  };
  
  // Add a new item to an array field
  const handleAddItem = (section) => {
    setFormData(prevData => {
      let newItem;
      
      switch (section) {
        case 'earthBankStores':
          newItem = { bankSlope: "Bank slope of 1:2.5 (21.8 degrees)", length: 0, width: 0, depth: 0, volume: 0 };
          break;
        case 'towerStores':
          newItem = { length: 0, width: 0, depth: 0, diameter: 0, volume: 0 };
          break;
        case 'slurryBags':
          newItem = { volume: 0 };
          break;
        case 'yards':
          newItem = { area: 0, description: "" };
          break;
        case 'roofs':
          newItem = { area: 0, description: "" };
          break;
        case 'livestock':
          newItem = { 
            type: "Dairy Cow", 
            age: "After first calf", 
            yield: "Medium (6000-9000)", 
            number: 0, 
            slurryPercent: 100,
            dailyExcreta: 53,
            annualNitrogen: 101
          };
          break;
        default:
          newItem = {};
      }
      
      return { ...prevData, [section]: [...prevData[section], newItem] };
    });
  };
  
  // Remove an item from an array field
  const handleRemoveItem = (section, index) => {
    setFormData(prevData => {
      const newArray = [...prevData[section]];
      if (newArray.length > 1) {
        newArray.splice(index, 1);
      }
      return { ...prevData, [section]: newArray };
    });
  };
  
  // Update livestock values when type/age/yield are changed
  const handleLivestockTypeChange = (index, type, age, yield_) => {
    const typeData = livestockReferenceData[type];
    if (!typeData) return;
    
    const ageData = typeData[age];
    if (!ageData) return;
    
    let values;
    if (typeof ageData === 'object' && !Array.isArray(ageData) && ageData !== null) {
      if (yield_ && ageData[yield_]) {
        values = ageData[yield_];
      } else {
        // If no specific yield data, use the first available values
        values = Object.values(ageData)[0];
      }
    } else {
      values = ageData;
    }
    
    setFormData(prevData => {
      const newLivestock = [...prevData.livestock];
      newLivestock[index] = { 
        ...newLivestock[index], 
        type,
        age,
        yield: yield_ || "",
        dailyExcreta: values.dailyExcreta,
        annualNitrogen: values.annualNitrogen
      };
      return { ...prevData, livestock: newLivestock };
    });
  };
  
  // Calculate grid reference from 10 figure to 4 figure
  const calculate4FigGridRef = (gridRef10Fig) => {
    if (!gridRef10Fig || gridRef10Fig.length < 10) return "";
    
    // Extract the first 2 letters and first 2 digits of each coordinate
    const letters = gridRef10Fig.match(/[A-Za-z]+/) ? gridRef10Fig.match(/[A-Za-z]+/)[0] : "";
    const digits = gridRef10Fig.match(/\d+/g);
    
    if (!letters || !digits || digits.length < 2) return "";
    
    const eastings = digits[0].substring(0, 2);
    const northings = digits[1].substring(0, 2);
    
    return letters + eastings + northings;
  };
  
  // Handle grid reference change
  const handleGridReferenceChange = (value) => {
    setFormData(prevData => {
      const gridReference4Fig = calculate4FigGridRef(value);
      return { 
        ...prevData, 
        gridReference10Fig: value,
        gridReference4Fig
      };
    });
  };
  
  // Effect to run calculations when form data changes
  useEffect(() => {
    performCalculations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);
  
  // Render the UI
  return (
    <div className="slurry-wizard">
      {/* Header */}
      <header className="header">
        <div className="container header-container">
          <h1>AHDB Slurry Wizard</h1>
          <img src={AHDBLogo} alt="AHDB Logo" className="logo" />
        </div>
      </header>
      
      {/* Tab Navigation */}
      <nav className="tab-navigation">
        <div className="container">
          <ul className="tabs">
            <li>
              <button 
                onClick={() => setActiveTab(0)}
                className={`tab-button ${activeTab === 0 ? 'active' : ''}`}
                aria-pressed={activeTab === 0}
                aria-controls="tab-panel-0"
                id="tab-0"
              >
                1. Farm & Slurry Data
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab(1)}
                className={`tab-button ${activeTab === 1 ? 'active' : ''}`}
                aria-pressed={activeTab === 1}
                aria-controls="tab-panel-1"
                id="tab-1"
              >
                2. Livestock Data
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab(2)}
                className={`tab-button ${activeTab === 2 ? 'active' : ''}`}
                aria-pressed={activeTab === 2}
                aria-controls="tab-panel-2"
                id="tab-2"
              >
                3. Slurry Report
              </button>
            </li>
          </ul>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="main-content">
        <div className="container">
          {/* Tab 1: Farm & Slurry Data */}
          <div 
            className={`tab-panel ${activeTab === 0 ? 'active' : ''}`}
            id="tab-panel-0"
            aria-labelledby="tab-0"
            role="tabpanel"
          >
            <h2 className="section-title">Farm & Slurry Data Entry</h2>
            
            {/* Farm details form */}
            <section className="form-section">
              <h3 className="subsection-title">Baseline farm data</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="farm-name" className="form-label">
                    Farm name / reference
                  </label>
                  <input
                    type="text"
                    id="farm-name"
                    className="form-input"
                    value={formData.farmName}
                    onChange={(e) => handleFormChange(null, 'farmName', e.target.value)}
                    aria-label="Farm name or reference"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="farmable-area" className="form-label">
                    Total farmable area (hectares)
                  </label>
                  <input
                    type="number"
                    id="farmable-area"
                    className="form-input"
                    value={formData.farmableArea}
                    onChange={(e) => handleFormChange(null, 'farmableArea', e.target.value)}
                    aria-label="Total farmable area in hectares"
                    min="0"
                    step="0.1"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="grid-ref" className="form-label">
                    Slurry store 10 figure grid reference
                  </label>
                  <input
                    type="text"
                    id="grid-ref"
                    className="form-input"
                    value={formData.gridReference10Fig}
                    onChange={(e) => handleGridReferenceChange(e.target.value)}
                    aria-label="Slurry store grid reference"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="max-rainfall" className="form-label">
                    Maximum likely 2 day rainfall (mm)
                  </label>
                  <input
                    type="number"
                    id="max-rainfall"
                    className="form-input"
                    value={formData.maxRainfall}
                    onChange={(e) => handleFormChange(null, 'maxRainfall', e.target.value)}
                    aria-label="Maximum likely 2 day rainfall in millimeters"
                    min="0"
                    step="1"
                  />
                  <small className="form-help-text">
                    If known, otherwise leave blank and it will be calculated automatically
                  </small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="cattle-herd" className="form-label">
                    Cattle in herd
                  </label>
                  <input
                    type="number"
                    id="cattle-herd"
                    className="form-input"
                    value={formData.cattleInHerd}
                    onChange={(e) => handleFormChange(null, 'cattleInHerd', e.target.value)}
                    aria-label="Number of cattle in herd"
                    min="0"
                    step="1"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="cows-milk" className="form-label">
                    Cows in milk
                  </label>
                  <input
                    type="number"
                    id="cows-milk"
                    className="form-input"
                    value={formData.cowsInMilk}
                    onChange={(e) => handleFormChange(null, 'cowsInMilk', e.target.value)}
                    aria-label="Number of cows in milk"
                    min="0"
                    step="1"
                  />
                </div>
              </div>
            </section>
            
            {/* Earth bank stores */}
            <section className="form-section">
              <h3 className="subsection-title">Slurry storage capacity for earth bank stores</h3>
              
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Store</th>
                      <th>Bank slope</th>
                      <th>Length (m)</th>
                      <th>Width (m)</th>
                      <th>Depth (m)</th>
                      <th>Volume (m³)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.earthBankStores.map((store, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                        <td>Store {index + 1}</td>
                        <td>
                          <select
                            className="form-select"
                            value={store.bankSlope}
                            onChange={(e) => handleFormChange('earthBankStores', 'bankSlope', e.target.value, index)}
                            aria-label={`Bank slope for store ${index + 1}`}
                          >
                            {Object.keys(bankSlopeFactors).map(slope => (
                              <option key={slope} value={slope}>{slope}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-input"
                            value={store.length}
                            onChange={(e) => handleFormChange('earthBankStores', 'length', e.target.value, index)}
                            aria-label={`Length for store ${index + 1}`}
                            min="0"
                            step="0.1"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-input"
                            value={store.width}
                            onChange={(e) => handleFormChange('earthBankStores', 'width', e.target.value, index)}
                            aria-label={`Width for store ${index + 1}`}
                            min="0"
                            step="0.1"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-input"
                            value={store.depth}
                            onChange={(e) => handleFormChange('earthBankStores', 'depth', e.target.value, index)}
                            aria-label={`Depth for store ${index + 1}`}
                            min="0"
                            step="0.1"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-input"
                            value={store.volume}
                            onChange={(e) => handleFormChange('earthBankStores', 'volume', e.target.value, index)}
                            aria-label={`Volume for store ${index + 1}`}
                            min="0"
                            step="0.1"
                          />
                        </td>
                        <td>
                          <button
                            onClick={() => handleRemoveItem('earthBankStores', index)}
                            className="button button-remove"
                            aria-label={`Remove store ${index + 1}`}
                            disabled={formData.earthBankStores.length <= 1}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <button
                onClick={() => handleAddItem('earthBankStores')}
                className="button button-primary mt-1"
                aria-label="Add another earth bank store"
              >
                Add Store
              </button>
              
              <p className="form-note">
                Earth bank lagoons must have 750mm of freeboard to protect banks. For new stores, if a bank slope steeper than 1 in 2.5 is being considered then a structural engineer must be consulted regarding the design.
              </p>
            </section>
            
            {/* Slurry separator section */}
            <section className="form-section">
              <h3 className="subsection-title">Slurry separator</h3>
              
              <div className="form-group">
                <label className="form-checkbox-label">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={formData.useSeparator}
                    onChange={(e) => handleFormChange(null, 'useSeparator', e.target.checked)}
                    aria-label="Do you operate a separator for the slurry entering the store(s)"
                  />
                  Do you operate a separator for the slurry entering the store(s)
                </label>
              </div>
              
              {formData.useSeparator && (
                <div className="form-group indented">
                  <label htmlFor="separator-reduction" className="form-label">
                    % reduction in slurry
                  </label>
                  <input
                    type="number"
                    id="separator-reduction"
                    className="form-input form-input-small"
                    value={formData.separatorReduction}
                    onChange={(e) => handleFormChange(null, 'separatorReduction', e.target.value)}
                    aria-label="Percent reduction in slurry"
                    min="0"
                    max="100"
                  />
                  <small className="form-help-text">
                    Adjust the % to reflect the average reduction in slurry volume (refer to manufacturers guidance)
                  </small>
                </div>
              )}
            </section>
            
            {/* Parlour washings section */}
            <section className="form-section">
              <h3 className="subsection-title">Parlour washings to slurry store</h3>
              
              <div className="form-group">
                <label className="form-checkbox-label">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={formData.includeParlourWashings}
                    onChange={(e) => handleFormChange(null, 'includeParlourWashings', e.target.checked)}
                    aria-label="Include parlour washings to slurry store"
                  />
                  Include parlour washings to slurry store
                </label>
              </div>
              
              {formData.includeParlourWashings && (
                <div className="form-group indented">
                  <label htmlFor="parlour-washings" className="form-label">
                    Parlour washing litres per cow per day (l/hd/d)
                  </label>
                  <input
                    type="number"
                    id="parlour-washings"
                    className="form-input form-input-small"
                    value={formData.parlourWashingsPerCow}
                    onChange={(e) => handleFormChange(null, 'parlourWashingsPerCow', e.target.value)}
                    aria-label="Parlour washing litres per cow per day"
                    min="0"
                  />
                  <small className="form-help-text">
                    Note: Suggested 5 to 15 l/hd/d robotic milkers (check with manufacturer). 20 l/hd/d low pressure system. 30 l/hd/d high pressure system.
                  </small>
                </div>
              )}
            </section>
            
            {/* Yard areas section */}
            <section className="form-section">
              <h3 className="subsection-title">Uncovered areas of dirty yards, silage silos and earth bank surrounds to slurry store</h3>
              
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Yard</th>
                      <th>Area (m²)</th>
                      <th>Description (optional)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.yards.map((yard, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                        <td>Yard {index + 1}</td>
                        <td>
                          <input
                            type="number"
                            className="form-input"
                            value={yard.area}
                            onChange={(e) => handleFormChange('yards', 'area', e.target.value, index)}
                            aria-label={`Area for yard ${index + 1}`}
                            min="0"
                            step="0.1"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-input"
                            value={yard.description}
                            onChange={(e) => handleFormChange('yards', 'description', e.target.value, index)}
                            aria-label={`Description for yard ${index + 1}`}
                          />
                        </td>
                        <td>
                          <button
                            onClick={() => handleRemoveItem('yards', index)}
                            className="button button-remove"
                            aria-label={`Remove yard ${index + 1}`}
                            disabled={formData.yards.length <= 1}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="table-total">Total yard area</td>
                      <td className="table-total-value">
                        {results.totalYardArea.toFixed(2)} m²
                      </td>
                      <td colSpan="2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <button
                onClick={() => handleAddItem('yards')}
                className="button button-primary mt-1"
                aria-label="Add another yard"
              >
                Add Yard
              </button>
            </section>
            
            {/* Roof water section */}
            <section className="form-section">
              <h3 className="subsection-title">Roof water area to slurry store</h3>
              
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Roof</th>
                      <th>Area (m²)</th>
                      <th>Description (optional)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.roofs.map((roof, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                        <td>Roof {index + 1}</td>
                        <td>
                          <input
                            type="number"
                            className="form-input"
                            value={roof.area}
                            onChange={(e) => handleFormChange('roofs', 'area', e.target.value, index)}
                            aria-label={`Area for roof ${index + 1}`}
                            min="0"
                            step="0.1"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-input"
                            value={roof.description}
                            onChange={(e) => handleFormChange('roofs', 'description', e.target.value, index)}
                            aria-label={`Description for roof ${index + 1}`}
                          />
                        </td>
                        <td>
                          <button
                            onClick={() => handleRemoveItem('roofs', index)}
                            className="button button-remove"
                            aria-label={`Remove roof ${index + 1}`}
                            disabled={formData.roofs.length <= 1}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="table-total">Total roof area</td>
                      <td className="table-total-value">
                        {results.totalRoofArea.toFixed(2)} m²
                      </td>
                      <td colSpan="2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <button
                onClick={() => handleAddItem('roofs')}
                className="button button-primary mt-1"
                aria-label="Add another roof"
              >
                Add Roof
              </button>
            </section>
            
            {/* Navigation buttons */}
            <div className="form-navigation">
              <button
                onClick={() => setActiveTab(1)}
                className="button button-primary"
                aria-label="Continue to livestock data entry"
              >
                Continue to Livestock Data
              </button>
            </div>
          </div>
          
          {/* Tab 2: Livestock Data */}
          <div 
            className={`tab-panel ${activeTab === 1 ? 'active' : ''}`}
            id="tab-panel-1"
            aria-labelledby="tab-1"
            role="tabpanel"
          >
            <h2 className="section-title">Livestock Data Entry</h2>
            
            <section className="form-section">
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Livestock</th>
                      <th>Age</th>
                      <th>Liveweight/yield</th>
                      <th>Number</th>
                      <th>% as slurry</th>
                      <th>Excreta (l/day)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.livestock.map((animal, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                        <td>
                          <select
                            className="form-select"
                            value={animal.type}
                            onChange={(e) => handleLivestockTypeChange(index, e.target.value, animal.age, animal.yield)}
                            aria-label={`Livestock type for animal ${index + 1}`}
                          >
                            {Object.keys(livestockReferenceData).map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            className="form-select"
                            value={animal.age}
                            onChange={(e) => handleLivestockTypeChange(index, animal.type, e.target.value, animal.yield)}
                            aria-label={`Age for animal ${index + 1}`}
                          >
                            {livestockReferenceData[animal.type] && 
                             Object.keys(livestockReferenceData[animal.type]).map(age => (
                              <option key={age} value={age}>{age}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          {animal.type === "Dairy Cow" || animal.type === "Beef Suckler" ? (
                            <select
                              className="form-select"
                              value={animal.yield}
                              onChange={(e) => handleLivestockTypeChange(index, animal.type, animal.age, e.target.value)}
                              aria-label={`Yield for animal ${index + 1}`}
                            >
                              {livestockReferenceData[animal.type] && 
                               livestockReferenceData[animal.type][animal.age] &&
                               Object.keys(livestockReferenceData[animal.type][animal.age]).map(yield_ => (
                                <option key={yield_} value={yield_}>{yield_}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="form-text">-</span>
                          )}
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-input"
                            value={animal.number}
                            onChange={(e) => handleFormChange('livestock', 'number', e.target.value, index)}
                            aria-label={`Number of animals for ${index + 1}`}
                            min="0"
                            step="1"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-input"
                            value={animal.slurryPercent}
                            onChange={(e) => handleFormChange('livestock', 'slurryPercent', e.target.value, index)}
                            aria-label={`Percentage collected as slurry for animal ${index + 1}`}
                            min="0"
                            max="100"
                            step="1"
                          />
                        </td>
                        <td className="table-data-value">
                          {animal.dailyExcreta}
                        </td>
                        <td>
                          <button
                            onClick={() => handleRemoveItem('livestock', index)}
                            className="button button-remove"
                            aria-label={`Remove animal ${index + 1}`}
                            disabled={formData.livestock.length <= 1}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="table-total">Totals</td>
                      <td colSpan="4"></td>
                      <td className="table-total-value">
                        {results.totalDailyExcreta.toFixed(2)} l/day
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <button
                onClick={() => handleAddItem('livestock')}
                className="button button-primary mt-1"
                aria-label="Add another animal"
              >
                Add Animal
              </button>
              
              <div className="info-panel mt-1">
                <p>
                  For dairy cows, the percentage collected as slurry depends on housing system:
                  <br />- 100% for fully housed dairy
                  <br />- 20-50% if housed overnight only
                  <br />- 10% for grazed dairy
                </p>
              </div>
            </section>
            
            {/* Navigation buttons */}
            <div className="form-navigation">
              <button
                onClick={() => setActiveTab(0)}
                className="button button-secondary"
                aria-label="Back to farm & slurry data"
              >
                Back to Farm & Slurry Data
              </button>
              
              <button
                onClick={() => setActiveTab(2)}
                className="button button-primary"
                aria-label="Continue to slurry report"
              >
                View Slurry Report
              </button>
            </div>
          </div>
          
          {/* Tab 3: Slurry Report */}
          <div 
            className={`tab-panel ${activeTab === 2 ? 'active' : ''}`}
            id="tab-panel-2"
            aria-labelledby="tab-2"
            role="tabpanel"
          >
            <h2 className="section-title">Slurry Report</h2>
            
            {/* Key metrics */}
            <section className="metrics-grid">
              <div className="metric-card">
                <h3 className="metric-title">Farm Nitrogen Loading</h3>
                <p className={`metric-value ${results.nitrogenLoading > 170 ? 'metric-error' : 'metric-success'}`}>
                  {results.nitrogenLoading.toFixed(1)} kg/ha
                </p>
                <p className="metric-note">
                  NB: This is the nitrogen loading BEFORE the import or export of manure
                </p>
              </div>
              
              <div className="metric-card">
                <h3 className="metric-title">Storage Capacity</h3>
                <p className={`metric-value ${
                  results.storageMonths < 4 
                    ? 'metric-error' 
                    : results.storageMonths < 6 
                      ? 'metric-warning' 
                      : 'metric-success'
                }`}>
                  {results.storageMonths.toFixed(1)} months
                </p>
                <p className="metric-note">
                  Minimum recommended: 6 months storage capacity
                </p>
              </div>
              
              <div className="metric-card">
                <h3 className="metric-title">Recommended Reception Pit Size</h3>
                <p className="metric-value">
                  {results.receptionPitSize.toFixed(1)} m³
                </p>
              </div>
              
              <div className="metric-card">
                <h3 className="metric-title">Total Annual Slurry Volume</h3>
                <p className="metric-value">
                  {results.totalAnnualSlurry.toFixed(1)} m³
                </p>
              </div>
            </section>
            
            {/* Recommendations */}
            <section className="form-section">
              <h3 className="subsection-title">Farming Rules for Water recommendations</h3>
              
              <div className={`recommendations-panel ${results.storageMonths >= 6 ? 'recommendations-success' : 'recommendations-warning'}`}>
                <p className="recommendations-status">
                  {results.complianceStatus}
                </p>
                
                <h4 className="recommendations-heading">Recommendations</h4>
                <ul className="recommendations-list">
                  {results.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            </section>
            
            {/* Monthly breakdown */}
            <section className="form-section">
              <h3 className="subsection-title">Slurry volume by month</h3>
              
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Days</th>
                      <th>Production (m³)</th>
                      <th>Capacity (m³)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.months && results.months.map((month, index) => {
                      const daysInMonth = month === 'Feb' ? 28 : ['Apr', 'Jun', 'Sep', 'Nov'].includes(month) ? 30 : 31;
                      const production = results.monthlyProduction[index] || 0;
                      const capacity = results.monthlyCapacity[index] || 0;
                      
                      // Determine status class
                      let statusClass = 'status-success';
                      let statusText = 'OK';
                      
                      if (capacity < 0) {
                        statusClass = 'status-error';
                        statusText = 'Overflow';
                      } else if (capacity < results.totalStorageCapacity * 0.2) {
                        statusClass = 'status-warning';
                        statusText = 'Low capacity';
                      }
                      
                      return (
                        <tr key={index} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                          <td className="text-bold">{month}</td>
                          <td>{daysInMonth}</td>
                          <td>{production.toFixed(1)}</td>
                          <td>{capacity.toFixed(1)}</td>
                          <td>
                            <div className="status-indicator">
                              <span className={`status-dot ${statusClass}`}></span>
                              <span className={`status-text ${statusClass}`}>
                                {statusText}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
            
            {/* Storage capacity visualization */}
            <section className="form-section">
              <h3 className="subsection-title">Storage capacity comparison</h3>
              
              <div className="capacity-visualization">
                <div className="capacity-item">
                  <div className="capacity-label">
                    <span>Total existing capacity:</span>
                    <span>{results.totalStorageCapacity.toFixed(1)} m³</span>
                  </div>
                  <div className="capacity-bar-bg">
                    <div 
                      className="capacity-bar-fill capacity-bar-primary"
                      style={{width: '100%'}}
                    ></div>
                  </div>
                </div>
                
                <div className="capacity-item">
                  <div className="capacity-label">
                    <span>Total annual slurry volume:</span>
                    <span>
                      {results.totalAnnualSlurry.toFixed(1)} m³ 
                      ({results.totalStorageCapacity > 0 
                          ? Math.round((results.totalAnnualSlurry / results.totalStorageCapacity) * 100) 
                          : 0}% of capacity)
                    </span>
                  </div>
                  <div className="capacity-bar-bg">
                    <div 
                      className={`capacity-bar-fill ${
                        results.totalAnnualSlurry > results.totalStorageCapacity 
                          ? 'capacity-bar-error' 
                          : results.totalAnnualSlurry > results.totalStorageCapacity * 0.8 
                            ? 'capacity-bar-warning' 
                            : 'capacity-bar-secondary'
                      }`}
                      style={{
                        width: `${Math.min(100, (results.totalAnnualSlurry / results.totalStorageCapacity) * 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Navigation buttons */}
            <div className="form-navigation">
              <button
                onClick={() => setActiveTab(1)}
                className="button button-secondary"
                aria-label="Back to livestock data"
              >
                Back to Livestock Data
              </button>
              
              <button
                onClick={() => window.print()}
                className="button button-success"
                aria-label="Print report"
              >
                Print Report
              </button>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <img src={AHDBLogo} alt="AHDB Logo" />
              <p>© Agriculture and Horticulture Development Board {new Date().getFullYear()}</p>
            </div>
            <div className="footer-info">
              <p>This application meets WCAG 2.1 AA accessibility standards</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default SlurryWizardApp;
