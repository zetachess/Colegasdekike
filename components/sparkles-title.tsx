const sparkles = [
  { x: "3%", y: "16%", size: 11, delay: "0s", color: "var(--points)" },
  { x: "14%", y: "78%", size: 8, delay: ".7s", color: "var(--tournaments)" },
  { x: "24%", y: "5%", size: 7, delay: "1.3s", color: "var(--tournaments)" },
  { x: "32%", y: "65%", size: 10, delay: "2s", color: "var(--points)" },
  { x: "40%", y: "12%", size: 8, delay: ".4s", color: "var(--points)" },
  { x: "48%", y: "84%", size: 7, delay: "1.8s", color: "var(--tournaments)" },
  { x: "56%", y: "3%", size: 11, delay: "1s", color: "var(--tournaments)" },
  { x: "64%", y: "70%", size: 8, delay: "2.4s", color: "var(--points)" },
  { x: "72%", y: "20%", size: 9, delay: ".3s", color: "var(--points)" },
  { x: "80%", y: "84%", size: 7, delay: "1.5s", color: "var(--tournaments)" },
  { x: "88%", y: "8%", size: 10, delay: "2.1s", color: "var(--tournaments)" },
  { x: "97%", y: "65%", size: 9, delay: ".9s", color: "var(--points)" },
];

export default function SparklesTitle() {
  return (
    <h1 className="sparkles-title">
      <span className="sparkles-title__text">Colegas de Kike</span>
      <span className="sparkles-title__effects" aria-hidden="true">
        {sparkles.map((sparkle, index) => (
          <span
            className="sparkles-title__sparkle"
            key={index}
            style={{
              left: sparkle.x,
              top: sparkle.y,
              width: sparkle.size,
              height: sparkle.size,
              color: sparkle.color,
              animationDelay: sparkle.delay,
            }}
          >
            <svg viewBox="0 0 200 200" fill="none" aria-hidden="true">
              <path d="M120 80L100 0 80 80 0 100l80 20 20 80 20-80 80-20-80-20z" fill="currentColor" />
            </svg>
          </span>
        ))}
      </span>
    </h1>
  );
}
