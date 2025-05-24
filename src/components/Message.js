import React from "react";

const Message = ({ message, isOwn }) => {
  const hasTranslation = message.originalText && message.originalText !== message.text;

  return (
    <div className={`flex mb-2 ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`p-2 rounded-lg max-w-xs break-words ${
          isOwn ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
        }`}
        title={hasTranslation ? `Оригинал: ${message.originalText}` : undefined}
      >
        <p className="text-sm font-semibold mb-1">{message.senderName}</p>
        <p>{message.text}</p>
      </div>
    </div>
  );
};

export default Message;
