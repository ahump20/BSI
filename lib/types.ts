/**
 * Shared Type Definitions
 *
 * Common types used across the Blaze Sports Intel platform
 */

export interface AlertPreferences {
  userId: string;
  teams: string[];
  alertTypes: {
    highLeverage: boolean;
    leadChange: boolean;
    closeGame: boolean;
    upsetAlert: boolean;
    walkOff: boolean;
    momentumShift: boolean;
    gameStart: boolean;
    gameEnd: boolean;
  };
  minLeverageThreshold: number;
  upsetThreshold: number;
  closeGameMargin: number;
  quietHours: {
    start: string;
    end: string;
  };
  deliveryMethods: {
    push: boolean;
    email: boolean;
    sms: boolean;
    webSocket: boolean;
  };
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  timestamp?: string;
  teamId?: string;
  gameId?: string;
  type?: string;
}
