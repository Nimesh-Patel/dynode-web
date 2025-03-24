import { JSX, useEffect, useState } from "react";
import "./Tabs.css";

interface TabData {
    title: string;
    content: () => JSX.Element;
}
export function Tabs({ tabs }: { tabs: TabData[] }) {
    const [active, setActive] = useState(0);
    const [tabContent, setTabContent] = useState(Array<JSX.Element>);

    // TODO<ryl8@cdc.gov> handle tabs props changing
    useEffect(() => {
        if (!tabContent[active]) {
            console.debug("Rendering tab " + active);
            let newTabContent = [...tabContent];
            newTabContent[active] = tabs[active].content();
            setTabContent(newTabContent);
        }
    }, [active]);

    return (
        <>
            <div className="tabs">
                {tabs.map(({ title }, index) => (
                    <div
                        key={title}
                        className={"tab" + (index === active ? " active" : "")}
                        onClick={() => setActive(index)}
                    >
                        <h2>{title}</h2>
                    </div>
                ))}
            </div>
            <div className="p-3 pt-2">
                {tabContent.map((content, i) => (
                    <div
                        key={i}
                        style={{ display: i === active ? "" : "none" }}
                    >
                        {content}
                    </div>
                ))}
            </div>
        </>
    );
}
