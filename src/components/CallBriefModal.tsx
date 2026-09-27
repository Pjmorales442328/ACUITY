// Pre-call briefing: customer CRM card and assessment expectations shown before connecting.
import React, { useMemo } from 'react';
import { PhoneCall, UserCircle, Calendar, Briefcase, FileText, Target, AlertTriangle, Play } from 'lucide-react';
import { Scenario } from '../types';

interface CallBriefModalProps {
  scenario: Scenario;
  candidateName: string;
  onConnect: () => void;
  onCancel: () => void;
}

export const CallBriefModal: React.FC<CallBriefModalProps> = ({
  scenario,
  candidateName,
  onConnect,
  onCancel
}) => {
  // Generate some fake CRM data based on the scenario
  const getCrmData = () => {
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setMonth(today.getMonth() - Math.floor(Math.random() * 24) - 1);
    
    return {
      accountNumber: Math.floor(10000000 + Math.random() * 90000000).toString(),
      customerSince: pastDate.toLocaleDateString(),
      status: 'Active',
      planType: scenario.category === 'Telecom' ? 'Fiber Gigabit' : scenario.category === 'Fintech' ? 'Premium Credit' : 'Standard Member'
    };
  };

  const crmData = useMemo(getCrmData, [scenario.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header - Simulated CTI Ringing */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 animate-pulse">
              <PhoneCall className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight tracking-tight">Incoming Interaction...</h2>
              <p className="text-blue-200 text-xs font-mono">Routing to Agent: {candidateName || 'New Candidate'}</p>
            </div>
          </div>
          <div className="bg-blue-600/20 text-blue-300 px-3 py-1 rounded text-[11px] font-bold uppercase tracking-wider border border-blue-500/30">
            {scenario.category} Dept
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <p className="text-sm text-slate-500 mb-6 italic">
            Please review the customer profile and scenario context before connecting the audio session.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            
            {/* CRM Profile Panel */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3 flex items-center gap-1.5">
                <UserCircle className="w-4 h-4 text-slate-400" /> CRM Profile Data
              </h3>
              
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Customer Name</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {scenario.customerName}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Account #</span>
                    <span className="text-xs font-mono text-slate-700">{crmData.accountNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Customer Since</span>
                    <span className="text-xs font-mono text-slate-700">{crmData.customerSince}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Status</span>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 inline-block">{crmData.status}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Tier / Plan</span>
                    <span className="text-xs font-medium text-slate-700">{crmData.planType}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Assessment Objectives Panel */}
            <div className="flex flex-col gap-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex-1">
                <h3 className="text-xs font-bold uppercase text-blue-700 tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-500" /> Situation & Purpose
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {scenario.description}
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase text-amber-700 tracking-wider mb-2 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-amber-500" /> BPO Agent Expectations
                </h3>
                <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4">
                  <li>Display strong active listening and professional empathy.</li>
                  <li>Follow logical troubleshooting/verification steps.</li>
                  <li>Maintain a calm, professional temperament to de-escalate.</li>
                  <li>Keep responses concise to allow natural turn-taking.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">
              When you click Connect, your microphone turns on and the customer speaks first. Respond out loud as the support agent; the call is scored after you end it.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Cancel Assessment
          </button>
          <button 
            onClick={onConnect}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4" fill="currentColor" />
            Connect Call
          </button>
        </div>

      </div>
    </div>
  );
};
