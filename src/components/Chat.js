import { useSelector, useDispatch } from 'react-redux';
import { clearUser } from '../app/store/userSlice';
import { logoutUser } from '../lib/firebase';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import '@/styles/Chat.module.css'

export default function Chat() {
  const { user, avatar } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [selectedChat, setSelectedChat] = useState(null);

  const handleLogout = async () => {
    await logoutUser();
    dispatch(clearUser());
    window.location.reload();
  };

  return (
    <div>
      <div>
        <p>{user?.displayName || user?.email}</p>
        <button onClick={handleLogout}>Выйти</button>
        <ChatList onSelectChat={setSelectedChat} />
      </div>
      <div>
        {selectedChat ? (
          <ChatWindow chatId={selectedChat.id} />
        ) : (
          <p>Выберите чат</p>
        )}
      </div>
    </div>
  );
}