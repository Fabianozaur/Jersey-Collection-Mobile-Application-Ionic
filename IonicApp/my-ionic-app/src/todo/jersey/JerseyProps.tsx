import internal from "events";

export interface JerseyProps {
    _id?: string;
    teamName: string;
    playerName: string;
    playerNumber: number;
    jerseyYear: string;
    sport:string;
    brand:string;
    isSigned:boolean;
    latitude?: number;
    longitude?: number;
    webViewPath: string;

  }
  