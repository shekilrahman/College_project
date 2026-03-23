"use strict";
// Prediction Engine - Dynamic Velocity factor from progress history with recency weighting
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectPredictions = void 0;
// ─── Helpers ─────────────────────────────────────────────────────────────────
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + Math.ceil(days));
    return d;
};
const diffDays = (d1, d2) => (d1.getTime() - d2.getTime()) / MS_PER_DAY;
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
const computeDynamicFactor = (progressHistory, today) => {
    if (!progressHistory || progressHistory.length < 2) {
        // Not enough data → use a neutral factor; means prediction = planned
        return 1.0;
    }
    // Sort ascending
    const sorted = [...progressHistory].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    let weightedVelocitySum = 0;
    let totalWeight = 0;
    for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        if (!prev || !curr)
            continue; // Guard against strict undefined checks
        const prevDate = new Date(prev.timestamp);
        const currDate = new Date(curr.timestamp);
        const periodDays = diffDays(currDate, prevDate);
        if (periodDays <= 0)
            continue; // Skip duplicate timestamps
        const progressDelta = curr.progress - prev.progress;
        if (progressDelta <= 0)
            continue; // Skip stalls and regressions
        const velocity = progressDelta / periodDays; // % per day
        // More recent segments get exponentially higher weight
        const ageInDays = diffDays(today, currDate);
        const weight = Math.pow(2, -ageInDays / RECENCY_HALF_LIFE_DAYS);
        weightedVelocitySum += velocity * weight;
        totalWeight += weight;
    }
    if (totalWeight === 0 || weightedVelocitySum === 0)
        return 1.0;
    const weightedAvgVelocity = weightedVelocitySum / totalWeight;
    // Factor = how much slower than ideal  (e.g. 2.5 pct/day vs 5 ideal = factor 2.0)
    const rawFactor = IDEAL_VELOCITY_PERCENT_PER_DAY / weightedAvgVelocity;
    // Clamp to [0.5, 4.0] to avoid absurd edge cases
    return Math.min(4.0, Math.max(0.5, rawFactor));
};
/**
 * Static role factor used as FALLBACK when no progress history is available.
 */
const getRoleFactor = (userType) => {
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
const getProjectPredictions = (allTasks) => {
    const predictions = new Map();
    const visited = new Set();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const getPredictedDates = (taskId) => {
        if (predictions.has(taskId))
            return predictions.get(taskId);
        if (visited.has(taskId)) {
            // Cycle guard — return today as fallback
            return { predictedStartDate: today, predictedEndDate: today };
        }
        visited.add(taskId);
        const task = allTasks.find(t => t._id.toString() === taskId);
        if (!task)
            return { predictedStartDate: today, predictedEndDate: today };
        const dates = task.dates || {};
        // ── 1. Base Start Date ───────────────────────────────────────────────
        let baseStart = dates.toStartDate ? new Date(dates.toStartDate) : new Date(today);
        baseStart.setHours(0, 0, 0, 0);
        // ── 2. Dependency Constraints ───────────────────────────────────────
        // The task CANNOT start before all its dependencies finish
        const deps = task.dependencies || [];
        let latestDepEnd = new Date(0);
        deps.forEach((dep) => {
            const depId = dep._id ? dep._id.toString() : dep.toString();
            const depResult = getPredictedDates(depId);
            if (depResult.predictedEndDate > latestDepEnd) {
                latestDepEnd = depResult.predictedEndDate;
            }
        });
        let predictedStart = latestDepEnd > baseStart ? new Date(latestDepEnd) : new Date(baseStart);
        // If a task is Pending AND its planned start is already in the past → start today at earliest
        if (task.status === 'Pending' && !dates.startedDate) {
            if (predictedStart < today)
                predictedStart = new Date(today);
        }
        // If the task actually started, use the real start date
        if (dates.startedDate) {
            predictedStart = new Date(dates.startedDate);
            predictedStart.setHours(0, 0, 0, 0);
        }
        // ── 3. Planned Duration ─────────────────────────────────────────────
        let plannedDays = 1;
        if (dates.toStartDate && dates.toCompleteDate) {
            const d = diffDays(new Date(dates.toCompleteDate), new Date(dates.toStartDate));
            plannedDays = Math.max(1, d);
        }
        // ── 4. Dynamic User Factor (velocity-based, recency-weighted) ───────
        const progressHistory = task.progressHistory || [];
        const hasHistory = progressHistory.length >= 2;
        let effectiveFactor;
        if (hasHistory) {
            // Compute from actual work-log history
            effectiveFactor = computeDynamicFactor(progressHistory, today);
        }
        else {
            // Fallback to static role factor
            effectiveFactor = getRoleFactor(task.assignedTo?.type);
        }
        const adjustedTotalDays = Math.ceil(plannedDays * effectiveFactor);
        // ── 5. Predicted End Date ───────────────────────────────────────────
        let predictedEnd;
        const progress = task.progress || 0;
        // Helper to find actual completion timestamp from logs
        const getActualCompletionDate = () => {
            if (dates.completedDate)
                return new Date(dates.completedDate);
            if (progressHistory.length > 0) {
                // Return latest log entry timestamp
                const sorted = [...progressHistory].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                return new Date(sorted[0].timestamp);
            }
            // Fallback to updated at if available (via any cast for safety with interface)
            if (task.updatedAt)
                return new Date(task.updatedAt);
            return today;
        };
        if ((task.status === 'Completed' || progress >= 100)) {
            // Already done — use actual completion date
            predictedEnd = getActualCompletionDate();
            predictedEnd.setHours(0, 0, 0, 0);
        }
        else if (task.status === 'In Progress' || progress > 0) {
            const remainingPct = Math.max(0, 100 - progress);
            // Derive remaining days using the SAME effective factor (recent velocity)
            const daysRemaining = adjustedTotalDays * (remainingPct / 100);
            // Remaining work starts from today (work resumes now)
            if (daysRemaining < 0.1 || progress >= 100) {
                predictedEnd = new Date(today);
            }
            else {
                const workBase = new Date(Math.max(predictedStart.getTime(), today.getTime()));
                predictedEnd = addDays(workBase, daysRemaining);
            }
        }
        else {
            // Pending — will take full adjusted duration from predicted start
            predictedEnd = addDays(predictedStart, adjustedTotalDays);
        }
        const result = { predictedStartDate: predictedStart, predictedEndDate: predictedEnd };
        predictions.set(taskId, result);
        visited.delete(taskId);
        return result;
    };
    allTasks.forEach(t => getPredictedDates(t._id.toString()));
    return predictions;
};
exports.getProjectPredictions = getProjectPredictions;
//# sourceMappingURL=predictiveEngine.js.map