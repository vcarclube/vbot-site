import React, { useEffect } from 'react';
import './style.css';

const Modal = ({ isOpen, onClose, title, children, size = 'medium' }) => {
  // Evitar scroll no body quando o modal está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div 
        className={`modal-container modal-${size}`} 
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;