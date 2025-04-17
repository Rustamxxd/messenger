 import React from "react";

const Message = ({ message, isOwn }) => {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`p-2 rounded-lg max-w-xs ${isOwn ? "bg-blue-500 text-white" : "bg-gray-200"}`}>
        <p className="text-sm font-semibold">{message.senderName}</p>
        <p>{message.text}</p>
      </div>
    </div>
  );
};

export default Message;
