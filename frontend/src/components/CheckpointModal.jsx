import React, { useState, useEffect } from 'react';

const CheckpointModal = ({ isOpen, onClose, quiz, onContinue }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [errorIndex, setErrorIndex] = useState(null);

  // Reset state when modal is opened/closed or quiz changes
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(null);
      setIsCorrect(false);
      setErrorIndex(null);
    }
  }, [isOpen, quiz]);

  if (!isOpen || !quiz) return null;

  const handleOptionClick = (index) => {
    if (isCorrect) return; // Prevent changing answer after correct choice

    setSelectedIndex(index);
    setErrorIndex(null);

    if (index === quiz.correctOptionIndex) {
      setIsCorrect(true);
    } else {
      setErrorIndex(index);
      // Remove error state after animation completes
      setTimeout(() => setErrorIndex(null), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-text-main/10 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="w-full max-w-[600px] bg-background-light p-12 flex flex-col items-center rounded-lg shadow-soft relative z-10">
        <div className="w-full flex flex-col items-center">
          <h3 className="font-display text-text-main text-[24px] font-bold leading-tight px-4 text-center pb-8">
            {quiz.question}
          </h3>
          
          <div className="flex flex-col gap-4 w-full">
            {quiz.options.map((option, index) => {
              const isSelected = selectedIndex === index;
              const isError = errorIndex === index;
              const isSuccess = isSelected && isCorrect;

              return (
                <label 
                  key={index}
                  onClick={() => handleOptionClick(index)}
                  className={`group flex items-center gap-4 rounded-md p-4 cursor-pointer transition-all
                    ${isSuccess 
                      ? 'border-2 border-success bg-success/5 bounce' 
                      : 'border border-muted hover:bg-surface'}
                    ${isError ? 'shake border-red-500 text-red-500' : ''}
                  `}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                    ${isSuccess 
                      ? 'border-success' 
                      : 'border-muted group-hover:border-primary'}
                    ${isError ? 'border-red-500' : ''}
                  `}>
                    <div className={`w-2.5 h-2.5 rounded-full
                      ${isSuccess ? 'bg-success' : 'bg-transparent'}
                    `} />
                  </div>
                  
                  <input 
                    type="radio" 
                    name="checkpoint-quiz" 
                    className="hidden" 
                    checked={isSelected}
                    readOnly
                  />
                  
                  <div className="flex grow flex-col">
                    <p className={`text-[16px] font-medium leading-normal
                      ${isError ? 'text-red-500' : 'text-text-main'}
                    `}>
                      {option}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Feedback Message & Continue Button - Only visible when correct */}
          <div className={`w-full mt-6 flex flex-col items-center transition-opacity duration-300 ${isCorrect ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="flex items-center gap-2 text-success mb-6">
              <p className="font-sans text-[16px] font-medium text-center">
                {quiz.successMessage}
              </p>
            </div>
            
            <button 
              onClick={onContinue}
              className="flex min-w-[200px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-8 bg-primary hover:bg-[#c25e3a] transition-colors text-white text-[14px] font-bold tracking-wide"
            >
              <span>Continue Journey</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckpointModal;
