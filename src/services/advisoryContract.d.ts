export type AdvisoryPriority="critical"|"high"|"medium"|"low";
export type EvidenceLevel="confirmed"|"calculated"|"suggested";
export interface ProposedAction{type:string;payload:Record<string,unknown>}
export interface AdvisoryItem{id:string;title:string;explanation:string;priority:AdvisoryPriority;sourceModule:string;relatedRecordIds:string[];evidenceLevel:EvidenceLevel;approvalRequired:true;proposedAction?:ProposedAction}
export interface AdvisoryResponse{contract:"familyos.advisory-response";version:"3.2";summary:string;findings:AdvisoryItem[];recommendations:AdvisoryItem[];risks:AdvisoryItem[];supportingRecords:Record<string,unknown>[];sourceModules:string[];generatedAt:string;fallback:boolean}
export function validateAdvisoryResponse(value:unknown):{ok:boolean;errors:string[];value?:AdvisoryResponse;fallbackSummary:string};
export function deterministicAdvisory(context?:Record<string,unknown>,options?:Record<string,unknown>):AdvisoryResponse;
