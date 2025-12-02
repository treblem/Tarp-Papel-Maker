import React, { useState, useCallback } from 'react';
import { 
  Layer, PaperSize, PosterConfig, SlicingMode, PaperOrientation, Unit 
} from './types';
import { PAPER_SIZES } from './constants';
import { CanvasWorkspace } from './components/CanvasWorkspace';
import { LayerControls } from './components/LayerControls';
import { generateTiledPDF } from './utils/pdfGenerator';
import { 
  Download, Plus, Settings, Image as ImageIcon, Type, 
  Minus, Scissors, Grid, Layers, Layout, Ruler, HelpCircle, Info, X, BookOpen
} from 'lucide-react';

const DEFAULT_PAPER_ID = 'letter';
const DEFAULT_PAPER = PAPER_SIZES.find(p => p.id === DEFAULT_PAPER_ID) || PAPER_SIZES[0];

const App: React.FC = () => {
  // State
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.5);
  const [activeTab, setActiveTab] = useState<'settings' | 'layers'>('settings');
  const [isExporting, setIsExporting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const [config, setConfig] = useState<PosterConfig>({
    mode: SlicingMode.GRID,
    unit: Unit.INCH,
    targetWidth: 36, // 3ft in inches
    targetHeight: 48, // 4ft in inches
    gridRows: 3,
    gridCols: 3,
    paperId: DEFAULT_PAPER.id,
    orientation: PaperOrientation.PORTRAIT,
    margin: 0.5, // 0.5 inch
    overlap: 0.25, // 0.25 inch
    showCutLines: true,
    cutLineStyle: 'dashed',
    showPageNumbers: true
  });

  const selectedPaper = PAPER_SIZES.find(p => p.id === config.paperId) || DEFAULT_PAPER;

  // Helpers
  const formatPaperDim = (mm: number, unit: Unit) => {
    if (unit === Unit.MM) return Math.round(mm);
    return (mm / 25.4).toFixed(2);
  };

  const toggleUnit = () => {
    const newUnit = config.unit === Unit.MM ? Unit.INCH : Unit.MM;
    const factor = newUnit === Unit.INCH ? 1/25.4 : 25.4;
    
    setConfig(prev => ({
        ...prev,
        unit: newUnit,
        targetWidth: parseFloat((prev.targetWidth * factor).toFixed(2)),
        targetHeight: parseFloat((prev.targetHeight * factor).toFixed(2)),
        margin: parseFloat((prev.margin * factor).toFixed(2)),
        overlap: parseFloat((prev.overlap * factor).toFixed(2)),
    }));
  };

  // Handlers
  const handleAddLayer = (type: 'image' | 'text', content: string) => {
    const newLayer: Layer = {
      id: crypto.randomUUID(),
      type,
      content,
      x: 0.25,
      y: 0.25,
      width: type === 'image' ? 0.5 : 0.5,
      height: type === 'image' ? 0.5 : 0.2, // Text height is auto visually, but used for bounding
      rotation: 0,
      opacity: 1,
      style: type === 'text' ? {
        color: '#000000',
        fontSize: 1,
        fontFamily: 'Inter',
        fontWeight: 'bold'
      } : undefined
    };
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
    setActiveTab('layers');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleAddLayer('image', event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const updateLayer = useCallback((id: string, updates: Partial<Layer>) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  }, []);

  const removeLayer = (id: string) => {
    setLayers(prev => prev.filter(l => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await generateTiledPDF(config, layers, selectedPaper);
    } catch (error) {
      alert("Failed to generate PDF. Please ensure all images are loaded.");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-2">
            <div className="bg-brand-600 text-white p-1.5 rounded-lg">
                <Scissors size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Tarp Papel Maker</h1>
        </div>

        <div className="flex items-center gap-4">
             <button 
                onClick={() => setShowInstructions(true)}
                className="flex items-center gap-1.5 text-slate-600 hover:text-brand-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
             >
                <BookOpen size={18} />
                Instructions
             </button>
             <button 
                onClick={() => setShowAbout(true)}
                className="flex items-center gap-1.5 text-slate-600 hover:text-brand-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
             >
                <Info size={18} />
                About
             </button>
             <div className="h-6 w-px bg-slate-200 mx-2"></div>
             <div className="flex items-center bg-slate-100 rounded-lg p-1">
                <button 
                    onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
                    className="p-1.5 hover:bg-white rounded-md text-slate-600 transition-colors"
                >
                    <Minus size={16} />
                </button>
                <span className="w-12 text-center text-xs font-medium text-slate-600">{Math.round(zoom * 100)}%</span>
                <button 
                    onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                    className="p-1.5 hover:bg-white rounded-md text-slate-600 transition-colors"
                >
                    <Plus size={16} />
                </button>
             </div>
             
             <button 
                onClick={handleExport}
                disabled={isExporting}
                className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-all active:scale-95 disabled:opacity-50"
             >
                {isExporting ? 'Generating...' : (
                    <>
                        <Download size={18} />
                        Export PDF
                    </>
                )}
             </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <aside className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-4 gap-4 z-20">
            <label className="cursor-pointer group relative flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-brand-600 transition-all">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <ImageIcon size={24} />
                <span className="text-[10px] font-medium">Image</span>
            </label>
            <button 
                onClick={() => handleAddLayer('text', 'Double click to edit')}
                className="group relative flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-brand-600 transition-all"
            >
                <Type size={24} />
                <span className="text-[10px] font-medium">Text</span>
            </button>
        </aside>

        {/* Canvas Area */}
        <CanvasWorkspace 
            layers={layers}
            config={config}
            paperSize={selectedPaper}
            selectedLayerId={selectedLayerId}
            onLayerSelect={setSelectedLayerId}
            onLayerUpdate={updateLayer}
            zoom={zoom}
        />

        {/* Right Sidebar */}
        <aside className="w-80 bg-white border-l border-slate-200 flex flex-col z-20 shadow-xl shadow-slate-200/50">
            <div className="flex border-b border-slate-200">
                <button 
                    onClick={() => setActiveTab('settings')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'settings' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Settings size={16} /> Config
                </button>
                <button 
                    onClick={() => setActiveTab('layers')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'layers' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Layers size={16} /> Layers
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {activeTab === 'settings' ? (
                    <>
                         {/* Unit Toggle */}
                         <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Ruler size={18} />
                                <span className="text-sm font-medium">Units</span>
                            </div>
                            <button 
                                onClick={toggleUnit}
                                className="flex bg-white border border-slate-300 rounded-md overflow-hidden h-7"
                            >
                                <span className={`px-2 flex items-center text-xs font-medium ${config.unit === Unit.MM ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50'}`}>mm</span>
                                <div className="w-px bg-slate-300"></div>
                                <span className={`px-2 flex items-center text-xs font-medium ${config.unit === Unit.INCH ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50'}`}>in</span>
                            </button>
                        </div>

                        {/* Mode Selection */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-slate-900">Slicing Mode</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => setConfig(c => ({ ...c, mode: SlicingMode.GRID }))}
                                    className={`p-2 border rounded-lg text-sm flex flex-col items-center gap-1 ${config.mode === SlicingMode.GRID ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 hover:border-slate-300'}`}
                                >
                                    <Grid size={18} />
                                    Grid Mode
                                </button>
                                <button 
                                    onClick={() => setConfig(c => ({ ...c, mode: SlicingMode.SIZE }))}
                                    className={`p-2 border rounded-lg text-sm flex flex-col items-center gap-1 ${config.mode === SlicingMode.SIZE ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 hover:border-slate-300'}`}
                                >
                                    <Layout size={18} />
                                    Size Mode
                                </button>
                            </div>

                            {config.mode === SlicingMode.GRID ? (
                                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div>
                                        <label className="text-xs font-medium text-slate-500">Rows</label>
                                        <input 
                                            type="number" min="1" max="20"
                                            value={config.gridRows}
                                            onChange={(e) => setConfig(c => ({...c, gridRows: Number(e.target.value)}))}
                                            className="w-full mt-1 border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500">Cols</label>
                                        <input 
                                            type="number" min="1" max="20"
                                            value={config.gridCols}
                                            onChange={(e) => setConfig(c => ({...c, gridCols: Number(e.target.value)}))}
                                            className="w-full mt-1 border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div>
                                        <label className="text-xs font-medium text-slate-500">Width ({config.unit})</label>
                                        <input 
                                            type="number"
                                            value={config.targetWidth}
                                            onChange={(e) => setConfig(c => ({...c, targetWidth: Number(e.target.value)}))}
                                            className="w-full mt-1 border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500">Height ({config.unit})</label>
                                        <input 
                                            type="number"
                                            value={config.targetHeight}
                                            onChange={(e) => setConfig(c => ({...c, targetHeight: Number(e.target.value)}))}
                                            className="w-full mt-1 border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Paper Settings */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-slate-900">Paper Settings</h3>
                            <div>
                                <label className="text-xs font-medium text-slate-500">Paper Size</label>
                                <select 
                                    value={config.paperId}
                                    onChange={(e) => setConfig(c => ({...c, paperId: e.target.value}))}
                                    className="w-full mt-1 border border-slate-300 rounded-md px-2 py-1.5 text-sm bg-white"
                                >
                                    <optgroup label="ISO">
                                        {PAPER_SIZES.filter(p => p.category === 'ISO').map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({formatPaperDim(p.width, config.unit)} x {formatPaperDim(p.height, config.unit)} {config.unit})</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="ANSI">
                                        {PAPER_SIZES.filter(p => p.category === 'ANSI').map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({formatPaperDim(p.width, config.unit)} x {formatPaperDim(p.height, config.unit)} {config.unit})</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Photo">
                                        {PAPER_SIZES.filter(p => p.category === 'Photo').map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({formatPaperDim(p.width, config.unit)} x {formatPaperDim(p.height, config.unit)} {config.unit})</option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setConfig(c => ({...c, orientation: PaperOrientation.PORTRAIT}))}
                                    className={`flex-1 py-1.5 text-xs rounded border ${config.orientation === PaperOrientation.PORTRAIT ? 'bg-brand-50 border-brand-500 text-brand-700' : 'border-slate-200'}`}
                                >
                                    Portrait
                                </button>
                                <button 
                                    onClick={() => setConfig(c => ({...c, orientation: PaperOrientation.LANDSCAPE}))}
                                    className={`flex-1 py-1.5 text-xs rounded border ${config.orientation === PaperOrientation.LANDSCAPE ? 'bg-brand-50 border-brand-500 text-brand-700' : 'border-slate-200'}`}
                                >
                                    Landscape
                                </button>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500">Margins ({config.unit})</label>
                                <input 
                                    type="number" min="0" step="0.1"
                                    value={config.margin}
                                    onChange={(e) => setConfig(c => ({...c, margin: Number(e.target.value)}))}
                                    className="w-full mt-1 border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                                />
                            </div>
                        </div>

                        {/* Export Options */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-slate-900">Guides</h3>
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-slate-500">Show Cut Lines</label>
                                <input 
                                    type="checkbox"
                                    checked={config.showCutLines}
                                    onChange={(e) => setConfig(c => ({...c, showCutLines: e.target.checked}))}
                                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                />
                            </div>
                            {config.showCutLines && (
                                <div>
                                    <label className="text-xs font-medium text-slate-500">Line Style</label>
                                    <select 
                                        value={config.cutLineStyle}
                                        onChange={(e) => setConfig(c => ({...c, cutLineStyle: e.target.value as any}))}
                                        className="w-full mt-1 border border-slate-300 rounded-md px-2 py-1.5 text-sm bg-white"
                                    >
                                        <option value="dashed">Dashed</option>
                                        <option value="solid">Solid</option>
                                    </select>
                                </div>
                            )}
                             <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-slate-500">Page Numbers</label>
                                <input 
                                    type="checkbox"
                                    checked={config.showPageNumbers}
                                    onChange={(e) => setConfig(c => ({...c, showPageNumbers: e.target.checked}))}
                                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="space-y-4">
                        {selectedLayerId ? (
                            <LayerControls 
                                layer={layers.find(l => l.id === selectedLayerId) || null}
                                updateLayer={updateLayer}
                                removeLayer={removeLayer}
                            />
                        ) : (
                            <p className="text-sm text-slate-500 text-center py-4">Select a layer to edit it.</p>
                        )}
                        
                        <div className="space-y-2 mt-4">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">All Layers</h3>
                            {layers.map((layer, index) => (
                                <div 
                                    key={layer.id}
                                    onClick={() => setSelectedLayerId(layer.id)}
                                    className={`p-2 rounded border flex items-center gap-3 cursor-pointer ${selectedLayerId === layer.id ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}
                                >
                                    <span className="text-xs text-slate-400 w-4">{index + 1}</span>
                                    {layer.type === 'image' ? <ImageIcon size={16} className="text-slate-600"/> : <Type size={16} className="text-slate-600"/>}
                                    <span className="text-sm text-slate-700 truncate flex-1">
                                        {layer.type === 'text' ? layer.content : 'Image Layer'}
                                    </span>
                                </div>
                            ))}
                            {layers.length === 0 && (
                                <p className="text-xs text-slate-400 text-center italic">No layers yet.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </aside>
      </main>

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative animate-in fade-in zoom-in duration-200">
                <button 
                    onClick={() => setShowInstructions(false)} 
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-1 transition-all"
                >
                    <X size={20}/>
                </button>
                <div className="flex items-center gap-3 mb-5">
                    <div className="bg-brand-100 text-brand-600 p-2 rounded-lg">
                         <BookOpen size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">How to use</h2>
                </div>
                
                <ol className="relative border-l border-slate-200 ml-3 space-y-6">
                    <li className="ml-6">
                        <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-brand-100 rounded-full ring-4 ring-white">
                            <span className="text-brand-600 text-xs font-bold">1</span>
                        </span>
                        <h3 className="font-semibold text-slate-900 mb-1">Set Your Size</h3>
                        <p className="text-sm text-slate-600">Choose <strong>Grid Mode</strong> to define rows/cols or <strong>Size Mode</strong> for specific dimensions.</p>
                    </li>
                    <li className="ml-6">
                        <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-brand-100 rounded-full ring-4 ring-white">
                             <span className="text-brand-600 text-xs font-bold">2</span>
                        </span>
                        <h3 className="font-semibold text-slate-900 mb-1">Add Content</h3>
                        <p className="text-sm text-slate-600">Use the left toolbar to upload images or add text to your canvas.</p>
                    </li>
                    <li className="ml-6">
                        <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-brand-100 rounded-full ring-4 ring-white">
                             <span className="text-brand-600 text-xs font-bold">3</span>
                        </span>
                        <h3 className="font-semibold text-slate-900 mb-1">Customize</h3>
                        <p className="text-sm text-slate-600">Drag, resize, and rotate your layers. Use the 'Layers' tab to manage stacking order.</p>
                    </li>
                    <li className="ml-6">
                        <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-brand-100 rounded-full ring-4 ring-white">
                             <span className="text-brand-600 text-xs font-bold">4</span>
                        </span>
                        <h3 className="font-semibold text-slate-900 mb-1">Export & Print</h3>
                        <p className="text-sm text-slate-600">Click <strong>Export PDF</strong> to get your tiled pages. Print, cut along the guides, and assemble!</p>
                    </li>
                </ol>

                <div className="mt-8 flex justify-end">
                    <button 
                        onClick={() => setShowInstructions(false)}
                        className="bg-brand-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-brand-700 transition-colors"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative text-center animate-in fade-in zoom-in duration-200">
                <button 
                    onClick={() => setShowAbout(false)} 
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-1 transition-all"
                >
                    <X size={20}/>
                </button>
                
                <div className="bg-gradient-to-br from-brand-50 to-brand-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-600 shadow-inner">
                    <Info size={40} />
                </div>
                
                <h2 className="text-xl font-bold text-slate-800 mb-1">Melbhert A. Boiser</h2>
                <p className="text-brand-600 text-sm font-semibold mb-6">SST-I (Secondary School Teacher I)</p>
                
                <div className="space-y-4 text-left">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2 mb-2 text-slate-800 font-semibold text-sm">
                             🏫 School Information
                        </div>
                        <p className="text-sm text-slate-600">Camambugan National High School</p>
                        <p className="text-xs text-slate-500 mt-0.5">Ubay, Bohol, Philippines</p>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2 mb-2 text-slate-800 font-semibold text-sm">
                             🎓 Educational Background
                        </div>
                        <p className="text-sm text-slate-600">Silliman University</p>
                        <p className="text-xs text-slate-500 mt-0.5">Dumaguete City, Negros Oriental, Philippines</p>
                    </div>
                </div>

                <div className="mt-6 text-xs text-slate-400">
                    Tarp Papel Maker v1.0
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;