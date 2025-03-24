import { useEffect, useState, useRef } from "react";
import "./NumberInput.css";
type NumberType = "float" | "int";

function inputToNumber(input: string, numberType: NumberType): number | Error {
    if (!/^[\d\s.,]+$/.test(input)) {
        return new Error("Invalid characters in input.");
    }
    let normalized = input.replace(/\s+/g, "").replace(/,/g, "");

    if (numberType == "int" && normalized.includes(".")) {
        return new Error("Integers should not contain a decimal point.");
    }

    let number =
        numberType === "int"
            ? parseInt(normalized, 10)
            : parseFloat(normalized);

    return isNaN(number) ? new Error("Invalid number format.") : number;
}

interface NumberInputProps {
    numberType?: "float" | "int";
    value: number;
    onValue: (val: number) => void;
}

function formatNumberToDisplay(num: number, numberType: NumberType) {
    return numberType === "float"
        ? num.toLocaleString("en-US", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 20,
          })
        : num.toLocaleString("en-US");
}

export const NumberInput: React.FC<NumberInputProps> = ({
    value,
    onValue,
    numberType = "float",
    ...otherProps
}) => {
    const [parsedInternal, setParsedInternal] = useState<number | null>(null);
    const [formattedVal, setFormattedVal] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (value !== parsedInternal) {
            setParsedInternal(value);
            setFormattedVal(formatNumberToDisplay(value, numberType));
        }
    }, [value, numberType]);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.setCustomValidity(errorMessage);
        }
    }, [errorMessage]);

    const handleParsing = (input: string) => {
        let parsed = inputToNumber(input, numberType);
        if (parsed instanceof Error) {
            setParsedInternal(null);
            setFormattedVal(input);
            setErrorMessage(parsed.message);
        } else {
            // Check if the value actually changed
            if (value !== parsed) {
                onValue(parsed);
            }
            setParsedInternal(parsed);
            setFormattedVal(formatNumberToDisplay(parsed, numberType));
            setErrorMessage("");
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormattedVal(e.target.value);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(
            () => handleParsing(e.target.value),
            2000
        );
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        handleParsing(e.target.value);
    };

    return (
        <div className="number-input-wrapper">
            <input
                ref={inputRef}
                value={formattedVal}
                onChange={handleChange}
                onBlur={handleBlur}
                {...otherProps}
            />
            <div className="number-input-save">
                <button onClick={(e) => e.preventDefault()}>Save</button>
            </div>
            <span className="input-error">{errorMessage}</span>
        </div>
    );
};
