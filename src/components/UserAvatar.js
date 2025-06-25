import React from "react";

const UserAvatar = ({ user, size = 45, className }) => {
  const style = {
    width: size,
    height: size,
    borderRadius: '50%',
    objectFit: 'cover',
  };
  if (user?.photoURL) {
    return <img src={user.photoURL} alt="avatar" className={className} style={style} />;
  }
  return <img src="/assets/default-avatar.png" alt="avatar" className={className} style={style} />;
};

export default UserAvatar;
