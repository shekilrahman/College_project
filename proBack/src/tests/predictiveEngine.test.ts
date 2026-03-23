import { getProjectPredictions } from '../utils/predictiveEngine';

describe('Predictive Engine', () => {
    // Helper to get local YYYY-MM-DD string
    const toYMD = (d: Date) => {
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    };

    const mockTasks = [
        {
            _id: 'task1',
            title: 'Test Task 1',
            status: 'Pending',
            progress: 0,
            dates: {
                toStartDate: '2026-03-24',
                toCompleteDate: '2026-03-25'
            },
            assignedTo: { _id: 'user1', type: 'dev' },
            dependencies: [],
            progressHistory: []
        },
        {
            _id: 'task2',
            title: 'Test Task 2',
            status: 'Pending',
            progress: 0,
            dates: {
                toStartDate: '2026-03-24',
                toCompleteDate: '2026-03-25'
            },
            assignedTo: { _id: 'user1', type: 'dev' },
            dependencies: ['task1'],
            progressHistory: []
        },
        {
            _id: 'parent1',
            title: 'Parent Task',
            status: 'Pending',
            progress: 0,
            parentTask: null,
            dates: {},
            assignedTo: { _id: 'admin1', type: 'admin' }
        }
    ];

    // Inject parent linkage
    (mockTasks[0] as any).parentTask = 'parent1';
    (mockTasks[1] as any).parentTask = 'parent1';

    it('should calculate basic prediction for a single task', () => {
        const predictions = getProjectPredictions([mockTasks[0]] as any);
        const res = predictions.get('task1');
        
        expect(res).toBeDefined();
        expect(toYMD(res!.predictedStartDate)).toBe('2026-03-24');
    });

    it('should handle member leaves in simulation with local-date safety', () => {
        const conditions = {
            memberLeaves: [{
                userId: 'user1',
                startDate: '2026-03-24',
                endDate: '2026-03-24'
            }]
        };
        
        const predictions = getProjectPredictions([mockTasks[0]] as any, conditions);
        const res = predictions.get('task1');
        
        // With leave on the 24th, start MUST shift to 25th
        expect(toYMD(res!.predictedStartDate)).toBe('2026-03-25');
    });

    it('should propagate dates to parent (Root Bounding)', () => {
        const predictions = getProjectPredictions(mockTasks as any);
        const pRes = predictions.get('parent1');
        const t1Res = predictions.get('task1');
        const t2Res = predictions.get('task2');

        // Parent start should be min of children
        expect(toYMD(pRes!.predictedStartDate)).toBe(toYMD(t1Res!.predictedStartDate));
        // Parent end should be max of children (t2 depends on t1)
        expect(pRes!.predictedEndDate.getTime()).toBeGreaterThanOrEqual(t2Res!.predictedEndDate.getTime());
    });

    it('should handle global holidays', () => {
        const conditions = {
            globalHolidays: [{
                startDate: '2026-03-24',
                endDate: '2026-03-24'
            }]
        };
        const predictions = getProjectPredictions([mockTasks[0]] as any, conditions);
        const res = predictions.get('task1');
        expect(toYMD(res!.predictedStartDate)).toBe('2026-03-25');
    });

    it('should consider user velocity (Dynamic Factor)', () => {
        const fastTask = {
            ...mockTasks[0],
            _id: 'fastTask',
            progressHistory: [
                { progress: 0, timestamp: '2026-03-20' },
                { progress: 50, timestamp: '2026-03-21' } // 50% in 1 day (Very fast)
            ]
        };
        const predictions = getProjectPredictions([fastTask] as any);
        const res = predictions.get('fastTask');
        // Fast user should have early end date
        expect(res!.predictedEndDate.getTime()).toBeLessThan(new Date('2026-03-30').getTime());
    });
});
