
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlignLeft, Square } from 'lucide-react';

interface ImageResizeProps {
  node: any;
  updateAttributes: (attributes: any) => void;
  selected: boolean;
}

const ImageResizeComponent: React.FC<ImageResizeProps> = ({ node, updateAttributes, selected }) => {
  const [isResizing, setIsResizing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  const isInline = node.attrs.display !== 'block';

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    
    const img = imgRef.current;
    if (img) {
      setStartSize({
        width: img.offsetWidth,
        height: img.offsetHeight
      });
    }
  };

  const toggleDisplay = () => {
    const newDisplay = isInline ? 'block' : 'inline';
    updateAttributes({ display: newDisplay });
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!imgRef.current) return;

      const deltaX = e.clientX - startPos.x;
      const aspectRatio = startSize.width / startSize.height;
      const newWidth = Math.max(50, startSize.width + deltaX);
      const newHeight = newWidth / aspectRatio;

      updateAttributes({
        width: newWidth,
        height: newHeight
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, startPos, startSize, updateAttributes]);

  return (
    <NodeViewWrapper 
      className={isInline ? "inline-block" : "block my-2"}
      style={{ display: isInline ? 'inline-block' : 'block' }}
    >
      <div className="relative group">
        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          width={node.attrs.width}
          height={node.attrs.height}
          className="rounded-lg max-w-full h-auto"
          style={{
            width: node.attrs.width ? `${node.attrs.width}px` : 'auto',
            height: node.attrs.height ? `${node.attrs.height}px` : 'auto',
            verticalAlign: isInline ? 'middle' : 'top'
          }}
        />
        {selected && (
          <>
            <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none">
              <div
                className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize pointer-events-auto"
                onMouseDown={handleMouseDown}
              />
            </div>
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={toggleDisplay}
                className="h-6 w-6 p-0 bg-white/90 hover:bg-white border shadow-sm"
                title={isInline ? "Make block (break text)" : "Make inline (flow with text)"}
              >
                {isInline ? <Square className="h-3 w-3" /> : <AlignLeft className="h-3 w-3" />}
              </Button>
            </div>
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const ImageResize = Node.create({
  name: 'imageResize',
  
  group: 'inline',
  
  inline: true,
  
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
      display: {
        default: 'inline',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (element) => {
          const img = element as HTMLImageElement;
          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt'),
            title: img.getAttribute('title'),
            width: img.getAttribute('width') ? parseInt(img.getAttribute('width')!) : null,
            height: img.getAttribute('height') ? parseInt(img.getAttribute('height')!) : null,
            display: img.style.display === 'block' ? 'block' : 'inline',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { display, ...attrs } = HTMLAttributes;
    return ['img', mergeAttributes(attrs, {
      style: `display: ${display || 'inline'}; ${display === 'inline' ? 'vertical-align: middle;' : 'margin: 8px 0;'}`
    })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageResizeComponent);
  },
});
