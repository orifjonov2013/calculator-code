export interface MathStep {
  step: number;
  title: string;
  expression: string;
  explanation: string;
}

export interface CalculationResponse {
  success: boolean;
  input: string;
  parsed_expression?: string;
  result: string;
  numeric_result?: number | null;
  fraction?: string | null;
  latex?: string;
  type?: string;
  is_symbolic?: boolean;
  steps: MathStep[];
  execution_time_ms: number;
  error?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  timestamp: string;
  type: 'keypad' | 'text' | 'photo' | 'result';
  text?: string;
  photoUrl?: string;
  calcResult?: CalculationResponse;
  showSteps?: boolean;
  keypadBuffer?: string;
  angleMode?: 'RAD' | 'DEG';
  isShift?: boolean;
  memory?: string;
}

export interface PythonProjectFiles {
  [filePath: string]: string;
}
