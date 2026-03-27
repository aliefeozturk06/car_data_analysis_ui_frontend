import React, { createContext, useContext, useState } from 'react';

interface ChatContextType {
    isChatOpen: boolean;
    targetUser: string | null;
    openChat: (username: string) => void;
    closeChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [targetUser, setTargetUser] = useState<string | null>(null);

    const openChat = (username: string) => {
        if (!username) return;
        setTargetUser(username);
        setIsChatOpen(true);
    };

    const closeChat = () => {
        setIsChatOpen(false);
        setTargetUser(null);
    };

    return (
        <ChatContext.Provider value={{ isChatOpen, targetUser, openChat, closeChat }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        return { isChatOpen: false, targetUser: null, openChat: () => {}, closeChat: () => {} };
    }
    return context;
};