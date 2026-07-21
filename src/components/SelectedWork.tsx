/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { PROJECTS_DATA } from '../data';
import { MOTION_CURVE_PREMIUM } from '../utils/motion';

interface ProjectChapterProps {
  project: typeof PROJECTS_DATA[0];
  index: number;
  onOpen: (project: typeof PROJECTS_DATA[0]) => void;
  hoveredProjectId: string | null;
  setHoveredProjectId: (id: string | null) => void;
  focusedProjectId: string | null;
  setFocusedProjectId: (id: string | null) => void;
  onNavigate: (currentIndex: number, direction: 'next' | 'prev') => void;
}

const ProjectChapter = React.memo<ProjectChapterProps>(({
  project,
  index,
  onOpen,
  hoveredProjectId,
  setHoveredProjectId,
  focusedProjectId,
  setFocusedProjectId,
  onNavigate
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const isEven = index % 2 === 0;

  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isAnyProjectActive = hoveredProjectId !== null || focusedProjectId !== null;
  const isThisProjectActive = hoveredProjectId === project.id || focusedProjectId === project.id;
  const showFaded = !isMobileViewport && isAnyProjectActive && !isThisProjectActive;

  const [shouldEagerLoad, setShouldEagerLoad] = useState(index === 0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduceMotion ? ["0%", "0%"] : ["-5%", "5%"]
  );

  // Swiss-style subtle scroll-driven exit/fading motion as elements leave viewport (Deactivated)
  const exitImageY = 0;
  const exitTextY = 0;
  const exitScale = 1;
  const exitOpacity = 1;

  const getHoverConfig = () => {
    if (shouldReduceMotion) return undefined;
    return "hover";
  };

  useEffect(() => {
    if (index === 0) return;

    const el = imageRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setShouldEagerLoad(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '400px 0px 400px 0px', // Target images immediately adjacent to the current viewport
        threshold: 0,
      }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [index]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onOpen(project);
      return;
    }

    const key = e.key.toLowerCase();
    if (key === 'arrowdown' || key === 'j') {
      e.preventDefault();
      onNavigate(index, 'next');
    } else if (key === 'arrowup' || key === 'k') {
      e.preventDefault();
      onNavigate(index, 'prev');
    }
  };

  const getNarrative = () => {
    return project.overview;
  };

  // Dynamic per-card reveal animations:
  // 1. Horizontally unfolds (index 0)
  // 2. Appears through masking (index 1)
  // 3. Enters diagonally (index 2)
  // 4. Reveals image first then text (index 3)
  // 5. Reveals text first then image (index 4)

  const getSmallLabelVariants = () => {
    return {
      initial: {
        opacity: isMobileViewport ? 1 : 0,
        y: (shouldReduceMotion || isMobileViewport) ? 0 : 15,
      },
      whileInView: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.9,
          ease: [0.16, 1, 0.3, 1],
          delay: isMobileViewport ? 0 : 0.22
        }
      }
    };
  };

  const getTitleVariants = () => {
    return {
      initial: {
        opacity: isMobileViewport ? 1 : 0,
        y: (shouldReduceMotion || isMobileViewport) ? 0 : 20,
      },
      whileInView: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 1.1,
          ease: [0.16, 1, 0.3, 1],
          delay: isMobileViewport ? 0 : 0.28
        }
      }
    };
  };

  const getImageVariants = () => {
    return {
      initial: {
        opacity: isMobileViewport ? 1 : 0,
        clipPath: (shouldReduceMotion || isMobileViewport) ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 100% 0%)",
      },
      whileInView: {
        opacity: 1,
        clipPath: "inset(0% 0% 0% 0%)",
        transition: {
          duration: 1.15,
          ease: [0.16, 1, 0.3, 1],
          delay: isMobileViewport ? 0 : 0.05
        }
      }
    };
  };

  const getDescriptionVariants = (paraIndex: number) => {
    const delay = paraIndex === 0 ? 0.34 : 0.40;
    return {
      initial: {
        opacity: isMobileViewport ? 1 : 0,
        y: (shouldReduceMotion || isMobileViewport) ? 0 : 15,
      },
      whileInView: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.9,
          ease: [0.16, 1, 0.3, 1],
          delay: isMobileViewport ? 0 : delay
        }
      }
    };
  };

  const titleAnimate = getTitleVariants();
  const imageAnimate = getImageVariants();
  const descParagraphAnimate = getDescriptionVariants(0);
  const descActionsAnimate = getDescriptionVariants(1);

  const titleWords = project.title.split(/\s+/);

  const titleModule = (
    <div className="w-full text-left">
      <motion.div
        variants={getSmallLabelVariants()}
        initial="initial"
        whileInView="whileInView"
        viewport={{ once: true, amount: 0.05 }}
        inherit={false}
        className="flex flex-wrap items-center typo-mono-label mb-4 text-[var(--text-dim)] group-hover:text-[var(--text-color)] transition-colors duration-300"
      >
        <span>{project.category}</span>
        <span className="mx-2">|</span>
        <span>{project.year}</span>
      </motion.div>
      <motion.h3
        variants={getTitleVariants()}
        initial="initial"
        whileInView="whileInView"
        viewport={{ once: true, amount: 0.05 }}
        className="typo-display-sm font-extrabold tracking-tight text-[var(--text-color)] uppercase transition-all duration-350"
      >
        {project.title}
      </motion.h3>
    </div>
  );

  const imageContainer = (
    <motion.div
      ref={imageRef}
      initial="initial"
      whileInView="whileInView"
      viewport={{ once: true, amount: 0.15 }}
      className="relative w-full aspect-video overflow-hidden bg-[var(--card-bg-subtle)] border border-white/[0.08] rounded select-none"
    >
      <motion.div
        variants={getImageVariants()}
        className="absolute inset-0 w-full h-full overflow-hidden"
      >
        {project.image ? (
          <>
            <AnimatePresence>
              {!isImageLoaded && (
                <motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45 }}
                  className="absolute inset-0 bg-neutral-950/40 dark:bg-zinc-950/60 animate-pulse flex flex-col items-center justify-center border border-white/[0.04]"
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500/80">
                      RESOLVING PREVIEW
                    </span>
                    <span className="font-mono text-[8px] text-zinc-600">
                      INDEX_{index + 1}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <motion.img
              src={project.image}
              alt={project.title}
              onLoad={() => setIsImageLoaded(true)}
              loading={shouldEagerLoad ? "eager" : "lazy"}
              className={`absolute inset-0 w-full h-full object-contain object-top p-4 sm:p-6 bg-zinc-900/60 dark:bg-zinc-950/40 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isImageLoaded ? 'opacity-100' : 'opacity-0'
              } ${
                isThisProjectActive ? 'scale-[1.015]' : 'scale-100'
              }`}
              referrerPolicy="no-referrer"
            />
          </>
        ) : (
          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-[var(--card-bg-subtle)] border border-[var(--border-color)] select-none overflow-hidden pb-4">
            <svg className="w-1/2 h-1/2 opacity-[0.08] text-zinc-500 group-hover:opacity-[0.15] transition-opacity duration-500" viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="200" cy="125" r="85" stroke="currentColor" strokeWidth="0.8" strokeDasharray="4 8" />
              <circle cx="200" cy="125" r="45" stroke="currentColor" strokeWidth="0.5" />
              <line x1="40" y1="125" x2="360" y2="125" stroke="currentColor" strokeWidth="0.6" strokeDasharray="10 6" />
              <line x1="200" y1="15" x2="200" y2="235" stroke="currentColor" strokeWidth="0.6" strokeDasharray="10 6" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="typo-mono-sub text-zinc-500">
                [UI_IMAGE_PLACEHOLDER: ASPECT_RATIO_PRESERVED]
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );

  const descriptionModule = (
    <div className="flex flex-col items-start gap-6 text-left w-full">
      <motion.div
        variants={getDescriptionVariants(0)}
        initial="initial"
        whileInView="whileInView"
        viewport={{ once: true, amount: 0.05 }}
        inherit={false}
      >
        <p className="typo-body-regular-dim select-text group-hover:text-[var(--text-color)] transition-all duration-300">
          {getNarrative()}
        </p>
      </motion.div>

      {/* Action triggers */}
      <motion.div
        variants={getDescriptionVariants(1)}
        initial="initial"
        whileInView="whileInView"
        viewport={{ once: true, amount: 0.05 }}
        inherit={false}
        className="pt-2 flex items-center gap-8 flex-wrap"
      >
        <span
          className="inline-flex items-center gap-1.5 typo-mono-btn text-neutral-300 hover:text-[var(--text-color)] transition-colors duration-300 select-none cursor-pointer min-h-[44px] py-1 -my-1 font-medium"
        >
          <span>OPEN CASE STUDY</span>
        </span>

        {project.live && (
          <a
            href={project.live}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 typo-mono-btn text-neutral-300 hover:text-[var(--text-color)] transition-colors duration-300 select-none cursor-pointer min-h-[44px] py-1 -my-1 font-medium"
          >
            <span>VIEW LIVE</span>
          </a>
        )}
      </motion.div>
    </div>
  );

  const renderLayout = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-16 lg:gap-20 items-center w-full">
        {isEven ? (
          <>
            {/* Even Chapter: Image Left, Metadata Right with Subtle Upward Exit Drift */}
            <motion.div
              style={{
                y: exitImageY,
                scale: exitScale,
                opacity: exitOpacity
              }}
              className="w-full lg:col-span-7 order-1"
            >
              {imageContainer}
            </motion.div>
            <motion.div
              style={{
                y: exitTextY,
                opacity: exitOpacity
              }}
              className="w-full lg:col-span-5 flex flex-col gap-6 md:gap-8 justify-start order-2"
            >
              {titleModule}
              {descriptionModule}
            </motion.div>
          </>
        ) : (
          <>
            {/* Odd Chapter: Metadata Left, Image Right with Subtle Upward Exit Drift */}
            <motion.div
              style={{
                y: exitTextY,
                opacity: exitOpacity
              }}
              className="w-full lg:col-span-5 flex flex-col gap-6 md:gap-8 justify-start order-2 lg:order-1"
            >
              {titleModule}
              {descriptionModule}
            </motion.div>
            <motion.div
              style={{
                y: exitImageY,
                scale: exitScale,
                opacity: exitOpacity
              }}
              className="w-full lg:col-span-7 order-1 lg:order-2"
            >
              {imageContainer}
            </motion.div>
          </>
        )}
      </div>
    );
  };

  return (
    <motion.div
      ref={containerRef}
      id={`project-chapter-${project.id}`}
      role="button"
      tabIndex={0}
      aria-label={`Open case study for ${project.title}`}
      onKeyDown={handleKeyDown}
      onClick={() => onOpen(project)}
      onMouseEnter={() => setHoveredProjectId(project.id)}
      onMouseLeave={() => setHoveredProjectId(null)}
      onFocus={() => setFocusedProjectId(project.id)}
      onBlur={() => setFocusedProjectId(null)}
      whileHover={getHoverConfig()}
      className={`group relative w-full cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--text-color)] focus-visible:bg-[var(--card-bg-subtle)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        showFaded ? "opacity-35" : "opacity-100"
      } py-10 sm:py-16 md:py-20`}
    >
      <div className="w-full max-w-7xl mx-auto px-0 sm:px-12 lg:px-16">
        {renderLayout()}
      </div>
    </motion.div>
  );
});

