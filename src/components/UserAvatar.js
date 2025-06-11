import React from "react";
import multiavatar from "@multiavatar/multiavatar";

const UserAvatar = ({ user, size = 45 }) => {
  if (user?.photoURL) {
    return (
      <img
        src={user.photoURL}
        
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
        }}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{
        __html: multiavatar(user?.displayName || "Пользователь"),
      }}
    />
  );
};

export default UserAvatar;
