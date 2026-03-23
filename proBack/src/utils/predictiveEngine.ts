// Prediction Engine - Dynamic Velocity factor from progress history with recency weighting

export interface PredictedDates {
    predictedStartDate: Date;
    predictedEndDate: Date;
}

export interface SimulationConditions {
    memberLeaves?: Array<{
        userId: string;
        startDate: string | Date;
        endDate: string | Date;
    }>;
    globalHolidays?: Array<{
        startDate: string | Date;
        endDate: string | Date;
    }>;
    taskDelays?: Array<{
        taskId: string;
        additionalDays: number;
    }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const getLocalDateString = (d: Date): string => {
    // Ensure we are looking at the date in local terms
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const parseDateSafe = (dateInput: string | Date): Date => {
    if (dateInput instanceof Date) return dateInput;
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        const [y, m, d] = dateInput.split('-').map(Number);
        if (y !== undefined && m !== undefined && d !== undefined) {
            return new Date(y, m - 1, d);
        }
    }
    return new Date(dateInput);
};

const getIdString = (ref: any): string | undefined => {
    if (!ref) return undefined;
    if (typeof ref === 'string') return ref;
    if (ref._id) return ref._id.toString();
    if (typeof ref.toString === 'function') return ref.toString();
    return String(ref);
};

const addWorkingDaysWithLeaveAndCapacity = (
    userId: string | undefined,
    startDate: Date,
    totalWorkDays: number,
    leaves: Array<{startDate: string | Date, endDate: string | Date}>,
    userCalendars: Map<string, Map<string, number>>
): { actualStart: Date, endDate: Date } => {
    let current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    
    if (totalWorkDays <= 0) return { actualStart: current, endDate: current };

    let remainingDays = Math.ceil(totalWorkDays);
    let loopCount = 0;
    let actualStart: Date | null = null;
    
    while (remainingDays > 0 && loopCount < 3000) {
        const dayOfWeek = current.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const currentStr = getLocalDateString(current);
        
        const isLeave = (leaves || []).some(l => {
            const startStr = typeof l.startDate === 'string' ? (l.startDate.split('T')[0] as string) : getLocalDateString(parseDateSafe(l.startDate));
            const endStr = typeof l.endDate === 'string' ? (l.endDate.split('T')[0] as string) : getLocalDateString(parseDateSafe(l.endDate));
            return currentStr >= startStr && currentStr <= endStr;
        });
        
        const dateStr = currentStr;
        let hasCapacity = false;
        
        if (!isLeave && !isWeekend) {
            if (userId) {
                const id = userId as string;
                let calendar = userCalendars.get(id);
                if (!calendar) {
                    calendar = new Map();
                    userCalendars.set(id, calendar);
                }
                const existingLoad = calendar.get(dateStr) || 0;
                if (existingLoad < 1.0) {
                    const capacity = 1.0 - existingLoad;
                    const workToDo = Math.min(remainingDays, capacity);
                    
                    calendar.set(dateStr, existingLoad + workToDo);
                    remainingDays -= workToDo;
                    hasCapacity = true;
                }
            } else {
                remainingDays -= 1;
                hasCapacity = true;
            }
        }
        
        if (hasCapacity && !actualStart) {
            actualStart = new Date(current);
        }
        
        if (remainingDays > 0 || !hasCapacity) {
            current.setDate(current.getDate() + 1);
        }
        
        loopCount++;
    }
    return { actualStart: actualStart || current, endDate: current };
};

const diffDays = (d1: Date, d2: Date): number =>
    (d1.getTime() - d2.getTime()) / MS_PER_DAY;

/** 
 * Compute a dynamic "effort factor" from progress history.
 *
 * Algorithm:
 *  1. Sort history by timestamp ascending.
 *  2. For each consecutive pair, compute velocity (% per day).
 *  3. Weight each segment by an exponential decay so RECENT history 
 *     has MORE influence than old history.
 *  4. Return `baseline / weightedVelocity` — how many times SLOWER
 *     or FASTER this user is compared to an ideal 5%/day pace.
 *     < 1.0 means they're ahead of baseline, > 1.0 means behind.
 */
const IDEAL_VELOCITY_PERCENT_PER_DAY = 5; // 5% per day as "on-track" baseline
const RECENCY_HALF_LIFE_DAYS = 7; // Older than 7 days has half the weight

const computeDynamicFactor = (
    progressHistory: Array<{ progress: number; timestamp: Date | string }>,
    today: Date
): number => {
    if (!progressHistory || progressHistory.length < 2) {
        // Not enough data → use a neutral factor; means prediction = planned
        return 1.0;
    }

    // Sort ascending
    const sorted = [...progressHistory].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let weightedVelocitySum = 0;
    let totalWeight = 0;

    for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];

