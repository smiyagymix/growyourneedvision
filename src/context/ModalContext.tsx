import React, { createContext, useState, useCallback, useContext, ReactNode } from 'react';
import { Modal } from '../components/shared/ui/Modal';

interface ModalConfig {
  title: string;
  content: ReactNode;
  footer?: ReactNode;
}

interface ModalContextType {
  openModal: (config: ModalConfig) => void;
  closeModal: () => void;
  isOpen: boolean;
}

export const ModalContext = createContext<ModalContextType | undefined>(undefined);

/**
 * Hook to access modal context
 */
export function useModal(): ModalContextType {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ModalConfig | null>(null);

  const openModal = useCallback((newConfig: ModalConfig) => {
    setConfig(newConfig);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setConfig(null), 300); // Clear after animation
  }, []);

  return (
    <ModalContext.Provider value={{ openModal, closeModal, isOpen }}>
      {children}
      {config && (
        <Modal
          isOpen={isOpen}
          onClose={closeModal}
          title={config.title}
          footer={config.footer}
        >
          {config.content}
        </Modal>
      )}
    </ModalContext.Provider>
  );
};
