/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { databaseService } from '../services/databaseService';
import { VerificationRequest, UserProfile } from '../types';
import {
  Check, X, Users, ClipboardCheck, AlertCircle, RefreshCw,
  Loader2, ShieldCheck, Shield, Clock, Search, Lock
} from 'lucide-react';

// ==========================================================
// TYPES
// ==========================================================
type ActionKind = 'approve' | 'reject';

interface ActionState {
  id: string | null;
  kind: ActionKind | null;
}

// ==========================================================
// MAIN
// ==========================================================
export default function AdminDashboard() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [action, setAction] = useState<ActionState>({ id: null, kind: null });
  const [searchQuery, setSearchQuery] = useState('');

  // ----------------------------------------------------------
  // Load
  // ----------------------------------------------------------
  const loadAdminMetrics = useCallback(async (silent = false) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError('');

      const [reqList, userList] = await Promise.all([
        databaseService.getVerificationRequests(),
        databaseService.getProfiles(),
      ]);

      setRequests((reqList || []).filter(r => r.status === 'pending'));
      setUsers(userList || []);
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
      setError('Could not load the admin dashboard. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAdminMetrics();
  }, [loadAdminMetrics]);

  // ----------------------------------------------------------
  // Approve / Decline
  // ----------------------------------------------------------
  const handleAction = useCallback(async (req: VerificationRequest, kind: ActionKind) => {
    if (action.id) return; // already processing
    setAction({ id: req.id, kind });
    setError('');
    setSuccess('');

    try {
      const nextStatus = kind === 'approve' ? 'verified' : 'unverified';

      await databaseService.updateProfile(req.profile_id, {
        verification_status: nextStatus,
      });
      await databaseService.reviewVerificationRequest(req.id, nextStatus);

      // Optimistic: remove from the pending list immediately
      setRequests(prev => prev.filter(r => r.id !== req.id));
      setUsers(prev =>
        prev.map(u =>
          u.id === req.profile_id ? { ...u, verification_status: nextStatus } : u
        )
      );

      setSuccess(
        kind === 'approve'
          ? `Verified ${req.nurse_name} · ID ${req.license_number}`
          : `Declined credentials for ${req.nurse_name}`
      );
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Action failed:', err);
      setError('Action failed. Please try again.');
    } finally {
      setAction({ id: null, kind: null });
    }
  }, [action.id]);

  // ----------------------------------------------------------
  // Derived
  // ----------------------------------------------------------
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u => {
      const name = `${u.first_name} ${u.last_name}`.toLowerCase();
      const username = (u.username || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      return name.includes(q) || username.includes(q) || email.includes(q);
    });
  }, [users, searchQuery]);

  const verifiedCount = useMemo(
    () => users.filter(u => u.verification_status === 'verified').length,
    [users]
  );

  // ==========================================================
  // RENDER
  // ==========================================================
  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-zinc-950">
      <div className="max-w-5xl mx-auto md:px-6 md:py-8 pb-24">

        {/* ============================================
            HEADER
            ============================================ */}
        <div className="px-4 md:px-0 pt-4 md:pt-0 pb-4 md:pb-6 flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-2xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
              Admin
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Review verification requests and manage the registry
            </p>
          </div>
          <button
            onClick={() => loadAdminMetrics(true)}
            disabled={refreshing || loading}
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-zinc-900 transition disabled:opacity-50 flex-shrink-0"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* ============================================
            STATS — 3 flat tiles
            ============================================ */}
        <section className="grid grid-cols-3 border-t border-b border-slate-100 dark:border-zinc-900 mb-6 md:rounded-2xl md:border">
          <StatTile
            icon={Clock}
            label="Pending"
            value={requests.length}
            tone="amber"
          />
          <StatTile
            icon={ShieldCheck}
            label="Verified"
            value={verifiedCount}
            tone="emerald"
          />
          <StatTile
            icon={Users}
            label="Total nurses"
            value={users.length}
            tone="teal"
            last
          />
        </section>

        {/* ============================================
            MESSAGES
            ============================================ */}
        {success && (
          <div className="mx-4 md:mx-0 mb-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-2xl text-sm font-semibold flex items-start gap-2 animate-in fade-in duration-150">
            <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="mx-4 md:mx-0 mb-4 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-2xl text-sm font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">

          {/* ============================================
              PENDING VERIFICATIONS
              ============================================ */}
          <section className="md:col-span-7">
            <div className="px-4 md:px-0 mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Pending review
              </h2>
              {requests.length > 0 && (
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full tabular-nums">
                  {requests.length}
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-2 px-4 md:px-0">
                {[1, 2].map(i => (
                  <div
                    key={i}
                    className="h-32 bg-slate-100 dark:bg-zinc-900 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="mx-4 md:mx-0 text-center py-16">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mb-4">
                  <Check className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
                  All clear
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
                  No pending verification requests right now.
                </p>
              </div>
            ) : (
              <div className="px-4 md:px-0 space-y-3">
                {requests.map(req => (
                  <RequestCard
                    key={req.id}
                    request={req}
                    action={action}
                    onApprove={() => handleAction(req, 'approve')}
                    onReject={() => handleAction(req, 'reject')}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ============================================
              NURSE DIRECTORY
              ============================================ */}
          <section className="md:col-span-5">
            <div className="px-4 md:px-0 mb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Nurse directory
              </h2>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by name or username"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full text-sm pl-11 pr-4 py-2.5 bg-slate-100 dark:bg-zinc-900 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition"
                />
              </div>
            </div>

            {loading ? (
              <div className="space-y-1 px-4 md:px-0">
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="h-12 bg-slate-100 dark:bg-zinc-900 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="mx-4 md:mx-0 text-center py-8">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {searchQuery
                    ? `No nurses match "${searchQuery}"`
                    : 'No nurses registered yet.'}
                </p>
              </div>
            ) : (
              <div className="px-4 md:px-0">
                {filteredUsers.map(user => (
                  <UserRow key={user.id} user={user} />
                ))}
              </div>
            )}
          </section>

        </div>

      </div>
    </div>
  );
}

// ==========================================================
// STAT TILE
// ==========================================================
const StatTile = React.memo<{
  icon: any;
  label: string;
  value: number;
  tone: 'teal' | 'emerald' | 'amber';
  last?: boolean;
}>(({ icon: Icon, label, value, tone, last }) => {
  const tones = {
    teal: 'text-teal-600 dark:text-teal-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
  };
  return (
    <div
      className={`px-4 py-5 text-center ${last ? '' : 'border-r border-slate-100 dark:border-zinc-900'
        }`}
    >
      <Icon className={`w-4 h-4 mx-auto mb-2 ${tones[tone]}`} />
      <div className="text-2xl font-display font-extrabold text-slate-900 dark:text-white tabular-nums leading-none">
        {value}
      </div>
      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1.5">
        {label}
      </p>
    </div>
  );
});
StatTile.displayName = 'StatTile';

// ==========================================================
// REQUEST CARD
// ==========================================================
const RequestCard = React.memo<{
  request: VerificationRequest;
  action: ActionState;
  onApprove: () => void;
  onReject: () => void;
}>(({ request, action, onApprove, onReject }) => {
  const isProcessing = action.id === request.id;
  const isApproving = isProcessing && action.kind === 'approve';
  const isRejecting = isProcessing && action.kind === 'reject';
  const disabled = isProcessing;

  return (
    <article className="bg-white dark:bg-zinc-950 md:rounded-2xl p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {request.nurse_name}
            </h3>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
              <Clock className="w-3 h-3" />
              Pending
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {request.nurse_email}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        <DetailCell label="License type" value={request.license_type} />
        <DetailCell label="License ID" value={request.license_number} mono />
        <DetailCell label="Issuing board" value={request.state_country} />
        <DetailCell
          label="Submitted"
          value={
            request.created_at
              ? new Date(request.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
              : '—'
          }
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-zinc-900">
        <button
          onClick={onApprove}
          disabled={disabled}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-emerald-600 active:bg-emerald-700 text-white text-xs font-bold transition disabled:opacity-50 min-h-[40px]"
        >
          {isApproving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Approving
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              Approve
            </>
          )}
        </button>
        <button
          onClick={onReject}
          disabled={disabled}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 text-xs font-bold active:opacity-70 transition disabled:opacity-50 min-h-[40px]"
        >
          {isRejecting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Declining
            </>
          ) : (
            <>
              <X className="w-3.5 h-3.5" />
              Decline
            </>
          )}
        </button>
      </div>
    </article>
  );
});
RequestCard.displayName = 'RequestCard';

// ==========================================================
// DETAIL CELL
// ==========================================================
const DetailCell = React.memo<{
  label: string;
  value: string;
  mono?: boolean;
}>(({ label, value, mono }) => (
  <div className="min-w-0">
    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
      {label}
    </p>
    <p
      className={`text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate ${mono ? 'font-mono' : ''
        }`}
      title={value}
    >
      {value || '—'}
    </p>
  </div>
));
DetailCell.displayName = 'DetailCell';

// ==========================================================
// USER ROW
// ==========================================================
const UserRow = React.memo<{ user: UserProfile }>(({ user }) => {
  const isVerified = user.verification_status === 'verified';
  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-zinc-900 last:border-b-0">
      {/* Avatar */}
      {user.avatar_url ? (
        <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 dark:bg-zinc-900 flex-shrink-0">
          <img
            src={user.avatar_url}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {initials || <Users className="w-4 h-4" />}
        </div>
      )}

      {/* Name + username */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
          {user.first_name} {user.last_name}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
          @{user.username}
        </p>
      </div>

      {/* Status */}
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${isVerified
          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
          : user.verification_status === 'pending'
            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
            : 'bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-slate-400'
          }`}
      >
        {isVerified ? (
          <ShieldCheck className="w-3 h-3" />
        ) : user.verification_status === 'pending' ? (
          <Clock className="w-3 h-3" />
        ) : (
          <Shield className="w-3 h-3" />
        )}
        {isVerified ? 'Verified' : user.verification_status === 'pending' ? 'Pending' : 'Unverified'}
      </span>
    </div>
  );
});
UserRow.displayName = 'UserRow';