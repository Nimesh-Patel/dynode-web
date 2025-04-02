import { useState } from "react";
import { Caret } from "./Caret";
import "./MiniExpandable.css";

type MiniExpandableProps = {
    title: string;
    initialState: boolean;
    children: React.ReactNode;
};

export function MiniExpandable({
    title,
    initialState,
    children,
}: MiniExpandableProps) {
    const [expanded, setExpanded] = useState(initialState);
    return (
        <div>
            <div
                className="mini-expandable-header"
                onClick={() => setExpanded(!expanded)}
            >
                <Caret dir={expanded ? "down" : "left"} /> {title}
            </div>
            <div
                className="mini-expandable-content"
                style={{ display: expanded ? "" : "none" }}
            >
                {children}
            </div>
        </div>
    );
}
