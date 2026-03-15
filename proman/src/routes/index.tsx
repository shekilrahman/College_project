import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/context/AuthContext'
import { useEffect } from 'react'

export const Route = createFileRoute('/')({
    component: HomeComponent,
})

function HomeComponent() {
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading) {
            if (user) {
                navigate({ to: '/dashboard' });
            } else {
                navigate({ to: '/login' });
            }
        }
    }, [user, isLoading, navigate]);

    return null; // Or a loading spinner
}
