import React, { Suspense, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import MainLayout from './MainLayout';
import { MODULE_REGISTRY, getModuleConfig } from '../../modules/registry';
import { ErrorBoundary } from '../shared/ErrorBoundary';

type LoadingSpinnerProps = {
  label?: string;
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Initializing module...',
}) => (
  <div
    className="flex h-full w-full flex-col items-center justify-center gap-4 text-gray-400 dark:text-hud-primary animate-fadeIn"
    role="status"
    aria-live="polite"
  >
    <div className="relative w-14 h-14">
      {/* Outer ring */}
      <div className="absolute inset-0 border-4 border-gray-200/60 dark:border-white/10 rounded-full" />

      {/* Main spinner ring */}
      <div className="absolute inset-0 border-4 border-t-gyn-blue-medium dark:border-t-hud-primary rounded-full animate-spin shadow-[0_0_18px_rgba(0,240,255,0.55)]" />

      {/* Inner counter-rotating ring */}
      <div className="absolute inset-3 border-2 border-b-gyn-orange/80 dark:border-b-hud-secondary rounded-full animate-spin-reverse opacity-80" />

      {/* Inner pulse dot */}
      <div className="absolute inset-5 rounded-full bg-gyn-blue-medium/10 dark:bg-hud-primary/10">
        <div className="absolute inset-1 rounded-full bg-gyn-blue-medium/60 dark:bg-hud-primary/70 animate-ping" />
      </div>
    </div>

    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-semibold tracking-[0.25em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-gyn-blue-dark via-gyn-blue-medium to-gyn-blue-dark dark:from-hud-primary dark:via-hud-secondary dark:to-hud-primary animate-pulse">
        {label}
      </span>
      <span className="text-[10px] uppercase tracking-[0.22em] text-gray-400/70 dark:text-white/40">
        Optimizing widgets &amp; data views
      </span>
    </div>
  </div>
);

const UnknownModule: React.FC<{ module: string }> = ({ module }) => (
  <motion.div
    className="flex h-full w-full flex-col items-center justify-center px-6 text-center"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.25, ease: 'easeOut' }}
  >
    <div className="mb-4 inline-flex items-center justify-center rounded-full border border-dashed border-gray-300/60 dark:border-white/15 bg-white/60 dark:bg-black/40 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-gray-500 dark:text-white/60">
      Module Not Found
    </div>
    <p className="text-base sm:text-lg font-semibold text-gray-700 dark:text-white">
      We couldn’t load{' '}
      <span className="font-bold text-gyn-blue-medium dark:text-hud-primary">
        {module}
      </span>
    </p>
    <p className="mt-2 max-w-md text-xs sm:text-sm text-gray-500 dark:text-white/60">
      This workspace section is not configured yet. Please verify the navigation configuration or contact an
      administrator if you believe this is an error.
    </p>
  </motion.div>
);

// Motion variants for module transitions
const moduleVariants = {
  initial: { opacity: 0, y: 8, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.995 },
};

const OwnerLayout: React.FC = () => {
  const navConfig = useMemo(() => getModuleConfig(), []);

  /**
   * MainLayout will call this render function and pass in
   * the current active module / tab / subnav from the OS.
   */
  const renderContent = useCallback(
    (activeModule: string, activeTab: string, activeSubNav: string) => {
      const moduleDef = MODULE_REGISTRY.find(m => m.id === activeModule);
      const moduleTitle = moduleDef?.label ?? 'Workspace Module';
      const props = { activeTab, activeSubNav };

      const ContentComponent = moduleDef?.component;
      const content = ContentComponent ? <ContentComponent {...props} /> : <UnknownModule module={activeModule} />;

      // Key ensures motion animation when module / tab changes
      const key = `${activeModule || 'unknown'}-${activeTab || 'root'}-${activeSubNav || 'base'}`;
      const isDashboard = activeModule === 'dashboard';

      return (
        <ErrorBoundary>
          <div className="flex h-full w-full flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
            {/* Module header / breadcrumb removed to save vertical space */}

            {/* Module content */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <Suspense
                fallback={
                  <div className="h-full w-full">
                    <LoadingSpinner label="Loading workspace..." />
                  </div>
                }
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={key}
                    // Scroll on mobile and desktop (internal scroll)
                    // Dashboard needs to be fixed height (no scroll) for the bento grid to work
                    className={`h-full w-full px-4 py-4 sm:px-6 sm:py-5 flex flex-col ${isDashboard ? 'overflow-hidden' : 'overflow-y-auto gyn-scroll'
                      }`}
                    variants={moduleVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    {content}
                  </motion.div>
                </AnimatePresence>
              </Suspense>
            </div>
          </div>
        </ErrorBoundary>
      );
    },
    []
  );

  return <MainLayout config={navConfig} renderContent={renderContent} role="Owner" />;
};

export default OwnerLayout;
