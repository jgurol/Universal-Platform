
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState, useRef, useEffect } from 'react';

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
    <NodeViewWrapper className="relative inline-block">
      <img
        ref={imgRef}
        src={node.attrs.src}
        alt={node.attrs.alt || ''}
        width={node.attrs.width}
        height={node.attrs.height}
        className="rounded-lg max-w-full h-auto"
        style={{
          width: node.attrs.width ? `${node.attrs.width}px` : 'auto',
          height: node.attrs.height ? `${node.attrs.height}px` : 'auto'
        }}
      />
      {selected && (
        <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none">
          <div
            className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize pointer-events-auto"
            onMouseDown={handleMouseDown}
          />
        </div>
      )}
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
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageResizeComponent);
  },
});
