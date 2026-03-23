import { expect, it, describe } from 'vitest'
import { cn } from './utils'

describe('cn utility', () => {
    it('should merge tailwind classes correctly', () => {
        const result = cn('bg-red-500', 'bg-blue-500')
        // tailwind-merge should prefer the last class
        expect(result).toContain('bg-blue-500')
    })

    it('should handle conditional classes', () => {
        const result = cn('base', true && 'is-true', false && 'is-false')
        expect(result).toContain('base')
        expect(result).toContain('is-true')
        expect(result).not.toContain('is-false')
    })
})
