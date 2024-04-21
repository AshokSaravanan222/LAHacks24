import React, { useState, useEffect, useRef } from 'react';

interface Props {
    words: string[];
    containerRef: React.RefObject<HTMLDivElement>;
}

export const ScrollingWords: React.FC<Props> = ({ words, containerRef }) => {
    // const [words, setWords] = useState(words);
    // const containerRef = useRef(containerRef);

    const addWord = () => {
        const newWord = `Word${words.length + 1}`;
        setWords([...words, newWord]);  // Adding new words
    };

    useEffect(() => {
        const adjustScrollPosition = () => {
            if (containerRef.current) {
                const container = containerRef.current;
                const lastChild = container.lastChild;
                if (lastChild) {
                    // Ensuring the latest word is visible in the viewport
                    const lastChildOffset = lastChild.offsetLeft + lastChild.clientWidth;
                    const scrollAmount = lastChildOffset - container.clientWidth + 50; // 50px padding for aesthetics
                    container.scrollLeft = scrollAmount > 0 ? scrollAmount : 0;
                }
            }
        };

        // Call the adjustment function every time words change
        adjustScrollPosition();
    }, [words]); // Dependency array includes words to trigger effect on change

    return (
        <div className="relative p-4">
            <div className="overflow-hidden bg-gray-200 p-3" style={{ width: '600px', height: '100px' }}>
                <div ref={containerRef} className="flex whitespace-nowrap space-x-2 overflow-hidden">
                    {words.map((word, index) => (
                        <div key={index} className="inline-flex items-center justify-center bg-blue-500 text-white p-2 rounded">
                            {word}
                        </div>
                    ))}
                </div>
            </div>
            <button onClick={addWord} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Add Word
            </button>
        </div>
    );
};

export default ScrollingWords;
