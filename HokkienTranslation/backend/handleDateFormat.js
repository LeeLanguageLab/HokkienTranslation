
export const handleDateFormat = (date) => {
        try {
            // Handle Firebase Timestamp object (from serverTimestamp)
            if (date && typeof date === 'object' && date.seconds) {
                return date.toDate().toLocaleDateString();
            }

            // Handle ISO string format (2025-06-19T11:17:45.563Z)
            if (typeof date === 'string' && date.includes('T')) {
                return new Date(date).toLocaleDateString();
            }

            // Handle Firebase timestamp string format (June 23, 2025 at 4:09:18 PM UTC+5:30)
            if (typeof date === 'string' && date.includes(' at ')) {
                const datePart = date.split(' at ')[0];
                return new Date(datePart).toLocaleDateString();
            }

            // Fallback for other formats or Date objects
            return new Date(date).toLocaleDateString();
        } catch (error) {
            console.warn('Error parsing date:', date, error);
            return 'Invalid date';
        }
    };
