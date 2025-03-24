import "./DragBar.css";
import { SeparatorProps } from "react-resizable-layout";

interface DragBarProps extends SeparatorProps {
    isDragging: boolean;
}

export const DragBar = ({
    id = "drag-bar",
    isDragging,
    ...props
}: DragBarProps) => {
    return (
        <div
            id={id}
            tabIndex={0}
            className={[
                "drag-bar",
                // dir === "horizontal" ? "drag-bar--horizontal" : "",
                isDragging ? "drag-bar--dragging" : "",
            ].join(" ")}
            {...props}
        />
    );
};
