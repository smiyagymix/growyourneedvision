import React from 'react';
import { Layer } from '../../types/editor';
import { OwnerIcon } from '../../../../components/shared/OwnerIcons';

interface AdvancedTextControlProps {
    layer: Layer;
    onChange: (updates: Partial<Layer>) => void;
}

export const AdvancedTextControl: React.FC<AdvancedTextControlProps> = ({ layer, onChange }) => {
    const fontFamilies = [
        'Inter', 'Roboto', 'Montserrat', 'Poppins', 'Playfair Display',
        'Merriweather', 'Lato', 'Open Sans', 'Raleway', 'Source Sans Pro',
        'Ubuntu', 'Nunito', 'PT Sans', 'Crimson Text', 'Courier New'
    ];

    const fontWeights = ['300', '400', '500', '600', '700', '800', '900'];
    const textDecorations = ['none', 'underline', 'line-through', 'overline'];

    return (
        <div className="space-y-4">
            {/* Font Family */}
            <div>
                <label className="text-xs text-gray-400 mb-2 block">Font Family</label>
                <select
                    value={layer.fontFamily || 'Inter'}
                    onChange={(e) => onChange({ fontFamily: e.target.value })}
                    className="w-full bg-[#27272a] border border-[#3f3f46] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                    {fontFamilies.map(font => (
                        <option key={font} value={font} style={{ fontFamily: font }}>
                            {font}
                        </option>
                    ))}
                </select>
            </div>

            {/* Font Size and Weight */}
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="text-xs text-gray-400 mb-2 block">Size</label>
                    <input
                        type="number"
                        value={layer.fontSize || 16}
                        onChange={(e) => onChange({ fontSize: parseInt(e.target.value) })}
                        className="w-full bg-[#27272a] border border-[#3f3f46] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                        min="8"
                        max="200"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-2 block">Weight</label>
                    <select
                        value={layer.fontWeight || '400'}
                        onChange={(e) => onChange({ fontWeight: e.target.value })}
                        className="w-full bg-[#27272a] border border-[#3f3f46] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                        {fontWeights.map(weight => (
                            <option key={weight} value={weight}>
                                {weight === '300' ? 'Light' : weight === '400' ? 'Regular' : weight === '500' ? 'Medium' : weight === '600' ? 'Semibold' : weight === '700' ? 'Bold' : weight === '800' ? 'Extra Bold' : 'Black'}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Text Alignment */}
            <div>
                <label className="text-xs text-gray-400 mb-2 block">Alignment</label>
                <div className="flex gap-1">
                    {(['left', 'center', 'right', 'justify'] as const).map(align => (
                        <button
                            key={align}
                            type="button"
                            onClick={() => onChange({ textAlign: align })}
                            className={`flex-1 py-2 rounded transition-colors ${
                                layer.textAlign === align
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-[#27272a] text-gray-400 hover:bg-[#3f3f46]'
                            }`}
                        >
                            <OwnerIcon 
                                name={align === 'left' ? 'Bars3BottomLeftIcon' : align === 'center' ? 'Bars3Icon' : align === 'right' ? 'Bars3BottomRightIcon' : 'Bars4Icon'} 
                                className="w-4 h-4 mx-auto" 
                            />
                        </button>
                    ))}
                </div>
            </div>

            {/* Text Style Buttons */}
            <div>
                <label className="text-xs text-gray-400 mb-2 block">Style</label>
                <div className="flex gap-1">
                    <button
                        type="button"
                        onClick={() => onChange({ fontStyle: layer.fontStyle === 'italic' ? 'normal' : 'italic' })}
                        className={`flex-1 py-2 rounded transition-colors font-italic ${
                            layer.fontStyle === 'italic'
                                ? 'bg-purple-600 text-white'
                                : 'bg-[#27272a] text-gray-400 hover:bg-[#3f3f46]'
                        }`}
                    >
                        <span className="italic">I</span>
                    </button>
                    {textDecorations.slice(1).map(decoration => (
                        <button
                            key={decoration}
                            type="button"
                            onClick={() => onChange({ textDecoration: layer.textDecoration === decoration ? 'none' : decoration })}
                            className={`flex-1 py-2 rounded transition-colors ${
                                layer.textDecoration === decoration
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-[#27272a] text-gray-400 hover:bg-[#3f3f46]'
                            }`}
                        >
                            <span style={{ textDecoration: decoration }}>
                                {decoration === 'underline' ? 'U' : decoration === 'line-through' ? 'S' : 'O'}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Letter Spacing */}
            <div>
                <label className="text-xs text-gray-400 mb-2 block flex justify-between">
                    <span>Letter Spacing</span>
                    <span className="text-white">{layer.letterSpacing || 0}px</span>
                </label>
                <input
                    type="range"
                    min="-5"
                    max="20"
                    step="0.5"
                    value={layer.letterSpacing || 0}
                    onChange={(e) => onChange({ letterSpacing: parseFloat(e.target.value) })}
                    className="w-full"
                />
            </div>

            {/* Line Height */}
            <div>
                <label className="text-xs text-gray-400 mb-2 block flex justify-between">
                    <span>Line Height</span>
                    <span className="text-white">{layer.lineHeight || 1.5}</span>
                </label>
                <input
                    type="range"
                    min="0.8"
                    max="3"
                    step="0.1"
                    value={layer.lineHeight || 1.5}
                    onChange={(e) => onChange({ lineHeight: parseFloat(e.target.value) })}
                    className="w-full"
                />
            </div>

            {/* Text Transform */}
            <div>
                <label className="text-xs text-gray-400 mb-2 block">Transform</label>
                <div className="grid grid-cols-3 gap-1">
                    {['none', 'uppercase', 'lowercase', 'capitalize'].map(transform => (
                        <button
                            key={transform}
                            type="button"
                            onClick={() => onChange({ textTransform: transform as any })}
                            className={`py-2 rounded text-xs transition-colors ${
                                (layer as any).textTransform === transform
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-[#27272a] text-gray-400 hover:bg-[#3f3f46]'
                            }`}
                        >
                            {transform === 'none' ? 'None' : transform === 'uppercase' ? 'ABC' : transform === 'lowercase' ? 'abc' : 'Abc'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Text Content */}
            <div>
                <label className="text-xs text-gray-400 mb-2 block">Content</label>
                <textarea
                    value={layer.text || ''}
                    onChange={(e) => onChange({ text: e.target.value })}
                    className="w-full bg-[#27272a] border border-[#3f3f46] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 min-h-[80px] resize-vertical"
                    placeholder="Enter text..."
                />
            </div>
        </div>
    );
};
