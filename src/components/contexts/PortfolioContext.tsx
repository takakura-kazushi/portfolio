"use client";

import { createContext, useContext, useState, ReactNode } from "react";

// 追加したいセクションをここに定義します
export type SectionId = "profile" | "works" | "skills" | "contact" | null;

interface PortfolioContextType {
    activeSection: SectionId;
    setActiveSection: (section: SectionId) => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: ReactNode }) {
    const [activeSection, setActiveSection] = useState<SectionId>(null);

    return (
        <PortfolioContext.Provider value={{ activeSection, setActiveSection }}>
            {children}
        </PortfolioContext.Provider>
    );
}

export function usePortfolio() {
    const context = useContext(PortfolioContext);
    if (!context) throw new Error("usePortfolio must be used within PortfolioProvider");
    return context;
}