import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/settings')({
    component: SettingsComponent,
})

function SettingsComponent() {
    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Settings</h2>
            <p>This is a nested settings page within the dashboard.</p>
        </div>
    )
}
