/**
 * CustomizeSheet.tsx
 *
 * Drag-to-close bottom sheet for CV customization. Instagram comment-drawer
 * feel, per the design rules. Two interactions in one surface:
 *   - Toggle sections on/off via a switch
 *   - Reorder sections via a long-press drag handle
 *
 * WHY one sheet and not two:
 * Both actions edit the same underlying preference object, and users who
 * toggle visibility often want to reorder too. Splitting them would force
 * a sheet swap mid-task — the opposite of Meta-grade flow.
 *
 * WHY drag-to-close from the whole header, not just a grabber:
 * On a phone, a grabber is a small target. The entire header bar is the
 * drag surface — matches iOS Maps, Threads, and every polished app.
 *
 * Touch targets: every row is min-h-[56px]. Switch is 44×26 with 44pt hit
 * area via padding. Drag handle is 44×44 (visually 24×24).
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { GripVertical, X } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    CV_SECTIONS,
    REQUIRED_SECTIONS,
    sectionMeta,
    type CVSectionId,
} from '../../lib/cvSections';
import type { CVPreferences } from '../../hooks/useCVPreferences';

interface Props {
    open: boolean;
    onClose: () => void;
    prefs: CVPreferences;
    onToggle: (id: CVSectionId, visible: boolean) => void;
    onReorder: (order: CVSectionId[]) => void;
    onSetShowPhoto: (show: boolean) => void;
    onReset: () => void;
}

export function CustomizeSheet({
    open,
    onClose,
    prefs,
    onToggle,
    onReorder,
    onSetShowPhoto,
    onReset,
}: Props) {
    const dragControls = useDragControls();
    const [mounted, setMounted] = useState(false);

    // Lock body scroll while the sheet is open — otherwise the page scrolls
    // behind the sheet on iOS, which feels broken.
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        setMounted(true);
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    // DnD sensors: pointer for mouse, touch for phone, keyboard for a11y.
    // The touch sensor requires a long-press (250ms) so scrolling the sheet
    // doesn't start a drag accidentally.
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 250, tolerance: 5 },
        }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = prefs.order.indexOf(active.id as CVSectionId);
        const newIndex = prefs.order.indexOf(over.id as CVSectionId);
        if (oldIndex < 0 || newIndex < 0) return;
        onReorder(arrayMove(prefs.order, oldIndex, newIndex));
    };

    return (
        <AnimatePresence>
            {open && mounted && (
                <>
                    {/* SCRIM — tap to close */}
                    <motion.div
                        className="fixed inset-0 z-40 bg-black/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        onClick={onClose}
                    />

                    {/* SHEET */}
                    <motion.div
                        className="fixed left-0 right-0 bottom-0 z-50 bg-zinc-50 dark:bg-zinc-900 rounded-t-3xl shadow-2xl flex flex-col"
                        style={{
                            maxHeight: '85vh',
                            paddingBottom: 'env(safe-area-inset-bottom)',
                        }}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 320, mass: 0.8 }}
                        drag="y"
                        dragControls={dragControls}
                        dragListener={false}
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.4 }}
                        onDragEnd={(_, info) => {
                            // Close if dragged down far enough or fast enough.
                            if (info.offset.y > 120 || info.velocity.y > 500) onClose();
                        }}
                    >
                        {/* HEADER — the whole bar is the drag surface */}
                        <div
                            className="pt-3 pb-3 px-4 shrink-0 touch-none cursor-grab active:cursor-grabbing"
                            onPointerDown={(e) => dragControls.start(e)}
                        >
                            <div className="mx-auto w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700 mb-3" />
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <h2 className="font-semibold text-base">Customize CV</h2>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                        Toggle sections and drag to reorder
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    aria-label="Close"
                                    className="p-2 -mr-1 rounded-xl active:scale-[98%] transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* CONTENT — scrollable */}
                        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
                            {/* PHOTO TOGGLE */}
                            <div className="mb-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                                    Header
                                </p>
                                <ToggleRow
                                    label="Include photo"
                                    description="Kenyan CVs usually include a photo; international ATS may reject it"
                                    checked={prefs.showPhoto}
                                    onChange={onSetShowPhoto}
                                />
                            </div>

                            {/* SECTIONS */}
                            <div>
                                <div className="flex items-baseline justify-between mb-2">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                        Sections
                                    </p>
                                    <button
                                        onClick={onReset}
                                        className="text-xs text-zinc-500 dark:text-zinc-400 active:scale-[98%] transition px-2 py-1 -mr-2"
                                    >
                                        Reset
                                    </button>
                                </div>

                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={prefs.order}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="space-y-2">
                                            {prefs.order.map((id) => (
                                                <SortableSectionRow
                                                    key={id}
                                                    id={id}
                                                    visible={prefs.visibility[id]}
                                                    required={REQUIRED_SECTIONS.includes(id)}
                                                    onToggle={(v) => onToggle(id, v)}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>

                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 px-1">
                                    Sections render in the column they belong to — reordering
                                    never moves a section from left to right.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// ---------------------------------------------------------------------------
// Sortable row
// ---------------------------------------------------------------------------

interface SortableRowProps {
    id: CVSectionId;
    visible: boolean;
    required: boolean;
    onToggle: (visible: boolean) => void;
}

function SortableSectionRow({ id, visible, required, onToggle }: SortableRowProps) {
    const meta = sectionMeta(id);
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
        flex items-center gap-3 min-h-[56px] px-3 rounded-2xl
        bg-white dark:bg-zinc-800
        border border-zinc-200 dark:border-zinc-700
        ${isDragging ? 'shadow-lg ring-2 ring-zinc-400 dark:ring-zinc-500' : ''}
      `}
        >
            {/* DRAG HANDLE — 44×44 tap target, only active when pointer down on it */}
            <button
                ref={setActivatorNodeRef}
                {...attributes}
                {...listeners}
                aria-label={`Reorder ${meta.label}`}
                className="
          w-11 h-11 -ml-1 rounded-xl flex items-center justify-center
          touch-none cursor-grab active:cursor-grabbing
          text-zinc-400 dark:text-zinc-500
        "
            >
                <GripVertical className="w-5 h-5" />
            </button>

            {/* LABEL + DESCRIPTION */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{meta.label}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {meta.description}
                </p>
            </div>

            {/* SWITCH — hidden toggle becomes a lock icon for required sections */}
            {required ? (
                <span className="text-xs text-zinc-400 dark:text-zinc-500 px-3">
                    Required
                </span>
            ) : (
                <Switch checked={visible} onChange={onToggle} />
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Switch
// ---------------------------------------------------------------------------

function Switch({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <button
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className="
        relative w-11 h-7 rounded-full transition-colors
        bg-zinc-300 dark:bg-zinc-700
        data-[on=true]:bg-zinc-900 dark:data-[on=true]:bg-zinc-100
        active:scale-[98%]
      "
            data-on={checked}
        >
            <span
                className={`
          absolute top-0.5 w-6 h-6 rounded-full bg-white dark:bg-zinc-900
          shadow transition-transform
          ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}
        `}
            />
        </button>
    );
}

// ---------------------------------------------------------------------------
// Reusable toggle row (for the photo toggle, non-sortable)
// ---------------------------------------------------------------------------

function ToggleRow({
    label,
    description,
    checked,
    onChange,
}: {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center gap-3 min-h-[56px] px-3 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{label}</p>
                {description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {description}
                    </p>
                )}
            </div>
            <Switch checked={checked} onChange={onChange} />
        </div>
    );
}