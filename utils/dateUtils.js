export const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const messageDate = new Date(timestamp.seconds * 1000);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const isToday = messageDate.toDateString() === today.toDateString();
  const isYesterday = messageDate.toDateString() === yesterday.toDateString();
  
  if (isToday) {
    return `${messageDate.getHours().toString().padStart(2, '0')}:${messageDate.getMinutes().toString().padStart(2, '0')}`;
  } else if (isYesterday) {
    return 'вчера';
  } else {
    return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(messageDate);
  }
};