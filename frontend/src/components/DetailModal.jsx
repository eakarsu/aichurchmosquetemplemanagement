import React, { useState } from 'react';
import { X } from 'lucide-react';

function DetailModal({ isOpen, onClose, title, children, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen) return null;

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete();
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
      setConfirmDelete(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={() => { onClose(); setConfirmDelete(false); }}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {(onEdit || onDelete) && (
          <div className="modal-footer">
            {onEdit && (
              <button className="btn btn-primary" onClick={onEdit}>
                Edit
              </button>
            )}
            {onDelete && (
              <button className="btn btn-danger" onClick={handleDelete}>
                {confirmDelete ? 'Confirm Delete?' : 'Delete'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DetailModal;
