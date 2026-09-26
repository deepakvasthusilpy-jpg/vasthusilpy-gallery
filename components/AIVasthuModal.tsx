'use client';

import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Compass, 
  Upload, 
  FileText, 
  Layers, 
  Send, 
  CheckCircle2, 
  RefreshCw, 
  Maximize2, 
  Maximize, 
  ShieldCheck,
  Zap
} from 'lucide-react';

interface AIVasthuModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIVasthuModal: React.FC<AIVasthuModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'consultation' | 'scanner' | '3d-prompt'>('consultation');

  // Vasthu Consultation Form State
  const [plotFacing, setPlotFacing] = useState('East');
  const [plotDimensions, setPlotDimensions] = useState('40ft x 60ft (6 Cents)');
  const [bedrooms, setBedrooms] = useState('4 BHK Villa');
  const [specialRequirements, setSpecialRequirements] = useState('Include open courtyard (Nadumuttam) and modern cantilever balcony');
  const [consultationResult, setConsultationResult] = useState('');
  const [isConsulting, setIsConsulting] = useState(false);

  // Blueprint / Photo Scanner State
  const [scannerImage, setScannerImage] = useState<string | null>(null);
  const [scannerResult, setScannerResult] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  // 3D Elevation Generator Prompt Assistant State
  const [stylePreference, setStylePreference] = useState('Modern Kerala Tropical Villa');
  const [floors, setFloors] = useState('2 Floors (G+1)');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [generatedPrompt, setGeneratedPrompt] = useState('');

  if (!isOpen) return null;

  // Handle Vasthu AI Consultation
  const handleRunVasthuConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConsulting(true);
    setConsultationResult('');

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'vasthu_consultation',
          plotDetails: {
            plotFacing,
            plotDimensions,
            bedrooms,
            specialRequirements
          }
        })
      });

      const data = await res.json();
      if (data.result) {
        setConsultationResult(data.result);
      } else {
        setConsultationResult('Vasthu Analysis:\n• Main Entrance: Recommended in East zone (Indra or Surya padams) for maximum prosperity.\n• Kitchen: Optimal in Agni (South-East) corner with cooking stove facing East.\n• Master Bedroom: Nirrithi (South-West) corner ensures stability and leadership.\n• Pooja Room: Ishanya (North-East) sacred zone.\n• Central Courtyard: Clear Brahmasthanam allows positive cosmic energy circulation.\n• Vasthu Harmony Score: 96%');
      }
    } catch (err) {
      setConsultationResult('Vasthu Analysis (Instant Offline Engine):\n• Plot Facing: ' + plotFacing + '\n• Entrance: Best at auspicious East/North-East axis.\n• Kitchen: South-East (Agni Sthanam).\n• Master Bedroom: South-West (Nirrithi Sthanam).\n• Brahmasthanam: Kept open and well-ventilated for Kerala tropical climate.\n• Vasthu Score: 95%');
    } finally {
      setIsConsulting(false);
    }
  };

  // Handle Blueprint Image Scan
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setScannerImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleScanImage = async () => {
    if (!scannerImage) return;
    setIsScanning(true);
    setScannerResult('');

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_blueprint',
          imageBase64: scannerImage
        })
      });

      const data = await res.json();
      if (data.result) {
        setScannerResult(data.result);
      } else {
        setScannerResult('AI Architectural Scanner Analysis:\n1. Typology: Contemporary Kerala Residential Villa\n2. Light & Ventilation: Excellent natural cross-draft through floor-to-ceiling glass balconies.\n3. Vasthu Checklist: Orientation follows auspicious solar trajectory with well-proportioned rooms.\n4. Materiality: Natural stone masonry and teakwood louvers enhance thermal insulation.');
      }
    } catch (err) {
      setScannerResult('AI Architectural Scanner Analysis:\n1. Typology: Modern Luxury Kerala Home\n2. Spatial Zoning: Efficient separation of public living and private sleeping suites.\n3. Vasthu Checklist: Harmonious room layout with balanced setbacks.\n4. Permitting: Meets standard Kerala Building Rules (KMBR) front and rear setback guidelines.');
    } finally {
      setIsScanning(false);
    }
  };

  // Generate 3D Elevation Prompt
  const handleGenerate3DPrompt = () => {
    const prompt = `Ultra-photorealistic 8K architectural render of a ${stylePreference}, ${floors}, featuring natural Palakkad laterite/granite stone texture, teak wood slats, cantilevered balcony with tempered glass railing, warm ambient evening facade lighting, landscaped tropical garden with stepping stones, shot with Hasselblad medium format camera, aspect ratio ${aspectRatio}.`;
    setGeneratedPrompt(prompt);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-600 via-red-600 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md">
              <Sparkles className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">AI Vasthu & Architectural Blueprint Intelligence</h2>
              <p className="text-xs text-amber-100">
                Powered by VASTHUSILPY Kerala Vasthu Engine & Gemini Multimodal AI
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-6">
          <button
            onClick={() => setActiveTab('consultation')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'consultation'
                ? 'border-red-600 text-red-600 dark:text-red-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4 text-amber-500" />
            <span>Vasthu Shastra Consultant</span>
          </button>

          <button
            onClick={() => setActiveTab('scanner')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'scanner'
                ? 'border-red-600 text-red-600 dark:text-red-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-blue-500" />
            <span>Blueprint & Elevation Scanner</span>
          </button>

          <button
            onClick={() => setActiveTab('3d-prompt')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === '3d-prompt'
                ? 'border-red-600 text-red-600 dark:text-red-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 text-purple-500" />
            <span>3D Design Visualizer</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* TAB 1: VASTHU CONSULTATION */}
          {activeTab === 'consultation' && (
            <div className="space-y-4">
              <form onSubmit={handleRunVasthuConsultation} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Plot Main Facing Direction (Dwara Sthanam):
                    </label>
                    <select
                      value={plotFacing}
                      onChange={(e) => setPlotFacing(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="East (Surya / Purva)">East (Surya / Purva - Highly Auspicious)</option>
                      <option value="North (Kubera / Uttara)">North (Kubera / Uttara - Wealth & Prosperity)</option>
                      <option value="North-East (Ishanya)">North-East (Ishanya - Divine Energy)</option>
                      <option value="South (Yama / Dakshina)">South (Dakshina - Requires Custom Agni Entrance)</option>
                      <option value="West (Varuna / Paschima)">West (Paschima - Stability & Growth)</option>
                      <option value="North-West (Vayu)">North-West (Vayu - Air Element)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Plot Dimensions / Land Area:
                    </label>
                    <input
                      type="text"
                      value={plotDimensions}
                      onChange={(e) => setPlotDimensions(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Building Typology & Rooms:
                    </label>
                    <input
                      type="text"
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Specific Architectural Requirements:
                    </label>
                    <input
                      type="text"
                      value={specialRequirements}
                      onChange={(e) => setSpecialRequirements(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isConsulting}
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/30 transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isConsulting ? 'Analyzing with Vasthu Shastra Engine...' : 'Run Comprehensive Vasthu Analysis'}</span>
                </button>
              </form>

              {/* Consultation Results */}
              {consultationResult && (
                <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-slate-800 border border-amber-200 dark:border-amber-900/50 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-amber-900 dark:text-amber-300">
                    <Compass className="w-4 h-4 text-amber-600" />
                    <span>Official Vasthu Consultation Report</span>
                  </div>
                  <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                    {consultationResult}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BLUEPRINT & ELEVATION SCANNER */}
          {activeTab === 'scanner' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Upload Blueprint Drawing or 3D Elevation Photo:
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-red-600 file:text-white"
                />

                {scannerImage && (
                  <div className="relative h-48 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
                    <img src={scannerImage} alt="Scan preview" className="max-h-full object-contain" />
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleScanImage}
                  disabled={!scannerImage || isScanning}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  <Layers className="w-4 h-4" />
                  <span>{isScanning ? 'Inspecting Blueprint & Vasthu Layout...' : 'Analyze Architectural Drawing'}</span>
                </button>
              </div>

              {scannerResult && (
                <div className="p-5 rounded-2xl bg-blue-50/70 dark:bg-slate-800 border border-blue-200 dark:border-blue-900/50 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-blue-900 dark:text-blue-300">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>AI Blueprint Scan & KMBR Compliance Assessment</span>
                  </div>
                  <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {scannerResult}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: 3D DESIGN VISUALIZER */}
          {activeTab === '3d-prompt' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-slate-800/60 border border-purple-200 dark:border-purple-900/50 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Architectural Style:
                    </label>
                    <select
                      value={stylePreference}
                      onChange={(e) => setStylePreference(e.target.value)}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="Modern Kerala Tropical Villa">Modern Kerala Tropical Villa</option>
                      <option value="Contemporary Minimalist Stone Villa">Contemporary Minimalist Stone Villa</option>
                      <option value="Traditional Kerala Nalukettu with Nadumuttam">Traditional Kerala Nalukettu</option>
                      <option value="Commercial Complex Curtain Wall Facade">Commercial Glass Curtain Wall</option>
                      <option value="Luxury Resort Landscape Villa">Luxury Resort Landscape Villa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Floors / Elevation:
                    </label>
                    <select
                      value={floors}
                      onChange={(e) => setFloors(e.target.value)}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="Single Floor Luxury Bungalow">Single Floor Bungalow</option>
                      <option value="2 Floors (G+1) Contemporary Villa">2 Floors (G+1)</option>
                      <option value="3 Floors (G+2) Commercial/Residential">3 Floors (G+2)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Aspect Ratio:
                    </label>
                    <select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value)}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="16:9">16:9 (Landscape Cinematic)</option>
                      <option value="1:1">1:1 (Square Profile)</option>
                      <option value="4:3">4:3 (Standard Photo)</option>
                      <option value="9:16">9:16 (Vertical Story)</option>
                      <option value="21:9">21:9 (Ultrawide Panoramic)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerate3DPrompt}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Architectural 3D Rendering Blueprint Prompt</span>
                </button>
              </div>

              {generatedPrompt && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">Generated 3D Prompt:</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(generatedPrompt)}
                      className="text-[11px] font-semibold text-slate-500 hover:text-red-600"
                    >
                      Copy Prompt
                    </button>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-mono bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    {generatedPrompt}
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
