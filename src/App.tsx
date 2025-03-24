import { ParamsEditor } from "./views/ParamsEditor";
import { EpiCurve } from "./views/EpiCurve";
import { useResizable } from "react-resizable-layout";
import { DragBar } from "./layout/DragBar";
import { Tabs } from "./layout/Tabs";
import { PresetEditor } from "./views/PresetEditor";
import { SummaryTable } from "./views/SummaryTable";
import "./App.css";

function App() {
    const resizeLeft = useResizable({
        axis: "x",
        initial: 250,
        min: 200,
    });
    const resizeRight = useResizable({
        axis: "x",
        initial: 320,
        min: 200,
        reverse: true,
    });
    return (
        <div className="app">
            <aside style={{ width: resizeLeft.position }}>
                <PresetEditor />
            </aside>
            <DragBar
                isDragging={resizeLeft.isDragging}
                {...resizeLeft.separatorProps}
            />
            <main>
                <Tabs
                    tabs={[
                        { title: "Epi Curve", content: () => <EpiCurve /> },
                        { title: "Summary", content: () => <SummaryTable /> },
                    ]}
                />
            </main>
            <DragBar
                isDragging={resizeRight.isDragging}
                {...resizeRight.separatorProps}
            />
            <aside style={{ width: resizeRight.position }}>
                <ParamsEditor />
            </aside>
        </div>
    );
}

export default App;
