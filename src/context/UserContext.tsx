import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { API } from '../lib/api';

interface UserContextType {
    userName: string | null;
    setUserName: (name: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [userName, setUserNameState] = useState<string | null>(() => {
        // Initialize from localStorage if available
        return localStorage.getItem('userName');
    });

    useEffect(() => {
        // Sync with API module and localStorage on change
        if (userName) {
            // @ts-ignore - setApiUser might not exist yet in API, but will be added shortly
            if (API.setApiUser) {
                // @ts-ignore
                API.setApiUser(userName);
            }
            localStorage.setItem('userName', userName);
        } else {
            // @ts-ignore
            if (API.setApiUser) {
                // @ts-ignore
                API.setApiUser('');
            }
            localStorage.removeItem('userName');
        }
    }, [userName]);

    const setUserName = (name: string) => {
        setUserNameState(name);
    };

    return (
        <UserContext.Provider value={{ userName, setUserName }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
