import React from 'react';
import { Layer } from '../types';
import { Trash2, Type, Image as ImageIcon, Box } from 'lucide-react';
import { COLORS, FONTS } from '../constants';

interface LayerControlsProps {
  layer: Layer | null;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  removeLayer: (id: string) => void;
}

export const LayerControls: React.FC<LayerControlsProps> = ({ layer, updateLayer, removeLayer }) => {
  if (!layer) return (
    <div className="p-4 text-center text-slate-400 text-sm">
      Select a layer to edit
    </div>
  );

  return (
    <div className="space-y-4 p-4 border-t border-slate-200 bg-white">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            {layer.type === 'image' ? <ImageIcon size={16}/> : <Type size={16}/>}
            Edit Layer
        </h3>
        <button 
            onClick={() => removeLayer(layer.id)}
            className="text-red-500 hover:text-red-600 p-1 rounded hover:bg-red-50"
        >
            <Trash2 size={16} />
        </button>
      </div>

      {/* Position & Opacity */}
      <div className="grid grid-cols-2 gap-2">
        <div>
            <label className="text-xs text-slate-500">Opacity</label>
            <input 
                type="range" min="0" max="1" step="0.1"
                value={layer.opacity}
                onChange={(e) => updateLayer(layer.id, { opacity: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
        </div>
        <div>
             <label className="text-xs text-slate-500">Rotation</label>
             <div className="flex items-center gap-2">
                <input 
                    type="number" 
                    value={layer.rotation}
                    onChange={(e) => updateLayer(layer.id, { rotation: Number(e.target.value) })}
                    className="w-full text-sm border rounded px-2 py-1"
                />
             </div>
        </div>
      </div>

      {/* Specific Controls */}
      {layer.type === 'text' && layer.style && (
        <div className="space-y-3">
             <div>
                <label className="text-xs text-slate-500 block mb-1">Text Content</label>
                <textarea 
                    value={layer.content}
                    onChange={(e) => updateLayer(layer.id, { content: e.target.value })}
                    className="w-full text-sm border rounded px-2 py-1"
                    rows={2}
                />
             </div>
             <div>
                <label className="text-xs text-slate-500 block mb-1">Color</label>
                <div className="flex flex-wrap gap-1">
                    {COLORS.map(c => (
                        <button
                            key={c}
                            onClick={() => updateLayer(layer.id, { style: { ...layer.style, color: c } })}
                            className={`w-6 h-6 rounded-full border ${layer.style?.color === c ? 'ring-2 ring-offset-1 ring-blue-500' : 'border-slate-300'}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>
             </div>
             <div className="grid grid-cols-2 gap-2">
                <div>
                     <label className="text-xs text-slate-500 block mb-1">Size</label>
                     <input 
                        type="number" step="0.1"
                        value={layer.style.fontSize}
                        onChange={(e) => updateLayer(layer.id, { style: { ...layer.style, fontSize: Number(e.target.value) } })}
                        className="w-full text-sm border rounded px-2 py-1"
                     />
                </div>
                <div>
                     <label className="text-xs text-slate-500 block mb-1">Font</label>
                     <select 
                        value={layer.style.fontFamily}
                        onChange={(e) => updateLayer(layer.id, { style: { ...layer.style, fontFamily: e.target.value } })}
                        className="w-full text-sm border rounded px-2 py-1"
                     >
                        {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                     </select>
                </div>
             </div>
        </div>
      )}

      {layer.type === 'image' && (
          <div className="space-y-3">
             <div className="grid grid-cols-2 gap-2">
                <div>
                     <label className="text-xs text-slate-500 block mb-1 flex items-center gap-1">
                        <Box size={12}/> Width (%)
                     </label>
                     <input 
                        type="number" step="1" min="1" max="100"
                        value={Math.round(layer.width * 100)}
                        onChange={(e) => updateLayer(layer.id, { width: Number(e.target.value) / 100 })}
                        className="w-full text-sm border rounded px-2 py-1"
                     />
                </div>
                <div>
                     <label className="text-xs text-slate-500 block mb-1 flex items-center gap-1">
                        <Box size={12}/> Height (%)
                     </label>
                     <input 
                        type="number" step="1" min="1" max="100"
                        value={Math.round(layer.height * 100)}
                        onChange={(e) => updateLayer(layer.id, { height: Number(e.target.value) / 100 })}
                        className="w-full text-sm border rounded px-2 py-1"
                     />
                </div>
             </div>
             <p className="text-[10px] text-slate-400">
                 Drag the corner handles on the canvas to resize freely.
             </p>
          </div>
      )}
    </div>
  );
};