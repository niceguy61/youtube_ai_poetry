export type Persona = 
  | 'hamlet'
  | 'nietzsche'
  | 'yi-sang'
  | 'baudelaire'
  | 'rimbaud'
  | 'kim-soo-young'
  | 'yun-dong-ju'
  | 'edgar-allan-poe'
  | 'oscar-wilde'
  | 'kafka'
  | 'baek-seok';

export interface PersonaDefinition {
  id: Persona;
  name: string;
  nameKo: string;
  description: string;
  style: string;
  promptModifier: string;
}
