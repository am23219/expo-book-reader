import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useSwipeable } from 'react-swipeable';
import { FiChevronRight, FiChevronLeft, FiZoomIn, FiZoomOut, FiMusic } from 'react-icons/fi';
import IslamicBorder from '../assets/IslamicBorder';
import '../styles/PDFReader.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const PDFReader = ({ pdfUrl, title = "منزل" }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef(null);
  const pageRef = useRef(null);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  const goToPrevPage = () => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1);
      setSwipeDirection('right');
    }
  };

  const goToNextPage = () => {
    if (pageNumber < numPages) {
      setPageNumber(pageNumber + 1);
      setSwipeDirection('left');
    }
  };

  const zoomIn = () => {
    if (scale < 2.0) {
      setScale(prevScale => prevScale + 0.1);
    }
  };

  const zoomOut = () => {
    if (scale > 0.5) {
      setScale(prevScale => prevScale - 0.1);
    }
  };

  // Reset swipe direction after animation completes
  useEffect(() => {
    const timer = setTimeout(() => {
      setSwipeDirection(null);
    }, 300);
    return () => clearTimeout(timer);
  }, [swipeDirection]);

  // Setup swipe handlers for page navigation
  const swipeHandlers = useSwipeable({
    onSwipedRight: () => goToPrevPage(),
    onSwipedLeft: () => goToNextPage(),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  // Handle touch events for page curl effect
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;
    
    const touch = e.touches[0];
    const deltaX = touchStart.x - touch.clientX;
    
    // Apply subtle page curl effect based on touch position
    if (deltaX > 0 && pageNumber < numPages) {
      // Curling to left (next page)
      const pageElement = pageRef.current;
      if (pageElement) {
        const curlAmount = Math.min(20, deltaX / 10);
        pageElement.style.transform = `perspective(1000px) rotateY(-${curlAmount}deg)`;
        pageElement.style.boxShadow = `${-curlAmount}px 0 10px rgba(0,0,0,0.15)`;
      }
    } else if (deltaX < 0 && pageNumber > 1) {
      // Curling to right (previous page)
      const pageElement = pageRef.current;
      if (pageElement) {
        const curlAmount = Math.min(20, -deltaX / 10);
        pageElement.style.transform = `perspective(1000px) rotateY(${curlAmount}deg)`;
        pageElement.style.boxShadow = `${curlAmount}px 0 10px rgba(0,0,0,0.15)`;
      }
    }
  };

  const handleTouchEnd = () => {
    // Reset page curl effect
    const pageElement = pageRef.current;
    if (pageElement) {
      pageElement.style.transform = '';
      pageElement.style.boxShadow = '';
    }
    setTouchStart(null);
  };
  
  // Calculate progress percentage for progress bar
  const progressPercentage = numPages ? (pageNumber / numPages) * 100 : 0;

  return (
    <div 
      className="pdf-reader-container" 
      ref={containerRef} 
      {...swipeHandlers}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>تحميل الكتاب...</p>
        </div>
      )}
      
      {/* Title bar with book name and page progress */}
      <div className="title-bar">
        <button className="nav-button menu-button">
          <span>☰</span>
        </button>
        
        <div className="book-title">{title} {pageNumber}</div>
        
        <div className="progress-bar">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        
        <div className="page-indicator">
          {pageNumber}/{numPages || '--'}
        </div>
        
        <button className="nav-button music-button">
          <FiMusic />
        </button>
      </div>
      
      <div 
        className={`pdf-document-container ${swipeDirection ? `swipe-${swipeDirection}` : ''}`}
      >
        <div className="book-page-container">
          {/* Page turn buttons styled as arrows */}
          <button 
            className={`turn-page-button prev ${pageNumber <= 1 ? 'disabled' : ''}`}
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            aria-label="Previous page"
          >
            &lt;
          </button>
          
          <div className="page-with-border">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(error) => console.error("Error loading PDF:", error)}
              loading={<div className="loading-placeholder">تحميل...</div>}
              className="document-wrapper"
            >
              <div className="page-wrapper" ref={pageRef}>
                <Page 
                  pageNumber={pageNumber} 
                  scale={scale}
                  rotate={rotation}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  loading={<div className="loading-placeholder">تحميل الصفحة...</div>}
                  className="pdf-page"
                />
              </div>
            </Document>
            
            {/* Surrounding the page with the Islamic border */}
            <div className="border-container">
              <IslamicBorder 
                color="#0099cc" 
                accentColor="#ffda44" 
                pageNumber={pageNumber}
              />
            </div>
          </div>
          
          <button 
            className={`turn-page-button next ${pageNumber >= numPages ? 'disabled' : ''}`}
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            aria-label="Next page"
          >
            &gt;
          </button>
        </div>
      </div>
      
      {/* Zoom controls (optional, can be hidden for cleaner look) */}
      <div className="zoom-controls-bottom">
        <button onClick={zoomIn} className="zoom-button" aria-label="Zoom in">
          <FiZoomIn />
        </button>
        <button onClick={zoomOut} className="zoom-button" aria-label="Zoom out">
          <FiZoomOut />
        </button>
      </div>
    </div>
  );
};

export default PDFReader; 