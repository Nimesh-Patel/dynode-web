import { ParamsEditor } from "./ParamsEditor";
import { PresetEditor } from "./PresetEditor";

export function MobileEditor() {
    return (
        <div className="mobile-editor">
            <div className="mb-3">
                <PresetEditor />
            </div>
            <h4 className="preset-header">Settings</h4>
            <ParamsEditor />
        </div>
    );
}
