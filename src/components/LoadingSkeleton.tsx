/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

// ==========================================================
// TYPES
// ==========================================================
interface LoadingSkeletonProps {
  id?: string;
  type?: 'card' | 'list' | 'profile' | 'stats' | 'feed' | 'detail';
}

// ==========================================================
// PRIMITIVE
// ==========================================================
const Pulse = React.memo<{
  className: string;
}>(({ className }) => (
  <div className={`bg-slate-200 dark:bg-zinc-800 rounded-lg animate-pulse ${className}`} />
));
Pulse.displayName = 'Pulse';

// ==========================================================
// LIST — matches the app's edge-to-edge row pattern
// ==========================================================
const ListSkeleton = React.memo(() => (
  <div>
    {[1, 2, 3, 4].map(n => (
      <div
        key={n}
        className="bg-white dark:bg-zinc-950 p-4 border-b border-slate-100 dark:border-zinc-900 animate-pulse"
      >
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-zinc-800 flex-shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-2/3" />
            <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-1/2" />
            <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-1/3" />
          </div>
        </div>
        <div className="mt-3 h-14 bg-slate-100 dark:bg-zinc-900 rounded-2xl" />
        <div className="flex gap-2 mt-3">
          <div className="h-8 w-20 bg-slate-200 dark:bg-zinc-800 rounded-full" />
          <div className="h-8 w-20 bg-slate-200 dark:bg-zinc-800 rounded-full ml-auto" />
        </div>
      </div>
    ))}
  </div>
));
ListSkeleton.displayName = 'ListSkeleton';

// ==========================================================
// PROFILE — matches PublicProfile hero + sections
// ==========================================================
const ProfileSkeleton = React.memo(() => (
  <div className="animate-pulse">
    {/* Cover */}
    <div className="h-32 md:h-44 bg-slate-200 dark:bg-zinc-800 md:rounded-3xl" />

    {/* Avatar + name */}
    <div className="px-4 md:px-6 -mt-12 md:-mt-14">
      <div className="flex items-end gap-4">
        <div className="w-24 h-24 rounded-full bg-slate-300 dark:bg-zinc-700 border-4 border-white dark:border-zinc-950 flex-shrink-0" />
        <div className="pb-1 flex-1 space-y-2 min-w-0">
          <div className="h-6 bg-slate-200 dark:bg-zinc-800 rounded w-1/2" />
          <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-1/3" />
        </div>
      </div>
    </div>

    {/* Bio / info sections */}
    <div className="px-4 md:px-6 mt-8 space-y-3">
      <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-full" />
      <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-5/6" />
      <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-4/6" />
    </div>

    <div className="px-4 md:px-6 mt-8 pt-8 border-t border-slate-100 dark:border-zinc-900 space-y-4">
      <div className="h-5 bg-slate-200 dark:bg-zinc-800 rounded w-1/3" />
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(n => (
          <div key={n} className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-2xl bg-slate-200 dark:bg-zinc-800 flex-shrink-0" />
            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="h-2 bg-slate-200 dark:bg-zinc-800 rounded w-1/2" />
              <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
));
ProfileSkeleton.displayName = 'ProfileSkeleton';

// ==========================================================
// STATS — matches the app's 3-column flat stat row
// ==========================================================
const StatsSkeleton = React.memo(() => (
  <div className="grid grid-cols-3 border-b border-slate-100 dark:border-zinc-900 animate-pulse">
    {[1, 2, 3].map(n => (
      <div
        key={n}
        className="px-4 py-5 text-center border-r border-slate-100 dark:border-zinc-900 last:border-r-0"
      >
        <div className="w-4 h-4 bg-slate-200 dark:bg-zinc-800 rounded mx-auto mb-2" />
        <div className="h-6 bg-slate-200 dark:bg-zinc-800 rounded w-12 mx-auto" />
        <div className="h-2 bg-slate-200 dark:bg-zinc-800 rounded w-16 mx-auto mt-2" />
      </div>
    ))}
  </div>
));
StatsSkeleton.displayName = 'StatsSkeleton';

// ==========================================================
// FEED — matches NurseFeed's post card layout
// ==========================================================
const FeedSkeleton = React.memo(() => (
  <div>
    {[1, 2, 3].map(n => (
      <article
        key={n}
        className="bg-white dark:bg-zinc-950 p-4 border-b border-slate-100 dark:border-zinc-900 animate-pulse"
      >
        {/* Author */}
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-zinc-800 flex-shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-1/3" />
            <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-1/4" />
          </div>
        </div>
        {/* Content */}
        <div className="mt-3 space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-full" />
          <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-5/6" />
          <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-2/3" />
        </div>
        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          <div className="h-8 w-16 bg-slate-200 dark:bg-zinc-800 rounded-full" />
          <div className="h-8 w-16 bg-slate-200 dark:bg-zinc-800 rounded-full" />
          <div className="h-8 w-20 bg-slate-200 dark:bg-zinc-800 rounded-full ml-auto" />
        </div>
      </article>
    ))}
  </div>
));
FeedSkeleton.displayName = 'FeedSkeleton';

// ==========================================================
// CARD — generic grid of card skeletons
// ==========================================================
const CardSkeleton = React.memo(() => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
    {[1, 2, 3].map(n => (
      <div
        key={n}
        className="bg-slate-100 dark:bg-zinc-900 rounded-3xl p-5 space-y-4"
      >
        <div className="flex justify-between">
          <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-zinc-800" />
          <div className="w-16 h-6 rounded-full bg-slate-200 dark:bg-zinc-800" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-2/3" />
          <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-1/2" />
          <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-3/4" />
        </div>
        <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 flex gap-2">
          <div className="h-7 bg-slate-200 dark:bg-zinc-800 rounded-full w-1/4" />
          <div className="h-7 bg-slate-200 dark:bg-zinc-800 rounded-full w-1/4" />
        </div>
      </div>
    ))}
  </div>
));
CardSkeleton.displayName = 'CardSkeleton';

// ==========================================================
// DETAIL — single focused skeleton (forms, detail pages)
// ==========================================================
const DetailSkeleton = React.memo(() => (
  <div className="animate-pulse space-y-6">
    {/* Header */}
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 rounded-2xl bg-slate-200 dark:bg-zinc-800 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-1/2" />
        <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-1/3" />
      </div>
    </div>

    {/* Form fields */}
    <div className="space-y-4">
      {[1, 2, 3].map(n => (
        <div key={n}>
          <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-1/4 mb-2" />
          <div className="h-12 bg-slate-100 dark:bg-zinc-900 rounded-2xl" />
        </div>
      ))}
    </div>

    {/* Action button */}
    <div className="flex justify-end pt-4">
      <div className="h-12 w-32 bg-slate-200 dark:bg-zinc-800 rounded-2xl" />
    </div>
  </div>
));
DetailSkeleton.displayName = 'DetailSkeleton';

// ==========================================================
// MAIN
// ==========================================================
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  id,
  type = 'card',
}) => {
  return (
    <div id={id} className="w-full">
      {type === 'list' && <ListSkeleton />}
      {type === 'profile' && <ProfileSkeleton />}
      {type === 'stats' && <StatsSkeleton />}
      {type === 'feed' && <FeedSkeleton />}
      {type === 'card' && <CardSkeleton />}
      {type === 'detail' && <DetailSkeleton />}
    </div>
  );
};