import React, { useState } from 'react';
import { Sliders, RefreshCw, AlertTriangle, ArrowRight, TrendingDown } from 'lucide-react';
import WhatIfPanel from '../components/WhatIfPanel';

const diseaseDefaults = {
  heart: {
    age: 58,
    sex: 1,
    cp: 4,
    trestbps: 160,
    chol: 280,
    fbs: 1,
    restecg: 2,
    thalach: 125,
    exang: 1,
    oldpeak: 2.8,
    slope: 2,
    ca: 2,
    thal: 7
  },
  diabetes: {
    Pregnancies: 4,
    Glucose: 165,
    BloodPressure: 85,
    SkinThickness: 33,
    Insulin: 180,
    BMI: 34.2,
    DiabetesPedigreeFunction: 0.65,
    Age: 46
  },
  liver: {
    Age: 52,
    Gender: "Male",
    Total_Bilirubin: 2.4,
    Direct_Bilirubin: 1.1,
    Alkaline_Phosphotase: 340,
    Alamine_Aminotransferase: 78,
    Aspartate_Aminotransferase: 95,
    Total_Protiens: 6.4,
    Albumin: 2.8,
    Albumin_and_Globulin_Ratio: 0.75
  },
  parkinsons: {
    "MDVP:Fo(Hz)": 120.2,
    "MDVP:Fhi(Hz)": 145.1,
    "MDVP:Flo(Hz)": 98.3,
    "MDVP:Jitter(%)": 0.012,
    "MDVP:Jitter(Abs)": 0.00009,
    "MDVP:RAP": 0.0055,
    "MDVP:PPQ": 0.0068,
    "Jitter:DDP": 0.0165,
    "MDVP:Shimmer": 0.058,
    "MDVP:Shimmer(dB)": 0.52,
    "Shimmer:APQ3": 0.029,
    "Shimmer:APQ5": 0.038,
    "MDVP:APQ": 0.045,
    "Shimmer:DDA": 0.088,
    "NHR": 0.035,
    "HNR": 18.2,
    "RPDE": 0.58,
    "DFA": 0.78,
    "spread1": -4.2,
    "spread2": 0.31,
    "D2": 2.65,
    "PPE": 0.32
  }
};

export default function WhatIfPage() {
  const [selectedDisease, setSelectedDisease] = useState('heart');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-indigo-700 to-purple-800 text-white rounded-2xl p-6 shadow-md flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <Sliders className="w-8 h-8 text-indigo-200" />
            <h1 className="text-2xl font-bold tracking-tight">Counterfactual What-If Risk Simulator</h1>
          </div>
          <p className="text-indigo-100 text-sm max-w-2xl">
            Simulate how clinical lifestyle interventions, medication adherence, or parameter improvements directly alter patient risk scores.
          </p>
        </div>
        
        <div className="flex gap-2">
          {['heart', 'diabetes', 'liver', 'parkinsons'].map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDisease(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                selectedDisease === d
                  ? 'bg-white text-indigo-800 shadow'
                  : 'bg-indigo-900/60 text-indigo-100 hover:bg-indigo-900'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <WhatIfPanel
        disease={selectedDisease}
        baselineInputs={diseaseDefaults[selectedDisease]}
        currentProbability={0.76}
      />
    </div>
  );
}
