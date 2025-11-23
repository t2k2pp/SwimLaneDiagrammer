import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useDiagramStore } from '../core/store';
import type { TextBox } from '../core/types';
import './TextBox.css';

interface Props {
    textBox: TextBox;
}

export const TextBoxComponent: React.FC<Props> = ({ textBox }) => {
    const { selectItem, selectedIds, updateTextBox, addHistorySnapshot } = useDiagramStore();
    const [isEditing, setIsEditing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isSelected = selectedIds.includes(textBox.id);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        selectItem(textBox.id, e.shiftKey);

        setIsDragging(true);
        setDragStart({
            x: e.clientX - textBox.position.x,
            y: e.clientY - textBox.position.y
        });
    };

    const handleResizeMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsResizing(true);
        setResizeStart({
            x: e.clientX,
            y: e.clientY,
            width: textBox.size.width,
            height: textBox.size.height
        });
    };

    const handleDoubleClick = () => {
        setIsEditing(true);
        setTimeout(() => {
            textareaRef.current?.focus();
        }, 0);
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        updateTextBox(textBox.id, { content: e.target.value });
    };

    const handleBlur = () => {
        setIsEditing(false);
        addHistorySnapshot();
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                updateTextBox(textBox.id, {
                    position: {
                        x: e.clientX - dragStart.x,
                        y: e.clientY - dragStart.y
                    }
                });
            } else if (isResizing) {
                const deltaX = e.clientX - resizeStart.x;
                const deltaY = e.clientY - resizeStart.y;
                updateTextBox(textBox.id, {
                    size: {
                        width: Math.max(200, resizeStart.width + deltaX),
                        height: Math.max(100, resizeStart.height + deltaY)
                    }
                });
            }
        };

        const handleMouseUp = () => {
            if (isDragging || isResizing) {
                addHistorySnapshot();
            }
            setIsDragging(false);
            setIsResizing(false);
        };

        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, dragStart, resizeStart, textBox.id, updateTextBox, addHistorySnapshot]);

    return (
        <div
            className={`textbox ${isSelected ? 'selected' : ''}`}
            style={{
                left: textBox.position.x,
                top: textBox.position.y,
                width: textBox.size.width,
                height: textBox.size.height,
                backgroundColor: (() => {
                    const bg = textBox.backgroundColor || '#ffffff';
                    const opacity = textBox.opacity ?? 1;
                    if (bg === 'transparent') return 'transparent';
                    if (bg.startsWith('#')) {
                        // Convert opacity to hex
                        const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
                        return `${bg}${alpha}`;
                    }
                    return bg;
                })(),
                // opacity: textBox.opacity ?? 1, // Removed to prevent text fading
                color: textBox.textColor === 'auto' ? 'inherit' : textBox.textColor,
                overflow: textBox.showScrollBar === false ? 'hidden' : 'auto',
                border: textBox.showBorder === false ? 'none' : `2px solid ${textBox.borderColor || 'var(--color-border)'}`
            }}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
        >
            {isEditing ? (
                <textarea
                    ref={textareaRef}
                    className="textbox-editor"
                    value={textBox.content}
                    onChange={handleContentChange}
                    onBlur={handleBlur}
                    placeholder="Markdown形式でテキストを入力..."
                />
            ) : (
                <div className="textbox-content">
                    <ReactMarkdown>{textBox.content || '*テキストを入力するにはダブルクリック*'}</ReactMarkdown>
                </div>
            )}
            {isSelected && !isEditing && (
                <div className="resize-handle" onMouseDown={handleResizeMouseDown} />
            )}
        </div>
    );
};