ProjectChapter.displayName = 'ProjectChapter';

interface SelectedWorkProps {
  activeProject?: typeof PROJECTS_DATA[0] | null;
  onActiveProjectChange?: (project: typeof PROJECTS_DATA[0] | null) => void;
  triggerWipe?: (onHalfway: () => void) => void;
  activeFilter?: 'ALL' | 'FULL-STACK' | 'CODE' | 'UI';
  setActiveFilter?: (filter: 'ALL' | 'FULL-STACK' | 'CODE' | 'UI') => void;
}

export default function SelectedWork({
  activeProject,
  onActiveProjectChange,
  triggerWipe,
  activeFilter: propsActiveFilter,
  setActiveFilter: propsSetActiveFilter
}: SelectedWorkProps = {}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [localSelectedProject, setLocalSelectedProject] = useState<typeof PROJECTS_DATA[0] | null>(null);
  const [localActiveFilter, setLocalActiveFilter] = useState<'ALL' | 'FULL-STACK' | 'CODE' | 'UI'>('ALL');
  const activeFilter = propsActiveFilter !== undefined ? propsActiveFilter : localActiveFilter;
  const setActiveFilter = propsSetActiveFilter !== undefined ? propsSetActiveFilter : setLocalActiveFilter;
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const [focusedProjectId, setFocusedProjectId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { scrollYProgress: worksScrollProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const shouldReduceMotion = useReducedMotion();
  const [ambientTime, setAmbientTime] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion) return;
    let frameId: number;
    const start = Date.now();
    const update = () => {
      const elapsed = (Date.now() - start) / 1000;
      setAmbientTime(elapsed);
      frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [shouldReduceMotion]);

  // Slow horizontal scroll-linked movement creating visual tension
  const worksHeadlineDriftX = useTransform(worksScrollProgress, [0, 1], [-30, 35]);

  // Combined with slow wave breathing to feel alive when idle
  const combinedWorksHeadlineX = useTransform(worksHeadlineDriftX, (val) => {
    if (shouldReduceMotion || isMobile) return 0;
    return val + Math.sin(ambientTime * 0.4) * 6;
  });

  // Scroll-linked continuous exit animation (Deactivated)
  const exitOpacity = 1;
  const exitY = 0;

  const selectedProject = activeProject !== undefined ? activeProject : localSelectedProject;
  const setSelectedProject = activeProject !== undefined && onActiveProjectChange ? onActiveProjectChange : setLocalSelectedProject;

  const handleOpenModal = useCallback((project: typeof PROJECTS_DATA[0]) => {
    setSelectedProject(project);
  }, [setSelectedProject]);

  const handleCloseModal = useCallback(() => {
    setSelectedProject(null);
  }, [setSelectedProject]);

  const filteredProjects = useMemo(() => {
    if (activeFilter === 'ALL') return PROJECTS_DATA;
    return PROJECTS_DATA.filter((p) => p.category === activeFilter);
  }, [activeFilter]);

  const handleProjectNavigation = useCallback((currentIndex: number, direction: 'next' | 'prev') => {
    const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex >= 0 && targetIndex < filteredProjects.length) {
      const targetProject = filteredProjects[targetIndex];
      const targetElement = document.getElementById(`project-chapter-${targetProject.id}`);
      if (targetElement) {
        targetElement.focus();
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [filteredProjects]);

  const filterCounts = useMemo(() => {
    return {
      ALL: PROJECTS_DATA.length,
      'FULL-STACK': PROJECTS_DATA.filter((p) => p.category === 'FULL-STACK').length,
      CODE: PROJECTS_DATA.filter((p) => p.category === 'CODE').length,
      UI: PROJECTS_DATA.filter((p) => p.category === 'UI').length,
    };
  }, []);

  // Natural keyboard navigation and focus flow are handled via standard DOM tabIndex and sequential focus.

  return (
    <section
      ref={sectionRef}
      id="works"
      className="relative w-full bg-[var(--bg-color)] z-20 text-[var(--text-color)] overflow-hidden pt-12 pb-16 md:pt-16 md:pb-24 scroll-mt-[100px]"
      style={{ paddingLeft: "max(20px, 4vw)", paddingRight: "max(20px, 4vw)" }}
    >
      <motion.div
        style={{
          opacity: shouldReduceMotion ? 1 : exitOpacity,
          y: shouldReduceMotion ? 0 : exitY
        }}
        className="w-full bg-[var(--bg-color)] relative flex flex-col max-w-7xl mx-auto"
      >
        {/* Works Intro & Structural category filters */}
        <div
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-20 items-start relative z-10 w-full px-0 sm:px-12 lg:px-16 pt-4 pb-0"
        >
          <div className="col-span-1 lg:col-span-6 flex flex-col items-start justify-start text-left">
            <motion.h2
              variants={{
                hidden: {
                  opacity: 0,
                },
                visible: {
                  opacity: 1,
                  transition: {
                    duration: 0.5,
                    ease: "easeOut",
                    delay: 0.05
                  }
                }
              }}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.05 }}
              style={{ x: 0 }}
              className="typo-display-lg select-text text-[var(--text-color)] font-black"
            >
              SELECTED WORKS
            </motion.h2>
          </div>

          {/* Typographic Filter Controls: Subtle sequential entrance */}
          <motion.div
            role="group"
            aria-label="Project filter categories"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.04,
                  delayChildren: 0.05
                }
              }
            }}
            className="col-span-1 lg:col-span-6 flex flex-nowrap lg:flex-wrap items-center lg:justify-end gap-x-8 gap-y-3 typo-mono-filter lg:pl-6 lg:pt-3 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-none w-full max-w-full whitespace-nowrap scroll-smooth"
          >
            {(['ALL', 'FULL-STACK', 'CODE', 'UI'] as const).map((filterValue) => {
               const count = filterCounts[filterValue];
               const isActive = activeFilter === filterValue;
               const displayName = {
                 ALL: 'ALL',
                 'FULL-STACK': 'FULL-STACK',
                 CODE: 'CODE',
                 UI: 'UI'
               }[filterValue];

               const customFilterVariants = {
                 hidden: {
                   opacity: 0,
                   y: shouldReduceMotion ? 0 : 12,
                   
                 },
                 visible: {
                   opacity: 1,
                   y: 0,
                   
                   transition: {
                     duration: 0.35,
                     type: "spring", stiffness: 280, damping: 22,
                   }
                 }
               };

               return (
                 <motion.button
                   key={filterValue}
                   variants={customFilterVariants}
                   onPointerDown={(e) => {
                     if (e.button === 0) {
                       e.preventDefault();
                       setActiveFilter(filterValue);
                     }
                   }}
                   onClick={(e) => {
                     if (e.clientX === 0 && e.clientY === 0) {
                       setActiveFilter(filterValue);
                     }
                   }}
                   aria-label={`Filter projects by ${displayName}`}
                   aria-pressed={isActive}
                  className={`relative cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--text-color)] rounded filter-tab-button shrink-0 py-3 lg:py-1 inline-flex items-center ${
                    isActive ? 'active' : ''
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span>{displayName}</span>
                    <span className="typo-mono-sub text-xs font-normal tracking-normal filter-tab-count">
                      ({count})
                    </span>
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        </div>

        <motion.div layout className="w-full flex flex-col works-sections-container mt-[10px]">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={`${project.id}-${selectedProject ? 'active' : 'inactive'}`}
                layout={shouldReduceMotion ? undefined : "position"}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  layout: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
                  opacity: { duration: 0.25 },
                  y: { duration: 0.35, ease: MOTION_CURVE_PREMIUM }
                }}
                style={{ display: "block" }}
              >
                <ProjectChapter
                  project={project}
                  index={index}
                  onOpen={handleOpenModal}
                  hoveredProjectId={hoveredProjectId}
                  setHoveredProjectId={setHoveredProjectId}
                  focusedProjectId={focusedProjectId}
                  setFocusedProjectId={setFocusedProjectId}
                  onNavigate={handleProjectNavigation}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </section>
  );
}