        if (!prev || !curr) continue; // Guard against strict undefined checks

        const prevDate = new Date(prev.timestamp);
        const currDate = new Date(curr.timestamp);
        const periodDays = diffDays(currDate, prevDate);

        if (periodDays <= 0) continue; // Skip duplicate timestamps

        const progressDelta = curr.progress - prev.progress;
        if (progressDelta <= 0) continue; // Skip stalls and regressions

        const velocity = progressDelta / periodDays; // % per day

        // More recent segments get exponentially higher weight
        const ageInDays = diffDays(today, currDate);
        const weight = Math.pow(2, -ageInDays / RECENCY_HALF_LIFE_DAYS);

        weightedVelocitySum += velocity * weight;
        totalWeight += weight;
    }

    if (totalWeight === 0 || weightedVelocitySum === 0) return 1.0;

    const weightedAvgVelocity = weightedVelocitySum / totalWeight;

    // Factor = how much slower than ideal  (e.g. 2.5 pct/day vs 5 ideal = factor 2.0)
    const rawFactor = IDEAL_VELOCITY_PERCENT_PER_DAY / weightedAvgVelocity;

    // Clamp to [0.5, 4.0] to avoid absurd edge cases
    return Math.min(4.0, Math.max(0.5, rawFactor));
};

/** 
 * Static role factor used as FALLBACK when no progress history is available.
 */
const getRoleFactor = (userType: string | undefined): number => {
    switch (userType) {
        case 'intern': return 1.5;
        case 'pm': return 1.2;
        case 'user': return 1.2;
        case 'dev': return 1.0;
        case 'admin': return 1.0;
        default: return 1.0;
    }
};

// ─── Main Engine ─────────────────────────────────────────────────────────────

