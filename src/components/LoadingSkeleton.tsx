/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LoadingSkeletonProps {
  id: string;
  type?: 'card' | 'list' | 'profile' | 'stats';
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ id, type = 'card' }) => {
  if (type === 'list') {
    return (
      <div id={id} className="space-y-4 w-full">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-center gap-4 bg-white border border-slate-100 p-4 rounded-xl animate-pulse">
            <div className="w-12 h-12 bg-slate-100 rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-100 rounded w-1/3"></div>
              <div className="h-3 bg-slate-50 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'profile') {
    return (
      <div id={id} className="w-full space-y-6 animate-pulse">
        <div className="h-48 bg-slate-100 rounded-2xl w-full"></div>
        <div className="flex gap-4 items-end -mt-12 px-6">
          <div className="w-24 h-24 rounded-full bg-slate-200 border-4 border-white"></div>
          <div className="space-y-2 pb-2">
            <div className="h-6 bg-slate-200 rounded w-48"></div>
            <div className="h-4 bg-slate-100 rounded w-32"></div>
          </div>
        </div>
        <div className="space-y-3 px-6 h-24 bg-white rounded-2xl border border-slate-100 p-6">
          <div className="h-4 bg-slate-100 rounded w-1/4"></div>
          <div className="h-3 bg-slate-50 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (type === 'stats') {
    return (
      <div id={id} className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-28 bg-white border border-slate-100 rounded-2xl p-6">
            <div className="flex justify-between">
              <div className="space-y-2 w-1/2">
                <div className="h-3 bg-slate-100 rounded"></div>
                <div className="h-6 bg-slate-200 rounded"></div>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div id={id} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {[1, 2, 3].map((n) => (
        <div key={n} className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between">
            <div className="w-16 h-16 bg-slate-200 rounded-xl"></div>
            <div className="w-20 h-6 bg-slate-100 rounded-full"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
            <div className="h-3 bg-slate-100 rounded w-1/2"></div>
            <div className="h-3 bg-slate-50 rounded w-3/4"></div>
          </div>
          <div className="pt-4 border-t border-slate-50 flex gap-2">
            <div className="h-6 bg-slate-100 rounded w-1/4"></div>
            <div className="h-6 bg-slate-100 rounded w-1/4"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
