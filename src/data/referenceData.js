// Reference data for livestock calculations, bank slopes, rainfall data, and UI colors

// Bank slope factors used in volume calculations
export const bankSlopeFactors = {
  "Bank slope of 1:0.5 (63 degrees)": 1,
  "Bank slope of 1:1 (45 degrees)": 2,
  "Bank slope of 1:1.5 (33.7 degrees)": 3,
  "Bank slope of 1:2 (26.6 degrees)": 4,
  "Bank slope of 1:2.5 (21.8 degrees)": 5,
  "Bank slope of 1:3 (18.4 degrees)": 6
};

// UI color scheme
export const colors = {
  primary: '#0090d4',
  secondary: '#339933',
  error: '#d32f2f',
  warning: '#f57c00',
  success: '#388e3c',
  background: '#f5f5f5',
  text: '#1f4350',
  lightText: '#718096',
  border: '#e2e8f0'
};

// Reference data for livestock excreta and nitrogen values
export const livestockReferenceData = {
  "Dairy Cow": {
    "After first calf": {
      "Low (<6000)": {
        dailyExcreta: 41, // Litres per day
        annualNitrogen: 83 // kg/year
      },
      "Medium (6000-9000)": {
        dailyExcreta: 53,
        annualNitrogen: 101
      },
      "High (>9000)": {
        dailyExcreta: 66,
        annualNitrogen: 117
      }
    }
  },
  "Dairy Followers": {
    "< 3 months": {
      dailyExcreta: 5,
      annualNitrogen: 21
    },
    "3-13 months": {
      dailyExcreta: 9,
      annualNitrogen: 38
    },
    "13-25 months": {
      dailyExcreta: 13,
      annualNitrogen: 59
    }
  },
  "Beef Suckler": {
    "After first calf": {
      "Small (450kg)": {
        dailyExcreta: 25,
        annualNitrogen: 79
      },
      "Medium (550kg)": {
        dailyExcreta: 28,
        annualNitrogen: 93
      },
      "Large (650kg)": {
        dailyExcreta: 36,
        annualNitrogen: 111
      }
    }
  },
  "Beef Cattle": {
    "< 3 months": {
      dailyExcreta: 5,
      annualNitrogen: 11
    },
    "3-13 months": {
      dailyExcreta: 9,
      annualNitrogen: 32
    },
    "13-25 months": {
      dailyExcreta: 13,
      annualNitrogen: 59
    },
    "Intensive beef (>500kg)": {
      dailyExcreta: 28,
      annualNitrogen: 84
    }
  },
  "Sheep": {
    "Lamb < 6 months": {
      dailyExcreta: 0.4,
      annualNitrogen: 1
    },
    "Lamb 6-12 months": {
      dailyExcreta: 0.8,
      annualNitrogen: 2
    },
    "Ewe & lamb(s)": {
      dailyExcreta: 3,
      annualNitrogen: 8
    },
    "Ram": {
      dailyExcreta: 3,
      annualNitrogen: 8
    }
  },
  "Pigs": {
    "Sow & litter (to 7kg)": {
      dailyExcreta: 10,
      annualNitrogen: 19
    },
    "Dry sow (in-pig)": {
      dailyExcreta: 5,
      annualNitrogen: 11
    },
    "Weaner (7-13kg)": {
      dailyExcreta: 1,
      annualNitrogen: 3
    },
    "Weaner (13-31kg)": {
      dailyExcreta: 2,
      annualNitrogen: 4
    },
    "Grower (31-66kg)": {
      dailyExcreta: 3,
      annualNitrogen: 8
    },
    "Finisher (66-100kg)": {
      dailyExcreta: 4,
      annualNitrogen: 10
    },
    "Maiden gilts (66-100kg)": {
      dailyExcreta: 4,
      annualNitrogen: 10
    },
    "Boar (66-150kg)": {
      dailyExcreta: 4,
      annualNitrogen: 10
    },
    "Boar (>150kg)": {
      dailyExcreta: 5,
      annualNitrogen: 11
    }
  },
  "Poultry": {
    "Broiler (< 2.4kg)": {
      dailyExcreta: 0.08,
      annualNitrogen: 0.3
    },
    "Layer (< 2.4kg)": {
      dailyExcreta: 0.12,
      annualNitrogen: 0.5
    },
    "Turkey (≤ 14kg)": {
      dailyExcreta: 0.16,
      annualNitrogen: 0.6
    },
    "Duck (≤ 7kg)": {
      dailyExcreta: 0.15,
      annualNitrogen: 0.6
    }
  }
};
