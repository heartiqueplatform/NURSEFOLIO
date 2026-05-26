/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Check, HelpCircle } from 'lucide-react';

export default function Pricing() {
  const plans = [
    {
      name: 'Nursing Student',
      price: '$0',
      period: 'Forever free',
      desc: 'Perfect for current BSN / LPN candidates laying out early rotations.',
      features: [
        'Single public portfolio page',
        'Clinical rotation hours logging',
        'Basic themes (clinical, academic)',
        'Student ID verification check',
        'Auto-generated resume exports'
      ],
      cta: 'Sign Up Student',
      btnId: 'pricing-btn-student',
      color: 'border-slate-100 dark:border-slate-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white',
    },
    {
      name: 'Clinical Professional',
      price: '$0',
      period: 'Beta Launch Promotion / Free',
      desc: 'For working Registered Nurses, nurse managers, & practitioners.',
      features: [
        'Unlimited verified board licenses',
        'Unlock all premium Themes (Modern, Dark, Academic)',
        'Hospital experiences charge logger',
        'Search directories discover placement',
        'PDF CV downloads telemetry panel',
        'Custom board cert uploads'
      ],
      popular: true,
      cta: 'Begin Premium Free',
      btnId: 'pricing-btn-professional',
      color: 'border-teal-500 bg-teal-900 dark:bg-teal-950 text-white ring-4 ring-teal-500/10 shadow-lg shadow-teal-500/5',
    },
    {
      name: 'Agency Enterprise',
      price: '$49',
      period: 'per month',
      desc: 'For acute medical centers, hospital recruiters and contracting boards.',
      features: [
        '5 active recruiter logins',
        'Advanced location or keyword candidate filters',
        'Download batches of certified nurse CVs',
        'Hospital vacancy posting boards',
        'Verified certificates audit log',
        'Custom placement matching algorithms'
      ],
      cta: 'Contact Sales Support',
      btnId: 'pricing-btn-agency',
      color: 'border-slate-100 dark:border-slate-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white',
    }
  ];

  return (
    <div className="bg-slate-50/40 dark:bg-zinc-950/40 min-h-screen py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <span className="text-xs bg-teal-50 dark:bg-teal-950/50 border border-teal-150 dark:border-teal-800 text-teal-700 dark:text-teal-400 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Simple Subscriptions
          </span>
          <h1 className="text-4xl font-extrabold font-sans tracking-tight text-slate-900 dark:text-white">
            Transparent pricing for everyone
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
            Nursefolio public layouts are free for nurses and students. Recruiter batch search metrics have agency parameters.
          </p>
        </div>

        {/* Pricing Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-16">
          {plans.map((plan, index) => {
            return (
              <div
                key={index}
                className={`rounded-3xl border p-8 flex flex-col justify-between relative transition-transform duration-300 hover:scale-[100.5%] ${plan.color}`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-teal-500 dark:bg-teal-400 text-slate-950 dark:text-slate-950 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Most Popular
                  </span>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold">{plan.name}</h3>
                    <p className={`text-xs mt-1 leading-relaxed ${plan.popular ? 'text-teal-350 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'}`}>{plan.desc}</p>
                  </div>

                  <div className="flex items-baseline gap-1 pt-2">
                    <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                    <span className={`text-xs font-semibold ${plan.popular ? 'text-teal-300 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'}`}>/{plan.period}</span>
                  </div>

                  {/* Feature list */}
                  <ul className="space-y-4 text-xs pt-4 border-t border-slate-100/10 dark:border-slate-800/50">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <Check className={`w-4 h-4 flex-shrink-0 ${plan.popular ? 'text-teal-400 dark:text-teal-500' : 'text-teal-600 dark:text-teal-500'}`} />
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <Link
                    id={plan.btnId}
                    to={plan.name === 'Agency Enterprise' ? '/contact' : '/register'}
                    className={`block w-full text-center py-3 rounded-xl text-xs font-bold transition active:scale-[98%] ${plan.popular
                      ? 'bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 shadow-md font-semibold hover:opacity-95'
                      : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                      }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Guarantee Info */}
        <div className="text-center p-8 bg-white dark:bg-zinc-950 border border-slate-100 dark:border-slate-800 rounded-3xl max-w-2xl mx-auto space-y-3">
          <HelpCircle className="w-8 h-8 text-teal-600 dark:text-teal-400 mx-auto" />
          <h4 className="text-base font-bold text-slate-850 dark:text-slate-200">Need a custom agency plan or multi-hospital dashboard?</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal max-w-md mx-auto">
            Our teams construct secure board certification pipelines integrated with hospital Epic EMR directories. Contact our support channels for Enterprise custom packages.
          </p>
        </div>

      </div>
    </div>
  );
}