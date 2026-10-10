import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { subscribe } from '../services/store';

// Recharge les données d'un écran :
//  - à son ouverture,
//  - dès qu'une donnée change (réservation, publication, annulation…),
//  - et toutes les 5 secondes en filet de sécurité.
export default function useLive(load, intervalMs = 5000) {
  useFocusEffect(
    useCallback(() => {
      load();
      const unsubscribe = subscribe(load);
      const timer = setInterval(load, intervalMs);
      return () => {
        unsubscribe();
        clearInterval(timer);
      };
    }, [load, intervalMs])
  );
}
