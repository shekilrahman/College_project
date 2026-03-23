import { expect, it, describe } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './badge'

describe('Badge Component', () => {
    it('should render the badge text', () => {
        render(<Badge>New Feature</Badge>)
        expect(screen.getByText('New Feature')).toBeDefined()
    })

    it('should apply the correct variant class', () => {
        const { container } = render(<Badge variant="secondary">Secondary</Badge>)
        // Secondary variant usually has bg-secondary
        expect(container.firstChild?.hasOwnProperty('className')).toBeDefined()
        const className = (container.firstChild as HTMLElement).className
        expect(className).toContain('bg-secondary')
    })
})
