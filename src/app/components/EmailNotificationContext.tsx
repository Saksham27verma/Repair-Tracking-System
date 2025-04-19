'use client';

import React, { createContext, useState, useContext } from 'react';
import EmailNotificationPopup from './EmailNotificationPopup';
import LoginEmailNotificationPopup from './LoginEmailNotificationPopup';
import { useRouter } from 'next/navigation';

interface EmailNotificationContextType {
  showEmailNotificationPopup: (repairId: string, initialEmail?: string) => void;
  showLoginEmailPopup: (initialEmail?: string) => void;
}

const EmailNotificationContext = createContext<EmailNotificationContextType>({
  showEmailNotificationPopup: () => {},
  showLoginEmailPopup: () => {},
});

export const useEmailNotification = () => useContext(EmailNotificationContext);

export function EmailNotificationProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false);
  const [repairId, setRepairId] = useState<string>('');
  const [initialEmail, setInitialEmail] = useState<string>('');
  const router = useRouter();

  const showEmailNotificationPopup = (id: string, email: string = '') => {
    console.log('showEmailNotificationPopup called with:', { id, email });
    setRepairId(id);
    setInitialEmail(email);
    setIsOpen(true);
    console.log('EmailNotificationContext - popup state set to open');
  };

  const showLoginEmailPopup = (email: string = '') => {
    setInitialEmail(email);
    setIsLoginPopupOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleLoginPopupClose = () => {
    setIsLoginPopupOpen(false);
  };

  const handleLoginEmailSave = async (email: string) => {
    try {
      // Store email in localStorage for later use
      if (typeof window !== 'undefined') {
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userNotificationPreference', 'email');
      }
      
      // Also try to update any repairs with this email in the database
      try {
        const response = await fetch('/api/user-preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            notificationPreference: 'email'
          }),
        });
        
        if (!response.ok) {
          console.warn('Could not update repair preferences, but email is saved locally');
        }
      } catch (apiError) {
        // If the API call fails, that's okay - we already saved to localStorage
        console.warn('API call failed, but email is saved locally:', apiError);
      }

      // Success - close the popup
      setIsLoginPopupOpen(false);
      
      // Refresh to update UI
      router.refresh();
    } catch (error) {
      console.error('Error saving email preferences:', error);
      throw error;
    }
  };

  return (
    <EmailNotificationContext.Provider value={{ showEmailNotificationPopup, showLoginEmailPopup }}>
      {children}
      {isOpen && (
        <EmailNotificationPopup
          open={isOpen}
          onClose={handleClose}
          repairId={repairId}
          initialEmail={initialEmail}
        />
      )}
      {isLoginPopupOpen && (
        <LoginEmailNotificationPopup
          open={isLoginPopupOpen}
          onClose={handleLoginPopupClose}
          onSave={handleLoginEmailSave}
          initialEmail={initialEmail}
        />
      )}
    </EmailNotificationContext.Provider>
  );
} 