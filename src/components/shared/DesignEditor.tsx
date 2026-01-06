import React, { useRef, useState, useEffect } from 'react';
import { Button } from './ui/CommonUI';
import { OwnerIcon } from './OwnerIcons';

interface DesignElement {
    id: string;
    type: 'text' | 'rect' | 'circle';
    x: number;
    y: number;
    width?: number;
    height?: number;
    text?: string;
    color: string;
    fontSize?: number;
}

export const DesignEditor: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [elements, setElements] = useState<DesignElement[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        drawCanvas();
    }, [elements, selectedId]);

    const drawCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw elements
        elements.forEach(el => {
            ctx.save();
            if (el.type === 'rect') {
                ctx.fillStyle = el.color;
                ctx.fillRect(el.x, el.y, el.width || 100, el.height || 100);
            } else if (el.type === 'circle') {
                ctx.beginPath();
                ctx.arc(el.x, el.y, el.width ? el.width / 2 : 50, 0, Math.PI * 2);
                ctx.fillStyle = el.color;
                ctx.fill();
            } else if (el.type === 'text') {
                ctx.font = `${el.fontSize || 20}px Arial`;
                ctx.fillStyle = el.color;
                ctx.fillText(el.text || 'Text', el.x, el.y);
            }

            // Selection outline
            if (el.id === selectedId) {
                ctx.strokeStyle = '#00a8ff';
                ctx.lineWidth = 2;
                if (el.type === 'text') {
                    const metrics = ctx.measureText(el.text || 'Text');
                    ctx.strokeRect(el.x - 5, el.y - (el.fontSize || 20), metrics.width + 10, (el.fontSize || 20) + 10);
                } else if (el.type === 'circle') {
                    ctx.beginPath();
                    ctx.arc(el.x, el.y, (el.width ? el.width / 2 : 50) + 5, 0, Math.PI * 2);
                    ctx.stroke();
                } else {
                    ctx.strokeRect(el.x - 5, el.y - 5, (el.width || 100) + 10, (el.height || 100) + 10);
                }
            }
            ctx.restore();
        });
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Simple hit detection (reverse order to select top-most)
        const clicked = [...elements].reverse().find(el => {
            if (el.type === 'rect') {
                return x >= el.x && x <= el.x + (el.width || 100) && y >= el.y && y <= el.y + (el.height || 100);
            } else if (el.type === 'circle') {
                const r = el.width ? el.width / 2 : 50;
                const dx = x - el.x;
                const dy = y - el.y;
                return dx * dx + dy * dy <= r * r;
            } else if (el.type === 'text') {
                // Approximate text hit box
                return x >= el.x && x <= el.x + 100 && y >= el.y - 20 && y <= el.y;
            }
            return false;
        });

        if (clicked) {
            setSelectedId(clicked.id);
            setIsDragging(true);
            setDragOffset({ x: x - clicked.x, y: y - clicked.y });
        } else {
            setSelectedId(null);
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDragging || !selectedId) return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setElements(prev => prev.map(el => {
            if (el.id === selectedId) {
                return { ...el, x: x - dragOffset.x, y: y - dragOffset.y };
            }
            return el;
        }));
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const addElement = (type: 'text' | 'rect' | 'circle') => {
        const newEl: DesignElement = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            x: 100,
            y: 100,
            color: type === 'text' ? '#000000' : '#3498db',
            width: 100,
            height: 100,
            text: type === 'text' ? 'New Text' : undefined,
            fontSize: 24
        };
        setElements([...elements, newEl]);
        setSelectedId(newEl.id);
    };

    const deleteSelected = () => {
        if (selectedId) {
            setElements(elements.filter(el => el.id !== selectedId));
            setSelectedId(null);
        }
    };

    const downloadImage = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const link = document.createElement('a');
            link.download = 'design.png';
            link.href = canvas.toDataURL();
            link.click();
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
            <div className="bg-white p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => addElement('rect')} leftIcon={<OwnerIcon name="StopIcon" className="w-4 h-4" />}>
                        Rectangle
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => addElement('circle')} leftIcon={<OwnerIcon name="StopIcon" className="w-4 h-4 rounded-full" />}>
                        Circle
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => addElement('text')} leftIcon={<OwnerIcon name="PencilIcon" className="w-4 h-4" />}>
                        Text
                    </Button>
                </div>
                <div className="flex gap-2">
                    <Button variant="danger" size="sm" onClick={deleteSelected} disabled={!selectedId} leftIcon={<OwnerIcon name="TrashIcon" className="w-4 h-4" />}>
                        Delete
                    </Button>
                    <Button variant="primary" size="sm" onClick={downloadImage} leftIcon={<OwnerIcon name="ArrowDownTrayIcon" className="w-4 h-4" />}>
                        Export
                    </Button>
                </div>
            </div>
            <div className="flex-1 p-8 flex items-center justify-center overflow-auto">
                <canvas 
                    ref={canvasRef} 
                    width={800} 
                    height={600} 
                    className="bg-white shadow-lg cursor-crosshair"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                />
            </div>
        </div>
    );
};
