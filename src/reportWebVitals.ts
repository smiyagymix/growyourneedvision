import { onCLS, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals';

const reportWebVitals = (onPerfEntry?: (metric: Metric) => void) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    onCLS(onPerfEntry);
    onFCP(onPerfEntry);
    onLCP(onPerfEntry);
    onTTFB(onPerfEntry);
    onINP(onPerfEntry);
  } else {
    // Default behavior: Log to console in a readable format if no callback provided
    // This helps developers see metrics in the console during development
    const logMetric = (metric: Metric) => {
        // Use a distinct color for Web Vitals logs
        console.groupCollapsed(`%c⚡ Web Vitals: ${metric.name}`, 'color: #00C853; font-weight: bold;');
        console.log(metric);
        console.log(`%cValue: ${Math.round(metric.value * 100) / 100}`, 'font-weight: bold');
        console.log(`%cRating: ${metric.rating}`, metric.rating === 'good' ? 'color: #00C853' : metric.rating === 'needs-improvement' ? 'color: #FFAB00' : 'color: #D50000');
        console.log(`Delta: ${Math.round(metric.delta * 100) / 100}`);
        console.log(`ID: ${metric.id}`);
        console.groupEnd();
    };

    onCLS(logMetric);
    onFCP(logMetric);
    onLCP(logMetric);
    onTTFB(logMetric);
    onINP(logMetric);
  }
};

export default reportWebVitals;
