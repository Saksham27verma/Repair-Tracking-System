'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEmailNotification } from '@/app/components/EmailNotificationContext';

export default function EmailPopupHandler() {
  const searchParams = useSearchParams();
  const { showLoginEmailPopup } = useEmailNotification();
  
  // Check if popup should be shown based on URL parameter
  const showEmailPopup = searchParams.get('showEmailPopup') === 'true';
  
  useEffect(() => {
    console.log('EmailPopupHandler mounted');
    console.log('showEmailPopup parameter:', showEmailPopup);
    
    if (showEmailPopup) {
      console.log('Showing login email popup');
      // Show the email popup
      showLoginEmailPopup();
    }
  }, [showEmailPopup, showLoginEmailPopup]);
  
  // This component doesn't render anything
  return null;
} 