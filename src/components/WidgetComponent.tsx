import "../index.css";

import { useWidgetParams, useSubmission } from "@joymath/widget-sdk";
import type { WidgetParams, WidgetAnswer } from "../definition";
import { useState, useEffect } from "react";

export function WidgetComponent() {
  const params = useWidgetParams<WidgetParams>();

  // Parse numbers from params
  const originalNumbers = params.numbers
    .trim()
    .split(/[,\s]+/)
    .map((n) => parseFloat(n))
    .filter((n) => !isNaN(n));

  // useSubmission hook
  const {
    answer,
    setAnswer,
    result,
    submit,
    isLocked,
    canSubmit,
    isSubmitting,
  } = useSubmission<WidgetAnswer>({
    evaluate: (ans) => {
      const sortedNumbers: number[] = JSON.parse(ans.sortedNumbers);

      if (sortedNumbers.length === 0) {
        return { isCorrect: false, score: 0, maxScore: 100 };
      }

      // Count correct consecutive pairs
      let correctPairs = 0;
      const totalPairs = sortedNumbers.length - 1;

      for (let i = 0; i < sortedNumbers.length - 1; i++) {
        const current = sortedNumbers[i];
        const next = sortedNumbers[i + 1];

        if (params.orderType === "Tăng dần") {
          if (current < next) {
            correctPairs++;
          }
        } else {
          // Giảm dần
          if (current > next) {
            correctPairs++;
          }
        }
      }

      const isCorrect = correctPairs === totalPairs;
      const score =
        totalPairs > 0 ? Math.round((correctPairs / totalPairs) * 100) : 0;

      return {
        isCorrect,
        score,
        maxScore: 100,
      };
    },
  });

  // Current sorted numbers
  const [sortedNumbers, setSortedNumbers] = useState<number[]>([]);
  const [initialOrder, setInitialOrder] = useState<number[]>([]);

  // Initialize when originalNumbers changes or answer exists
  useEffect(() => {
    if (originalNumbers.length === 0) return;

    if (answer?.initialOrder && answer?.sortedNumbers) {
      try {
        const order = JSON.parse(answer.initialOrder);
        const sorted = JSON.parse(answer.sortedNumbers);

        // Verify that sorted array matches current originalNumbers
        const sortedSet = new Set(sorted);
        const originalSet = new Set(originalNumbers);
        const isSameSet =
          sorted.length === originalNumbers.length &&
          [...sortedSet].every((n) => originalSet.has(n as number));

        if (isSameSet) {
          setInitialOrder(order);
          setSortedNumbers(sorted);
        } else {
          // Numbers changed, reinitialize
          initializeShuffle();
        }
      } catch {
        initializeShuffle();
      }
    } else if (!isLocked) {
      initializeShuffle();
    }
  }, [originalNumbers.join(","), isLocked]);

  const initializeShuffle = () => {
    if (originalNumbers.length === 0) return;

    // Create shuffled indices
    const indices = originalNumbers.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const shuffled = indices.map((i) => originalNumbers[i]);
    setInitialOrder(indices);
    setSortedNumbers(shuffled);
    setAnswer({
      sortedNumbers: JSON.stringify(shuffled),
      initialOrder: JSON.stringify(indices),
    });
  };

  // Drag & Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    if (isLocked) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (isLocked) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (isLocked || draggedIndex === null) return;

    const newNumbers = [...sortedNumbers];
    const draggedNumber = newNumbers[draggedIndex];

    // Remove from old position
    newNumbers.splice(draggedIndex, 1);
    // Insert at new position
    newNumbers.splice(dropIndex, 0, draggedNumber);

    setSortedNumbers(newNumbers);
    setAnswer({
      sortedNumbers: JSON.stringify(newNumbers),
      initialOrder: JSON.stringify(initialOrder),
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Get correct order for display
  const getCorrectOrder = () => {
    return [...originalNumbers].sort((a, b) => {
      if (params.orderType === "Tăng dần") {
        return a - b;
      } else {
        return b - a;
      }
    });
  };

  // Check if transition from index to index+1 is correct
  const isTransitionCorrect = (index: number): boolean => {
    if (index >= sortedNumbers.length - 1) return true;

    const current = sortedNumbers[index];
    const next = sortedNumbers[index + 1];

    if (params.orderType === "Tăng dần") {
      return current < next;
    } else {
      return current > next;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-3xl">
        {/* Review Mode Badge */}
        {isLocked && (
          <div className="mb-4 text-center">
            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              📋 Chế độ xem lại
            </span>
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10 border border-slate-200">
          {/* Question */}
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-slate-800">
              {params.question}
            </h2>
            <p className="text-lg md:text-xl text-indigo-600 font-semibold">
              {params.orderType === "Tăng dần" ? "📈 Tăng dần" : "📉 Giảm dần"}
            </p>
            {!isLocked && (
              <p className="text-sm text-slate-600 mt-2">
                Kéo thả các số để sắp xếp theo thứ tự{" "}
                {params.orderType.toLowerCase()}
              </p>
            )}
          </div>

          {/* Numbers Container */}
          <div className="mb-8">
            <div className="flex flex-wrap justify-center items-center gap-1 p-6 bg-slate-50 rounded-xl border-2 border-slate-200">
              {sortedNumbers.map((number, index) => {
                const isDragging = draggedIndex === index;
                const isDragOver = dragOverIndex === index;
                const isTransitionOk = isTransitionCorrect(index);
                const showDivider =
                  isLocked && index < sortedNumbers.length - 1;

                return (
                  <div
                    key={`${number}-${index}`}
                    className="flex items-center gap-1"
                  >
                    {/* Number Box */}
                    <div
                      draggable={!isLocked}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`
                        w-16 h-16 md:w-20 md:h-20 
                        flex items-center justify-center 
                        text-2xl md:text-3xl font-bold 
                        rounded-xl border-3 transition-all 
                        ${!isLocked ? "cursor-grab active:cursor-grabbing" : ""}
                        ${
                          isDragging
                            ? "bg-indigo-100 border-indigo-300 text-indigo-700 opacity-50 scale-95"
                            : isDragOver
                              ? "bg-amber-100 border-amber-400 text-amber-800 scale-110 shadow-lg"
                              : isLocked
                                ? "bg-white border-slate-300 text-slate-800"
                                : "bg-white border-indigo-200 text-slate-800 hover:border-indigo-400 hover:scale-105 shadow-sm hover:shadow-md"
                        }
                      `}
                    >
                      {number}
                    </div>

                    {/* Divider between numbers (in review mode) */}
                    {showDivider && (
                      <div className="flex items-center justify-center w-8 h-16 md:h-20">
                        {isTransitionOk ? (
                          <div className="w-1 h-8 bg-green-400 rounded-full"></div>
                        ) : (
                          <div className="w-1 h-8 bg-red-400 rounded-full"></div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hint - Show correct answer in review mode if incorrect */}
          {isLocked && !result?.isCorrect && (
            <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
              <p className="text-sm text-blue-800 text-center font-medium mb-3">
                💡 Đáp án đúng:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {getCorrectOrder().map((num, idx) => (
                  <div
                    key={`correct-${idx}`}
                    className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-xl md:text-2xl font-bold bg-green-50 border-2 border-green-300 text-green-700 rounded-lg"
                  >
                    {num}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          {!isLocked && (
            <button
              onClick={submit}
              disabled={!canSubmit || isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-colors"
            >
              {isSubmitting ? "Đang nộp bài..." : "Nộp bài"}
            </button>
          )}

          {/* Result */}
          {result && isLocked && (
            <div
              className={`p-6 rounded-xl mt-6 border-2 ${
                result.isCorrect
                  ? "bg-green-50 border-green-200"
                  : "bg-amber-50 border-amber-200"
              }`}
            >
              <div className="text-center">
                <div className="text-5xl mb-3">
                  {result.isCorrect ? "🎉" : "💪"}
                </div>
                <div
                  className={`text-2xl font-bold mb-2 ${
                    result.isCorrect ? "text-green-700" : "text-amber-700"
                  }`}
                >
                  {result.isCorrect
                    ? params.settings.showFeedback
                      ? params.settings.feedbackCorrect
                      : "Tuyệt vời!"
                    : params.settings.showFeedback
                      ? params.settings.feedbackIncorrect
                      : "Chưa đúng rồi!"}
                </div>
                <div
                  className={`text-lg font-semibold ${
                    result.isCorrect ? "text-green-600" : "text-amber-600"
                  }`}
                >
                  Điểm: {result.score}/{result.maxScore}
                </div>
                {sortedNumbers.length > 1 && (
                  <div
                    className={`text-sm mt-2 ${
                      result.isCorrect ? "text-green-600" : "text-amber-600"
                    }`}
                  >
                    Số cặp đúng:{" "}
                    {Math.round(
                      (result.score / 100) * (sortedNumbers.length - 1),
                    )}
                    /{sortedNumbers.length - 1}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
