import React from 'react';
import './ConfirmDialog.css';

interface ConfirmDialogProps {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="confirm-dialog-overlay" onClick={onCancel}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="confirm-dialog-message">{message}</div>
                <div className="confirm-dialog-buttons">
                    <button
                        className="confirm-btn confirm-yes"
                        onClick={onConfirm}
                    >
                        はい
                    </button>
                    <button
                        className="confirm-btn confirm-no"
                        onClick={onCancel}
                    >
                        いいえ
                    </button>
                </div>
            </div>
        </div>
    );
};