export const getProjectPredictions = (allTasks: any[], conditions?: SimulationConditions): Map<string, PredictedDates> => {
    const predictions = new Map<string, PredictedDates>();
    const visited = new Set<string>();
    const userCalendars = new Map<string, Map<string, number>>();

    // 1. Performance Lookups
    const taskMap = new Map<string, any>();
    const parentToChildren = new Map<string, string[]>();

    allTasks.forEach(t => {
        const id = getIdString(t._id);
        if (id) {
            taskMap.set(id, t);
            const pid = getIdString(t.parentTask);
            if (pid) {
                const children = parentToChildren.get(pid) || [];
                children.push(id);
                parentToChildren.set(pid, children);
            }
        }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getPredictedDates = (taskId: string): PredictedDates => {
        if (predictions.has(taskId)) return predictions.get(taskId)!;
        if (visited.has(taskId)) {
            return { predictedStartDate: today, predictedEndDate: today };
        }

        const task = taskMap.get(taskId);
        if (!task) return { predictedStartDate: today, predictedEndDate: today };

        visited.add(taskId);

        // Check if this is a Container task (has subtasks)
        const subtaskIds = parentToChildren.get(taskId) || [];
        const isContainer = subtaskIds.length > 0;

        let predictedStart: Date;
        let predictedEnd: Date;

        if (isContainer) {
            // CONTAINER LOGIC: Dates are derived purely from children
            let earliestStart = new Date(8640000000000000);
            let latestEnd = new Date(0);

            subtaskIds.forEach(sid => {
                const childRes = getPredictedDates(sid);
                if (childRes.predictedStartDate < earliestStart) earliestStart = childRes.predictedStartDate;
                if (childRes.predictedEndDate > latestEnd) latestEnd = childRes.predictedEndDate;
            });

            if (latestEnd.getTime() > 0 && earliestStart.getTime() !== 8640000000000000) {
                predictedStart = earliestStart;
                predictedEnd = latestEnd;
            } else {
                predictedStart = today;
                predictedEnd = today;
            }
        } else {
            // WORKER LOGIC: Calculate based on dependencies, duration, history, and capacity
            const dates = task.dates || {};
            let baseStart = dates.toStartDate ? new Date(dates.toStartDate) : new Date(today);
            baseStart.setHours(0, 0, 0, 0);

            // Inherit dependencies recursively from parents
            const getAllInheritedDeps = (currId: string): string[] => {
                const t = taskMap.get(currId);
                if (!t) return [];
                const localDeps = (t.dependencies || []).map((d: any) => getIdString(d)).filter(Boolean) as string[];
                const parentId = getIdString(t.parentTask);
                if (parentId) {
                    return [...localDeps, ...getAllInheritedDeps(parentId)];
                }
                return localDeps;
            };

            const allDepIds = getAllInheritedDeps(taskId);
            let latestDepEnd = new Date(0);

            allDepIds.forEach(depId => {
                const depRes = getPredictedDates(depId);
                if (depRes.predictedEndDate > latestDepEnd) {
                    latestDepEnd = depRes.predictedEndDate;
                }
            });

            predictedStart = latestDepEnd > baseStart ? new Date(latestDepEnd) : new Date(baseStart);

            if (task.status === 'Pending' && !dates.startedDate) {
                if (predictedStart < today) predictedStart = new Date(today);
            }

            if (dates.startedDate) {
                predictedStart = new Date(dates.startedDate);
                predictedStart.setHours(0, 0, 0, 0);
            }

            let plannedDays = 1;
            if (dates.toStartDate && dates.toCompleteDate) {
                const d = diffDays(new Date(dates.toCompleteDate), new Date(dates.toStartDate));
                plannedDays = Math.max(1, d);
            }

            const simulatedDelay = conditions?.taskDelays?.find(td => td.taskId === taskId)?.additionalDays || 0;
            plannedDays += Math.max(0, simulatedDelay);

            const progressHistory = task.progressHistory || [];
            let effectiveFactor = 1.0;
            if (progressHistory.length >= 2) {
                effectiveFactor = computeDynamicFactor(progressHistory, today);
            } else {
                effectiveFactor = getRoleFactor(task.assignedTo?.type);
            }

            const adjustedTotalDays = Math.ceil(plannedDays * effectiveFactor);
            const progress = task.progress || 0;

            const getActualCompletionDate = () => {
                if (dates.completedDate) return new Date(dates.completedDate);
                if (progressHistory.length > 0) {
                    const sorted = [...progressHistory].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                    return new Date(sorted[0].timestamp);
                }
                if ((task as any).updatedAt) return new Date((task as any).updatedAt);
                return today;
            };

            if (task.status === 'Completed' || progress >= 100) {
                predictedEnd = getActualCompletionDate();
                predictedEnd.setHours(0, 0, 0, 0);
            } else if (task.status === 'In Progress' || progress > 0) {
                const remainingPct = Math.max(0, 100 - progress);
                const daysRemaining = adjustedTotalDays * (remainingPct / 100);
                
                if (daysRemaining < 0.1) {
                    predictedEnd = new Date(today);
                } else {
                    const workBase = new Date(Math.max(predictedStart.getTime(), today.getTime()));
                    const assigneeId = getIdString(task.assignedTo);
                    const userLeaves = assigneeId ? (conditions?.memberLeaves || []).filter(l => l.userId === assigneeId) : [];
                    const globalHolidays = conditions?.globalHolidays || [];
                    const combinedExcluded = [...userLeaves, ...globalHolidays];
                    
                    const res = addWorkingDaysWithLeaveAndCapacity(assigneeId, workBase, daysRemaining, combinedExcluded, userCalendars);
                    predictedStart = res.actualStart;
                    predictedEnd = res.endDate;
                }
            } else {
                const assigneeId = getIdString(task.assignedTo);
                const userLeaves = assigneeId ? (conditions?.memberLeaves || []).filter(l => l.userId === assigneeId) : [];
                const globalHolidays = conditions?.globalHolidays || [];
                const combinedExcluded = [...userLeaves, ...globalHolidays];
                
                const res = addWorkingDaysWithLeaveAndCapacity(assigneeId, predictedStart, adjustedTotalDays, combinedExcluded, userCalendars);
                predictedStart = res.actualStart;
                predictedEnd = res.endDate;
            }
        }

        const result: PredictedDates = { predictedStartDate: predictedStart, predictedEndDate: predictedEnd };
        predictions.set(taskId, result);
        visited.delete(taskId);

        return result;
    };

    const sortedTasks = [...allTasks].sort((a, b) => {
        const startA = a.dates?.toStartDate ? new Date(a.dates.toStartDate).getTime() : 0;
        const startB = b.dates?.toStartDate ? new Date(b.dates.toStartDate).getTime() : 0;
        return startA - startB;
    });

    sortedTasks.forEach(t => getPredictedDates(t._id.toString()));
    return predictions;
};
