import React, { useState } from 'react';
import { Divide, X, Minus, Plus, Percent, Delete } from 'lucide-react';

const Calculator: React.FC = () => {
    const [display, setDisplay] = useState('0');
    const [currentValue, setCurrentValue] = useState<number | null>(null);
    const [operator, setOperator] = useState<string | null>(null);
    const [waitingForOperand, setWaitingForOperand] = useState(false);

    const inputDigit = (digit: string) => {
        if (waitingForOperand) {
            setDisplay(digit);
            setWaitingForOperand(false);
        } else {
            setDisplay(display === '0' ? digit : display + digit);
        }
    };

    const inputDecimal = () => {
        if (!display.includes('.')) {
            setDisplay(display + '.');
        }
    };

    const clearDisplay = () => {
        setDisplay('0');
        setCurrentValue(null);
        setOperator(null);
        setWaitingForOperand(false);
    };

    const performOperation = (nextOperator: string) => {
        const inputValue = parseFloat(display);

        if (currentValue === null) {
            setCurrentValue(inputValue);
        } else if (operator) {
            const result = calculate(currentValue, inputValue, operator);
            setCurrentValue(result);
            setDisplay(String(result));
        }

        setWaitingForOperand(true);
        setOperator(nextOperator);
    };
    
    const calculate = (firstOperand: number, secondOperand: number, op: string) => {
        switch (op) {
            case '+': return firstOperand + secondOperand;
            case '-': return firstOperand - secondOperand;
            case '*': return firstOperand * secondOperand;
            case '/': return firstOperand / secondOperand;
            case '=': return secondOperand;
            default: return secondOperand;
        }
    };
    
    const handleEquals = () => {
        const inputValue = parseFloat(display);
        if (operator && currentValue !== null) {
            const result = calculate(currentValue, inputValue, operator);
            setCurrentValue(result);
            setDisplay(String(result));
            setOperator(null);
            setWaitingForOperand(true);
        }
    };
    
    const handleBackspace = () => {
        setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
    };

    const calcBtn = "flex items-center justify-center h-14 w-14 rounded-2xl text-xl font-semibold transition-colors";
    const numBtn = `${calcBtn} bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-light-text dark:text-dark-text`;
    const opBtn = `${calcBtn} bg-light-primary-container dark:bg-dark-primary-container text-light-secondary dark:text-dark-secondary hover:opacity-90`;

    return (
        <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
            <div className="text-right text-4xl font-bold mb-4 h-12 pr-2 overflow-hidden overflow-ellipsis break-all text-light-text dark:text-dark-text">
                {display}
            </div>
            <div className="grid grid-cols-4 gap-3 text-center">
                <button onClick={clearDisplay} className={`${opBtn} text-red-600 dark:text-red-300`}>C</button>
                <button onClick={handleBackspace} className={opBtn}><Delete size={20} /></button>
                <button onClick={() => performOperation('/')} className={opBtn}><Divide size={20} /></button>
                <button onClick={() => performOperation('*')} className={opBtn}><X size={20} /></button>

                <button onClick={() => inputDigit('7')} className={numBtn}>7</button>
                <button onClick={() => inputDigit('8')} className={numBtn}>8</button>
                <button onClick={() => inputDigit('9')} className={numBtn}>9</button>
                <button onClick={() => performOperation('-')} className={opBtn}><Minus size={20} /></button>

                <button onClick={() => inputDigit('4')} className={numBtn}>4</button>
                <button onClick={() => inputDigit('5')} className={numBtn}>5</button>
                <button onClick={() => inputDigit('6')} className={numBtn}>6</button>
                <button onClick={() => performOperation('+')} className={opBtn}><Plus size={20} /></button>

                <button onClick={() => inputDigit('1')} className={numBtn}>1</button>
                <button onClick={() => inputDigit('2')} className={numBtn}>2</button>
                <button onClick={() => inputDigit('3')} className={numBtn}>3</button>
                <button onClick={handleEquals} className={`${calcBtn} row-span-2 bg-light-primary text-white dark:bg-dark-primary dark:text-black hover:opacity-90`}>=</button>

                <button onClick={() => inputDigit('0')} className={`${numBtn} col-span-2`}>0</button>
                <button onClick={inputDecimal} className={numBtn}>.</button>
            </div>
        </div>
    );
};

export default Calculator;