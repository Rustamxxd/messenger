import getAvatarUrl from "@/utils/getAvatar";

const UserAvatar = ({ username }) => {
  return (
    <img
      src={getAvatarUrl(username)}
      alt="User Avatar"
      className="w-12 h-12 rounded-full"
    />
  );
};

export default UserAvatar;