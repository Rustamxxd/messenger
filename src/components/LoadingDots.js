import styles from '@/styles/LoadingDots.module.css';

export default function LoadingDots() {
  return (
    <span className={styles.dots}>
      <span className={styles.dot}>.</span>
      <span className={styles.dot}>.</span>
      <span className={styles.dot}>.</span>
    </span>
  );
} 