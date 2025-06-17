import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "../styles/MediaViewer.module.css";
import { IoIosArrowBack, IoIosArrowForward, IoMdClose } from "react-icons/io";
import { FiDownload, FiZoomIn } from "react-icons/fi";

const MediaViewer = ({ files = [], initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const mediaRef = useRef(null);

  const currentFile = files[currentIndex];
if (!currentFile) return null;

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  }, [currentIndex]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const next = () => {
    if (currentIndex < files.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const prev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const toggleZoom = () => {
    setZoomed(!zoomed);
    setOffset({ x: 0, y: 0 });
  };

  const handleTouchStart = (e) => {
    setDragStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!dragStart) return;
    const deltaX = e.changedTouches[0].clientX - dragStart;
    if (deltaX > 50) prev();
    else if (deltaX < -50) next();
    setDragStart(null);
  };

  const handleMouseDown = (e) => {
    if (!zoomed) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startOffset = { ...offset };

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      setOffset({ x: startOffset.x + dx, y: startOffset.y + dy });
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  useEffect(() => {
    setZoomed(false);
    setOffset({ x: 0, y: 0 });
  }, [currentIndex]);

  return (
    <div className={styles.overlay}>
      <div className={styles.header}>
        <div className={styles.actions}>
          <a href={currentFile.url} download target="_blank" rel="noopener noreferrer"><FiDownload className={styles.download}/></a>
          <button onClick={toggleZoom}><FiZoomIn className={styles.zoom}/></button>
          <button onClick={onClose}><IoMdClose className={styles.close}/></button>
        </div>
      </div>

      <div className={styles.viewer}>
        {currentIndex > 0 && <button className={styles.navLeft} onClick={prev}><IoIosArrowBack /></button>}
        {currentIndex < files.length - 1 && <button className={styles.navRight} onClick={next}><IoIosArrowForward /></button>}

        <div className={styles.mediaWrapper}>
          {currentFile.type === "video" ? (
            <video
              src={currentFile.url}
              controls
              autoPlay
              className={`${styles.media} ${styles.mediaVideo}`}
            />
          ) : (
            <img
              ref={mediaRef}
              src={currentFile.url}
              alt=""
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className={styles.media}
              style={zoomed ? {
                cursor: "grab",
                transform: `scale(2) translate(${offset.x / 2}px, ${offset.y / 2}px)`
              } : {}}
            />
          )}
        </div>
      </div>

      <div className={styles.thumbnailBar}>
        {files.map((file, index) =>
          file.url ? (
            file.type === "video"
              ? (
                <video
                  key={index}
                  src={file.url}
                  className={styles.thumb}
                  muted
                  playsInline
                  preload="metadata"
                  onClick={() => setCurrentIndex(index)}
                />
              ) : (
                <img
                  key={index}
                  src={file.url}
                  className={`${styles.thumb} ${index === currentIndex ? styles.active : ""}`}
                  onClick={() => setCurrentIndex(index)}
                />
              )
          ) : null
        )}
      </div>
    </div>
  );
};

export default MediaViewer