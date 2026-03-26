export interface CodeQualityItem {
    dimension: string;    
    description: string;    
    isAppropriate: boolean; 
}

export interface AIAnalysisResult {
    feedback: string;       
    score: number;       
    mistake_tags: string[]; 
    foundSyntaxError: boolean;
    conceptExplanation: string; 
    codeQuality: CodeQualityItem[];
}