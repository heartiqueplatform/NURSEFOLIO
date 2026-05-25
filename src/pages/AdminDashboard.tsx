/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { databaseService } from '../services/databaseService';
import { VerificationRequest, UserProfile } from '../types';
import { ShieldAlert, Check, X, Users, ClipboardCheck, AlertCircle, RefreshCw } from 'lucide-react';

export default function AdminDashboard() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  const loadAdminMetrics = async () => {
    try {
      setLoading(true);
      const reqList = (await databaseService.getVerificationRequests()).filter(r => r.status === 'pending');
      setRequests(reqList);
      
      // Load overall mock registries
      const userList = await databaseService.getProfiles();
      setUsers(userList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminMetrics();
  }, []);

  const handleApprove = async (req: VerificationRequest) => {
    setActionMsg('');
    try {
      // Approve profile verification status
      await databaseService.updateProfile(req.profile_id, {
        verification_status: 'verified'
      });
      // Resolve checking request
      await databaseService.reviewVerificationRequest(req.id, 'verified');
      
      setActionMsg(`Approved board credentials for "${req.nurse_name}" matching ID: ${req.license_number}`);
      setTimeout(() => setActionMsg(''), 4000);
      await loadAdminMetrics();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDecline = async (req: VerificationRequest) => {
    setActionMsg('');
    try {
      await databaseService.updateProfile(req.profile_id, {
        verification_status: 'unverified'
      });
      await databaseService.reviewVerificationRequest(req.id, 'unverified');
      
      setActionMsg(`Rejected credential filings for "${req.nurse_name}" matching state registry ID.`);
      setTimeout(() => setActionMsg(''), 4000);
      await loadAdminMetrics();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 font-sans text-xs">
      
      {/* Title */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl -z-10"></div>
        <div className="flex justify-between items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Board Registry Administration Hub</h2>
            <p className="text-slate-400 text-xs">Review state nurse licensings, student ID verifications, and audit reported profile cards.</p>
          </div>
          
          <button
            id="admin-btn-reload"
            onClick={loadAdminMetrics}
            className="p-3 bg-slate-800 border border-slate-700 hover:border-teal-500 rounded-xl transition text-slate-350 cursor-pointer"
            title="Reload registry dockets"
          >
            <RefreshCw className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {actionMsg && (
        <div id="admin-action-alert" className="bg-emerald-50 border border-emerald-100 text-emerald-705 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{actionMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Verification requests lists */}
        <div className="md:col-span-8 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="border-b border-slate-105 pb-3.5">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-teal-650" />
              <span>Pending State Licensing Reviews ({requests.length})</span>
            </h3>
            <p className="text-[10px] text-slate-450 mt-1">Nurses awaiting board verified badge indicators.</p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-slate-100 border-t-teal-600 rounded-full animate-spin"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-slate-50/40 rounded-xl border border-dashed border-slate-150">
              <Check className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-800">Clear queue!</h4>
              <p className="text-[10px] text-slate-450 mt-0.5 max-w-xs mx-auto">No pending verification inquiries have been compiled on the servers.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div key={req.id} className="bg-slate-50/60 border border-slate-100 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-start gap-3 flex-wrap">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs leading-tight">{req.nurse_name}</h4>
                      <p className="text-[10px] text-slate-450 mt-0.5">{req.nurse_email}</p>
                    </div>

                    <div className="inline-flex gap-2">
                      <button
                        id={`admin-btn-approve-${req.id}`}
                        onClick={() => handleApprove(req)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3.5 rounded-lg text-[10px] active:scale-95 transition cursor-pointer"
                      >
                        Approve Badge
                      </button>
                      <button
                        id={`admin-btn-reject-${req.id}`}
                        onClick={() => handleDecline(req)}
                        className="bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold py-1.5 px-3.5 rounded-lg text-[10px] active:scale-95 transition cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-[10px] border-t border-slate-100/60 pt-2 text-slate-500 font-medium ml-1">
                    <div>
                      <span>License Type:</span>
                      <span className="text-slate-705 ml-1 font-bold">{req.license_type}</span>
                    </div>
                    <div>
                      <span>License ID:</span>
                      <span className="text-slate-705 font-mono ml-1">{req.license_number}</span>
                    </div>
                    <div>
                      <span>State Board:</span>
                      <span className="text-slate-705 ml-1 font-bold">{req.state_country}</span>
                    </div>
                    <div>
                      <span>Status:</span>
                      <span className="bg-amber-50 border border-amber-100 text-amber-700 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ml-1">PENDING REVIEW</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Registered Profiles list */}
        <div className="md:col-span-4 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
            <Users className="w-5 h-5 text-teal-650" />
            <span>Active nurse directories list ({users.length})</span>
          </h3>

          <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto pr-1">
            {users.map((profile) => (
              <div key={profile.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-slate-800 text-xs">{profile.first_name} {profile.last_name}</div>
                  <div className="text-[10px] text-slate-450">@{profile.username}</div>
                </div>

                <div className="flex items-center gap-1">
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    profile.verification_status === 'verified'
                      ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                      : 'bg-slate-50 border border-slate-150 text-slate-600'
                  }`}>
                    {profile.verification_status}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}
