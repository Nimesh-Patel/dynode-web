import { Plot } from "@observablehq/plot";
import { from } from "arquero";
import {
    bisector,
    Bisector,
    pointer,
    select,
    Selection,
    ScaleLinear,
} from "d3";

const DEFAULT_STYLE: Partial<CSSStyleDeclaration> = {
    backgroundColor: "white",
    zIndex: "1000",
    borderRadius: "3px",
    boxShadow: "0 2px 6px rgba(44, 44, 44, 0.2)",
    padding: "10px",
};

interface TooltipOptions<P> {
    points: P[];
    containerEl: HTMLElement;
    plot?: (HTMLElement | SVGElement) & Plot;
    svg?: SVGElement;
    scaleX?: ScaleLinear<number, number>;
    xProperty: keyof P & (string | number);
    renderContent: (
        x: number,
        points: P[] | undefined,
        tooltipEl: HTMLElement
    ) => void;
    yRange?: [number, number];
    tooltipWidth?: number;
    style?: Partial<CSSStyleDeclaration> | null;
    margin?: number;
}

export class Tooltip<P> {
    public tooltipEl: HTMLElement;

    private node: SVGElement;
    private plotSelection: Selection<SVGElement, unknown, null, undefined>;
    private xScale: (x: number) => number;
    private xScaleInverted: (x: number) => number;
    private xProperty: keyof P & (string | number);
    private bisector: Bisector<number, number>;
    private xValues: number[];
    private pointMap: Map<number, P[]>;
    private focusLineStartY: number;
    private focusLineEndY: number;
    private tooltipWidth: number;
    private renderContent: (
        x: number,
        points: P[] | undefined,
        tooltipEl: HTMLElement
    ) => void;
    private containerEl: HTMLElement;
    private focusLine: Selection<SVGLineElement, unknown, null, undefined>;
    private margin: number;
    private trackEnter: boolean;
    private style: Partial<CSSStyleDeclaration> | null;

    constructor({
        containerEl,
        plot,
        svg,
        xProperty,
        scaleX,
        points,
        yRange,
        margin = 15,
        tooltipWidth = 200,
        renderContent,
        style = DEFAULT_STYLE,
    }: TooltipOptions<P>) {
        let yScale = plot?.scale("y");
        let focusLineCoords: [number, number];

        if (yRange) {
            focusLineCoords = yRange;
        } else if (yScale && yScale.range instanceof Array) {
            focusLineCoords = [
                yScale.range[0],
                yScale.range[yScale.range.length - 1],
            ];
        } else {
            throw new Error(
                "You must provide a ycale range as an array or a yRange"
            );
        }
        if (scaleX) {
            this.xScale = (n) => scaleX(n);
            this.xScaleInverted = (n) => scaleX.invert(n);
        } else if (plot) {
            let scale = plot.scale("x");
            if (!scale || !scale.invert) {
                throw new Error(
                    "You must provide a x scale with an invert method"
                );
            }
            this.xScale = (n) => scale.apply(n);
            this.xScaleInverted = (n) => scale.invert && scale.invert(n);
        } else {
            throw new Error(
                "You must provide an x scale with an invert method or a plot"
            );
        }

        if (plot instanceof SVGElement) {
            this.node = plot;
            this.plotSelection = select(plot as SVGElement);
        } else {
            let node =
                svg || plot?.querySelector<SVGElement>("svg[class^='plot']");
            if (!node) {
                throw new Error("No svg found");
            }
            this.node = node;
            this.plotSelection = select(node);
        }

        this.xProperty = xProperty;
        this.bisector = bisector((d) => d);
        // @ts-expect-error Map is not typed correctly
        this.pointMap = from(points)
            .groupby(this.xProperty)
            .objects({ grouped: true }) as Map<number, P[]>;
        this.xValues = [...this.pointMap.keys()];
        this.focusLineStartY = focusLineCoords[0];
        this.focusLineEndY = focusLineCoords[1];
        this.tooltipWidth = tooltipWidth;

        this.margin = margin;
        this.renderContent = renderContent;

        this.onPointerEnter = this.onPointerEnter.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerLeave = this.onPointerLeave.bind(this);

        this.containerEl = containerEl;
        this.tooltipEl = document.createElement("div");
        this.tooltipEl.className = "tooltip";
        this.containerEl.appendChild(this.tooltipEl);
        this.focusLine = this.plotSelection.append("line");
        this.trackEnter = false;

        this.style = style;

        // Needs to be re-run when points changes
        this.setup();
    }

    getX(d: P): number {
        let value = d[this.xProperty];
        if (typeof value !== "number") {
            console.warn(`Value of x property should be a number`);
        }
        return value as number;
    }

    setup() {
        this.tooltipEl.style.position = "fixed";
        this.tooltipEl.style.width = `${this.tooltipWidth}px`;
        this.tooltipEl.style.display = "none";
        this.tooltipEl.style.pointerEvents = "none";

        if (this.style && this.style !== null) {
            Object.assign(this.tooltipEl.style, this.style);
        }

        this.focusLine
            .attr("stroke-width", 1)
            .attr("stroke", "rgba(0, 0, 0, 0.2)")
            .attr("y1", this.focusLineStartY)
            .attr("y2", this.focusLineEndY)
            .style("display", "none");

        this.node.addEventListener("pointerenter", this.onPointerEnter);
        this.node.addEventListener("pointermove", this.onPointerMove);
        this.node.addEventListener("pointerleave", this.onPointerLeave);
    }

    cleanup() {
        this.tooltipEl.remove();
        this.node.removeEventListener("pointerenter", this.onPointerEnter);
        this.node.removeEventListener("pointermove", this.onPointerMove);
        this.node.removeEventListener("pointerleave", this.onPointerLeave);
    }

    onPointerEnter() {
        this.tooltipEl.style.display = "";
        this.focusLine.style("display", "");
        this.trackEnter = true;
    }

    onPointerMove(event: PointerEvent) {
        if (!this.trackEnter) {
            this.onPointerEnter();
        }
        const [x] = pointer(event);
        const index = this.bisector.center(
            this.xValues,
            this.xScaleInverted(x)
        );
        const nearestX = this.xValues[index];

        // this.tooltipEl.innerText = "";
        this.renderContent(
            nearestX,
            this.pointMap.get(nearestX),
            this.tooltipEl
        );

        let left = event.clientX + this.margin;
        let top = event.clientY;
        let overlapX = this.tooltipWidth + left - window.innerWidth;
        let overlapY = this.tooltipEl.clientHeight + top - window.innerHeight;

        this.tooltipEl.style.left = `${Math.min(left, left - overlapX)}px`;
        this.tooltipEl.style.top = `${Math.min(top, top - overlapY)}px`;

        this.focusLine.attr(
            "transform",
            `translate(${this.xScale(nearestX)},0)`
        );
    }

    onPointerLeave() {
        this.tooltipEl.style.display = "none";
        this.focusLine.style("display", "none");
    }
}
