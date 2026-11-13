// PdfViewer.jsx
// A minimal, production-ready PDF viewer component built on usePdfRenderer.
// It renders thumbnails immediately and high-res canvases on-demand with smooth scrolling,
// accurate page detection, zooming, and progress callbacks.

import React, { useEffect, useState } from 'react';
import usePdfRenderer from '../pdf/usePdfRenderer';

export default function PdfViewer({
  pdfSource,                 // ArrayBuffer | URL string | Blob
  initialPage = 1,
  onPageChange = () => {},
  onProgressUpdate = () => {},
  className = '',
  style = {},
}) {
  const [loadStatus, setLoadStatus] = useState('idle');
  const {
    loadPdf,
    currentPage,
    totalPages,
    zoom,
    setZoom,
    navigateToPage,
    containerRef,
  } = usePdfRenderer({
    initialPage,
    onPageChange,
    onProgressUpdate,
    lruLimit: 4, // keep 3–6 canvases in memory
  });

  useEffect(() => {
    if (!pdfSource) return;
    let active = true;
    setLoadStatus('loading');
    loadPdf(pdfSource).then(() => {
      if (active) setLoadStatus('ready');
    }).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Failed to load PDF:', err);
      if (active) setLoadStatus('error');
    });
    return () => {
      active = false;
    };
  }, [pdfSource, loadPdf]);

  const zoomOut = () => setZoom((z) => Math.max(50, z - 10));
  const zoomIn = () => setZoom((z) => Math.min(200, z + 10));
  const resetZoom = () => setZoom(150);

  return (
    <div className={`pdf-viewer-root ${className}`} style={{ display: 'flex', flexDirection: 'column', ...style }}>
      {/* Optional minimal controls (can be removed if you provide external UI) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
        <span style={{ fontSize: 12, color: '#666' }}>
          Page {currentPage || 1} of {totalPages || '?'}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => navigateToPage(Math.max(1, (currentPage || 1) - 1))} disabled={!totalPages || (currentPage || 1) <= 1}>
            Prev
          </button>
          <button onClick={() => navigateToPage(Math.min(totalPages || 1, (currentPage || 1) + 1))} disabled={!totalPages || (currentPage || 1) >= (totalPages || 1)}>
            Next
          </button>
          <button onClick={zoomOut}>-</button>
          <span style={{ fontSize: 12 }}>{zoom}%</span>
          <button onClick={zoomIn}>+</button>
          <button onClick={resetZoom} title="Reset zoom">Reset</button>
        </div>
      </div>

      {loadStatus === 'loading' && (
        <div role="status" style={{ padding: '12px 16px', color: '#526052', textAlign: 'center' }}>
          Loading the sample document…
        </div>
      )}
      {loadStatus === 'error' && (
        <div role="alert" style={{ padding: '14px 16px', color: '#7a3b28', background: '#fff4ee', textAlign: 'center' }}>
          This PDF could not be rendered in the embedded reader.{' '}
          {typeof pdfSource === 'string' && (
            <a href={pdfSource} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', fontWeight: 700 }}>
              Open the PDF in a new tab
            </a>
          )}
        </div>
      )}

      {/* Scrollable container that the hook manages */}
      <div
        ref={containerRef}
        className="pdf-scroll-container"
        style={{
          position: 'relative',
          overflowY: 'auto',
          overflowX: 'hidden',
          height: 'calc(100vh - 56px)',
          background: 'transparent',
        }}
      />
    </div>
  );
}
